'use client';

import { MOCK_STARTUPS } from '@/lib/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Brain, Target } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '$0';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || p.stroke || '#94a3b8' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const MRR_GROWTH = [8000, 12000, 18000, 25000, 31000, 37500];
const mrrTrend = MONTHS.map((m, i) => ({ month: m, mrr: MRR_GROWTH[i], startups: i + 2 }));

const PIE_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

const industryData = Object.entries(
  MOCK_STARTUPS.reduce((acc, s) => ({ ...acc, [s.industry]: (acc[s.industry] || 0) + 1 }), {} as Record<string, number>)
).map(([name, value]) => ({ name, value }));

const stageData = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'].map(stage => ({
  stage: stage.replace('_', ' '),
  count: MOCK_STARTUPS.filter(s => s.stage === stage).length,
}));

const radarData = [
  { metric: 'AI Score', value: Math.round(MOCK_STARTUPS.reduce((s, st) => s + (st.aiScores.overallReadinessScore || 0), 0) / MOCK_STARTUPS.length) },
  { metric: 'Roadmap', value: Math.round(MOCK_STARTUPS.reduce((s, st) => s + st.roadmapProgress, 0) / MOCK_STARTUPS.length) },
  { metric: 'MRR Growth', value: 72 },
  { metric: 'Team Score', value: 68 },
  { metric: 'Market Fit', value: 61 },
];

export default function AdminAnalyticsPage() {
  const totalMRR = MOCK_STARTUPS.reduce((s, st) => s + st.metrics.mrr, 0);
  const totalMAU = MOCK_STARTUPS.reduce((s, st) => s + st.metrics.mau, 0);
  const avgScore = Math.round(MOCK_STARTUPS.reduce((s, st) => s + (st.aiScores.overallReadinessScore || 0), 0) / MOCK_STARTUPS.length);
  const avgProgress = Math.round(MOCK_STARTUPS.reduce((s, st) => s + st.roadmapProgress, 0) / MOCK_STARTUPS.length);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Ecosystem Analytics</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Portfolio-level performance metrics and trends</p>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Portfolio MRR', value: fmt(totalMRR), change: '+24%', icon: <DollarSign size={18} />, color: '#10b981' },
          { label: 'Combined MAU', value: totalMAU.toLocaleString(), change: '+18%', icon: <Users size={18} />, color: '#7c3aed' },
          { label: 'Avg AI Score', value: `${avgScore}/100`, change: '+5pts', icon: <Brain size={18} />, color: '#3b82f6' },
          { label: 'Avg Roadmap Progress', value: `${avgProgress}%`, change: '+12%', icon: <Target size={18} />, color: '#f59e0b' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>{kpi.icon}</div>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                {kpi.change} MoM
              </span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* MRR Trend */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Portfolio MRR Growth (6 months)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrTrend}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#7c3aed" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ecosystem Health Radar */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Ecosystem Health
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} />
              <Radar name="Score" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Industry Distribution */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Industry Distribution
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={industryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={((p: any) => `${p.name} ${((p.percent ?? 0) * 100).toFixed(0)}%`) as any} labelLine={false}>
                {industryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} startup(s)`, 'Count']} contentStyle={{ background: '#0d0d20', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Stage Distribution
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageData} barSize={36}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Startups" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Startup Leaderboard */}
      <div className="card">
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          🏆 Startup Leaderboard — by AI Score
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...MOCK_STARTUPS].sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0)).map((s, i) => {
            const score = s.aiScores.overallReadinessScore || 0;
            const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '12px', background: i === 0 ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c32' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, color: i <= 2 ? '#050510' : '#64748b', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{s.industry} • {s.location}</div>
                </div>
                <div className="progress-bar" style={{ flex: 1, maxWidth: '200px' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${score}%`, background: scoreColor, boxShadow: `0 0 6px ${scoreColor}80` }} />
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 800, color: scoreColor, minWidth: 40, textAlign: 'right' }}>
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
