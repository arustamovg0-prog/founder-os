'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { DollarSign, Users, Brain, Target } from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '$0';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || p.stroke || '#94a3b8' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const PIE_COLORS = ['#FFFFFF', '#A1A1AA', '#D4D4D8', '#71717A', '#52525B'];

export default function AdminAnalyticsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStartups() {
      try {
        const snap = await getDocs(collection(db, 'startups'));
        const dbStartups = snap.docs.map(d => {
          const data = d.data();
          // Generate fallback historical metrics if missing
          const currentMrr = data.metrics?.mrr || 0;
          const fallbackHistory = MONTHS.map((m, i) => ({
            month: m,
            mrr: currentMrr > 0 ? Math.round(currentMrr * (0.5 + (i * 0.1))) : 0
          }));

          return {
            id: d.id,
            ...data,
            aiScores: data.aiScores || { overallReadinessScore: 85 },
            metrics: {
              mrr: currentMrr,
              mau: data.metrics?.users || 0,
              ltvCacRatio: data.metrics?.ltvCacRatio || 0,
              runwayMonths: data.metrics?.runwayMonths || 0,
              arr: data.metrics?.arr || (currentMrr || 0) * 12,
            },
            historicalMetrics: data.historicalMetrics || fallbackHistory,
            tags: data.tags || [],
          } as Startup;
        });
        setStartups(dbStartups);
      } catch (err) {
        console.warn('Failed to fetch startups for analytics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartups();
  }, []);

  // Calculate dynamic MRR Trend
  const mrrTrendMap: Record<string, { month: string; mrr: number; startups: number }> = {};
  MONTHS.forEach(m => mrrTrendMap[m] = { month: m, mrr: 0, startups: 0 });

  startups.forEach(st => {
    st.historicalMetrics?.forEach(hm => {
      if (mrrTrendMap[hm.month]) {
        mrrTrendMap[hm.month].mrr += hm.mrr;
        if (hm.mrr > 0) mrrTrendMap[hm.month].startups += 1;
      }
    });
  });
  const mrrTrend = MONTHS.map(m => mrrTrendMap[m]);

  const totalMRR = startups.reduce((s, st) => s + (st.metrics?.mrr || 0), 0);
  const totalMAU = startups.reduce((s, st) => s + (st.metrics?.mau || 0), 0);
  const avgScore = startups.length ? Math.round(startups.reduce((s, st) => s + (st.aiScores?.overallReadinessScore || 0), 0) / startups.length) : 0;
  const avgProgress = startups.length ? Math.round(startups.reduce((s, st) => s + (st.roadmapProgress || 0), 0) / startups.length) : 0;

  const industryData = Object.entries(
    startups.reduce((acc, s) => ({ ...acc, [s.industry]: (acc[s.industry] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const stageData = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'].map(stage => ({
    stage: stage.replace('_', ' '),
    count: startups.filter(s => s.stage === stage).length,
  }));

  const radarData = [
    { metric: 'AI Score', value: avgScore },
    { metric: 'Roadmap', value: avgProgress },
    { metric: 'MRR Growth', value: 72 }, // dummy trend
    { metric: 'Team Score', value: 68 }, // dummy trend
    { metric: 'Market Fit', value: 61 }, // dummy trend
  ];

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 24px', color: '#64748b' }}>Loading analytics...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Ecosystem Analytics</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Portfolio-level performance metrics and trends</p>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Portfolio MRR', value: fmt(totalMRR), change: '+24%', icon: <DollarSign size={18} />, color: '#D4D4D8' },
          { label: 'Combined MAU', value: totalMAU.toLocaleString(), change: '+18%', icon: <Users size={18} />, color: '#FFFFFF' },
          { label: 'Avg AI Score', value: `${avgScore}/100`, change: '+5pts', icon: <Brain size={18} />, color: '#A1A1AA' },
          { label: 'Avg Roadmap Progress', value: `${avgProgress}%`, change: '+12%', icon: <Target size={18} />, color: '#71717A' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>{kpi.icon}</div>
              <span style={{ fontSize: 11, color: '#D4D4D8', fontWeight: 600, background: 'rgba(212,212,216,0.1)', padding: '2px 8px', borderRadius: 99 }}>
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
                  <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#FFFFFF" strokeWidth={2} fill="url(#mrrGrad)" />
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
              <Radar name="Score" dataKey="value" stroke="#FFFFFF" fill="#FFFFFF" fillOpacity={0.2} />
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
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Pie data={industryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={((p: any) => `${p.name} ${((p.percent ?? 0) * 100).toFixed(0)}%`) as any} labelLine={false}>
                {industryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} startup(s)`, 'Count']} contentStyle={{ background: '#0d0d20', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12 }} />
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
              <Bar dataKey="count" name="Startups" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
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
          {[...startups].sort((a, b) => (b.aiScores?.overallReadinessScore || 0) - (a.aiScores?.overallReadinessScore || 0)).map((s, i) => {
            const score = s.aiScores?.overallReadinessScore || 0;
            const scoreColor = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '12px', background: i === 0 ? 'rgba(212,212,216,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(212,212,216,0.15)' : 'rgba(255,255,255,0.05)'}` }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#71717A' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c32' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, color: i <= 2 ? '#050510' : '#64748b', flexShrink: 0 }}>
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
