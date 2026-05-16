'use client';

import { useState } from 'react';
import { MOCK_STARTUPS, ROADMAP_STAGES } from '@/lib/mockData';
import { Startup } from '@/types';
import { Search, Brain, MapPin, Eye, MessageSquare, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { ImpersonationPanel } from '@/components/ImpersonationPanel';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

const STAGE_COLORS: Record<string, string> = {
  idea: '#64748b', validation: '#f59e0b', mvp: '#3b82f6', growth: '#7c3aed', investment_ready: '#10b981',
};

function StartupDetailRow({ s }: { s: Startup }) {
  const [open, setOpen] = useState(false);
  const score = s.aiScores.overallReadinessScore || 0;
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const stageColor = STAGE_COLORS[s.stage];
  const currentStage = ROADMAP_STAGES.find(r => r.id === s.currentRoadmapStageId);

  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${open ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`, marginBottom: '10px', overflow: 'hidden', transition: 'all 0.2s' }}>
      {/* Row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', background: open ? 'rgba(124,58,237,0.05)' : 'transparent', transition: 'background 0.15s' }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `${stageColor}20`, border: `1px solid ${stageColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 800, color: stageColor,
        }}>{s.name.charAt(0)}</div>

        <div style={{ flex: '0 0 200px', minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
          <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} />{s.location}
          </div>
        </div>

        <div style={{ flex: '0 0 140px' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}25` }}>
            {s.stage.replace('_', ' ')}
          </span>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {[
            { l: 'MRR', v: fmt(s.metrics.mrr), c: '#10b981' },
            { l: 'MAU', v: s.metrics.mau > 0 ? s.metrics.mau.toLocaleString() : '—', c: '#3b82f6' },
            { l: 'Runway', v: s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—', c: s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 ? '#ef4444' : '#94a3b8' },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>{m.l}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: scoreColor }}>{score}</div>
          <div style={{ fontSize: 10, color: '#334155' }}>AI Score</div>
        </div>

        <div style={{ flex: '0 0 100px' }}>
          <div className="progress-bar">
            <div style={{ height: '100%', borderRadius: 99, width: `${s.roadmapProgress}%`, background: '#7c3aed', boxShadow: '0 0 6px rgba(124,58,237,0.5)' }} />
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4, textAlign: 'center' }}>{s.roadmapProgress}% done</div>
        </div>

        {open ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
      </div>

      {/* Expanded Detail */}
      {open && (
        <div style={{ padding: '20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,16,0.5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* AI Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Brain size={13} color="#a78bfa" />
                <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Copilot Analysis</span>
              </div>
              {s.executiveSummaryAI ? (
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, padding: '12px', background: 'rgba(124,58,237,0.07)', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.15)' }}>
                  {s.executiveSummaryAI}
                </p>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: '#334155', fontSize: 13 }}>
                  AI analysis not yet generated — upload pitch deck to trigger scoring
                </div>
              )}
            </div>

            {/* Metrics & Current Stage */}
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Full Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { l: 'ARR', v: fmt(s.metrics.arr) },
                  { l: 'Churn', v: s.metrics.churnRate > 0 ? `${s.metrics.churnRate}%` : '—' },
                  { l: 'LTV', v: fmt(s.metrics.ltv) },
                  { l: 'CAC', v: fmt(s.metrics.cac) },
                  { l: 'LTV/CAC', v: s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—' },
                  { l: 'Team', v: `${s.metrics.teamSize} ppl` },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{m.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {currentStage && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Current Roadmap Stage</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>{currentStage.title}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 16px' }}>
              <Eye size={13} /> View Full Profile
            </button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 16px' }}>
              <MessageSquare size={13} /> Send AI Hint
            </button>
            {score >= 75 && s.stage !== 'investment_ready' && (
              <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>
                <CheckCircle size={13} /> Approve Stage
              </button>
            )}
            {s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 && (
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, padding: '7px 16px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', cursor: 'pointer', fontFamily: 'Inter' }}>
                <AlertTriangle size={13} /> Flag Critical
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStartupsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = MOCK_STARTUPS.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.founderName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'ready') return (s.aiScores.overallReadinessScore || 0) >= 75;
    if (filter === 'critical') return s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0;
    if (filter === 'early') return ['idea', 'validation'].includes(s.stage);
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Startup Management</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Review, monitor and manage all startups in the ecosystem</p>
      </div>

      {/* Admin Impersonation */}
      <ImpersonationPanel />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder="Search startup or founder..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
          {[
            { key: 'all', label: `All (${MOCK_STARTUPS.length})` },
            { key: 'ready', label: `🟢 Ready (${MOCK_STARTUPS.filter(s => (s.aiScores.overallReadinessScore || 0) >= 75).length})` },
            { key: 'critical', label: `🔴 Critical (${MOCK_STARTUPS.filter(s => s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0).length})` },
            { key: 'early', label: `🌱 Early Stage` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              background: filter === f.key ? 'rgba(124,58,237,0.3)' : 'transparent',
              color: filter === f.key ? '#a78bfa' : '#64748b',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: '#475569', marginBottom: '16px' }}>{filtered.length} startups</div>

      {/* List */}
      {filtered.map(s => <StartupDetailRow key={s.id} s={s} />)}
    </div>
  );
}
