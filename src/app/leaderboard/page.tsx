'use client';

import { useState, useEffect } from 'react';
import { Trophy, MapPin, TrendingUp, Users, Zap, Star, ArrowUpRight, Globe } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { cn } from '@/lib/utils';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { Card, CardContent } from '@/components/ui/card';

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  validation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  mvp: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  growth: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  investment_ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

const FILTERS = [
  { key: 'score', label: 'AI Score' },
  { key: 'mrr', label: 'MRR' },
  { key: 'mau', label: 'MAU' },
  { key: 'growth', label: 'Growth' },
  { key: 'geo', label: 'Global' }
] as const;

export default function LeaderboardPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'mrr' | 'mau' | 'growth' | 'geo'>('score');
  const [industryFilter, setIndustryFilter] = useState('All');

  useEffect(() => {
    async function fetchStartups() {
      try {
        const snap = await getDocs(collection(db, 'startups'));
        if (!snap.empty) {
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
              },
              tags: data.tags || [],
            } as Startup;
          });
          setStartups(dbStartups);
        }
      } catch (err) {
        console.warn('Failed to fetch startups for Leaderboard', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartups();
  }, []);

  const INDUSTRY_FILTERS = ['All', ...Array.from(new Set(startups.map(s => s.industry)))];

  const sorted = [...startups]
    .filter(s => industryFilter === 'All' || s.industry === industryFilter)
    .sort((a, b) => {
      if (sortBy === 'score') return (b.aiScores?.overallReadinessScore || 0) - (a.aiScores?.overallReadinessScore || 0);
      if (sortBy === 'mrr') return (b.metrics?.mrr || 0) - (a.metrics?.mrr || 0);
      if (sortBy === 'mau') return (b.metrics?.mau || 0) - (a.metrics?.mau || 0);
      if (sortBy === 'growth') return (b.roadmapProgress || 0) - (a.roadmapProgress || 0);
      return 0;
    });

  const MEDALS = ['🥇', '🥈', '🥉'];
  const topThree = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  if (loading) return <div className="min-h-screen p-12 text-zinc-500 animate-pulse text-center">Загрузка лидерборда...</div>;

  return (
    <div className="min-h-screen py-12 px-6">
      <FadeIn className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-4">
            <Trophy size={14} className="text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">UNTITLED Ecosystem</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
            Startup <span className="bg-clip-text text-transparent bg-gradient-to-br from-zinc-500 to-zinc-800 dark:from-zinc-400 dark:to-zinc-600">Leaderboard</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Рейтинг стартапов UNTITLED по AI Score, MRR и прогрессу
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setSortBy(f.key)} className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                sortBy === f.key ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl overflow-x-auto max-w-full">
            {INDUSTRY_FILTERS.map(ind => (
              <button key={ind} onClick={() => setIndustryFilter(ind)} className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                industryFilter === ind ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Podium — Top 3 */}
        {topThree.length >= 3 && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 items-end">
            {/* 2nd */}
            <StaggerItem className="order-2 md:order-1">
              <Card className="text-center bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 mt-8">
                <CardContent className="pt-8 pb-6 px-4">
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-display text-xl font-bold text-zinc-500 mx-auto mb-3">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <div className="font-display font-bold text-sm mb-1 text-zinc-900 dark:text-white">{topThree[1].name}</div>
                  <div className="text-xs text-zinc-500 mb-2">{topThree[1].industry}</div>
                  <div className="font-display text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                    {sortBy === 'score' ? topThree[1].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[1].metrics.mrr) : sortBy === 'mau' ? topThree[1].metrics.mau.toLocaleString() : `${topThree[1].roadmapProgress}%`}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            {/* 1st */}
            <StaggerItem className="order-1 md:order-2">
              <Card className="text-center border-2 border-zinc-300 dark:border-zinc-700 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 relative z-10">
                <CardContent className="pt-10 pb-8 px-5">
                  <div className="text-4xl mb-3">🥇</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-400 dark:to-zinc-600 flex items-center justify-center font-display text-2xl font-bold text-white shadow-lg mx-auto mb-3">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <div className="font-display font-bold text-lg mb-1 text-zinc-900 dark:text-white">{topThree[0].name}</div>
                  <div className="text-xs text-zinc-500 mb-3">{topThree[0].industry} · {topThree[0].location}</div>
                  <div className="font-display text-3xl font-black text-zinc-900 dark:text-white">
                    {sortBy === 'score' ? topThree[0].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[0].metrics.mrr) : sortBy === 'mau' ? topThree[0].metrics.mau.toLocaleString() : `${topThree[0].roadmapProgress}%`}
                  </div>
                  <div className="mt-4">
                    <span className={cn("text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider", STAGE_COLORS[topThree[0].stage] || STAGE_COLORS.idea)}>
                      {topThree[0].stage.replace('_', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            {/* 3rd */}
            <StaggerItem className="order-3 md:order-3">
              <Card className="text-center bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30 mt-12">
                <CardContent className="pt-8 pb-6 px-4">
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center font-display text-xl font-bold text-amber-700 dark:text-amber-500 mx-auto mb-3">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <div className="font-display font-bold text-sm mb-1 text-zinc-900 dark:text-white">{topThree[2].name}</div>
                  <div className="text-xs text-zinc-500 mb-2">{topThree[2].industry}</div>
                  <div className="font-display text-2xl font-bold text-amber-700 dark:text-amber-500">
                    {sortBy === 'score' ? topThree[2].aiScores.overallReadinessScore : sortBy === 'mrr' ? fmt(topThree[2].metrics.mrr) : sortBy === 'mau' ? topThree[2].metrics.mau.toLocaleString() : `${topThree[2].roadmapProgress}%`}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Rest of table */}
        <StaggerContainer className="flex flex-col gap-3 mb-16">
          {rest.map((s, i) => {
            const score = s.aiScores.overallReadinessScore || 0;
            const scColor = score >= 75 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-600 dark:text-zinc-400';
            const stageClass = STAGE_COLORS[s.stage] || STAGE_COLORS.idea;
            return (
              <StaggerItem key={s.id}>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md">
                  <div className="w-8 text-center font-display font-bold text-zinc-400 dark:text-zinc-500 shrink-0">#{i + 4}</div>
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-display font-bold text-zinc-900 dark:text-white shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-zinc-900 dark:text-white mb-0.5 truncate">{s.name}</div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 truncate">
                      <MapPin size={10} />{s.location} <span className="opacity-50">·</span> {s.industry}
                    </div>
                  </div>
                  <div className={cn("hidden sm:block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0", stageClass)}>
                    {s.stage.replace('_', ' ')}
                  </div>
                  <div className="text-right shrink-0 min-w-[60px]">
                    <div className={cn("font-display text-lg font-bold", scColor)}>{score}</div>
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">AI Score</div>
                  </div>
                  <div className="text-right shrink-0 min-w-[70px]">
                    <div className="font-display text-sm font-bold text-zinc-900 dark:text-white">{fmt(s.metrics.mrr)}</div>
                    <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">MRR</div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-zinc-500">
            Рейтинг обновляется в реальном времени · <Link href="/" className="text-zinc-900 dark:text-white font-medium hover:underline">Founder OS</Link> · UNTITLED Ecosystem
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

