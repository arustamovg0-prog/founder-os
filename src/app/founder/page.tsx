"use client";

import { useState, useEffect } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { 
  TrendingUp, DollarSign, Users, Target, Zap, ArrowUpRight, 
  Clock, CheckCircle, AlertCircle, Brain, Trophy, Star, Gift, Flame 
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db, isDemoConfig } from '@/lib/firebase';
import { Startup } from '@/types';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n}`;
}

function ScoreRing({ score, color = '#111827' }: { score: number; color?: string }) {
  const r = 30, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div className="relative h-20 w-20">
      <svg width="80" height="80" className="-rotate-90 transform">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6" />
        <circle 
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          className="transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold text-zinc-900 dark:text-white">{score}</span>
        <span className="text-[9px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">/ 100</span>
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
  const tRoadmap = useTranslations('FounderRoadmap');

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
  }, [profile, isDemoMode]);

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">{t('loading')}</div>;
  if (!startup) return <div className="p-8 text-zinc-500">{t('notFound')}</div>;

  const s = startup;
  const metrics = s.metrics;
  const currentStageIdx = ROADMAP_STAGES.findIndex(st => st.id === s.currentRoadmapStageId) || 0;
  const currentStage = ROADMAP_STAGES[currentStageIdx >= 0 ? currentStageIdx : 0];

  const kpis = [
    { label: 'MRR', value: fmt(metrics.mrr), icon: <DollarSign size={18} />, change: '+16.7%' },
    { label: 'ARR', value: fmt(metrics.arr), icon: <TrendingUp size={18} />, change: '+16.7%' },
    { label: 'MAU', value: metrics.mau.toLocaleString(), icon: <Users size={18} />, change: '+9.1%' },
    { label: 'LTV/CAC', value: `${metrics.ltvCacRatio}x`, icon: <Target size={18} />, change: '' },
    { label: 'Runway', value: t('kpis.runway', { months: metrics.runwayMonths }), icon: <Clock size={18} />, change: '' },
    { label: 'Team', value: t('kpis.team', { count: metrics.teamSize }), icon: <Users size={18} />, change: '' },
  ];

  const logIcons: Record<string, string> = {
    artifact_uploaded: '📄', metric_updated: '📈', stage_completed: '✅',
    pitch_requested: '📨', meeting_held: '🤝', feedback_received: '💬', ai_analysis_done: '🤖',
  };

  return (
    <FadeIn className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {s.name} <span className="text-lg font-medium text-zinc-400 dark:text-zinc-500">#{s.industry}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{s.tagline}</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
            {(s.stage || '').replace('_', ' ')}
          </span>
          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400 capitalize">
            {s.status}
          </span>
        </div>
      </div>

      {/* AI Readiness + Progress */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <ScoreRing score={s.aiScores.overallReadinessScore || 0} />
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Brain size={16} className="text-zinc-900 dark:text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{t('aiReadinessScore')}</span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {s.executiveSummaryAI}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('roadmap')}: <strong className="text-zinc-900 dark:text-white">{s.roadmapProgress}%</strong>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-1000" style={{ width: `${s.roadmapProgress}%` }} />
              </div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t('stage', { current: currentStageIdx + 1, total: ROADMAP_STAGES.length })}
              </span>
            </div>
          </div>
          <Button asChild>
            <Link href="/founder/roadmap" className="gap-2">
              {t('viewRoadmap')} <ArrowUpRight size={16} />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, i) => (
          <StaggerItem key={i}>
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111] text-zinc-700 dark:text-zinc-300">
                    {kpi.icon}
                  </div>
                  {kpi.change && (
                    <span className="rounded-full bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400">
                      {kpi.change}
                    </span>
                  )}
                </div>
                <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">{kpi.value}</div>
                <div className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Founder Health Widget */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Score detail */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              <Brain size={14} /> {t('breakdown.title')}
            </div>
            <div className="space-y-4">
              {[
                { label: t('breakdown.pitchDeck'), val: s.aiScores.pitchDeckScore || 0 },
                { label: t('breakdown.marketFit'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.9) },
                { label: t('breakdown.traction'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 0.8) },
                { label: t('breakdown.team'), val: Math.round((s.aiScores.overallReadinessScore || 0) * 1.05) },
              ].map((item, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">{item.label}</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{Math.min(item.val, 100)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div 
                      className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-1000" 
                      style={{ width: `${Math.min(item.val, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Step */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('nextStep.title')}
            </div>
            {currentStage && (
              <>
                <div className="font-display text-lg font-bold text-zinc-900 dark:text-white">{currentStage.title}</div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{currentStage.description}</p>
                <div className="mt-4 space-y-2">
                  {currentStage.requiredArtifacts.slice(0, 2).map(a => (
                    <div key={a.key} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      <span className="font-medium text-zinc-600 dark:text-zinc-300">{a.label}</span>
                      {a.isRequired && <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{t('nextStep.required')}</span>}
                    </div>
                  ))}
                </div>
                <Link href="/founder/roadmap" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  {t('nextStep.openRoadmap')} <ArrowUpRight size={16} />
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ecosystem rank */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('ecosystemRank.title')}
            </div>
            {(() => {
              const sorted = [...allStartups].sort((a, b) => (b.aiScores.overallReadinessScore || 0) - (a.aiScores.overallReadinessScore || 0));
              let rank = sorted.findIndex(st => st.id === s.id) + 1;
              if (rank === 0) rank = sorted.length + 1;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <>
                  <div className="mb-6 flex items-center gap-4">
                    <span className="text-4xl">{rank <= 3 ? medals[rank - 1] : `#${rank}`}</span>
                    <div>
                      <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">#{rank}</div>
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('ecosystemRank.outOfTotal', { total: allStartups.length })}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sorted.slice(0, 3).map((st, i) => {
                      const isMe = st.id === s.id;
                      return (
                        <div key={st.id} className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                          isMe ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" : "bg-transparent"
                        )}>
                          <span>{medals[i]}</span>
                          <span className={cn("flex-1", isMe ? "font-bold text-zinc-900 dark:text-white" : "font-medium text-zinc-600 dark:text-zinc-300")}>{st.name}</span>
                          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{st.aiScores.overallReadinessScore}</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link href="/leaderboard" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    {t('ecosystemRank.fullLeaderboard')} <ArrowUpRight size={16} />
                  </Link>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
