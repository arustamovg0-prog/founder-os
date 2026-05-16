'use client';

import { useState } from 'react';
import { MOCK_STARTUPS } from '@/lib/mockData';
import { Startup } from '@/types';
import { Search, Filter, ArrowUpRight, TrendingUp, Users, Clock, Star, Brain, MapPin } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const INDUSTRIES = ['All', 'FinTech', 'EdTech', 'AgriTech', 'HealthTech'];
const STAGES = ['All', 'idea', 'validation', 'mvp', 'growth', 'investment_ready'];

const STAGE_COLORS: Record<string, string> = {
  idea: '#64748b', validation: '#f59e0b', mvp: '#3b82f6', growth: '#7c3aed', investment_ready: '#10b981',
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: size < 60 ? 13 : 16, fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  );
}

function StartupCard({ s }: { s: Startup }) {
  const score = s.aiScores.overallReadinessScore || 0;
  const stageColor = STAGE_COLORS[s.stage];

  return (
    <div className="card glass-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
          background: `linear-gradient(135deg, ${stageColor}40, ${stageColor}20)`,
          border: `1px solid ${stageColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 800, color: stageColor,
        }}>
          {s.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</span>
            <span style={{
              padding: '2px 8px', borderRadius: '99px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              background: `${stageColor}20`, color: stageColor, border: `1px solid ${stageColor}30`,
            }}>
              {s.stage.replace('_', ' ')}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.tagline}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} />{s.location}
            </span>
            <span style={{ fontSize: 11, color: '#475569' }}>#{s.industry}</span>
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
        {[
          { label: 'MRR', value: fmt(s.metrics.mrr), color: '#10b981' },
          { label: 'MAU', value: s.metrics.mau.toLocaleString(), color: '#3b82f6' },
          { label: 'LTV/CAC', value: s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—', color: '#f59e0b' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {s.executiveSummaryAI && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Brain size={12} color="#a78bfa" />
            <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
            {s.executiveSummaryAI.slice(0, 140)}...
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {s.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 10, color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {tag}
            </span>
          ))}
        </div>
        <Link href={`/investor/deal-flow`} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
          View <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function DealFlowPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('All');
  const [minScore, setMinScore] = useState(0);

  const filtered = MOCK_STARTUPS.filter(s => {
    const q = search.toLowerCase();
    if (search && !s.name.toLowerCase().includes(q) && !s.tagline.toLowerCase().includes(q)) return false;
    if (industry !== 'All' && s.industry !== industry) return false;
    if (stage !== 'All' && s.stage !== stage) return false;
    if ((s.aiScores.overallReadinessScore || 0) < minScore) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Deal Flow</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Browse AI-scored startups in the UNTITLED ecosystem</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              className="input-field"
              placeholder="Search startups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select className="input-field" value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '140px', appearance: 'none' }}>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <select className="input-field" value={stage} onChange={e => setStage(e.target.value)} style={{ width: '160px', appearance: 'none' }}>
            {STAGES.map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Star size={13} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Min score:</span>
            <input
              type="range" min={0} max={100} step={10}
              value={minScore}
              onChange={e => setMinScore(Number(e.target.value))}
              style={{ width: '80px', accentColor: '#7c3aed' }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', minWidth: 24 }}>{minScore}</span>
          </div>
          <span style={{ fontSize: 13, color: '#475569', flexShrink: 0 }}>{filtered.length} results</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {filtered.map(s => <StartupCard key={s.id} s={s} />)}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: '#334155' }}>
            <Filter size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
            <p>No startups match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
