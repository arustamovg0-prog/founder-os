'use client';

import { useState, useEffect } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { Search, Brain, MapPin, Eye, MessageSquare, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { ImpersonationPanel } from '@/components/ImpersonationPanel';
import { useTranslations } from 'next-intl';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

const STAGE_COLORS: Record<string, string> = {
  idea: '#64748b', validation: '#71717A', mvp: '#A1A1AA', growth: '#FFFFFF', investment_ready: '#D4D4D8',
};

function StartupDetailRow({ s }: { s: Startup }) {
  const t = useTranslations('adminStartups');
  const [open, setOpen] = useState(false);
  const score = s.aiScores.overallReadinessScore || 0;
  const scoreColor = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
  const stageColor = STAGE_COLORS[s.stage];
  const currentStage = ROADMAP_STAGES.find(r => r.id === s.currentRoadmapStageId);

  return (
    <div style={{ borderRadius: '14px', border: `1px solid ${open ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, marginBottom: '10px', overflow: 'hidden', transition: 'var(--transition-standard)' }}>
      {/* Row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer', background: open ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 160ms var(--ease-out)' }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
          background: `${stageColor}20`, border: `1px solid ${stageColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 800, color: stageColor,
        }}>{s.name.charAt(0)}</div>

        <div style={{ flex: '0 0 200px', minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.name}</div>
          <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} />{s.location}
          </div>
        </div>

        <div style={{ flex: '0 0 140px' }}>
          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${stageColor}15`, color: stageColor, border: `1px solid ${stageColor}25` }}>
            {s.stage.replace('_', ' ')}
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { l: t('metrics.mrr'), v: fmt(s.metrics.mrr), c: '#D4D4D8' },
            { l: t('metrics.mau'), v: s.metrics.mau > 0 ? s.metrics.mau.toLocaleString() : '—', c: '#A1A1AA' },
            { l: t('metrics.runway'), v: s.metrics.runwayMonths > 0 ? `${s.metrics.runwayMonths}mo` : '—', c: s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 ? '#52525B' : '#94a3b8' },
          ].map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, color: '#334155', fontWeight: 600 }}>{m.l}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: scoreColor }}>{score}</div>
          <div style={{ fontSize: 10, color: '#334155' }}>{t('aiScore')}</div>
        </div>

        <div style={{ flex: '0 0 100px' }}>
          <div className="progress-bar">
            <div style={{ height: '100%', borderRadius: 99, width: `${s.roadmapProgress}%`, background: '#FFFFFF', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4, textAlign: 'center' }}>{t('progress', { pct: s.roadmapProgress })}</div>
        </div>

        {open ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
      </div>

      {/* Expanded Detail */}
      {open && (
        <div style={{ padding: '20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,16,0.5)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* AI Summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Brain size={13} color="#D8B4FE" />
                <span style={{ fontSize: 11, color: '#D8B4FE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('aiAnalysis')}</span>
              </div>
              {s.executiveSummaryAI ? (
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, padding: '12px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {s.executiveSummaryAI}
                </p>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: '#334155', fontSize: 13 }}>
                  {t('aiNotGenerated')}
                </div>
              )}
            </div>

            {/* Metrics & Current Stage */}
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                {t('fullMetrics')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { l: t('metrics.arr'), v: fmt(s.metrics.arr) },
                  { l: t('metrics.churn'), v: s.metrics.churnRate > 0 ? `${s.metrics.churnRate}%` : '—' },
                  { l: t('metrics.ltv'), v: fmt(s.metrics.ltv) },
                  { l: t('metrics.cac'), v: fmt(s.metrics.cac) },
                  { l: t('metrics.ltvCac'), v: s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—' },
                  { l: t('metrics.team'), v: s.metrics.teamSize },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{m.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{m.v}</div>
                  </div>
                ))}
              </div>

              {currentStage && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{t('currentStage')}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#D8B4FE' }}>{currentStage.title}</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 16px' }}>
              <Eye size={13} /> {t('btnView')}
            </button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 16px' }}>
              <MessageSquare size={13} /> {t('btnHint')}
            </button>
            {score >= 75 && s.stage !== 'investment_ready' && (
              <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>
                <CheckCircle size={13} /> {t('btnApprove')}
              </button>
            )}
            {s.metrics.runwayMonths <= 6 && s.metrics.runwayMonths > 0 && (
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, padding: '7px 16px', borderRadius: '8px', background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.3)', color: '#D4D4D8', cursor: 'pointer', fontFamily: 'Inter' }}>
                <AlertTriangle size={13} /> {t('btnFlag')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
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
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 6 }}>{t('title')}</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>{t('subtitle')}</p>
      </div>

      {/* Admin Impersonation */}
      <ImpersonationPanel />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input className="input-field" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
          {[
            { key: 'all', label: t('filterAll', { count: startups.length }) },
            { key: 'ready', label: t('filterReady', { count: startups.filter(s => (s.aiScores?.overallReadinessScore || 0) >= 75).length }) },
            { key: 'critical', label: t('filterCritical', { count: startups.filter(s => (s.metrics?.runwayMonths || 0) <= 6 && (s.metrics?.runwayMonths || 0) > 0).length }) },
            { key: 'early', label: t('filterEarly') },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              background: filter === f.key ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: filter === f.key ? '#D8B4FE' : '#64748b',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: '#475569', marginBottom: '16px' }}>{t('countLabel', { count: filtered.length })}</div>

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
