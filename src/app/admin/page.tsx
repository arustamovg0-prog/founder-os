'use client';

import { MOCK_STARTUPS, MOCK_PITCHES, ROADMAP_STAGES } from '@/lib/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Users, TrendingUp, Brain, Briefcase, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_ORDER = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'];
const STAGE_LABELS: Record<string, string> = { idea: 'Idea', validation: 'Validation', mvp: 'MVP', growth: 'Growth', investment_ready: 'Inv. Ready' };
const STAGE_COLORS: Record<string, string> = { idea: '#64748b', validation: '#f59e0b', mvp: '#3b82f6', growth: '#7c3aed', investment_ready: '#10b981' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || '#94a3b8' }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const totalMRR = MOCK_STARTUPS.reduce((s, st) => s + st.metrics.mrr, 0);
  const avgScore = Math.round(MOCK_STARTUPS.reduce((s, st) => s + (st.aiScores.overallReadinessScore || 0), 0) / MOCK_STARTUPS.length);
  const readyCount = MOCK_STARTUPS.filter(s => (s.aiScores.overallReadinessScore || 0) >= 75).length;
  const stuckCount = MOCK_STARTUPS.filter(s => s.metrics.runwayMonths <= 6).length;

  const stageDistrib = STAGE_ORDER.map(stage => ({
    stage: STAGE_LABELS[stage],
    count: MOCK_STARTUPS.filter(s => s.stage === stage).length,
    color: STAGE_COLORS[stage],
  }));

  const mrrByStartup = MOCK_STARTUPS.map(s => ({ name: s.name.split(' ')[0], mrr: s.metrics.mrr }));
  const scoreData = MOCK_STARTUPS.map(s => ({ name: s.name.split(' ')[0], score: s.aiScores.overallReadinessScore || 0 }));

  const alerts = [
    ...MOCK_STARTUPS.filter(s => s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0).map(s => ({
      type: 'danger', msg: `${s.name} — only ${s.metrics.runwayMonths}mo runway left`, icon: <AlertTriangle size={13} />,
    })),
    ...MOCK_STARTUPS.filter(s => (s.aiScores.overallReadinessScore || 0) >= 80 && s.stage !== 'investment_ready').map(s => ({
      type: 'success', msg: `${s.name} — AI Score 80+, ready for next stage`, icon: <CheckCircle size={13} />,
    })),
    { type: 'info', msg: `${MOCK_PITCHES.filter(p => p.status === 'pending').length} pending pitch requests need attention`, icon: <Clock size={13} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>UNTITLED ADMIN</span>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Ecosystem Overview</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>UNTITLED Founder OS — Admin Control Panel</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Startups', value: MOCK_STARTUPS.length, icon: <Users size={18} />, color: '#7c3aed', sub: 'in ecosystem' },
          { label: 'Total MRR', value: fmt(totalMRR), icon: <TrendingUp size={18} />, color: '#10b981', sub: 'combined portfolio' },
          { label: 'Avg AI Score', value: `${avgScore}/100`, icon: <Brain size={18} />, color: '#3b82f6', sub: 'ecosystem health' },
          { label: 'Investment Ready', value: readyCount, icon: <Zap size={18} />, color: '#f59e0b', sub: 'score ≥ 75' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, marginBottom: 12 }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          🔔 System Alerts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
              background: a.type === 'danger' ? 'rgba(239,68,68,0.08)' : a.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
              border: `1px solid ${a.type === 'danger' ? 'rgba(239,68,68,0.2)' : a.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
              color: a.type === 'danger' ? '#f87171' : a.type === 'success' ? '#34d399' : '#60a5fa',
            }}>
              {a.icon}
              <span style={{ fontSize: 13 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Stage Distribution */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Startups by Stage
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageDistrib} barSize={32}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Startups" radius={[6, 6, 0, 0]}>
                {stageDistrib.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Score by Startup */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            AI Readiness Scores
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData} barSize={32}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="AI Score" radius={[6, 6, 0, 0]}>
                {scoreData.map((d, i) => (
                  <Cell key={i} fill={d.score >= 75 ? '#10b981' : d.score >= 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Startup Table */}
      <div className="card">
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          All Startups — Quick View
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Startup', 'Stage', 'MRR', 'Team', 'Runway', 'Score', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_STARTUPS.map((s) => {
                const score = s.aiScores.overallReadinessScore || 0;
                const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{s.founderName}</div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${STAGE_COLORS[s.stage]}20`, color: STAGE_COLORS[s.stage], border: `1px solid ${STAGE_COLORS[s.stage]}30` }}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', fontFamily: 'Space Grotesk', fontWeight: 700, color: s.metrics.mrr > 0 ? '#10b981' : '#334155' }}>{fmt(s.metrics.mrr) || '—'}</td>
                    <td style={{ padding: '12px 12px', color: '#94a3b8' }}>{s.metrics.teamSize}</td>
                    <td style={{ padding: '12px 12px', color: s.metrics.runwayMonths <= 6 ? '#f87171' : '#10b981' }}>
                      {s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—'}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: scoreColor }}>{score}</span>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'deal' ? 'badge-purple' : 'badge-gray'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
