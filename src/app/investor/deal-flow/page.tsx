'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Startup } from '@/types';
import { Search, Filter, ArrowUpRight, Star, Brain, MapPin, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

const INDUSTRIES = ['All', 'FinTech', 'EdTech', 'AgriTech', 'HealthTech'];
const STAGES = ['All', 'idea', 'validation', 'mvp', 'growth', 'investment_ready'];

const STAGE_COLORS: Record<string, string> = {
  idea: '#64748b', validation: '#71717A', mvp: '#A1A1AA', growth: '#9333EA', investment_ready: '#D4D4D8',
};

const KANBAN_COLUMNS = [
  { id: 'watchlist', label: 'Watchlist', emoji: '👀', color: '#64748b', description: 'На примете' },
  { id: 'first_contact', label: 'First Contact', emoji: '📧', color: '#A1A1AA', description: 'Первый контакт' },
  { id: 'due_diligence', label: 'Due Diligence', emoji: '🔍', color: '#71717A', description: 'Проверка' },
  { id: 'portfolio', label: 'Portfolio', emoji: '✅', color: '#D4D4D8', description: 'В портфеле' },
];

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: size < 60 ? 13 : 16, fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  );
}

function StartupCard({ s }: { s: Startup }) {
  const score = s.aiScores.overallReadinessScore || 0;
  const stageColor = STAGE_COLORS[s.stage];
  return (
    <div className="card glass-hover" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', flexShrink: 0, background: `linear-gradient(135deg, ${stageColor}40, ${stageColor}20)`, border: `1px solid ${stageColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 800, color: stageColor }}>
          {s.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</span>
            <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', background: `${stageColor}20`, color: stageColor, border: `1px solid ${stageColor}30` }}>
              {s.stage.replace('_', ' ')}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.tagline}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={10} />{s.location}
            </span>
            <span style={{ fontSize: 11, color: '#475569' }}>#{s.industry}</span>
          </div>
        </div>
        <ScoreRing score={score} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
        {[
          { label: 'MRR', value: fmt(s.metrics.mrr), color: '#D4D4D8' },
          { label: 'MAU', value: s.metrics.mau.toLocaleString(), color: '#A1A1AA' },
          { label: 'LTV/CAC', value: s.metrics.ltvCacRatio > 0 ? `${s.metrics.ltvCacRatio}x` : '—', color: '#71717A' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 10, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {s.executiveSummaryAI && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(147,51,234,0.08)', border: '1px solid rgba(147,51,234,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Brain size={12} color="#D8B4FE" />
            <span style={{ fontSize: 10, color: '#D8B4FE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Summary</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{s.executiveSummaryAI.slice(0, 140)}...</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {s.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 10, color: '#475569', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{tag}</span>
          ))}
        </div>
        <Link href="/investor/deal-flow" className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
          View <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function KanbanCard({ s, columnColor }: { s: Startup; columnColor: string }) {
  const score = s.aiScores.overallReadinessScore || 0;
  const scoreColor = score >= 75 ? '#D4D4D8' : score >= 50 ? '#71717A' : '#52525B';
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(13,13,32,0.9)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'grab', transition: 'var(--transition-standard)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${columnColor}35`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</span>
        <span style={{ fontWeight: 800, fontSize: 12, color: scoreColor, fontFamily: 'Space Grotesk' }}>{score}</span>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{s.industry} · {s.location}</div>
      <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
        <span style={{ color: '#D4D4D8', fontWeight: 600 }}>{fmt(s.metrics.mrr)} MRR</span>
        <span style={{ color: '#475569' }}>{s.metrics.mau.toLocaleString()} MAU</span>
      </div>
      {s.metrics.ltvCacRatio > 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: '#71717A', fontWeight: 600 }}>LTV/CAC: {s.metrics.ltvCacRatio}x</div>
      )}
    </div>
  );
}

export default function DealFlowPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('All');
  const [stage, setStage] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [kanbanPlacements, setKanbanPlacements] = useState<Record<string, string>>({
    startup_1: 'due_diligence',
    startup_2: 'first_contact',
    startup_3: 'watchlist',
    startup_4: 'watchlist',
  });
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStartups() {
      try {
        const snap = await getDocs(collection(db, 'startups'));
        if (!snap.empty) {
          const dbStartups = snap.docs.map(d => {
            const data = d.data();
            // Adapt DB format to UI format
            return {
              id: d.id,
              ...data,
              // Fallbacks to match Startup UI type
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
        console.warn('Failed to fetch real startups', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartups();
  }, []);

  const filtered = startups.filter(s => {
    const q = search.toLowerCase();
    if (search && !s.name.toLowerCase().includes(q) && !s.tagline.toLowerCase().includes(q)) return false;
    if (industry !== 'All' && s.industry !== industry) return false;
    if (stage !== 'All' && s.stage !== stage) return false;
    if ((s.aiScores.overallReadinessScore || 0) < minScore) return false;
    return true;
  });

  const moveToColumn = (startupId: string, columnId: string) => {
    setKanbanPlacements(prev => ({ ...prev, [startupId]: columnId }));
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Deal Flow</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Browse AI-scored startups in the UNTITLED ecosystem</p>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', transition: 'var(--transition-standard)', background: viewMode === 'grid' ? 'rgba(147,51,234,0.15)' : 'transparent', border: viewMode === 'grid' ? '1px solid rgba(147,51,234,0.3)' : '1px solid transparent', color: viewMode === 'grid' ? '#D8B4FE' : '#64748b' }}>
            <List size={13} />Grid
          </button>
          <button onClick={() => setViewMode('kanban')} style={{ padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', transition: 'var(--transition-standard)', background: viewMode === 'kanban' ? 'rgba(147,51,234,0.15)' : 'transparent', border: viewMode === 'kanban' ? '1px solid rgba(147,51,234,0.3)' : '1px solid transparent', color: viewMode === 'kanban' ? '#D8B4FE' : '#64748b' }}>
            <LayoutGrid size={13} />Kanban
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input className="input-field" placeholder="Search startups..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
          </div>
          <select className="input-field" value={industry} onChange={e => setIndustry(e.target.value)} style={{ width: '140px', appearance: 'none' }}>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <select className="input-field" value={stage} onChange={e => setStage(e.target.value)} style={{ width: '160px', appearance: 'none' }}>
            {STAGES.map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Star size={13} color="#71717A" />
            <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>Min score:</span>
            <input type="range" min={0} max={100} step={10} value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={{ width: '80px', accentColor: '#9333EA' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#D8B4FE', minWidth: 24 }}>{minScore}</span>
          </div>
          <span style={{ fontSize: 13, color: '#475569', flexShrink: 0 }}>{filtered.length} results</span>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {filtered.map(s => <StartupCard key={s.id} s={s} />)}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: '#334155' }}>
              <Filter size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
              <p>No startups match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div>
          <p style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>Перетащите стартапы между колонками · Нажмите кнопку для перемещения</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'start' }}>
            {KANBAN_COLUMNS.map(col => {
              const colStartups = startups.filter(s => kanbanPlacements[s.id] === col.id);
              return (
                <div key={col.id} style={{ borderRadius: 14, background: 'rgba(13,13,32,0.5)', border: `1px solid ${col.color}20`, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: `1px solid ${col.color}20`, background: `${col.color}08` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 16 }}>{col.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: `${col.color}20`, color: col.color }}>
                        {colStartups.length}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{col.description}</div>
                  </div>
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 160 }}>
                    {colStartups.map(s => (
                      <div key={s.id}>
                        <KanbanCard s={s} columnColor={col.color} />
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                          {KANBAN_COLUMNS.filter(c => c.id !== col.id).map(targetCol => (
                            <button key={targetCol.id} onClick={() => moveToColumn(s.id, targetCol.id)} style={{ padding: '3px 8px', borderRadius: 99, fontSize: 9, fontWeight: 700, cursor: 'pointer', background: `${targetCol.color}10`, border: `1px solid ${targetCol.color}25`, color: targetCol.color, fontFamily: 'Inter' }}>
                              → {targetCol.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {colStartups.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#334155', fontSize: 12 }}>Нет стартапов</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
