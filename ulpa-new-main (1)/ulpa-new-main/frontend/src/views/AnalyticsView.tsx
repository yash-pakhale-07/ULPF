import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RefreshCw, 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Network
} from 'lucide-react';
import { fetchAnalytics } from '../api';
import type { EngineStats } from '../types';

interface AnalyticsViewProps {
  stats: EngineStats | null;
  onBackToOverview: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  onBackToOverview,
}) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalytics();
      setAnalyticsData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load real database analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEvents = analyticsData?.summary?.total_events ?? stats?.storage.total_events ?? 0;
  const totalAnomalies = analyticsData?.summary?.total_anomalies ?? stats?.storage.total_anomalies ?? 0;
  const avgDqi = analyticsData?.summary?.avg_data_quality_score ?? stats?.storage.avg_data_quality_score ?? 100;
  const compRatio = analyticsData?.summary?.overall_compression_ratio ?? stats?.storage.overall_compression_ratio ?? 0;

  const actionDist: Array<{ action: string; count: number }> = analyticsData?.action_distribution || [];
  const severityDist: Array<{ severity: string; count: number }> = analyticsData?.severity_distribution || [];
  const vendorDist: Array<{ vendor: string; count: number }> = analyticsData?.vendor_distribution || [];
  const topPorts: Array<{ dst_port: number; count: number }> = analyticsData?.top_ports || [];

  const maxAction = Math.max(...actionDist.map(a => a.count), 1);
  const maxSev = Math.max(...severityDist.map(s => s.count), 1);
  const maxVendor = Math.max(...vendorDist.map(v => v.count), 1);
  const maxPort = Math.max(...topPorts.map(p => p.count), 1);

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
              <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>TELEMETRY ANALYTICS</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                Perimeter Telemetry & Security Analytics
              </h2>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              Real-time SQLite database aggregations across actions, threat severities, vendor dialects, and ports
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-cyber btn-cyber-secondary"
            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            title="Refresh database analytics"
          >
            <RefreshCw size={13} className={isLoading ? 'anim-pulse-cyan' : ''} />
            <span>{isLoading ? 'Aggregating...' : 'Refresh'}</span>
          </button>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              DATABASE: SQLite WAL Persistent
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>
            <Activity size={20} className="anim-pulse-cyan" />
            <span>Aggregating stored security events from database...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 700 }}>Analytics query error: {error}</span>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Top 4 Real KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Total Database Events</span>
                <Server size={16} color="#00f0ff" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00f0ff', margin: '4px 0' }}>
                {totalEvents.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Persistent SQLite WAL records
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Identified Anomalies</span>
                <ShieldAlert size={16} color={totalAnomalies > 0 ? '#f43f5e' : '#10b981'} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: totalAnomalies > 0 ? '#f43f5e' : '#10b981', margin: '4px 0' }}>
                {totalAnomalies} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>({totalEvents > 0 ? ((totalAnomalies / totalEvents) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Isolation Forest flagged threats
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Avg Data Quality (DQI)</span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#10b981', margin: '4px 0' }}>
                {avgDqi}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                100% Cryptographic integrity
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Storage Optimization</span>
                <TrendingUp size={16} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fbbf24', margin: '4px 0' }}>
                -{compRatio}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Zlib level 6 compression reduction
              </div>
            </div>

          </div>

          {/* 2-Column Analytics Grids */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* 1. Action Distribution */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#00f0ff" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                    Firewall Action Distribution
                  </h3>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>REAL SQL AGGREGATION</span>
              </div>

              {actionDist.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.78rem', padding: '20px 0', textAlign: 'center' }}>No action records stored yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {actionDist.map((act) => {
                    const pct = Math.round((act.count / maxAction) * 100);
                    const color = act.action === 'ALLOW' ? '#10b981' : act.action === 'DENY' || act.action === 'DROP' ? '#f43f5e' : '#fbbf24';
                    return (
                      <div key={act.action} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 700 }}>{act.action}</span>
                          <span style={{ color: color }}>{act.count} events ({((act.count / Math.max(totalEvents, 1)) * 100).toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Severity Classification Breakdown */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} color="#f43f5e" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                    Event Severity Breakdown
                  </h3>
                </div>
                <span className="badge badge-red" style={{ fontSize: '0.62rem' }}>RISK METRICS</span>
              </div>

              {severityDist.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.78rem', padding: '20px 0', textAlign: 'center' }}>No severity records stored yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {severityDist.map((sev) => {
                    const pct = Math.round((sev.count / maxSev) * 100);
                    const color = sev.severity === 'CRITICAL' ? '#f43f5e' : sev.severity === 'HIGH' ? '#fb923c' : sev.severity === 'MEDIUM' ? '#fbbf24' : '#38bdf8';
                    return (
                      <div key={sev.severity} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 700 }}>{sev.severity}</span>
                          <span style={{ color: color }}>{sev.count} events ({((sev.count / Math.max(totalEvents, 1)) * 100).toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Vendor / Source Dialect Mix */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#c084fc" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                    Vendor & Telemetry Dialect Mix
                  </h3>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>MULTI-SOURCE</span>
              </div>

              {vendorDist.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.78rem', padding: '20px 0', textAlign: 'center' }}>No vendor data available</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {vendorDist.map((v) => {
                    const pct = Math.round((v.count / maxVendor) * 100);
                    return (
                      <div key={v.vendor} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 700 }}>{v.vendor}</span>
                          <span style={{ color: '#c084fc' }}>{v.count} logs ({((v.count / Math.max(totalEvents, 1)) * 100).toFixed(1)}%)</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#c084fc', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Top Targeted Destination Ports */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Network size={18} color="#38bdf8" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f8fafc' }}>
                    Top Targeted Destination Ports
                  </h3>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>PORT ANALYSIS</span>
              </div>

              {topPorts.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.78rem', padding: '20px 0', textAlign: 'center' }}>No destination port data recorded</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topPorts.map((p) => {
                    const pct = Math.round((p.count / maxPort) * 100);
                    const isRisky = [445, 3389, 135, 6379].includes(p.dst_port);
                    return (
                      <div key={p.dst_port} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: isRisky ? '#f43f5e' : '#f8fafc', fontWeight: 700 }}>
                            Port {p.dst_port} {isRisky ? '(HIGH-RISK SERVICE)' : ''}
                          </span>
                          <span style={{ color: isRisky ? '#f43f5e' : '#38bdf8' }}>{p.count} connections</span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isRisky ? '#f43f5e' : '#38bdf8', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};
