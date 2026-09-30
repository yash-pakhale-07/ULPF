import React from 'react';
import { 
  Activity, 
  FileInput, 
  Cpu, 
  GitMerge, 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  FileCode, 
  BarChart3, 
  Search, 
  Milestone, 
  Terminal, 
  Clock
} from 'lucide-react';
import type { EngineStats } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  stats: EngineStats | null;
  isConnected: boolean;
  onOpenTestBench: () => void;
  onOpenHistory: () => void;
  onOpenExports: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  stats,
  isConnected,
  onOpenTestBench,
  onOpenHistory,
  onOpenExports,
}) => {
  const CORE_NAV = [
    { id: 'overview', label: 'Dashboard', icon: Activity, badge: 'Live' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'explorer', label: 'Log Explorer', icon: Search, badge: stats?.storage?.total_events ? String(stats.storage.total_events) : undefined },
    { id: 'journey', label: 'Event Journey', icon: Milestone },
  ];

  const PIPELINE_STAGES = [
    { id: 'ingestion', label: '01. Ingestion', icon: FileInput, color: '#00f0ff' },
    { id: 'parser', label: '02. Parser', icon: Cpu, color: '#c084fc' },
    { id: 'normalization', label: '03. Normalization', icon: GitMerge, color: '#38bdf8' },
    { id: 'validation', label: '04. Validation / DQI', icon: ShieldCheck, color: '#10b981' },
    { id: 'storage', label: '05. Storage (WAL)', icon: Database, color: '#fbbf24' },
    { id: 'ml', label: '06. ML Anomaly', icon: BrainCircuit, color: '#f43f5e' },
    { id: 'export', label: '07. SIEM Export', icon: FileCode, color: '#818cf8' },
  ];

  return (
    <aside 
      style={{
        width: '260px',
        minWidth: '260px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        zIndex: 40,
      }}
    >
      {/* Top Brand & Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 6px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0, 240, 255, 0.45)',
            }}
          >
            <Activity size={20} color="#040711" strokeWidth={2.8} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '1.15rem', 
                fontWeight: 900, 
                letterSpacing: '0.06em',
                color: '#f8fafc',
              }}>
                ULPF
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 5px' }}>
                v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Log Processing Engine
            </p>
          </div>
        </div>

        {/* Core Platform Nav Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 6px 8px', fontFamily: 'var(--font-mono)' }}>
            Operations
          </div>
          {CORE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                <Icon size={16} color={isActive ? '#00f0ff' : '#94a3b8'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span className={isActive ? 'badge badge-cyan' : 'badge badge-gray'} style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 7-Stage Pipeline Workflow Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 6px 8px', fontFamily: 'var(--font-mono)' }}>
            Processing Pipeline
          </div>
          {PIPELINE_STAGES.map((stage) => {
            const Icon = stage.icon;
            const isActive = activeTab === stage.id;
            return (
              <button
                key={stage.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(stage.id)}
              >
                <Icon size={15} color={isActive ? stage.color : '#64748b'} />
                <span style={{ flex: 1, fontSize: '0.8rem' }}>{stage.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Bottom Utility / Health & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
        
        {/* Quick Action Tools */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <button 
            className="btn-cyber btn-cyber-secondary" 
            onClick={onOpenTestBench}
            style={{ padding: '6px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            title="Custom Ingestion Test Bench"
          >
            <Terminal size={11} />
            <span>Bench</span>
          </button>
          
          <button 
            className="btn-cyber btn-cyber-secondary" 
            onClick={onOpenHistory}
            style={{ padding: '6px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            title="Recent Events Journal"
          >
            <Clock size={11} />
            <span>History</span>
          </button>

          <button 
            className="btn-cyber btn-cyber-secondary" 
            onClick={onOpenExports}
            style={{ padding: '6px 4px', fontSize: '0.68rem', justifyContent: 'center' }}
            title="SIEM Exporters Modal"
          >
            <FileCode size={11} />
            <span>SIEM</span>
          </button>
        </div>

        {/* Engine Operational Status Card */}
        <div 
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Engine Status</span>
            <span className={`badge ${isConnected ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isConnected ? '#10b981' : '#f43f5e' }} />
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#94a3b8' }}>Stream</span>
            <span style={{ color: stats?.is_streaming ? '#00f0ff' : '#64748b', fontWeight: 600 }}>
              {stats?.is_streaming ? `${stats.current_eps} EPS` : 'Idle / Step'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#94a3b8' }}>Storage</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>SQLite WAL</span>
          </div>
        </div>

      </div>

    </aside>
  );
};
