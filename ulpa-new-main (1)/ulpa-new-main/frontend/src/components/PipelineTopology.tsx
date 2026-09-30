import React from 'react';
import type { 
  StageEnum, 
  PipelineContext, 
  StageExecutionMetrics, 
  SampleLog 
} from '../types';
import { 
  FileInput, 
  Cpu, 
  GitMerge, 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  Zap,
  ArrowRight
} from 'lucide-react';

interface PipelineTopologyProps {
  context: PipelineContext | null;
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
}

interface StageNodeDef {
  id: StageEnum;
  number: string;
  title: string;
  sub: string;
  icon: React.ComponentType<{ size: number; color?: string; className?: string }>;
  accentColor: string;
  pulseClass: string;
}

const STAGES: StageNodeDef[] = [
  { id: 'INGEST', number: '01', title: 'INGESTION', sub: 'Zero-Loss Capture', icon: FileInput, accentColor: '#00f0ff', pulseClass: 'anim-pulse-cyan' },
  { id: 'PARSE', number: '02', title: 'PARSER', sub: 'Multi-Dialect AST', icon: Cpu, accentColor: '#c084fc', pulseClass: 'anim-pulse-cyan' },
  { id: 'NORMALIZE', number: '03', title: 'NORMALIZATION', sub: 'Canonical Taxonomy', icon: GitMerge, accentColor: '#38bdf8', pulseClass: 'anim-pulse-cyan' },
  { id: 'VALIDATE', number: '04', title: 'VALIDATION', sub: 'Semantic DQI Rules', icon: ShieldCheck, accentColor: '#10b981', pulseClass: 'anim-pulse-green' },
  { id: 'STORE', number: '05', title: 'STORAGE', sub: 'SQLite WAL Engine', icon: Database, accentColor: '#fbbf24', pulseClass: 'anim-pulse-amber' },
  { id: 'ML', number: '06', title: 'ML ANOMALY', sub: 'Isolation Forest', icon: BrainCircuit, accentColor: '#f43f5e', pulseClass: 'anim-pulse-red' },
  { id: 'STANDARDIZED', number: '07', title: 'EXPORT', sub: 'SIEM ECS / HEC / OCSF', icon: CheckCircle2, accentColor: '#818cf8', pulseClass: 'anim-pulse-green' },
];

export const PipelineTopology: React.FC<PipelineTopologyProps> = ({
  context,
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
}) => {
  const getStageMetric = (stageId: StageEnum): StageExecutionMetrics | undefined => {
    return context?.stage_metrics?.find((m) => m.stage === stageId);
  };

  const getStageStatus = (stageId: StageEnum) => {
    if (!context) return { isCompleted: false, isCurrent: false, status: 'PENDING' };
    const isCompleted = context.stages_completed?.includes(stageId) || false;
    const isCurrent = context.current_stage === stageId || activeTransitionStage === stageId;
    const metric = getStageMetric(stageId);
    if (metric?.status === 'ERROR') return { isCompleted, isCurrent, status: 'ERROR' };
    if (metric?.status === 'WARNING') return { isCompleted, isCurrent, status: 'WARNING' };
    if (isCurrent && !isCompleted) return { isCompleted: false, isCurrent: true, status: 'RUNNING' };
    if (isCompleted) return { isCompleted: true, isCurrent, status: 'COMPLETED' };
    return { isCompleted: false, isCurrent: false, status: 'PENDING' };
  };

  const getStageLiveSnippet = (stageId: StageEnum): string => {
    if (!context) return 'Standby';
    if (stageId === 'INGEST' && context.raw_event) return `${context.raw_event.raw.length_bytes}B • SHA-256 OK`;
    if (stageId === 'PARSE' && context.parsed_event) return `${context.parsed_event.parser_name} (${Object.keys(context.parsed_event.extracted_fields).length} keys)`;
    if (stageId === 'NORMALIZE' && context.normalized_event) return `${context.normalized_event.event.action} • ${context.normalized_event.event.severity}`;
    if (stageId === 'VALIDATE' && context.validated_event) return `DQI ${context.validated_event.data_quality_score}% • Validated`;
    if (stageId === 'STORE' && context.stored_event) return `WAL -${context.stored_event.storage.compression_ratio}% reduction`;
    if (stageId === 'ML' && context.ml_event) return `Score: ${context.ml_event.ml.anomaly_score.toFixed(2)} (${context.ml_event.ml.risk_level})`;
    if (stageId === 'STANDARDIZED' && context.final_event) return `ECS, Splunk, OCSF Ready`;
    return 'Pending execution';
  };

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Top Header & Engine Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        
        {/* Left: Title & Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#00f0ff" />
            <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc', letterSpacing: '0.04em' }}>
              Pipeline Structure
            </span>
          </div>

          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => onSetMode('STREAM')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'STREAM' ? '#00f0ff' : 'transparent',
                color: mode === 'STREAM' ? '#040711' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Live Stream
            </button>
            <button
              onClick={() => onSetMode('DEBUG')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: mode === 'DEBUG' ? '#c084fc' : 'transparent',
                color: mode === 'DEBUG' ? '#040711' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              Step Debugger
            </button>
          </div>
        </div>

        {/* Right: Controls dependent on mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Sample Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Sample:</span>
            <select
              value={selectedSampleId}
              onChange={(e) => onSelectSample(e.target.value)}
              style={{
                background: '#060911',
                border: '1px solid var(--border-medium)',
                borderRadius: '7px',
                color: '#f8fafc',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                padding: '5px 10px',
                outline: 'none',
              }}
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.vendor} • {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* STREAM Mode Controls */}
          {mode === 'STREAM' && (
            <>
              {/* EPS Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.7)', padding: '4px 10px', borderRadius: '7px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Rate:</span>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={eps}
                  onChange={(e) => onSetEps(parseFloat(e.target.value))}
                  style={{ width: '60px', accentColor: '#00f0ff', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: '42px' }}>
                  {eps} EPS
                </span>
              </div>

              {/* Single Event Trigger */}
              <button
                onClick={onTriggerSingleEvent}
                disabled={isProcessing}
                className="btn-cyber btn-cyber-secondary"
                style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                title="Send a single event through the pipeline"
              >
                <Zap size={12} />
                <span>Single</span>
              </button>

              {/* Toggle Live Stream */}
              <button
                onClick={onToggleStream}
                className={`btn-cyber ${isStreaming ? 'btn-cyber-danger' : 'btn-cyber-primary'}`}
                style={{ padding: '5px 12px', fontSize: '0.74rem' }}
              >
                {isStreaming ? <Pause size={12} /> : <Play size={12} />}
                <span>{isStreaming ? 'Stop Stream' : 'Start Stream'}</span>
              </button>
            </>
          )}

          {/* DEBUG Mode Controls */}
          {mode === 'DEBUG' && (
            <>
              <button
                onClick={onStepForward}
                disabled={!canStepForward || isProcessing}
                className="btn-cyber btn-cyber-primary"
                style={{ padding: '5px 10px', fontSize: '0.72rem' }}
              >
                <StepForward size={12} />
                <span>Step ➔</span>
              </button>

              <button
                onClick={onFastForward}
                disabled={isProcessing}
                className="btn-cyber btn-cyber-secondary"
                style={{ padding: '5px 10px', fontSize: '0.72rem' }}
              >
                <FastForward size={12} />
                <span>Fast-Forward ⏩</span>
              </button>

              <button
                onClick={onResetStepper}
                className="btn-cyber btn-cyber-secondary"
                style={{ padding: '5px 10px', fontSize: '0.72rem' }}
              >
                <RotateCcw size={12} />
                <span>Reset ↺</span>
              </button>
            </>
          )}

        </div>

      </div>

      {/* 7-Stage Horizontal Pipeline Flow Canvas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', alignItems: 'stretch' }}>
        {STAGES.map((st, idx) => {
          const Icon = st.icon;
          const { isCompleted, isCurrent } = getStageStatus(st.id);
          const metric = getStageMetric(st.id);
          const liveText = getStageLiveSnippet(st.id);
          const isSelected = selectedStage === st.id;

          let borderCol = 'var(--border-subtle)';
          let bgGrad = 'rgba(15, 23, 42, 0.7)';
          let pulseClass = '';

          if (isCurrent) {
            borderCol = st.accentColor;
            bgGrad = `linear-gradient(180deg, ${st.accentColor}18 0%, rgba(15, 23, 42, 0.9) 100%)`;
            pulseClass = st.pulseClass;
          } else if (isCompleted) {
            borderCol = 'rgba(16, 185, 129, 0.4)';
            bgGrad = 'rgba(15, 23, 42, 0.85)';
          }

          return (
            <div
              key={st.id}
              onClick={() => onSelectStage(st.id)}
              className={pulseClass}
              style={{
                background: bgGrad,
                border: `1px solid ${borderCol}`,
                borderRadius: '12px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                boxShadow: isSelected ? `0 0 20px ${st.accentColor}25` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.borderColor = borderCol;
              }}
            >
              {/* Connector Arrow (except last) */}
              {idx < STAGES.length - 1 && (
                <div 
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#0b1120',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight size={10} color={isCompleted ? '#10b981' : '#64748b'} />
                </div>
              )}

              {/* Node Header: Number + Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: st.accentColor, fontFamily: 'var(--font-mono)' }}>
                  [{st.number}]
                </span>
                
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${st.accentColor}15`,
                    border: `1px solid ${st.accentColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={14} color={st.accentColor} />
                </div>
              </div>

              {/* Node Title & Subtitle */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-main)', letterSpacing: '0.01em' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {st.sub}
                </div>
              </div>

              {/* Live Status & Data Snippet */}
              <div 
                style={{
                  background: 'rgba(6, 9, 17, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '0.64rem', color: isCompleted ? '#34d399' : isCurrent ? '#00f0ff' : '#64748b', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {isCurrent ? '⚡ RUNNING' : isCompleted ? '✓ COMPLETED' : 'STANDBY'}
                </div>
                <div style={{ fontSize: '0.64rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={liveText}>
                  {liveText}
                </div>
                {metric && (
                  <div style={{ fontSize: '0.58rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                    {metric.duration_us} µs
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer Info Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#10b981' }}>✓ Pipeline Engine Operational</span>
          <span>•</span>
          <span>Click any stage card to open technical workbench</span>
        </div>
        <div>
          Total Stage Latency: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{context?.total_duration_us ?? 380} µs</span>
        </div>
      </div>

    </div>
  );
};
