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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-bold text-gray-900">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-medium text-gray-600">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }} />
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const t = useTranslations('adminDashboard');
  const [startups, setStartups] = useState<Startup[]>([]);
  const [pitches, setPitches] = useState<PitchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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

  if (loading) return <div className="p-8 text-gray-500 animate-pulse">{t('loading')}</div>;

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
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('untitledAdmin')}</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle', { count: startups.length })}</p>
      </div>

      {/* KPIs */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('kpis.startups'), value: startups.length, icon: <Users size={18} />, colorClass: 'text-gray-900', sub: t('kpis.startupsSub') },
          { label: t('kpis.mrr'), value: fmt(totalMRR), icon: <TrendingUp size={18} />, colorClass: 'text-green-600', sub: t('kpis.mrrSub') },
          { label: t('kpis.avgScore'), value: `${avgScore}/100`, icon: <Brain size={18} />, colorClass: 'text-purple-600', sub: t('kpis.avgScoreSub') },
          { label: t('kpis.ready'), value: readyCount, icon: <Zap size={18} />, colorClass: 'text-amber-500', sub: t('kpis.readySub') },
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
                <div className="mt-1 text-sm font-medium text-gray-900">{kpi.label}</div>
                <div className="mt-0.5 text-xs text-gray-500">{kpi.sub}</div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Alerts */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-6">
          <div className="mb-4 text-xs font-bold uppercase tracking-wider text-amber-800/60">
            {t('systemAlerts')}
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm",
                a.type === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : 
                a.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 
                'border-blue-200 bg-blue-50 text-blue-700'
              )}>
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  a.type === 'danger' ? 'bg-red-100 text-red-600' : 
                  a.type === 'success' ? 'bg-green-100 text-green-600' : 
                  'bg-blue-100 text-blue-600'
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
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('charts.stage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stageDistrib} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
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
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {t('charts.scores')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreData} barSize={40} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="score" name={t('charts.scoreName')} radius={[4, 4, 0, 0]}>
                  {scoreData.map((d, i) => (
                    <Cell key={i} fill={d.score >= 75 ? '#22c55e' : d.score >= 50 ? '#a855f7' : '#64748b'} />
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
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
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
                const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-purple-600' : 'text-gray-500';
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.founderName}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        s.stage === 'idea' && "bg-gray-100 text-gray-800",
                        s.stage === 'validation' && "bg-yellow-100 text-yellow-800",
                        s.stage === 'mvp' && "bg-blue-100 text-blue-800",
                        s.stage === 'growth' && "bg-purple-100 text-purple-800",
                        s.stage === 'investment_ready' && "bg-green-100 text-green-800",
                      )}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                    </TableCell>
                    <TableCell className={cn("font-display font-bold", s.metrics.mrr > 0 ? "text-gray-900" : "text-gray-400")}>
                      {fmt(s.metrics.mrr) || '—'}
                    </TableCell>
                    <TableCell className="text-gray-600">{s.metrics.teamSize}</TableCell>
                    <TableCell className={cn("font-medium", s.metrics.runwayMonths <= 6 ? "text-red-600" : "text-gray-900")}>
                      {s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-display text-lg font-bold", scoreColor)}>{score}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        s.status === 'active' ? "bg-green-100 text-green-700" : 
                        s.status === 'deal' ? "bg-purple-100 text-purple-700" : 
                        "bg-gray-100 text-gray-700"
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
