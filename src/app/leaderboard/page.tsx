'use client';

import { useState } from 'react';
import { MOCK_STARTUPS } from '@/lib/mockData';
import { Trophy, MapPin, TrendingUp, Users, Zap, Star, ArrowUpRight, Globe } from 'lucide-react';
import Link from 'next/link';

const STAGE_COLORS: Record<string, string> = {
  idea: '#64748b', validation: '#71717A', mvp: '#A1A1AA',
  growth: '#9333EA', investment_ready: '#D4D4D8',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

const FILTERS = [
  { key: 'score', label: '🏆 AI Score' },
  { key: 'mrr', label: '💰 MRR' },
  { key: 'mau', label: '👥 MAU' },
  { key: 'growth', label: '📈 Growth' },
] as const;

const INDUSTRY_FILTERS = ['All', ...Array.from(new Set(MOCK_STARTUPS.map(s => s.industry)))];

export default function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<'score' | 'mrr' | 'mau' | 'growth'>('score');
  const [industryFilter, setIndustryFilter] = useState('All');

  const sorted = [...MOCK_STARTUPS]
    .filter(s => industryFilter === 'All' || s.industry === industryFilter)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0);
      if (sortBy === 'mrr') return b.metrics.mrr - a.metrics.mrr;
      if (sortBy === 'mau') return b.metrics.mau - a.metrics.mau;
      if (sortBy === 'growth') return b.roadmapProgress - a.roadmapProgress;
      return 0;
    });

  const MEDALS = ['🥇', '🥈', '🥉'];
  const topThree = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '48px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: 99, background: 'rgba(113,113,122,0.12)', border: '1px solid rgba(113,113,122,0.25)', marginBottom: 16 }}>
            <Trophy size={13} color="#D4D4D8" />
            <span style={{ fontSize: 12, color: '#D4D4D8', fontWeight: 600 }}>UNTITLED Ecosystem</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 40, fontWeight: 800, marginBottom: 10 }}>
            Startup <span style={{ background: 'linear-gradient(135deg,#71717A,#52525B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leaderboard</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Рейтинг стартапов UNTITLED по AI Score, MRR и прогрессу
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setSortBy(f.key)} style={{
                padding: '8px 16px', borderRadius: '7px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                background: sortBy === f.key ? 'rgba(113,113,122,0.2)' : 'transparent',
                color: sortBy === f.key ? '#D4D4D8' : '#64748b',
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', overflowX: 'auto' }}>
            {INDUSTRY_FILTERS.map(ind => (
              <button key={ind} onClick={() => setIndustryFilter(ind)} style={{
                padding: '8px 12px', borderRadius: '7px', border: 'none', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500, whiteSpace: 'nowrap',
                background: industryFilter === ind ? 'rgba(147,51,234,0.2)' : 'transparent',
                color: industryFilter === ind ? '#D8B4FE' : '#64748b',
              }}>{ind}</button>
            ))}
          </div>
        </div>

        {/* Podium — Top 3 */}
        {topThree.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr', gap: '16px', marginBottom: '32px', alignItems: 'end' }}>
            {/* 2nd */}
            <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '16px', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.15)', marginTop: '32px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥈</div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(148,163,184,0.2)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 800, color: '#94a3b8' }}>
                {topThree[1].name.charAt(0)}
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{topThree[1].name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{topThree[1].industry}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#94a3b8' }}>
                {sortBy === 'score' ? topThree[1].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[1].metrics.mrr) : sortBy === 'mau' ? topThree[1].metrics.mau.toLocaleString() : `${topThree[1].roadmapProgress}%`}
              </div>
            </div>
            {/* 1st */}
            <div style={{ textAlign: 'center', padding: '32px 20px', borderRadius: '20px', background: 'linear-gradient(135deg,rgba(113,113,122,0.12),rgba(82,82,91,0.08))', border: '2px solid rgba(113,113,122,0.3)', boxShadow: '0 0 40px rgba(113,113,122,0.15)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🥇</div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#71717A,#52525B)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, color: 'white', boxShadow: '0 0 20px rgba(113,113,122,0.4)' }}>
                {topThree[0].name.charAt(0)}
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{topThree[0].name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>{topThree[0].industry} · {topThree[0].location}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 900, color: '#D4D4D8' }}>
                {sortBy === 'score' ? topThree[0].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[0].metrics.mrr) : sortBy === 'mau' ? topThree[0].metrics.mau.toLocaleString() : `${topThree[0].roadmapProgress}%`}
              </div>
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#D4D4D8', background: 'rgba(113,113,122,0.15)', padding: '3px 10px', borderRadius: 99 }}>
                  {topThree[0].stage.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            {/* 3rd */}
            <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: '16px', background: 'rgba(180,120,60,0.06)', border: '1px solid rgba(180,120,60,0.15)', marginTop: '48px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🥉</div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(180,120,60,0.2)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 800, color: '#b47c3c' }}>
                {topThree[2].name.charAt(0)}
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{topThree[2].name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{topThree[2].industry}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#b47c3c' }}>
                {sortBy === 'score' ? topThree[2].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[2].metrics.mrr) : sortBy === 'mau' ? topThree[2].metrics.mau.toLocaleString() : `${topThree[2].roadmapProgress}%`}
              </div>
            </div>
          </div>
        )}

        {/* Rest of table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '48px' }}>
          {rest.map((s, i) => {
            const score = s.aiScores.overallReadinessScore || 0;
            const sc = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
            const stageColor = STAGE_COLORS[s.stage] || '#64748b';
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                transition: 'var(--transition-standard)',
              }}>
                <div style={{ width: 32, fontSize: 16, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#334155', textAlign: 'center', flexShrink: 0 }}>#{i + 4}</div>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${stageColor}20`, border: `1px solid ${stageColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 800, color: stageColor, flexShrink: 0 }}>
                  {s.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={9} />{s.location} · {s.industry}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: stageColor, background: `${stageColor}15`, padding: '3px 10px', borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>
                  {s.stage.replace('_', ' ')}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 800, color: sc }}>{score}</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>AI Score</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '60px' }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: '#D4D4D8' }}>{fmt(s.metrics.mrr)}</div>
                  <div style={{ fontSize: 10, color: '#334155' }}>MRR</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#334155' }}>
            Рейтинг обновляется в реальном времени · <Link href="/" style={{ color: '#9333EA', textDecoration: 'none' }}>Founder OS</Link> · UNTITLED Ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}
