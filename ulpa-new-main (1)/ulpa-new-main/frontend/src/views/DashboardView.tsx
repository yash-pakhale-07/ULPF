import React, { useState } from 'react';
import type { 
  PipelineContext, 
  EngineStats, 
  StageEnum, 
  SampleLog 
} from '../types';
import { PipelineTopology } from '../components/PipelineTopology';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Database, 
  TrendingDown, 
  Clock, 
  ArrowRight, 
  Copy, 
  Check, 
  Milestone
} from 'lucide-react';

interface DashboardViewProps {
  context: PipelineContext | null;
  stats: EngineStats | null;
  selectedStage: StageEnum;
  onSelectStage: (stage: StageEnum) => void;
  activeTransitionStage?: StageEnum | null;
  mode: 'STREAM' | 'DEBUG';
  onSetMode: (mode: 'STREAM' | 'DEBUG') => void;
  isStreaming: boolean;
  onToggleStream: () => void;
  eps: number;
  onSetEps: (eps: number) => void;
  samples: SampleLog[];
  selectedSampleId: string;
  onSelectSample: (sampleId: string) => void;
  onTriggerSingleEvent: () => void;
  onStepForward: () => void;
  onResetStepper: () => void;
  onFastForward: () => void;
  canStepForward: boolean;
  isProcessing: boolean;
  onInspectEvent: (eventId: string) => void;
  onGoToStage: (stageTab: string) => void;
  onGoToJourney: (eventId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  context,
  stats,
  selectedStage,
  onSelectStage,
  activeTransitionStage,
  mode,
  onSetMode,
  isStreaming,
  onToggleStream,
  eps,
  onSetEps,
  samples,
  selectedSampleId,
  onSelectSample,
  onTriggerSingleEvent,
  onStepForward,
  onResetStepper,
  onFastForward,
  canStepForward,
  isProcessing,
  onInspectEvent,
  onGoToStage,
  onGoToJourney,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const totalEvents = stats?.storage.total_events || stats?.total_processed || 0;
  const totalAnomalies = stats?.storage.total_anomalies || 0;
  const compressionRatio = stats?.storage.overall_compression_ratio || 52.4;
  const avgLatency = context?.total_duration_us || 340;
  const avgDqi = stats?.storage.avg_data_quality_score || 98.6;

  const rawPayload = context?.raw_event?.raw.payload || 'Awaiting log stream...';
  const sha256 = context?.raw_event?.raw.sha256_hash || '—';
  const normEvent = context?.normalized_event;
  const recentEvents = stats?.storage.recent_events || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. TOP KPI SUMMARY STRIP (Inspired by Observo.ai / Edge Delta) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        
        {/* Metric 1: Optimization / Reduction */}
        <div className="glass-panel" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Zlib Reduction
            </span>
            <TrendingDown size={15} color="#00f0ff" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00f0ff', margin: '4px 0 2px 0' }}>
            -{compressionRatio.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            WAL Columnar Footprint
          </div>
        </div>

        {/* Metric 2: Total Ingested Events */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Events
            </span>
            <Database size={15} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#f8fafc', margin: '4px 0 2px 0' }}>
            {totalEvents.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            SQLite WAL Stored Records
          </div>
        </div>

        {/* Metric 3: Data Quality Index */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average DQI
            </span>
            <ShieldCheck size={15} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#10b981', margin: '4px 0 2px 0' }}>
            {avgDqi.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Semantic Rule Integrity
          </div>
        </div>

        {/* Metric 4: Flagged Anomalies */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ML Anomalies
            </span>
            <ShieldAlert size={15} color={totalAnomalies > 0 ? '#f43f5e' : '#38bdf8'} />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: totalAnomalies > 0 ? '#f43f5e' : '#38bdf8', margin: '4px 0 2px 0' }}>
            {totalAnomalies}
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Isolation Forest Flags
          </div>
        </div>

        {/* Metric 5: Pipeline Latency */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pipeline Latency
            </span>
            <Clock size={15} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fbbf24', margin: '4px 0 2px 0' }}>
            {avgLatency} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>µs</span>
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            Sub-millisecond Preprocessing
          </div>
        </div>

      </div>

      {/* 2. HERO PIPELINE STRUCTURE TOPOLOGY CANVAS */}
      <PipelineTopology
        context={context}
        selectedStage={selectedStage}
        onSelectStage={(st) => {
          onSelectStage(st);
          if (st === 'INGEST') onGoToStage('ingestion');
          else if (st === 'PARSE') onGoToStage('parser');
          else if (st === 'NORMALIZE') onGoToStage('normalization');
          else if (st === 'VALIDATE') onGoToStage('validation');
          else if (st === 'STORE') onGoToStage('storage');
          else if (st === 'ML') onGoToStage('ml');
          else if (st === 'STANDARDIZED') onGoToStage('export');
        }}
        activeTransitionStage={activeTransitionStage}
        mode={mode}
        onSetMode={onSetMode}
        isStreaming={isStreaming}
        onToggleStream={onToggleStream}
        eps={eps}
        onSetEps={onSetEps}
        samples={samples}
        selectedSampleId={selectedSampleId}
        onSelectSample={onSelectSample}
        onTriggerSingleEvent={onTriggerSingleEvent}
        onStepForward={onStepForward}
        onResetStepper={onResetStepper}
        onFastForward={onFastForward}
        canStepForward={canStepForward}
        isProcessing={isProcessing}
      />

      {/* 3. MID SECTION: 2-COLUMN LIVE EVENT FOCUS & DIFF INSPECTOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        
        {/* Left: Pristine Raw Payload Focus */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>STAGE 01</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
                Pristine Raw Log Payload
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(rawPayload, 'raw')}
              className="btn-cyber btn-cyber-secondary"
              style={{ padding: '3px 8px', fontSize: '0.68rem' }}
            >
              {copiedKey === 'raw' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
              <span>Copy</span>
            </button>
          </div>

          <div className="code-box" style={{ minHeight: '140px', maxHeight: '180px', color: '#38bdf8', fontSize: '0.74rem' }}>
            {rawPayload}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            <span>SHA-256: <span style={{ color: '#10b981' }}>{sha256.slice(0, 20)}...</span></span>
            <span>Bytes: <span style={{ color: '#00f0ff' }}>{context?.raw_event?.raw.length_bytes || 0} B</span></span>
          </div>
        </div>

        {/* Right: Canonical Normalized Schema Focus */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>STAGE 03</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
                Normalized Canonical Schema
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(normEvent, null, 2), 'norm')}
              className="btn-cyber btn-cyber-secondary"
              style={{ padding: '3px 8px', fontSize: '0.68rem' }}
            >
              {copiedKey === 'norm' ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
              <span>Copy JSON</span>
            </button>
          </div>

          <div className="code-box" style={{ minHeight: '140px', maxHeight: '180px', color: '#c084fc', fontSize: '0.74rem' }}>
            {normEvent ? JSON.stringify(normEvent, null, 2) : '// Awaiting normalization...'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            <span>Action: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{normEvent?.event.action || '—'}</span></span>
            <span>Severity: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{normEvent?.event.severity || '—'}</span></span>
            <span>Taxonomy: <span style={{ color: '#38bdf8' }}>ULPF Standard v1.0</span></span>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM SECTION: STORED PERIMETER LOGS TABLE */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="#00f0ff" />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)' }}>
              Recent Stored Perimeter Events
            </span>
          </div>

          <button
            onClick={() => onGoToStage('explorer')}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
          >
            <span>Open Full Log Explorer</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            No perimeter events stored yet. Trigger single events or start live streaming above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                  <th style={{ padding: '10px 16px' }}>Event UUID</th>
                  <th style={{ padding: '10px 16px' }}>Timestamp</th>
                  <th style={{ padding: '10px 16px' }}>Vendor</th>
                  <th style={{ padding: '10px 16px' }}>Source IP</th>
                  <th style={{ padding: '10px 16px' }}>Destination IP</th>
                  <th style={{ padding: '10px 16px' }}>Action</th>
                  <th style={{ padding: '10px 16px' }}>Severity</th>
                  <th style={{ padding: '10px 16px' }}>DQI</th>
                  <th style={{ padding: '10px 16px' }}>Anomaly</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center' }}>Trace</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.slice(0, 6).map((ev: any, idx: number) => {
                  const isAnom = ev.is_anomalous === 1 || (ev.anomaly_score && ev.anomaly_score >= 0.60);
                  const actColor = ev.action === 'ALLOW' ? '#10b981' : ev.action === 'DENY' || ev.action === 'DROP' ? '#f43f5e' : '#fbbf24';
                  const sevColor = ev.severity === 'CRITICAL' ? '#f43f5e' : ev.severity === 'HIGH' ? '#fb923c' : ev.severity === 'MEDIUM' ? '#fbbf24' : '#38bdf8';

                  return (
                    <tr 
                      key={ev.event_id || idx}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)')}
                    >
                      <td style={{ padding: '10px 16px', color: '#38bdf8', fontWeight: 700 }}>
                        {ev.event_id ? ev.event_id.slice(0, 8) + '...' : 'N/A'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>
                        {ev.timestamp ? ev.timestamp.slice(11, 19) : '00:00:00'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#f8fafc' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
                          {ev.vendor || 'Generic'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                        {ev.src_ip || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                        {ev.dst_ip || '—'}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: actColor, fontWeight: 700 }}>
                          {ev.action || 'UNKNOWN'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: sevColor, fontWeight: 700 }}>
                          {ev.severity || 'INFO'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>
                          {ev.data_quality_score ?? 100}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={`badge ${isAnom ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.6rem' }}>
                          {ev.anomaly_score !== undefined ? Number(ev.anomaly_score).toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            onInspectEvent(ev.event_id);
                            onGoToJourney(ev.event_id);
                          }}
                          className="btn-cyber btn-cyber-primary"
                          style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                          title="Trace 7-Stage Event Journey"
                        >
                          <Milestone size={11} />
                          <span>Journey</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
