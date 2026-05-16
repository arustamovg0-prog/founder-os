'use client';

import { MOCK_STARTUPS, MOCK_PITCHES, MOCK_LOGS, ROADMAP_STAGES } from '@/lib/mockData';
import { TrendingUp, DollarSign, Users, Target, Zap, ArrowUpRight, Clock, CheckCircle, AlertCircle, Brain } from 'lucide-react';
import Link from 'next/link';

const MY_STARTUP = MOCK_STARTUPS[0]; // PayFlow UZ demo

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

const STAGE_LABELS: Record<string, string> = {
  discovery: 'Discovery', validation: 'Validation',
  building: 'Building', scaling: 'Scaling', fundraising: 'Fundraising',
};

function ScoreRing({ score, color = '#7c3aed' }: { score: number; color?: string }) {
  const r = 30, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 9, color: '#475569', fontWeight: 600, letterSpacing: '0.5px' }}>/ 100</span>
      </div>
    </div>
  );
}

export default function FounderDashboard() {
  const s = MY_STARTUP;
  const metrics = s.metrics;
  const currentStageIdx = ROADMAP_STAGES.findIndex(st => st.id === s.currentRoadmapStageId);
  const currentStage = ROADMAP_STAGES[currentStageIdx];
  const pitches = MOCK_PITCHES.filter(p => p.startupId === s.id);
  const recentLogs = MOCK_LOGS.filter(l => l.startupId === s.id).slice(0, 4);

  const kpis = [
    { label: 'MRR', value: fmt(metrics.mrr), icon: <DollarSign size={18} />, color: '#10b981', change: '+16.7%', positive: true },
    { label: 'ARR', value: fmt(metrics.arr), icon: <TrendingUp size={18} />, color: '#7c3aed', change: '+16.7%', positive: true },
    { label: 'MAU', value: metrics.mau.toLocaleString(), icon: <Users size={18} />, color: '#3b82f6', change: '+9.1%', positive: true },
    { label: 'LTV/CAC', value: `${metrics.ltvCacRatio}x`, icon: <Target size={18} />, color: '#f59e0b', change: '', positive: true },
    { label: 'Runway', value: `${metrics.runwayMonths}mo`, icon: <Clock size={18} />, color: '#ec4899', change: '', positive: true },
    { label: 'Team', value: `${metrics.teamSize} ppl`, icon: <Users size={18} />, color: '#06b6d4', change: '', positive: true },
  ];

  const logIcons: Record<string, string> = {
    artifact_uploaded: '📎', metric_updated: '📊', stage_completed: '✅',
    pitch_requested: '📨', meeting_held: '🤝', feedback_received: '💬', ai_analysis_done: '🤖',
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
            {s.name} <span style={{ fontSize: 14, color: '#7c3aed', fontWeight: 500 }}>#{s.industry}</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{s.tagline}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-purple">{s.stage.replace('_', ' ')}</span>
          <span className="badge badge-green">{s.status}</span>
        </div>
      </div>

      {/* AI Readiness + Progress */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(59,130,246,0.05))', borderColor: 'rgba(124,58,237,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={s.aiScores.overallReadinessScore || 0} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Brain size={14} color="#a78bfa" />
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Readiness Score</span>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: '12px' }}>
              {s.executiveSummaryAI}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Roadmap: <strong style={{ color: '#a78bfa' }}>{s.roadmapProgress}%</strong>
              </div>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${s.roadmapProgress}%` }} />
              </div>
              <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                Stage {currentStageIdx + 1}/{ROADMAP_STAGES.length}
              </span>
            </div>
          </div>
          <Link href="/founder/roadmap" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            View Roadmap <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '8px',
                background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color,
              }}>
                {kpi.icon}
              </div>
              {kpi.change && (
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                  {kpi.change}
                </span>
              )}
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, marginBottom: '4px', color: kpi.color }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Founder Health Widget ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* AI Score detail */}
        <div className="card" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={12} /> AI Score Breakdown
          </div>
          {[
            { label: 'Pitch Deck', val: s.aiScores.pitchDeckScore || 0, color: '#7c3aed' },
            { label: 'Market Fit', val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.9), color: '#3b82f6' },
            { label: 'Traction', val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.8), color: '#10b981' },
            { label: 'Team', val: Math.round((s.aiScores.overallReadinessScore || 0) * 1.05), color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700 }}>{Math.min(item.val, 100)}</span>
              </div>
              <div className="progress-bar">
                <div style={{ height: '100%', width: `${Math.min(item.val, 100)}%`, borderRadius: 99, background: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Next Step */}
        <div className="card" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            ⚡ Следующий шаг
          </div>
          {currentStage && (
            <>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{currentStage.title}</div>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>{currentStage.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentStage.requiredArtifacts.slice(0, 2).map(a => (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ color: '#94a3b8' }}>{a.label}</span>
                    {a.isRequired && <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>REQUIRED</span>}
                  </div>
                ))}
              </div>
              <Link href="/founder/roadmap" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 12, color: '#34d399', fontWeight: 600, textDecoration: 'none' }}>
                Открыть Roadmap <ArrowUpRight size={12} />
              </Link>
            </>
          )}
        </div>

        {/* Ecosystem rank */}
        <div className="card" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            🏆 Ecosystem Rank
          </div>
          {(() => {
            const sorted = [...MOCK_STARTUPS].sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0));
            const rank = sorted.findIndex(st => st.id === s.id) + 1;
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 36 }}>{medals[rank - 1] || `#${rank}`}</span>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>#{rank}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>из {MOCK_STARTUPS.length} стартапов</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sorted.slice(0, 3).map((st, i) => (
                    <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: st.id === s.id ? 'rgba(245,158,11,0.1)' : 'transparent', border: st.id === s.id ? '1px solid rgba(245,158,11,0.2)' : 'none' }}>
                      <span style={{ fontSize: 12 }}>{medals[i]}</span>
                      <span style={{ fontSize: 12, flex: 1, color: st.id === s.id ? '#fbbf24' : '#64748b', fontWeight: st.id === s.id ? 700 : 400 }}>{st.name}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>{st.aiScores.overallReadinessScore}</span>
                    </div>
                  ))}
                </div>
                <Link href="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 12, color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>
                  Весь лидерборд <ArrowUpRight size={12} />
                </Link>
              </>
            );
          })()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Current Stage */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Current Stage
          </div>
          {currentStage && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className="badge badge-purple">{STAGE_LABELS[currentStage.phase]}</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700 }}>{currentStage.title}</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: '16px' }}>{currentStage.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentStage.requiredArtifacts.map((art) => {
                  const done = s.dataRoom.pitchDeckUrl && art.key.includes('pitch');
                  return (
                    <div key={art.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {done
                        ? <CheckCircle size={14} color="#10b981" />
                        : <AlertCircle size={14} color="#f59e0b" />
                      }
                      <span style={{ fontSize: 13, color: done ? '#10b981' : '#f59e0b' }}>{art.label}</span>
                      {art.isRequired && !done && <span className="badge badge-yellow">Required</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active Pitches */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Active Pitches
            </div>
            <Link href="/founder/pitches" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          {pitches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#334155' }}>
              <Zap size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No active pitches</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pitches.map((p) => (
                <div key={p.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{p.investorName}</span>
                    <span className={`badge ${p.status === 'pending' ? 'badge-yellow' : p.status === 'accepted' ? 'badge-green' : 'badge-blue'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#475569' }}>
                    Score at request: {p.request.snapshotScore}/100
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Digital Footprint
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLogs.map((log, i) => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}>
                  {logIcons[log.eventType]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: '#e2e8f0', marginBottom: '4px' }}>{log.description}</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ fontSize: 11, color: '#334155' }}>
                      {log.timestamp.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ fontSize: 11, color: '#334155', textTransform: 'capitalize' }}>{log.actorRole.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
