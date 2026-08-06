'use client';

import { useState, useEffect } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { Search, Brain, MapPin, Eye, MessageSquare, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { ImpersonationPanel } from '@/components/ImpersonationPanel';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

function StartupDetailRow({ s }: { s: Startup }) {
  const t = useTranslations('adminStartups');
  const [open, setOpen] = useState(false);
  const score = s.aiScores.overallReadinessScore || 0;
  
  const getScoreColor = () => {
    if (score >= 75) return 'text-zinc-900 dark:text-zinc-100';
    if (score >= 50) return 'text-zinc-500 dark:text-zinc-400';
    return 'text-zinc-400 dark:text-zinc-500';
  };
  
  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'idea': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800';
      case 'validation': return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800';
      case 'mvp': return 'bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
      case 'growth': return 'bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200';
      case 'investment_ready': return 'bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  const stageStyle = getStageStyle(s.stage);
  const currentStage = ROADMAP_STAGES.find(r => r.id === s.currentRoadmapStageId);

  return (
    <Card className={cn("mb-3 overflow-hidden transition-all duration-200", open ? "border-zinc-300 dark:border-zinc-700 shadow-sm" : "hover:border-zinc-300 dark:hover:border-zinc-700")}>
      {/* Row */}
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors",
          open ? "bg-zinc-50 dark:bg-zinc-900/50" : "bg-transparent hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
        )}
      >
        <div className={cn(
          "w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-display text-lg font-bold border",
          stageStyle
        )}>
          {s.name.charAt(0)}
        </div>

        <div className="flex-[0_0_200px] min-w-0">
          <div className="font-bold text-[15px] mb-0.5 text-zinc-900 dark:text-zinc-100 truncate">{s.name}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 truncate">
            <MapPin size={10} className="shrink-0" />{s.location}
          </div>
        </div>

        <div className="flex-[0_0_140px]">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", stageStyle)}>
            {s.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { l: t('metrics.mrr'), v: fmt(s.metrics.mrr), highlight: true },
            { l: t('metrics.mau'), v: s.metrics.mau > 0 ? s.metrics.mau.toLocaleString() : '—' },
            { l: t('metrics.runway'), v: s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—', warn: s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 },
          ].map((m, i) => (
            <div key={i}>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold mb-0.5">{m.l}</div>
              <div className={cn(
                "font-display text-sm font-bold",
                m.highlight ? "text-zinc-900 dark:text-zinc-100" : 
                m.warn ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
              )}>
                {m.v}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-[0_0_80px] text-center">
          <div className={cn("font-display text-2xl font-bold", getScoreColor())}>{score}</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">{t('aiScore')}</div>
        </div>

        <div className="flex-[0_0_100px]">
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-1000" style={{ width: `${s.roadmapProgress}%` }} />
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 text-center">{t('progress', { pct: s.roadmapProgress })}</div>
        </div>

        <div className="shrink-0 text-zinc-400 dark:text-zinc-500">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Detail */}
      {open && (
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* AI Summary */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Brain size={13} className="text-purple-600 dark:text-purple-400" />
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">{t('aiAnalysis')}</span>
              </div>
              {s.executiveSummaryAI ? (
                <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {s.executiveSummaryAI}
                </p>
              ) : (
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-[13px]">
                  {t('aiNotGenerated')}
                </div>
              )}
            </div>

            {/* Metrics & Current Stage */}
            <div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2.5">
                {t('fullMetrics')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { l: t('metrics.arr'), v: fmt(s.metrics.arr) },
                  { l: t('metrics.churn'), v: s.metrics.churnRate > 0 ? `${s.metrics.churnRate}%` : '—' },
                  { l: t('metrics.ltv'), v: fmt(s.metrics.ltv) },
                  { l: t('metrics.cac'), v: fmt(s.metrics.cac) },
                  { l: t('metrics.ltvCac'), v: s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—' },
                  { l: t('metrics.team'), v: s.metrics.teamSize },
                ].map((m, i) => (
                  <div key={i} className="p-2 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold mb-0.5">{m.l}</div>
                    <div className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">{m.v}</div>
                  </div>
                ))}
              </div>

              {currentStage && (
                <div className="mt-3 p-2.5 px-3.5 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                  <div className="text-[11px] text-purple-600/70 dark:text-purple-400/70 font-semibold mb-1">{t('currentStage')}</div>
                  <div className="text-sm font-bold text-purple-700 dark:text-purple-400">{currentStage.title}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Eye size={13} /> {t('btnView')}
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <MessageSquare size={13} /> {t('btnHint')}
            </button>
            {score >= 75 && s.stage !== 'investment_ready' && (
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors">
                <CheckCircle size={13} /> {t('btnApprove')}
              </button>
            )}
            {s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 && (
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                <AlertTriangle size={13} /> {t('btnFlag')}
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminStartupsPage() {
  const t = useTranslations('adminStartups');
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchStartups() {
      try {
        const snap = await getDocs(collection(db, 'startups'));
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
              runwayMonths: data.metrics?.runwayMonths || 0,
              arr: data.metrics?.arr || (data.metrics?.mrr || 0) * 12,
              churnRate: data.metrics?.churnRate || 0,
              ltv: data.metrics?.ltv || 0,
              cac: data.metrics?.cac || 0,
              teamSize: data.metrics?.teamSize || 0,
            },
            tags: data.tags || [],
          } as Startup;
        });
        setStartups(dbStartups);
      } catch (err) {
        console.warn('Failed to fetch startups for Admin Startups', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartups();
  }, []);

  const filtered = startups.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.founderName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'ready') return (s.aiScores.overallReadinessScore || 0) >= 75;
    if (filter === 'critical') return s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0;
    if (filter === 'early') return ['idea', 'validation'].includes(s.stage);
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1 text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
      </div>

      {/* Admin Impersonation */}
      <ImpersonationPanel />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100" 
            placeholder={t('search')} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
          {[
            { key: 'all', label: t('filterAll', { count: startups.length }) },
            { key: 'ready', label: t('filterReady', { count: startups.filter(s => (s.aiScores?.overallReadinessScore || 0) >= 75).length }) },
            { key: 'critical', label: t('filterCritical', { count: startups.filter(s => (s.metrics?.runwayMonths || 0) <= 6 && (s.metrics?.runwayMonths || 0) > 0).length }) },
            { key: 'early', label: t('filterEarly') },
          ].map(f => (
            <button 
              key={f.key} 
              onClick={() => setFilter(f.key)} 
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                filter === f.key 
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" 
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 font-medium">{t('countLabel', { count: filtered.length })}</div>

      {/* List */}
      <div className="stagger-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map(s => (
          <div key={s.id} className="stagger-item">
            <StartupDetailRow s={s} />
          </div>
        ))}
      </div>
    </div>
  );
}
