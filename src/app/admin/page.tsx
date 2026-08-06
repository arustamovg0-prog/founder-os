'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { Users, TrendingUp, Brain, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup, PitchEvent } from '@/types';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_ORDER = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'];
const STAGE_LABELS: Record<string, string> = { idea: 'Idea', validation: 'Validation', mvp: 'MVP', growth: 'Growth', investment_ready: 'Inv. Ready' };
const STAGE_COLORS: Record<string, string> = { idea: '#64748b', validation: '#eab308', mvp: '#3b82f6', growth: '#a855f7', investment_ready: '#22c55e' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-lg">
      <p className="mb-1 text-xs font-bold text-zinc-900 dark:text-white">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }} />
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const t = useTranslations('adminDashboard');
  const { isDemoMode } = useAuth();
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
          { id: '4', name: 'CloudSync', stage: 'idea', status: 'inactive', metrics: { mrr: 0, arr: 0, users: 0, ltvCacRatio: 0, runwayMonths: 4, teamSize: 2 }, aiScores: { overallReadinessScore: 45 }, founderName: 'Eve W.' } as Startup,
        ]);
        setPitches([
          { id: 'p1', startupId: '1', startupName: 'Nexus AI', investorId: 'inv1', status: 'pending', request: { message: 'We are raising a $2M seed round...', proposedDate: new Date(), snapshotScore: 82 } } as any,
        ]);
        setLoading(false);
        return;
      }

      try {
        const [snap, pitchSnap] = await Promise.all([
          getDocs(collection(db, 'startups')),
          getDocs(query(collection(db, 'pitches'), where('status', '==', 'pending')))
        ]);
        
        if (!snap.empty) {
          const dbStartups = snap.docs.map(d => {
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
        
        if (!pitchSnap.empty) {
          setPitches(pitchSnap.docs.map(d => ({ id: d.id, ...d.data() } as PitchEvent)));
        }
      } catch (err) {
        console.warn('Failed to fetch admin data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-zinc-500 animate-pulse">{t('loading')}</div>;

  const totalMRR = startups.reduce((s, st) => s + (st.metrics?.mrr || 0), 0);
  const avgScore = startups.length ? Math.round(startups.reduce((s, st) => s + (st.aiScores?.overallReadinessScore || 0), 0) / startups.length) : 0;
  const readyCount = startups.filter(s => (s.aiScores?.overallReadinessScore || 0) >= 75).length;

  const stageDistrib = STAGE_ORDER.map(stage => ({
    stage: STAGE_LABELS[stage],
    count: startups.filter(s => s.stage === stage).length,
    color: STAGE_COLORS[stage],
  }));

  const scoreData = startups.map(s => ({ name: s.name.split(' ')[0], score: s.aiScores?.overallReadinessScore || 0 }));

  const alerts = [
    ...startups.filter(s => (s.metrics?.runwayMonths || 0) <= 6 && (s.metrics?.runwayMonths || 0) > 0).map(s => ({
      type: 'danger', msg: t('alerts.runway', { name: s.name, months: s.metrics?.runwayMonths }), icon: <AlertTriangle size={14} />,
    })),
    ...startups.filter(s => (s.aiScores?.overallReadinessScore || 0) >= 80 && s.stage !== 'investment_ready').map(s => ({
      type: 'success', msg: t('alerts.ready', { name: s.name }), icon: <CheckCircle size={14} />,
    })),
    { type: 'info', msg: t('alerts.pitches', { count: pitches.length }), icon: <Clock size={14} /> },
  ];

  return (
    <FadeIn className="space-y-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] dark:shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('untitledAdmin')}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle', { count: startups.length })}</p>
      </div>

      {/* KPIs */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('kpis.startups'), value: startups.length, icon: <Users size={18} />, colorClass: 'text-zinc-900 dark:text-white', sub: t('kpis.startupsSub') },
          { label: t('kpis.mrr'), value: fmt(totalMRR), icon: <TrendingUp size={18} />, colorClass: 'text-green-600 dark:text-green-400', sub: t('kpis.mrrSub') },
          { label: t('kpis.avgScore'), value: `${avgScore}/100`, icon: <Brain size={18} />, colorClass: 'text-purple-600 dark:text-purple-400', sub: t('kpis.avgScoreSub') },
          { label: t('kpis.ready'), value: readyCount, icon: <Zap size={18} />, colorClass: 'text-amber-500 dark:text-amber-400', sub: t('kpis.readySub') },
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
                <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-200">{kpi.label}</div>
                <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{kpi.sub}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Alerts */}
      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-800/60 dark:text-amber-500/80">
            {t('systemAlerts')}
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
                a.type === 'danger' ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 
                a.type === 'success' ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 
                'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              )}>
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  a.type === 'danger' ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' : 
                  a.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' : 
                  'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                )}>
                  {a.icon}
                </div>
                <span className="font-medium">{a.msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('charts.stage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageDistrib} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#52525b" strokeOpacity={0.2} strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 113, 122, 0.1)' }} />
                <Bar dataKey="count" name={t('charts.startupName')} radius={[4, 4, 0, 0]}>
                  {stageDistrib.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Score by Startup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t('charts.scores')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#52525b" strokeOpacity={0.2} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 113, 122, 0.1)' }} />
                <Bar dataKey="score" name={t('charts.scoreName')} radius={[4, 4, 0, 0]}>
                  {scoreData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 75 ? '#22c55e' : d.score >= 50 ? '#a855f7' : '#71717a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Startup Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t('table.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <TableHead key={i}>{t(`table.cols.${i}`)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {startups.map((s) => {
                const score = s.aiScores.overallReadinessScore || 0;
                const scoreColor = score >= 75 ? 'text-green-600 dark:text-green-400' : score >= 50 ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-500 dark:text-zinc-400';
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-semibold text-zinc-900 dark:text-white">{s.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.founderName}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        s.stage === 'idea' && "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300",
                        s.stage === 'validation' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
                        s.stage === 'mvp' && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
                        s.stage === 'growth' && "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
                        s.stage === 'investment_ready' && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
                      )}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                    </TableCell>
                    <TableCell className={cn("font-display font-bold", s.metrics.mrr > 0 ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-600")}>
                      {fmt(s.metrics.mrr) || '—'}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">{s.metrics.teamSize}</TableCell>
                    <TableCell className={cn("font-medium", s.metrics.runwayMonths <= 6 ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-white")}>
                      {s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-display text-lg font-bold", scoreColor)}>{score}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        s.status === 'active' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : 
                        s.status === 'deal' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" : 
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400"
                      )}>
                        {s.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
