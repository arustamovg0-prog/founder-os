'use client';

import { useState, useEffect } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { TrendingUp, DollarSign, Users, Target, Zap, ArrowUpRight, Clock, CheckCircle, AlertCircle, Brain, Trophy, Star, Gift, Flame } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db, isDemoConfig } from '@/lib/firebase';
import { Startup } from '@/types';


function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

// STAGE_LABELS removed in favor of translations

function ScoreRing({ score, color = '#FFFFFF' }: { score: number; color?: string }) {
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
  const { profile, isDemoMode } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [allStartups, setAllStartups] = useState<Startup[]>([]);
  const [pitches, setPitches] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const t = useTranslations('FounderDashboard');
  const tCommon = useTranslations('Common');
  const tNav = useTranslations('Navigation');

  useEffect(() => {
    if (!profile?.linkedStartupId) {
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      setStartup({
        id: 'demo_startup',
        name: 'Nexus AI',
        tagline: 'AI-driven operations for modern teams',
        industry: 'B2B SaaS',
        stage: 'validation',
        status: 'active',
        founderIds: ['demo_founder'],
        metrics: { mrr: 12500, arr: 150000, mau: 4500, ltvCacRatio: 3.2, runwayMonths: 18, teamSize: 5 },
        currentRoadmapStageId: 'validation_1',
        roadmapProgress: 45,
        executiveSummaryAI: 'Strong traction in early validation. Need to focus on GTM scalable channels.',
        aiScores: { overallReadinessScore: 82, pitchDeckScore: 75 },
      } as Startup);
      setPitches([
        { id: '1', investorName: 'Aibek Ventures', status: 'pending', request: { snapshotScore: 82 } }
      ]);
      setAllStartups([
        { id: '2', name: 'Quantum Core', aiScores: { overallReadinessScore: 91 } } as Startup,
        { id: 'demo_startup', name: 'Nexus AI', aiScores: { overallReadinessScore: 82 } } as Startup,
        { id: '3', name: 'DataFlow', aiScores: { overallReadinessScore: 78 } } as Startup,
      ]);
      setRecentLogs([
        { id: '1', eventType: 'artifact_uploaded', description: 'Pitch Deck uploaded', timestamp: new Date(), actorRole: 'founder' }
      ]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'startups', profile.linkedStartupId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStartup({
          id: snap.id,
          ...data,
          aiScores: data.aiScores || { overallReadinessScore: 85 },
          metrics: {
            mrr: data.metrics?.mrr || 0,
            arr: (data.metrics?.mrr || 0) * 12,
            mau: data.metrics?.users || 0,
            ltvCacRatio: data.metrics?.ltvCacRatio || 0,
            runwayMonths: data.metrics?.runwayMonths || 12,
            teamSize: data.metrics?.teamSize || 2,
          }
        } as Startup);
      }
      setLoading(false);
    });

    import('firebase/firestore').then(({ query, where }) => {
      getDocs(query(collection(db, 'pitches'), where('startupId', '==', profile.linkedStartupId)))
        .then(snap => {
          if (!snap.empty) {
            setPitches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        })
        .catch(err => console.warn('Failed to fetch pitches for founder dashboard', err));
    });

    getDocs(collection(db, 'startups')).then(snap => {
      if (!snap.empty) {
        setAllStartups(snap.docs.map(d => ({ id: d.id, ...d.data(), aiScores: d.data().aiScores || { overallReadinessScore: 85 } } as Startup)));
      }
    }).catch(err => console.warn('Failed to fetch all startups for leaderboard', err));

    return () => unsubscribe();
  }, [profile]);

  if (loading) return <div className="animate-fade-in" style={{ padding: 32, color: '#64748b' }}>{t('loading')}</div>;
  if (!startup) return <div className="animate-fade-in" style={{ padding: 32, color: '#64748b' }}>{t('notFound')}</div>;

  const s = startup;
  const metrics = s.metrics;
  const currentStageIdx = ROADMAP_STAGES.findIndex(st => st.id === s.currentRoadmapStageId) || 0;
  const currentStage = ROADMAP_STAGES[currentStageIdx >= 0 ? currentStageIdx : 0];

  const kpis = [
    { label: 'MRR', value: fmt(metrics.mrr), icon: <DollarSign size={18} />, color: '#D8B4FE', change: '+16.7%', positive: true },
    { label: 'ARR', value: fmt(metrics.arr), icon: <TrendingUp size={18} />, color: '#FFFFFF', change: '+16.7%', positive: true },
    { label: 'MAU', value: metrics.mau.toLocaleString(), icon: <Users size={18} />, color: '#A1A1AA', change: '+9.1%', positive: true },
    { label: 'LTV/CAC', value: `${metrics.ltvCacRatio}x`, icon: <Target size={18} />, color: '#D8B4FE', change: '', positive: true },
    { label: 'Runway', value: t('kpis.runway', { months: metrics.runwayMonths }), icon: <Clock size={18} />, color: '#71717A', change: '', positive: true },
    { label: 'Team', value: t('kpis.team', { count: metrics.teamSize }), icon: <Users size={18} />, color: '#FFFFFF', change: '', positive: true },
  ];

  const logIcons: Record<string, string> = {
    artifact_uploaded: '📎', metric_updated: '📊', stage_completed: '✅',
    pitch_requested: '📨', meeting_held: '🤝', feedback_received: '💬', ai_analysis_done: '🤖',
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 6 }}>
            {s.name} <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 500 }}>#{s.industry}</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{s.tagline}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-purple">{(s.stage || '').replace('_', ' ')}</span>
          <span className="badge badge-green">{s.status}</span>
        </div>
      </div>

      {/* AI Readiness + Progress */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(161,161,170,0.05))', borderColor: 'rgba(255,255,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <ScoreRing score={s.aiScores.overallReadinessScore || 0} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Brain size={14} color="#D8B4FE" />
              <span style={{ fontSize: 12, color: '#D8B4FE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('aiReadinessScore')}</span>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: '12px' }}>
              {s.executiveSummaryAI}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {t('roadmap')}: <strong style={{ color: '#D8B4FE' }}>{s.roadmapProgress}%</strong>
              </div>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${s.roadmapProgress}%` }} />
              </div>
              <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                {t('stage', { current: currentStageIdx + 1, total: ROADMAP_STAGES.length })}
              </span>
            </div>
          </div>
          <Link href="/founder/roadmap" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {t('viewRoadmap')} <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                <span style={{ fontSize: 11, color: '#D4D4D8', fontWeight: 600, background: 'rgba(212,212,216,0.1)', padding: '2px 8px', borderRadius: '99px' }}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* AI Score detail */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: 11, color: '#D8B4FE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={12} /> {t('breakdown.title')}
          </div>
          {[
            { label: t('breakdown.pitchDeck'), val: s.aiScores.pitchDeckScore || 0, color: '#FFFFFF' },
            { label: t('breakdown.marketFit'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.9), color: '#A1A1AA' },
            { label: t('breakdown.traction'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.8), color: '#D4D4D8' },
            { label: t('breakdown.team'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 1.05), color: '#71717A' },
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
        <div className="card" style={{ background: 'rgba(212,212,216,0.04)', borderColor: 'rgba(212,212,216,0.15)' }}>
          <div style={{ fontSize: 11, color: '#A1A1AA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            {t('nextStep.title')}
          </div>
          {currentStage && (
            <>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{currentStage.title}</div>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>{currentStage.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {currentStage.requiredArtifacts.slice(0, 2).map(a => (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#71717A', flexShrink: 0 }} />
                    <span style={{ color: '#94a3b8' }}>{a.label}</span>
                    {a.isRequired && <span style={{ fontSize: 9, color: '#71717A', fontWeight: 700 }}>{t('nextStep.required')}</span>}
                  </div>
                ))}
              </div>
              <Link href="/founder/roadmap" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 14, fontSize: 12, color: '#A1A1AA', fontWeight: 600, textDecoration: 'none' }}>
                {t('nextStep.openRoadmap')} <ArrowUpRight size={12} />
              </Link>
            </>
          )}
        </div>

        {/* Ecosystem rank */}
        <div className="card" style={{ background: 'rgba(113,113,122,0.04)', borderColor: 'rgba(113,113,122,0.15)' }}>
          <div style={{ fontSize: 11, color: '#D4D4D8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            {t('ecosystemRank.title')}
          </div>
          {(() => {
            const sorted = [...allStartups].sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0));
            let rank = sorted.findIndex(st => st.id === s.id) + 1;
            if (rank === 0) rank = sorted.length + 1;
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 36 }}>{rank <= 3 ? medals[rank - 1] : `#${rank}`}</span>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#D4D4D8' }}>#{rank}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{t('ecosystemRank.outOfTotal', { total: allStartups.length })}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sorted.slice(0, 3).map((st, i) => (
                    <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: st.id === s.id ? 'rgba(113,113,122,0.1)' : 'transparent', border: st.id === s.id ? '1px solid rgba(113,113,122,0.2)' : 'none' }}>
                      <span style={{ fontSize: 12 }}>{medals[i]}</span>
                      <span style={{ fontSize: 12, flex: 1, color: st.id === s.id ? '#D4D4D8' : '#64748b', fontWeight: st.id === s.id ? 700 : 400 }}>{st.name}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>{st.aiScores.overallReadinessScore}</span>
                    </div>
                  ))}
                </div>
                <Link href="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 12, color: '#D4D4D8', fontWeight: 600, textDecoration: 'none' }}>
                  {t('ecosystemRank.fullLeaderboard')} <ArrowUpRight size={12} />
                </Link>
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stage */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            {t('currentStage.title')}
          </div>
          {currentStage && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className="badge badge-purple">{tCommon(`stages.${currentStage.phase}`)}</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700 }}>{currentStage.title}</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: '16px' }}>{currentStage.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentStage.requiredArtifacts.map((art) => {
                  const done = s.dataRoom?.pitchDeckUrl && art.key.includes('pitch');
                  return (
                    <div key={art.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {done
                        ? <CheckCircle size={14} color="#D4D4D8" />
                        : <AlertCircle size={14} color="#71717A" />
                      }
                      <span style={{ fontSize: 13, color: done ? '#D4D4D8' : '#71717A' }}>{art.label}</span>
                      {art.isRequired && !done && <span className="badge badge-yellow">{t('nextStep.required')}</span>}
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
              {t('activePitches.title')}
            </div>
            <Link href="/founder/pitches" style={{ fontSize: 12, color: '#FFFFFF', textDecoration: 'none', fontWeight: 500 }}>
              {t('activePitches.viewAll')}
            </Link>
          </div>
          {pitches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#334155' }}>
              <Zap size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>{t('activePitches.noPitches')}</p>
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
                    {t('activePitches.scoreAtRequest', { score: p.request.snapshotScore })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges & Quick Links */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={16} color="#71717A" />
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('achievements.title')}</span>
            </div>
            {(() => {
              const sorted = [...allStartups].sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0));
              let rank = sorted.findIndex(st => st.id === s.id) + 1;
              if (rank === 0) rank = sorted.length + 1;
              return (
                <span style={{ fontSize: 11, color: '#475569' }}>
                  <span dangerouslySetInnerHTML={{ __html: t('achievements.batchInfo', { rank: `<strong style="color: #71717A">#${rank}</strong>`, total: allStartups.length }) }} />
                </span>
              );
            })()}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {[
              { emoji: '🚀', label: t('badges.firstPitch'), earned: true, color: '#FFFFFF' },
              { emoji: '💡', label: t('badges.mvpReady'), earned: true, color: '#A1A1AA' },
              { emoji: '📊', label: t('badges.mrr'), earned: true, color: '#D4D4D8' },
              { emoji: '🏆', label: t('badges.investmentReady'), earned: true, color: '#71717A' },
              { emoji: '🌍', label: t('badges.firstExport'), earned: false, color: '#64748b' },
              { emoji: '💼', label: t('badges.seriesA'), earned: false, color: '#64748b' },
            ].map((b, i) => (
              <div key={i} title={b.label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 14px', borderRadius: 12,
                background: b.earned ? `${b.color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${b.earned ? `${b.color}30` : 'rgba(255,255,255,0.06)'}`,
                opacity: b.earned ? 1 : 0.4, transition: 'var(--transition-standard)', cursor: 'default', minWidth: 72,
              }}>
                <span style={{ fontSize: 22, filter: b.earned ? 'none' : 'grayscale(100%)' }}>{b.emoji}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: b.earned ? b.color : '#334155', whiteSpace: 'nowrap' }}>{b.label}</span>
                {b.earned && <Star size={8} color={b.color} fill={b.color} />}
              </div>
            ))}
          </div>

          {/* Quick links to new modules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { href: '/founder/perks', icon: <Gift size={14} />, label: tNav('perks'), sub: t('quickLinks.perksVal'), color: '#71717A' },
              { href: '/founder/legal', icon: <Zap size={14} />, label: tNav('legal'), sub: t('quickLinks.legalVal'), color: '#A1A1AA' },
              { href: '/founder/challenges', icon: <Flame size={14} />, label: tNav('challenges'), sub: t('quickLinks.challengesVal'), color: '#52525B' },
              { href: '/founder/community', icon: <Users size={14} />, label: tNav('community'), sub: t('quickLinks.communityVal'), color: '#D4D4D8' },
            ].map((link, i) => (
              <Link key={i} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: `${link.color}08`, border: `1px solid ${link.color}20`, cursor: 'pointer', transition: 'var(--transition-standard)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${link.color}40`; (e.currentTarget as HTMLDivElement).style.background = `${link.color}12`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${link.color}20`; (e.currentTarget as HTMLDivElement).style.background = `${link.color}08`; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: link.color }}>
                    {link.icon}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{link.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{link.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('digitalFootprint.title')}
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
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
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
