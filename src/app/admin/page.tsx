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

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const STAGE_ORDER = ['idea', 'validation', 'mvp', 'growth', 'investment_ready'];
const STAGE_LABELS: Record<string, string> = { idea: 'Idea', validation: 'Validation', mvp: 'MVP', growth: 'Growth', investment_ready: 'Inv. Ready' };
const STAGE_COLORS: Record<string, string> = { idea: '#64748b', validation: '#71717A', mvp: '#A1A1AA', growth: '#FFFFFF', investment_ready: '#D4D4D8' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 12, color: p.color || '#94a3b8' }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}</p>
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

  if (loading) return <div className="animate-fade-in" style={{ padding: 32, color: '#64748b' }}>{t('loading')}</div>;

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
      type: 'danger', msg: t('alerts.runway', { name: s.name, months: s.metrics?.runwayMonths }), icon: <AlertTriangle size={13} />,
    })),
    ...startups.filter(s => (s.aiScores?.overallReadinessScore || 0) >= 80 && s.stage !== 'investment_ready').map(s => ({
      type: 'success', msg: t('alerts.ready', { name: s.name }), icon: <CheckCircle size={13} />,
    })),
    { type: 'info', msg: t('alerts.pitches', { count: pitches.length }), icon: <Clock size={13} /> },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4D4D8', boxShadow: '0 0 8px #D4D4D8' }} />
          <span style={{ fontSize: 12, color: '#D4D4D8', fontWeight: 600 }}>{t('untitledAdmin')}</span>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700 }}>{t('title')}</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>{t('subtitle', { count: startups.length })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: t('kpis.startups'), value: startups.length, icon: <Users size={18} />, color: '#FFFFFF', sub: t('kpis.startupsSub') },
          { label: t('kpis.mrr'), value: fmt(totalMRR), icon: <TrendingUp size={18} />, color: '#D4D4D8', sub: t('kpis.mrrSub') },
          { label: t('kpis.avgScore'), value: `${avgScore}/100`, icon: <Brain size={18} />, color: '#A1A1AA', sub: t('kpis.avgScoreSub') },
          { label: t('kpis.ready'), value: readyCount, icon: <Zap size={18} />, color: '#71717A', sub: t('kpis.readySub') },
        ].map((kpi, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}20`, border: `1px solid ${kpi.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, marginBottom: 12 }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          {t('systemAlerts')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px',
              background: a.type === 'danger' ? 'rgba(82,82,91,0.08)' : a.type === 'success' ? 'rgba(212,212,216,0.08)' : 'rgba(161,161,170,0.08)',
              border: `1px solid ${a.type === 'danger' ? 'rgba(82,82,91,0.2)' : a.type === 'success' ? 'rgba(212,212,216,0.2)' : 'rgba(161,161,170,0.2)'}`,
              color: a.type === 'danger' ? '#f87171' : a.type === 'success' ? '#A1A1AA' : '#60a5fa',
            }}>
              {a.icon}
              <span style={{ fontSize: 13 }}>{a.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Stage Distribution */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            {t('charts.stage')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageDistrib} barSize={32}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name={t('charts.startupName')} radius={[6, 6, 0, 0]}>
                {stageDistrib.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Score by Startup */}
        <div className="card">
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
            {t('charts.scores')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData} barSize={32}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name={t('charts.scoreName')} radius={[6, 6, 0, 0]}>
                {scoreData.map((d, i) => (
                  <Cell key={i} fill={d.score >= 75 ? '#D4D4D8' : d.score >= 50 ? '#71717A' : '#52525B'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Startup Table */}
      <div className="card">
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          {t('table.title')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <th key={i} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {t(`table.cols.${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => {
                const score = s.aiScores.overallReadinessScore || 0;
                const scoreColor = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{s.founderName}</div>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: `${STAGE_COLORS[s.stage]}20`, color: STAGE_COLORS[s.stage], border: `1px solid ${STAGE_COLORS[s.stage]}30` }}>
                        {STAGE_LABELS[s.stage]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 12px', fontFamily: 'Space Grotesk', fontWeight: 700, color: s.metrics.mrr > 0 ? '#D4D4D8' : '#334155' }}>{fmt(s.metrics.mrr) || '—'}</td>
                    <td style={{ padding: '12px 12px', color: '#94a3b8' }}>{s.metrics.teamSize}</td>
                    <td style={{ padding: '12px 12px', color: s.metrics.runwayMonths <= 6 ? '#f87171' : '#D4D4D8' }}>
                      {s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—'}
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: scoreColor }}>{score}</span>
                    </td>
                    <td style={{ padding: '12px 12px' }}>
                      <span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'deal' ? 'badge-purple' : 'badge-gray'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
