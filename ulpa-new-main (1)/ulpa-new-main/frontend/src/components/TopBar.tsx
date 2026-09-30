import React from 'react';
import { 
  Terminal, 
  FileCode, 
  Radio, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';
import type { EngineStats } from '../types';

interface TopBarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  stats: EngineStats | null;
  isConnected?: boolean;
  onOpenTestBench: () => void;
  onOpenHistory?: () => void;
  onOpenExports: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  onOpenTestBench,
  onOpenExports,
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Pipeline Control Room';
      case 'ingestion': return 'Stage 01 — Raw Ingestion & Capture';
      case 'parser': return 'Stage 02 — Multi-Dialect Parser & AST';
      case 'normalization': return 'Stage 03 — Schema Normalization & Taxonomy';
      case 'validation': return 'Stage 04 — Semantic Validation & DQI';
      case 'storage': return 'Stage 05 — SQLite WAL Storage Engine';
      case 'ml': return 'Stage 06 — ML Anomaly & Entropy Studio';
      case 'export': return 'Stage 07 — SIEM & Data Lake Exporter';
      case 'analytics': return 'Perimeter Security Telemetry Analytics';
      case 'explorer': return 'Perimeter Log Explorer';
      case 'journey': return 'Event Lifecycle Journey & Traceability';
      default: return 'Control Room';
    }
  };

  const SUB_TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'explorer', label: 'Log Explorer' },
    { id: 'journey', label: 'Event Journey' },
  ];

  return (
    <header
      style={{
        background: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Breadcrumbs & View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
          <span>ULPF</span>
          <ChevronRight size={12} />
          <span style={{ color: '#94a3b8' }}>Pipeline</span>
          <ChevronRight size={12} />
        </div>
        <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
          {getTabTitle(activeTab)}
        </h1>
      </div>

      {/* Center: Quick Navigation Sub-Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.6)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`header-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right: Live Telemetry Badges & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Offline Air-Gap Badge */}
        <span 
          className="badge badge-green" 
          style={{ 
            fontSize: '0.66rem', 
            padding: '4px 8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
          }}
          title="100% Self-Contained Local Scikit-Learn & SQLite WAL Engine"
        >
          <ShieldCheck size={12} color="#10b981" />
          <span>OFFLINE AIR-GAP</span>
        </span>

        {/* Live Stream Indicator */}
        <span className="badge badge-blue" style={{ fontSize: '0.66rem', padding: '4px 8px' }}>
          <Radio size={11} className={stats?.is_streaming ? 'anim-pulse-cyan' : ''} />
          <span>{stats?.is_streaming ? `${stats.current_eps} EPS STREAMING` : 'IDLE / STEP'}</span>
        </span>

        {/* Action Buttons */}
        <button 
          className="btn-cyber btn-cyber-primary" 
          onClick={onOpenTestBench}
          style={{ padding: '6px 12px', fontSize: '0.74rem' }}
        >
          <Terminal size={13} />
          <span>Test Bench</span>
        </button>

        <button 
          className="btn-cyber btn-cyber-secondary" 
          onClick={onOpenExports}
          style={{ padding: '6px 12px', fontSize: '0.74rem' }}
        >
          <FileCode size={13} />
          <span>Export Gateway</span>
        </button>

      </div>
    </header>
  );
};
