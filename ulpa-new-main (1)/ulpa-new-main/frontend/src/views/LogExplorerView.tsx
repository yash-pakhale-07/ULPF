import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  Copy, 
  Check, 
  Eye, 
  Milestone,
  X
} from 'lucide-react';
import { fetchStoredEvents, fetchEventDetail } from '../api';
import type { EngineStats } from '../types';

interface LogExplorerViewProps {
  stats: EngineStats | null;
  onBackToOverview: () => void;
  onInspectEvent: (eventId: string) => void;
  onGoToJourney: (eventId: string) => void;
}

export const LogExplorerView: React.FC<LogExplorerViewProps> = ({
  stats,
  onBackToOverview,
  onInspectEvent,
  onGoToJourney,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState<'ALL' | 'ANOMALOUS' | 'NORMAL'>('ALL');
  
  // Pagination
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Detail Drawer State
  const [selectedEventDetail, setSelectedEventDetail] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isAnom = anomalyFilter === 'ANOMALOUS' ? true : anomalyFilter === 'NORMAL' ? false : undefined;
      const data = await fetchStoredEvents({
        limit,
        offset,
        search: searchTerm.trim() || undefined,
        action: selectedAction,
        severity: selectedSeverity,
        vendor: selectedVendor,
        isAnomalous: isAnom,
      });
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to query database events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [offset, selectedAction, selectedSeverity, selectedVendor, anomalyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    loadEvents();
  };

  const handleOpenDetail = async (eventId: string) => {
    try {
      const detail = await fetchEventDetail(eventId);
      setSelectedEventDetail(detail);
    } catch (err) {
      console.error('Failed to load event detail', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={onBackToOverview}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} />
            <span>Control Room</span>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>EVENT EXPLORER</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                Perimeter Security Log Explorer
              </h2>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Real-time query and technical drill-down into SQLite WAL stored telemetry records
            </p>
          </div>
        </div>

        {/* Status / Quick Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
          >
            <RefreshCw size={13} className={isLoading ? 'anim-pulse-cyan' : ''} />
            <span>Refresh</span>
          </button>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.7rem', color: '#00f0ff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              TOTAL: {stats?.storage.total_events ?? events.length} EVENTS STORED
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by UUID, IP, Vendor, Product, or Raw Payload..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 14px 8px 36px',
                background: '#050b14',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setOffset(0); }}
            style={{
              padding: '8px 12px',
              background: '#050b14',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          >
            <option value="ALL">Action: All</option>
            <option value="ALLOW">ALLOW</option>
            <option value="DENY">DENY</option>
            <option value="DROP">DROP</option>
            <option value="ALERT">ALERT</option>
            <option value="RESET">RESET</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => { setSelectedSeverity(e.target.value); setOffset(0); }}
            style={{
              padding: '8px 12px',
              background: '#050b14',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          >
            <option value="ALL">Severity: All</option>
            <option value="INFORMATIONAL">INFORMATIONAL</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>

          {/* Vendor Filter */}
          <select
            value={selectedVendor}
            onChange={(e) => { setSelectedVendor(e.target.value); setOffset(0); }}
            style={{
              padding: '8px 12px',
              background: '#050b14',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          >
            <option value="ALL">Vendor: All</option>
            <option value="Cisco">Cisco Systems</option>
            <option value="Palo Alto Networks">Palo Alto</option>
            <option value="Suricata">Suricata IDS</option>
            <option value="Amazon Web Services">AWS VPC Flow</option>
            <option value="Zeek Project">Zeek Network</option>
            <option value="Micro Focus ArcSight">ArcSight CEF</option>
            <option value="Microsoft">Microsoft Windows</option>
          </select>

          {/* Anomaly Filter */}
          <select
            value={anomalyFilter}
            onChange={(e) => { setAnomalyFilter(e.target.value as any); setOffset(0); }}
            style={{
              padding: '8px 12px',
              background: '#050b14',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          >
            <option value="ALL">ML Status: All</option>
            <option value="ANOMALOUS">Anomalies Only</option>
            <option value="NORMAL">Normal Traffic Only</option>
          </select>

          <button
            type="submit"
            className="btn-cyber btn-cyber-primary"
            style={{ padding: '8px 16px', fontSize: '0.78rem' }}
          >
            Search
          </button>

        </form>
      </div>

      {/* Main Events Table Container */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Table Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#00f0ff" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
              Stored Perimeter Events
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Showing {events.length} records (Offset: {offset})
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#00f0ff', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <RefreshCw size={20} className="anim-pulse-cyan" style={{ display: 'inline-block', marginRight: '8px' }} />
            Querying SQLite WAL index tables...
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
            <AlertTriangle size={20} style={{ display: 'inline-block', marginRight: '8px' }} />
            Query error: {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div style={{ padding: '50px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>No events matched your search query</div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Try adjusting your search terms or filters to inspect stored events.
            </p>
          </div>
        )}

        {/* Table Rows */}
        {!isLoading && !error && events.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                  <th style={{ padding: '10px 16px' }}>Event UUID</th>
                  <th style={{ padding: '10px 16px' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px' }}>Vendor / Dialect</th>
                  <th style={{ padding: '10px 16px' }}>Source IP:Port</th>
                  <th style={{ padding: '10px 16px' }}>Destination IP:Port</th>
                  <th style={{ padding: '10px 16px' }}>Action</th>
                  <th style={{ padding: '10px 16px' }}>Severity</th>
                  <th style={{ padding: '10px 16px' }}>DQI</th>
                  <th style={{ padding: '10px 16px' }}>Anomaly</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => {
                  const isAnom = ev.is_anomalous === 1 || (ev.anomaly_score && ev.anomaly_score >= 0.60);
                  const actColor = ev.action === 'ALLOW' ? '#10b981' : ev.action === 'DENY' || ev.action === 'DROP' ? '#f43f5e' : '#fbbf24';
                  const sevColor = ev.severity === 'CRITICAL' ? '#f43f5e' : ev.severity === 'HIGH' ? '#fb923c' : ev.severity === 'MEDIUM' ? '#fbbf24' : '#38bdf8';

                  return (
                    <tr
                      key={ev.event_id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)')}
                    >
                      {/* UUID */}
                      <td style={{ padding: '10px 16px', color: '#38bdf8', fontWeight: 700 }}>
                        {ev.event_id ? ev.event_id.slice(0, 8) + '...' : 'N/A'}
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>
                        {ev.timestamp ? ev.timestamp.slice(11, 19) : ev.ingested_at ? ev.ingested_at.slice(11, 19) : '00:00:00'}
                      </td>

                      {/* Vendor */}
                      <td style={{ padding: '10px 16px', color: '#f8fafc' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
                          {ev.vendor || 'Generic'}
                        </span>
                      </td>

                      {/* Source */}
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                        {ev.src_ip ? `${ev.src_ip}:${ev.src_port || 0}` : '—'}
                      </td>

                      {/* Destination */}
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                        {ev.dst_ip ? `${ev.dst_ip}:${ev.dst_port || 0}` : '—'}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: actColor, fontWeight: 700 }}>
                          {ev.action || 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Severity */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: sevColor, fontWeight: 700 }}>
                          {ev.severity || 'INFO'}
                        </span>
                      </td>

                      {/* DQI */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: (ev.data_quality_score || 100) >= 80 ? '#10b981' : '#fbbf24', fontWeight: 700 }}>
                          {ev.data_quality_score ?? 100}%
                        </span>
                      </td>

                      {/* Anomaly Score */}
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          className={`badge ${isAnom ? 'badge-red' : 'badge-green'}`}
                          style={{ fontSize: '0.6rem' }}
                        >
                          {ev.anomaly_score !== undefined ? Number(ev.anomaly_score).toFixed(2) : '0.00'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenDetail(ev.event_id)}
                            className="btn-cyber btn-cyber-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                            title="Quick Inspect Record"
                          >
                            <Eye size={11} />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => {
                              onInspectEvent(ev.event_id);
                              onGoToJourney(ev.event_id);
                            }}
                            className="btn-cyber btn-cyber-primary"
                            style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                            title="Open in Event Journey"
                          >
                            <Milestone size={11} />
                            <span>Journey</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0 || isLoading}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '4px 12px', fontSize: '0.74rem' }}
          >
            ← Previous Page
          </button>
          
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Page {Math.floor(offset / limit) + 1}
          </span>

          <button
            onClick={() => setOffset(offset + limit)}
            disabled={events.length < limit || isLoading}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '4px 12px', fontSize: '0.74rem' }}
          >
            Next Page →
          </button>
        </div>

      </div>

      {/* Quick Record Inspection Detail Drawer */}
      {selectedEventDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedEventDetail(null)}>
          <div
            className="glass-panel-elevated"
            style={{ width: '800px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={18} color="#00f0ff" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                  Database Stored Record Detail
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="btn-cyber btn-cyber-secondary"
                style={{ padding: '4px 8px' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Top Meta Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Event UUID</div>
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, wordBreak: 'break-all' }}>
                    {selectedEventDetail.event_id}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Vendor & Action</div>
                  <div style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 700 }}>
                    {selectedEventDetail.vendor} • {selectedEventDetail.action}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>DQI & Anomaly</div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                    DQI: {selectedEventDetail.data_quality_score}% • Anomaly: {Number(selectedEventDetail.anomaly_score || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Pristine Raw Log */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Pristine Raw Log Payload
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedEventDetail.raw_payload || '', 'raw')}
                    className="btn-cyber btn-cyber-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.66rem' }}
                  >
                    {copiedKey === 'raw' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    <span>Copy Raw</span>
                  </button>
                </div>
                <div className="code-box" style={{ maxHeight: '120px', color: '#38bdf8', fontSize: '0.72rem' }}>
                  {selectedEventDetail.raw_payload || 'No raw payload available'}
                </div>
              </div>

              {/* SHA-256 Hash */}
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>SHA-256 Digest</span>
                <span style={{ fontSize: '0.74rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {selectedEventDetail.raw_sha256 || 'N/A'}
                </span>
              </div>

              {/* Stored Normalized JSON */}
              {selectedEventDetail.normalized_json && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Stored Normalized Canonical Representation
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedEventDetail.normalized_json, null, 2), 'norm')}
                      className="btn-cyber btn-cyber-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.66rem' }}
                    >
                      {copiedKey === 'norm' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <div className="code-box" style={{ maxHeight: '200px', fontSize: '0.72rem' }}>
                    {typeof selectedEventDetail.normalized_json === 'string'
                      ? selectedEventDetail.normalized_json
                      : JSON.stringify(selectedEventDetail.normalized_json, null, 2)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    const id = selectedEventDetail.event_id;
                    setSelectedEventDetail(null);
                    onInspectEvent(id);
                    onGoToJourney(id);
                  }}
                  className="btn-cyber btn-cyber-primary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <Milestone size={14} />
                  <span>Trace Full Event Journey</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
