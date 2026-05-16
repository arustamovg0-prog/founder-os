'use client';

import { MOCK_STARTUPS, MOCK_PITCHES } from '@/lib/mockData';
import { TrendingUp, Users, Briefcase, DollarSign, ArrowUpRight, Star, Clock } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_BADGE: Record<string, string> = {
  idea: 'badge-gray', validation: 'badge-yellow',
  mvp: 'badge-blue', growth: 'badge-purple', investment_ready: 'badge-green',
};

function ScoreBar({ score, color = '#7c3aed' }: { score: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div className="progress-bar" style={{ flex: 1 }}>
        <div style={{ height: '100%', borderRadius: '99px', width: `${score}%`, background: color, transition: 'width 0.8s ease', boxShadow: `0 0 6px ${color}80` }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>{score}</span>
    </div>
  );
}

export default function InvestorDashboard() {
  const readyStartups = MOCK_STARTUPS.filter(s => s.aiScores.overallReadinessScore && s.aiScores.overallReadinessScore >= 60);
  const pendingPitches = MOCK_PITCHES.filter(p => p.status === 'pending').length;
  const activePitches = MOCK_PITCHES.filter(p => ['accepted', 'feedback_pending'].includes(p.status)).length;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          Investor Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Welcome back, Aibek Ventures</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Investment-Ready Startups', value: MOCK_STARTUPS.filter(s => (s.aiScores.overallReadinessScore || 0) >= 75).length, icon: <Star size={18} />, color: '#f59e0b' },
          { label: 'Active Pipeline', value: MOCK_STARTUPS.length, icon: <TrendingUp size={18} />, color: '#7c3aed' },
          { label: 'Pending Pitches', value: pendingPitches, icon: <Clock size={18} />, color: '#3b82f6' },
          { label: 'Active Pitches', value: activePitches, icon: <Briefcase size={18} />, color: '#10b981' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{
              width: 36, height: 36, borderRadius: 8, marginBottom: 12,
              background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color,
            }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Top Startups */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Top Opportunities
            </div>
            <Link href="/investor/deal-flow" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {readyStartups.map((s, i) => (
              <div key={s.id} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '6px',
                        background: `hsl(${i * 60}, 70%, 30%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                      }}>
                        {s.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
                      <span className={`badge ${STAGE_BADGE[s.stage]}`}>{s.stage.replace('_', ' ')}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{s.tagline}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 2 }}>MRR</div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: '#10b981' }}>{fmt(s.metrics.mrr)}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {[
                    { label: 'LTV/CAC', value: `${s.metrics.ltvCacRatio}x` },
                    { label: 'MAU', value: s.metrics.mau.toLocaleString() },
                    { label: 'Runway', value: `${s.metrics.runwayMonths}mo` },
                  ].map((m, j) => (
                    <div key={j} style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: '#334155' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>AI Readiness Score</div>
                  <ScoreBar score={s.aiScores.overallReadinessScore || 0} color={i === 0 ? '#10b981' : i === 1 ? '#7c3aed' : '#f59e0b'} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link href={`/investor/deal-flow`} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
                    View Profile <ArrowUpRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Pitch Requests */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            Pending Pitch Requests
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {MOCK_PITCHES.filter(p => p.status === 'pending').map((p) => {
              const startup = MOCK_STARTUPS.find(s => s.id === p.startupId);
              return (
                <div key={p.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{p.startupName}</span>
                    <span className="badge badge-yellow"><Clock size={10} /> Pending</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: '10px', lineHeight: 1.5 }}>
                    {p.request.message.slice(0, 100)}...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#475569' }}>Score: {p.request.snapshotScore}/100</span>
                    <span style={{ fontSize: 11, color: '#475569' }}>
                      {p.request.proposedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn-primary" style={{ flex: 1, fontSize: 12, padding: '7px' }}>Accept</button>
                    <button className="btn-secondary" style={{ flex: 1, fontSize: 12, padding: '7px' }}>Decline</button>
                  </div>
                </div>
              );
            })}
            {MOCK_PITCHES.filter(p => p.status === 'pending').length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#334155' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                <p style={{ fontSize: 13 }}>No pending requests</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
