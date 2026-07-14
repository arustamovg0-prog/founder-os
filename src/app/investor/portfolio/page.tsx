'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const PIE_COLORS = ['#9333EA', '#A1A1AA', '#D4D4D8', '#71717A'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStartups() {
      try {
        const snap = await getDocs(collection(db, 'startups'));
        const dbStartups = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            aiScores: data.aiScores || { overallReadinessScore: 85 },
            metrics: {
              mrr: data.metrics?.mrr || 0,
              mau: data.metrics?.users || 0,
              ltvCacRatio: data.metrics?.ltvCacRatio || 0,
              runwayMonths: data.metrics?.runwayMonths || 0,
              arr: data.metrics?.arr || (data.metrics?.mrr || 0) * 12,
            },
            tags: data.tags || [],
          } as Startup;
        });
        setPortfolio(dbStartups.filter(s => (s.aiScores.overallReadinessScore || 0) >= 60));
      } catch (err) {
        console.warn('Failed to fetch portfolio', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartups();
  }, []);

  const totalMRR = portfolio.reduce((s, p) => s + (p.metrics?.mrr || 0), 0);
  const totalMAU = portfolio.reduce((s, p) => s + (p.metrics?.mau || 0), 0);
  const avgScore = portfolio.length > 0 ? Math.round(portfolio.reduce((s, p) => s + (p.aiScores?.overallReadinessScore || 0), 0) / portfolio.length) : 0;

  const mrrData = portfolio.map(s => ({ name: s.name, mrr: s.metrics?.mrr || 0, arr: s.metrics?.arr || 0 }));
  const industryData = Object.entries(
    portfolio.reduce((acc, s) => ({ ...acc, [s.industry]: (acc[s.industry] || 0) + 1 }), {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 24px', color: '#64748b' }}>Loading portfolio...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Portfolio</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Watchlist and tracked startups performance</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total MRR (Watchlist)', value: fmt(totalMRR), icon: <DollarSign size={18} />, color: '#D4D4D8' },
          { label: 'Total MAU', value: totalMAU.toLocaleString(), icon: <TrendingUp size={18} />, color: '#9333EA' },
          { label: 'Avg AI Score', value: `${avgScore}/100`, icon: <Briefcase size={18} />, color: '#A1A1AA' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}20`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* MRR Chart */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            MRR / ARR by Startup
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mrrData} barGap={4}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v / 1000}K`} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mrr" name="MRR" fill="#9333EA" radius={[6, 6, 0, 0]} />
              <Bar dataKey="arr" name="ARR" fill="#A1A1AA" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Industry Mix */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Industry Mix
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={industryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {industryData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend formatter={v => <span style={{ fontSize: 12, color: '#94a3b8' }}>{v}</span>} />
              <Tooltip formatter={(v) => [`${v} startup${(v as number) > 1 ? 's' : ''}`, 'Count']} contentStyle={{ background: '#0d0d20', border: '1px solid rgba(147,51,234,0.3)', borderRadius: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          Watchlist Companies
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Company', 'Stage', 'MRR', 'MAU', 'LTV/CAC', 'Runway', 'AI Score'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.map((s) => {
                const score = s.aiScores.overallReadinessScore || 0;
                const scoreColor = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 160ms var(--ease-out)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{s.location}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`badge ${s.stage === 'investment_ready' ? 'badge-green' : 'badge-purple'}`}>
                        {s.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Grotesk', fontWeight: 700, color: '#D4D4D8' }}>{fmt(s.metrics.mrr)}</td>
                    <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{s.metrics.mau.toLocaleString()}</td>
                    <td style={{ padding: '14px 12px', color: s.metrics.ltvCacRatio >= 5 ? '#D4D4D8' : '#71717A' }}>
                      {s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—'}
                    </td>
                    <td style={{ padding: '14px 12px', color: s.metrics.runwayMonths >= 12 ? '#D4D4D8' : '#71717A' }}>
                      {s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—'}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: scoreColor }}>{score}</span>
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

