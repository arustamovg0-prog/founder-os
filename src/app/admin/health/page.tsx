'use client';

import { MOCK_STARTUPS } from '@/lib/mockData';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Activity, TrendingUp, Users, DollarSign, AlertTriangle,
  Target, Zap, Globe, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

const STAGE_ORDER = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'];
const STAGE_COLORS = {
  idea: '#64748b', validation: '#71717A', mvp: '#A1A1AA',
  growth: '#9333EA', investment_ready: '#D4D4D8',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Trend arrow helper ───────────────────────────────────────────────────────
function Trend({ val, suffix = '' }: { val: number; suffix?: string }) {
  const up = val > 0;
  const zero = val === 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: 12,
      color: zero ? '#64748b' : up ? '#D4D4D8' : '#52525B' }}>
      {zero ? <Minus size={11} /> : up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(val)}{suffix}
    </span>
  );
}

export default function EcosystemHealthPage() {
  const S = MOCK_STARTUPS;

  // ─── Aggregate metrics ─────────────────────────────────────────────────────
  const totalMRR = S.reduce((a, s) => a + s.metrics.mrr, 0);
  const totalARR = totalMRR * 12;
  const totalMAU = S.reduce((a, s) => a + s.metrics.mau, 0);
  const avgScore = Math.round(S.reduce((a, s) => a + (s.aiScores.overallReadinessScore || 0), 0) / S.length);
  const investReady = S.filter(s => s.stage === 'investment_ready').length;
  const criticalRunway = S.filter(s => s.metrics.runwayMonths > 0 && s.metrics.runwayMonths <= 6).length;
  const avgRunway = Math.round(S.filter(s => s.metrics.runwayMonths > 0).reduce((a, s) => a + s.metrics.runwayMonths, 0) / S.filter(s => s.metrics.runwayMonths > 0).length);

  // ─── Funnel data (conversion) ──────────────────────────────────────────────
  const funnelData = STAGE_ORDER.map(stage => ({
    name: stage.replace('_', ' '),
    value: S.filter(s => s.stage === stage).length,
    fill: STAGE_COLORS[stage as keyof typeof STAGE_COLORS],
  }));

  // ─── MRR by stage ──────────────────────────────────────────────────────────
  const mrrByStage = STAGE_ORDER.map(stage => {
    const stageStartups = S.filter(s => s.stage === stage);
    return {
      stage: stage.replace('_', ' '),
      totalMRR: stageStartups.reduce((a, s) => a + s.metrics.mrr, 0),
      count: stageStartups.length,
      color: STAGE_COLORS[stage as keyof typeof STAGE_COLORS],
    };
  }).filter(d => d.count > 0);

  // ─── Industry distribution ─────────────────────────────────────────────────
  const byIndustry = Object.entries(
    S.reduce((acc, s) => ({ ...acc, [s.industry]: (acc[s.industry] || 0) + 1 }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  // ─── Radar — ecosystem health ──────────────────────────────────────────────
  const radarData = [
    { metric: 'AI Score', value: avgScore },
    { metric: 'Runway Health', value: Math.round((S.filter(s => s.metrics.runwayMonths > 12).length / S.length) * 100) },
    { metric: 'Revenue', value: Math.round((S.filter(s => s.metrics.mrr > 10000).length / S.length) * 100) },
    { metric: 'Traction', value: Math.round((S.filter(s => s.metrics.mau > 500).length / S.length) * 100) },
    { metric: 'Stage Progress', value: Math.round((investReady / S.length) * 100) + 20 },
    { metric: 'Deal Flow', value: Math.round((S.filter(s => (s.aiScores.overallReadinessScore || 0) >= 60).length / S.length) * 100) },
  ];

  // ─── Simulated 6-month MRR trend ──────────────────────────────────────────
  const mrrTrend = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((month, i) => ({
    month,
    mrr: Math.round(totalMRR * (0.6 + i * 0.08) + ((i * 1337) % 5000)),
    arr: Math.round(totalARR * (0.6 + i * 0.08)),
  }));

  // ─── Runway buckets ───────────────────────────────────────────────────────
  const runwayBuckets = [
    { label: '≤3 мес', count: S.filter(s => s.metrics.runwayMonths > 0 && s.metrics.runwayMonths <= 3).length, color: '#52525B' },
    { label: '3-6 мес', count: S.filter(s => s.metrics.runwayMonths > 3 && s.metrics.runwayMonths <= 6).length, color: '#71717A' },
    { label: '6-12 мес', count: S.filter(s => s.metrics.runwayMonths > 6 && s.metrics.runwayMonths <= 12).length, color: '#A1A1AA' },
    { label: '>12 мес', count: S.filter(s => s.metrics.runwayMonths > 12).length, color: '#D4D4D8' },
  ];

  // ─── Ecosystem health score ────────────────────────────────────────────────
  const ecosystemScore = Math.round(
    (avgScore * 0.3) +
    ((investReady / S.length) * 100 * 0.25) +
    ((S.length - criticalRunway) / S.length * 100 * 0.25) +
    (Math.min(totalMRR / 100000, 1) * 100 * 0.2)
  );
  const scoreColor = ecosystemScore >= 70 ? '#D4D4D8' : ecosystemScore >= 50 ? '#71717A' : '#52525B';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700 }}>Ecosystem Health</h1>
          <div style={{
            padding: '4px 14px', borderRadius: 99,
            background: `${scoreColor}20`, border: `1px solid ${scoreColor}40`,
            fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 800, color: scoreColor,
          }}>
            {ecosystemScore}/100
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: 14 }}>Realtime ecosystem aggregate analytics — всё в одном месте</p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Ecosystem MRR', value: fmt(totalMRR), sub: `ARR ${fmt(totalARR)}`, icon: <DollarSign size={18} />, color: '#D4D4D8', trend: 12 },
          { label: 'Total MAU', value: totalMAU.toLocaleString(), sub: `${S.length} стартапов`, icon: <Users size={18} />, color: '#9333EA', trend: 8 },
          { label: 'Investment Ready', value: `${investReady}/${S.length}`, sub: `${Math.round(investReady / S.length * 100)}% conversion`, icon: <Target size={18} />, color: '#A1A1AA', trend: 1 },
          { label: 'Critical Runway', value: criticalRunway > 0 ? `⚠️ ${criticalRunway}` : '✅ 0', sub: `Avg ${avgRunway} мес runway`, icon: <AlertTriangle size={18} />, color: criticalRunway > 0 ? '#52525B' : '#D4D4D8', trend: -criticalRunway },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}20`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
              <Trend val={stat.trend} suffix={i === 0 ? '%' : ''} />
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 11, color: '#334155' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: MRR Trend + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* MRR Trend */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={14} color="#9333EA" /> Ecosystem MRR Growth (6 мес)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrTrend}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#9333EA" strokeWidth={2} fill="url(#mrrGrad)" />
              <Area type="monotone" dataKey="arr" name="ARR (÷12)" stroke="#A1A1AA" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color="#D4D4D8" /> Health Radar
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#475569' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#334155' }} />
              <Radar name="Ecosystem" dataKey="value" stroke="#D4D4D8" fill="#D4D4D8" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip formatter={(v) => [`${v}%`, '']} contentStyle={{ background: '#0d0d20', border: '1px solid rgba(212,212,216,0.3)', borderRadius: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Funnel + MRR by Stage + Industry */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Conversion Funnel */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Conversion Funnel
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnelData.map((stage, i) => {
              const pct = Math.round((stage.value / funnelData[0].value) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: stage.fill, fontWeight: 600, textTransform: 'capitalize' }}>{stage.name}</span>
                    <span style={{ color: '#64748b' }}>{stage.value} стартапов ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: stage.fill, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${stage.fill}50` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '16px', padding: '10px', borderRadius: '10px', background: 'rgba(212,212,216,0.06)', border: '1px solid rgba(212,212,216,0.15)', fontSize: 12, color: '#A1A1AA', textAlign: 'center' }}>
            Conversion: idea → ready = {Math.round((investReady / S.length) * 100)}%
          </div>
        </div>

        {/* MRR by Stage */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            MRR по стадиям
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mrrByStage} barGap={4}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="totalMRR" name="MRR" radius={[6, 6, 0, 0]}>
                {mrrByStage.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Runway Distribution */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Runway Distribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {runwayBuckets.map((b, i) => {
              const pct = Math.round((b.count / S.length) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: '#94a3b8' }}>{b.label}</div>
                  <div style={{ width: '80px' }}>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: b.color }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: b.color, width: '20px', textAlign: 'right' }}>{b.count}</div>
                </div>
              );
            })}
          </div>

          {criticalRunway > 0 && (
            <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(82,82,91,0.08)', border: '1px solid rgba(82,82,91,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={13} color="#f87171" />
              <span style={{ fontSize: 12, color: '#f87171' }}>{criticalRunway} стартап{criticalRunway > 1 ? 'а' : ''} требует внимания</span>
            </div>
          )}
        </div>
      </div>

      {/* Industry + Top performers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Industry breakdown */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={14} /> Industry Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {byIndustry.map(([industry, count], i) => {
              const pct = Math.round((count / S.length) * 100);
              const colors = ['#9333EA', '#A1A1AA', '#D4D4D8', '#71717A', '#52525B'];
              const c = colors[i % colors.length];
              return (
                <div key={industry} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${c}20`, border: `1px solid ${c}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: c, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#94a3b8' }}>{industry}</span>
                      <span style={{ color: '#475569' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: c }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top performers */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="#71717A" /> Top Performers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...S]
              .sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0))
              .slice(0, 5)
              .map((s, i) => {
                const score = s.aiScores.overallReadinessScore || 0;
                const sc = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: i === 0 ? 'rgba(212,212,216,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(212,212,216,0.15)' : 'rgba(255,255,255,0.04)'}` }}>
                    <span style={{ fontSize: 16 }}>{medals[i]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{s.industry} · {fmt(s.metrics.mrr)} MRR</div>
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 800, color: sc }}>{score}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
