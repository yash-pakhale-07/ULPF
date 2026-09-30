"""
ULPF Storage Engine (Stage 5)
Dual-storage engine providing SQLite WAL transactional storage and Columnar Analytics memory layout.
"""

import os
import sqlite3
import json
import zlib
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.core.models import (
    ULPFValidatedEvent,
    ULPFStoredEvent,
    StorageMetadata,
)


class StorageEngine:
    """
    Stage 5: STORAGE
    Stores both raw and normalized representations, manages SQLite tables, indexes, and columnar structures.
    """

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        if db_path != ":memory:":
            db_dir = os.path.dirname(db_path)
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_db()
        self._columnar_buffer: List[Dict[str, Any]] = []

    def _init_db(self):
        with self.conn:
            # Enable WAL mode for high concurrency
            self.conn.execute("PRAGMA journal_mode=WAL;")
            self.conn.execute("PRAGMA synchronous=NORMAL;")
            
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS ulpf_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    ingested_at TEXT NOT NULL,
                    vendor TEXT NOT NULL,
                    product TEXT NOT NULL,
                    category TEXT NOT NULL,
                    action TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    src_ip TEXT,
                    src_port INTEGER,
                    dst_ip TEXT,
                    dst_port INTEGER,
                    protocol TEXT,
                    raw_payload TEXT NOT NULL,
                    raw_sha256 TEXT NOT NULL,
                    raw_length_bytes INTEGER NOT NULL,
                    compressed_bytes INTEGER NOT NULL,
                    data_quality_score REAL NOT NULL,
                    anomaly_score REAL DEFAULT 0.0,
                    is_anomalous INTEGER DEFAULT 0,
                    normalized_json TEXT NOT NULL,
                    stored_at TEXT NOT NULL
                );
            """)

            # Create Indexes for fast SIEM/Analytics querying
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_timestamp ON ulpf_events(timestamp);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_src_ip ON ulpf_events(src_ip);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_dst_ip ON ulpf_events(dst_ip);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_dst_port ON ulpf_events(dst_port);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_action ON ulpf_events(action);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_severity ON ulpf_events(severity);")
            self.conn.execute("CREATE INDEX IF NOT EXISTS idx_ulpf_anomaly ON ulpf_events(anomaly_score);")

    def store(self, validated_event: ULPFValidatedEvent) -> ULPFStoredEvent:
        t0 = time.perf_counter_ns()
        
        norm = validated_event.normalized
        raw_payload = norm.raw.payload
        raw_bytes = raw_payload.encode("utf-8")
        raw_len = len(raw_bytes)
        
        # Calculate compression
        compressed = zlib.compress(raw_bytes, level=6)
        comp_len = len(compressed)
        compression_ratio = round((1.0 - (comp_len / max(raw_len, 1))) * 100.0, 1) if raw_len > 0 else 0.0
        
        normalized_dict = norm.model_dump()
        normalized_json_str = json.dumps(normalized_dict)

        now_str = datetime.now(timezone.utc).isoformat()

        with self.conn:
            cursor = self.conn.execute("""
                INSERT OR REPLACE INTO ulpf_events (
                    event_id, timestamp, ingested_at, vendor, product, category,
                    action, severity, src_ip, src_port, dst_ip, dst_port,
                    protocol, raw_payload, raw_sha256, raw_length_bytes,
                    compressed_bytes, data_quality_score, normalized_json, stored_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                validated_event.event_id,
                norm.event.timestamp or now_str,
                norm.event.ingested_at,
                norm.observer.vendor,
                norm.observer.product,
                norm.event.category,
                norm.event.action.value,
                norm.event.severity.value,
                norm.source.ip,
                norm.source.port,
                norm.destination.ip,
                norm.destination.port,
                norm.network.protocol,
                raw_payload,
                norm.raw.sha256_hash,
                raw_len,
                comp_len,
                validated_event.data_quality_score,
                normalized_json_str,
                now_str
            ))
            row_id = cursor.lastrowid

        # Add to columnar memory buffer (max 10,000 in memory)
        columnar_row = {
            "event_id": validated_event.event_id,
            "timestamp": norm.event.timestamp or now_str,
            "vendor": norm.observer.vendor,
            "action": norm.event.action.value,
            "severity": norm.event.severity.value,
            "src_ip": norm.source.ip,
            "src_port": norm.source.port,
            "dst_ip": norm.destination.ip,
            "dst_port": norm.destination.port,
            "protocol": norm.network.protocol,
            "bytes": norm.network.bytes_total,
            "dqi": validated_event.data_quality_score,
        }
        self._columnar_buffer.append(columnar_row)
        if len(self._columnar_buffer) > 10000:
            self._columnar_buffer.pop(0)

        t1 = time.perf_counter_ns()
        duration_us = (t1 - t0) // 1000

        storage_meta = StorageMetadata(
            storage_engine="SQLite-WAL",
            table_name="ulpf_events",
            row_id=row_id,
            raw_size_bytes=raw_len,
            compressed_size_bytes=comp_len,
            compression_ratio=compression_ratio,
            indexed_fields=["timestamp", "src_ip", "dst_ip", "dst_port", "action", "severity", "anomaly_score"],
            stored_at=now_str,
        )

        return ULPFStoredEvent(
            event_id=validated_event.event_id,
            validated=validated_event,
            storage=storage_meta,
            storage_duration_us=duration_us,
        )

    def update_ml_scores(self, event_id: str, anomaly_score: float, is_anomalous: bool):
        """Update ML prediction scores in storage table."""
        with self.conn:
            self.conn.execute("""
                UPDATE ulpf_events
                SET anomaly_score = ?, is_anomalous = ?
                WHERE event_id = ?
            """, (anomaly_score, 1 if is_anomalous else 0, event_id))

    def query_events(
        self,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        action: Optional[str] = None,
        severity: Optional[str] = None,
        vendor: Optional[str] = None,
        is_anomalous: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve recent stored events with optional filtering and search."""
        clauses = []
        params: List[Any] = []

        if search:
            s_term = f"%{search.strip()}%"
            clauses.append("(event_id LIKE ? OR src_ip LIKE ? OR dst_ip LIKE ? OR vendor LIKE ? OR product LIKE ? OR raw_payload LIKE ?)")
            params.extend([s_term, s_term, s_term, s_term, s_term, s_term])
        
        if action and action.upper() != "ALL":
            clauses.append("action = ?")
            params.append(action.upper())

        if severity and severity.upper() != "ALL":
            clauses.append("severity = ?")
            params.append(severity.upper())

        if vendor and vendor.upper() != "ALL":
            clauses.append("vendor = ?")
            params.append(vendor)

        if is_anomalous is not None:
            clauses.append("is_anomalous = ?")
            params.append(1 if is_anomalous else 0)

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        
        sql = f"""
            SELECT event_id, timestamp, ingested_at, vendor, product, category,
                   action, severity, src_ip, src_port, dst_ip, dst_port,
                   protocol, raw_length_bytes, compressed_bytes,
                   data_quality_score, anomaly_score, is_anomalous, stored_at
            FROM ulpf_events
            {where_sql}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])

        cursor = self.conn.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]

    def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        cursor = self.conn.execute("SELECT * FROM ulpf_events WHERE event_id = ?", (event_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def get_statistics(self) -> Dict[str, Any]:
        cursor = self.conn.execute("""
            SELECT 
                COUNT(*) as total_events,
                SUM(raw_length_bytes) as total_raw_bytes,
                SUM(compressed_bytes) as total_compressed_bytes,
                AVG(data_quality_score) as avg_dqi,
                SUM(is_anomalous) as total_anomalies
            FROM ulpf_events
        """)
        row = cursor.fetchone()
        if not row or row["total_events"] == 0:
            return {
                "total_events": 0,
                "total_raw_bytes": 0,
                "total_compressed_bytes": 0,
                "overall_compression_ratio": 0.0,
                "avg_data_quality_score": 100.0,
                "total_anomalies": 0,
            }
        
        raw_b = row["total_raw_bytes"] or 0
        comp_b = row["total_compressed_bytes"] or 0
        ratio = round((1.0 - (comp_b / max(raw_b, 1))) * 100.0, 1) if raw_b > 0 else 0.0

        return {
            "total_events": row["total_events"],
            "total_raw_bytes": raw_b,
            "total_compressed_bytes": comp_b,
            "overall_compression_ratio": ratio,
            "avg_data_quality_score": round(row["avg_dqi"] or 100.0, 1),
            "total_anomalies": row["total_anomalies"] or 0,
        }

    def get_analytics(self) -> Dict[str, Any]:
        """Aggregate real database statistics across multiple security dimensions."""
        stats = self.get_statistics()
        
        # Action breakdown
        c_act = self.conn.execute("""
            SELECT action, COUNT(*) as count 
            FROM ulpf_events 
            GROUP BY action 
            ORDER BY count DESC
        """)
        action_dist = [dict(r) for r in c_act.fetchall()]

        # Severity breakdown
        c_sev = self.conn.execute("""
            SELECT severity, COUNT(*) as count 
            FROM ulpf_events 
            GROUP BY severity 
            ORDER BY count DESC
        """)
        severity_dist = [dict(r) for r in c_sev.fetchall()]

        # Vendor breakdown
        c_ven = self.conn.execute("""
            SELECT vendor, COUNT(*) as count 
            FROM ulpf_events 
            GROUP BY vendor 
            ORDER BY count DESC
        """)
        vendor_dist = [dict(r) for r in c_ven.fetchall()]

        # Protocol breakdown
        c_proto = self.conn.execute("""
            SELECT protocol, COUNT(*) as count 
            FROM ulpf_events 
            WHERE protocol IS NOT NULL AND protocol != ''
            GROUP BY protocol 
            ORDER BY count DESC
        """)
        protocol_dist = [dict(r) for r in c_proto.fetchall()]

        # Top Destination Ports
        c_ports = self.conn.execute("""
            SELECT dst_port, COUNT(*) as count 
            FROM ulpf_events 
            WHERE dst_port IS NOT NULL
            GROUP BY dst_port 
            ORDER BY count DESC 
            LIMIT 6
        """)
        top_ports = [dict(r) for r in c_ports.fetchall()]

        # Top Source IPs
        c_srcs = self.conn.execute("""
            SELECT src_ip, COUNT(*) as count 
            FROM ulpf_events 
            WHERE src_ip IS NOT NULL AND src_ip != ''
            GROUP BY src_ip 
            ORDER BY count DESC 
            LIMIT 6
        """)
        top_sources = [dict(r) for r in c_srcs.fetchall()]

        # Anomaly vs Normal breakdown
        total_ev = stats.get("total_events", 0)
        total_anom = stats.get("total_anomalies", 0)
        normal_ev = max(0, total_ev - total_anom)

        return {
            "summary": stats,
            "action_distribution": action_dist,
            "severity_distribution": severity_dist,
            "vendor_distribution": vendor_dist,
            "protocol_distribution": protocol_dist,
            "top_ports": top_ports,
            "top_sources": top_sources,
            "anomaly_split": {
                "anomalous": total_anom,
                "normal": normal_ev,
                "anomaly_rate": round((total_anom / max(total_ev, 1)) * 100.0, 1),
            }
        }
