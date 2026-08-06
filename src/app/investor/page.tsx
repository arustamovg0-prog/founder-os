'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup, PitchEvent } from '@/types';
import { TrendingUp, Users, Briefcase, DollarSign, ArrowUpRight, Star, Clock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_BADGE: Record<string, string> = {
  idea: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300',
  validation: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  mvp: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  growth: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
  investment_ready: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
};

function ScoreBar({ score, color = 'bg-primary' }: { score: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className={cn("text-xs font-bold", color.replace('bg-', 'text-').replace('-500', '-600'), color.replace('bg-', 'dark:text-').replace('-500', '-400'))}>
        {score}
      </span>
    </div>
  );
}

export default function InvestorDashboard() {
  const t = useTranslations('investorDashboard');
  const { profile, isDemoMode } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [pitches, setPitches] = useState<PitchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (isDemoMode) {
        setStartups([
          { id: '1', name: 'Nexus AI', stage: 'validation', status: 'active', metrics: { mrr: 12500, arr: 150000, users: 4500, ltvCacRatio: 3.2, runwayMonths: 18, teamSize: 5 }, aiScores: { overallReadinessScore: 82 }, founderName: 'Alex K.' } as Startup,
          { id: '2', name: 'Quantum Core', stage: 'mvp', status: 'active', metrics: { mrr: 45000, arr: 540000, users: 12000, ltvCacRatio: 4.1, runwayMonths: 12, teamSize: 15 }, aiScores: { overallReadinessScore: 91 }, founderName: 'Maria S.' } as Startup,
          { id: '3', name: 'DataFlow', stage: 'growth', status: 'deal', metrics: { mrr: 150000, arr: 1800000, users: 45000, ltvCacRatio: 5.5, runwayMonths: 24, teamSize: 45 }, aiScores: { overallReadinessScore: 95 }, founderName: 'John D.' } as Startup,
        ]);
        setPitches([
          { id: 'p1', startupId: '1', startupName: 'Nexus AI', investorId: 'inv1', status: 'pending', request: { message: 'We are raising a $2M seed round. Looking for a lead investor who understands AI infrastructure.', proposedDate: new Date(), snapshotScore: 82 } } as any,
          { id: 'p2', startupId: '2', startupName: 'Quantum Core', investorId: 'inv1', status: 'accepted', request: { message: 'We have strong traction in the MVP phase...', proposedDate: new Date(), snapshotScore: 91 } } as any,
        ]);
        setLoading(false);
        return;
      }

      try {
        const [startupsSnap, pitchesSnap] = await Promise.all([
          getDocs(collection(db, 'startups')),
          getDocs(collection(db, 'pitches'))
        ]);
        
        if (!startupsSnap.empty) {
          const dbStartups = startupsSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
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
            } as Startup;
          });
          setStartups(dbStartups);
        }
        
        if (!pitchesSnap.empty) {
          const dbPitches = pitchesSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            request: {
              ...d.data().request,
              proposedDate: d.data().request?.proposedDate?.toDate ? d.data().request.proposedDate.toDate() : new Date(),
            }
          } as PitchEvent));
          setPitches(dbPitches);
        }
      } catch (err) {
        console.warn('Failed to fetch data for investor dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">{t('loading')}</div>;

  const readyStartups = startups.filter(s => s.aiScores?.overallReadinessScore && s.aiScores.overallReadinessScore >= 60);
  const pendingPitches = pitches.filter(p => p.status === 'pending').length;
  const activePitches = pitches.filter(p => ['accepted', 'feedback_pending'].includes(p.status)).length;

  return (
    <FadeIn className="space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle', { name: profile?.name || 'Инвестор' })}</p>
      </div>

      {/* KPIs */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('kpis.ready'), value: startups.filter(s => (s.aiScores.overallReadinessScore || 0) >= 75).length, icon: <Star size={18} />, colorClass: 'text-amber-500 dark:text-amber-400' },
          { label: t('kpis.active'), value: startups.length, icon: <TrendingUp size={18} />, colorClass: 'text-purple-500 dark:text-purple-400' },
          { label: t('kpis.pending'), value: pendingPitches, icon: <Clock size={18} />, colorClass: 'text-blue-500 dark:text-blue-400' },
          { label: t('kpis.pitches'), value: activePitches, icon: <Briefcase size={18} />, colorClass: 'text-green-500 dark:text-green-400' },
        ].map((kpi, i) => (
          <StaggerItem key={i}>
            <Card>
              <CardContent className="p-6">
                <div className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-[#111]",
                  kpi.colorClass
                )}>
                  {kpi.icon}
                </div>
                <div className={cn("font-display text-3xl font-bold", kpi.colorClass)}>{kpi.value}</div>
                <div className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{kpi.label}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Top Startups */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t('topStartups')}
              </div>
              <Link href="/investor/deal-flow" className="text-xs font-semibold text-zinc-900 dark:text-white hover:underline">
                {t('viewAll')} →
              </Link>
            </div>
            
            <div className="space-y-4">
              {readyStartups.map((s, i) => (
                <Card key={s.id} className="border-zinc-200 dark:border-zinc-800">
                  <CardContent className="p-4">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 dark:bg-white text-xs font-bold text-white dark:text-zinc-900">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">{s.name}</span>
                          <span className={cn("px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full", STAGE_BADGE[s.stage] || STAGE_BADGE.idea)}>
                            {s.stage.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.tagline}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('mrr')}</div>
                        <div className="font-display text-lg font-bold text-green-600 dark:text-green-400">{fmt(s.metrics.mrr)}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {[
                        { label: t('metrics.ltv'), value: `${s.metrics.ltvCacRatio}x` },
                        { label: t('metrics.mau'), value: s.metrics.mau.toLocaleString() },
                        { label: t('metrics.runway'), value: `${s.metrics.runwayMonths}mo` },
                      ].map((m, j) => (
                        <div key={j} className="rounded-md bg-zinc-50 dark:bg-zinc-900/50 py-2 text-center">
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">{m.value}</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t('score')}</div>
                      <ScoreBar 
                        score={s.aiScores.overallReadinessScore || 0} 
                        color={i === 0 ? 'bg-green-500' : i === 1 ? 'bg-purple-500' : 'bg-amber-500'} 
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/investor/deal-flow`}>
                          {t('viewProfile')} <ArrowUpRight className="ml-1" size={14} />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Pitch Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('pendingRequests')}
            </div>
            <div className="space-y-4">
              {pitches.filter(p => p.status === 'pending').map((p) => {
                const startup = startups.find(s => s.id === p.startupId);
                return (
                  <div key={p.id} className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{p.startupName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-500">
                        <Clock size={10} /> {t('pending')}
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {p.request.message.slice(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      <span>{t('pitchScore', { score: p.request.snapshotScore })}</span>
                      <span>
                        {p.request.proposedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button className="flex-1" size="sm">{t('accept')}</Button>
                      <Button variant="secondary" className="flex-1" size="sm">{t('decline')}</Button>
                    </div>
                  </div>
                );
              })}
              {pitches.filter(p => p.status === 'pending').length === 0 && (
                <div className="py-10 text-center text-zinc-500 dark:text-zinc-500">
                  <Clock size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">{t('noRequests')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}
