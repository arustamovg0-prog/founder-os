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
  idea: 'bg-gray-100 text-gray-800',
  validation: 'bg-yellow-100 text-yellow-800',
  mvp: 'bg-blue-100 text-blue-800',
  growth: 'bg-purple-100 text-purple-800',
  investment_ready: 'bg-green-100 text-green-800',
};

function ScoreBar({ score, color = 'bg-primary' }: { score: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className={cn("text-xs font-bold", color.replace('bg-', 'text-').replace('-500', '-600'))}>
        {score}
      </span>
    </div>
  );
}

export default function InvestorDashboard() {
  const t = useTranslations('investorDashboard');
  const { profile } = useAuth();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [pitches, setPitches] = useState<PitchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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

  if (loading) return <div className="p-8 text-gray-500 animate-pulse">{t('loading')}</div>;

  const readyStartups = startups.filter(s => s.aiScores?.overallReadinessScore && s.aiScores.overallReadinessScore >= 60);
  const pendingPitches = pitches.filter(p => p.status === 'pending').length;
  const activePitches = pitches.filter(p => ['accepted', 'feedback_pending'].includes(p.status)).length;

  return (
    <FadeIn className="space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle', { name: profile?.name || 'Инвестор' })}</p>
      </div>

      {/* KPIs */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('kpis.ready'), value: startups.filter(s => (s.aiScores.overallReadinessScore || 0) >= 75).length, icon: <Star size={18} />, colorClass: 'text-amber-500' },
          { label: t('kpis.active'), value: startups.length, icon: <TrendingUp size={18} />, colorClass: 'text-purple-500' },
          { label: t('kpis.pending'), value: pendingPitches, icon: <Clock size={18} />, colorClass: 'text-blue-500' },
          { label: t('kpis.pitches'), value: activePitches, icon: <Briefcase size={18} />, colorClass: 'text-green-500' },
        ].map((kpi, i) => (
          <StaggerItem key={i}>
            <Card>
              <CardContent className="p-6">
                <div className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-100 bg-gray-50",
                  kpi.colorClass
                )}>
                  {kpi.icon}
                </div>
                <div className={cn("font-display text-3xl font-bold", kpi.colorClass)}>{kpi.value}</div>
                <div className="mt-1 text-sm font-medium text-gray-500">{kpi.label}</div>
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
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('topStartups')}
              </div>
              <Link href="/investor/deal-flow" className="text-xs font-semibold text-gray-900 hover:underline">
                {t('viewAll')} →
              </Link>
            </div>
            
            <div className="space-y-4">
              {readyStartups.map((s, i) => (
                <Card key={s.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-xs font-bold text-white">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-base font-bold text-gray-900">{s.name}</span>
                          <span className={cn("px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full", STAGE_BADGE[s.stage] || STAGE_BADGE.idea)}>
                            {s.stage.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{s.tagline}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('mrr')}</div>
                        <div className="font-display text-lg font-bold text-green-600">{fmt(s.metrics.mrr)}</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {[
                        { label: t('metrics.ltv'), value: `${s.metrics.ltvCacRatio}x` },
                        { label: t('metrics.mau'), value: s.metrics.mau.toLocaleString() },
                        { label: t('metrics.runway'), value: `${s.metrics.runwayMonths}mo` },
                      ].map((m, j) => (
                        <div key={j} className="rounded-md bg-gray-50 py-2 text-center">
                          <div className="text-sm font-bold text-gray-900">{m.value}</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{t('score')}</div>
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
            <div className="mb-6 text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('pendingRequests')}
            </div>
            <div className="space-y-4">
              {pitches.filter(p => p.status === 'pending').map((p) => {
                const startup = startups.find(s => s.id === p.startupId);
                return (
                  <div key={p.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">{p.startupName}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        <Clock size={10} /> {t('pending')}
                      </span>
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-gray-700">
                      {p.request.message.slice(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500">
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
                <div className="py-10 text-center text-gray-500">
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
