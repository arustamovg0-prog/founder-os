'use client';

import { useState } from 'react';
import { MOCK_STARTUPS } from '@/lib/mockData';
import { Eye, Mail, FileSearch, FileText, CheckCircle, ArrowRight, Plus, X, MapPin, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type PipelineStage = 'watching' | 'contacted' | 'due_diligence' | 'term_sheet' | 'closed';

interface Deal {
  id: string;
  startupId: string;
  stage: PipelineStage;
  notes: string;
  addedAt: Date;
  priority: 'low' | 'medium' | 'high';
  dealAmount?: number;
}

// ─── Pipeline config ──────────────────────────────────────────────────────────

const STAGES: { key: PipelineStage; label: string; color: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'watching', label: 'Watching', color: '#64748b', icon: <Eye size={14} />, desc: 'На радаре' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6', icon: <Mail size={14} />, desc: 'Связались' },
  { key: 'due_diligence', label: 'Due Diligence', color: '#f59e0b', icon: <FileSearch size={14} />, desc: 'Проверка' },
  { key: 'term_sheet', label: 'Term Sheet', color: '#7c3aed', icon: <FileText size={14} />, desc: 'Условия' },
  { key: 'closed', label: 'Closed', color: '#10b981', icon: <CheckCircle size={14} />, desc: 'Сделка' },
];

const PRIORITY_COLORS = { low: '#64748b', medium: '#f59e0b', high: '#ef4444' };

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : '—';
}

// ─── Initial deals ────────────────────────────────────────────────────────────

const INITIAL_DEALS: Deal[] = [
  { id: 'd1', startupId: 'startup_1', stage: 'due_diligence', notes: 'Strong B2B play. Team impressive.', addedAt: new Date(Date.now() - 5 * 86400000), priority: 'high', dealAmount: 200000 },
  { id: 'd2', startupId: 'startup_2', stage: 'watching', notes: 'Monitor traction for 30 days', addedAt: new Date(Date.now() - 3 * 86400000), priority: 'medium' },
  { id: 'd3', startupId: 'startup_3', stage: 'contacted', notes: 'Sent intro email', addedAt: new Date(Date.now() - 1 * 86400000), priority: 'medium' },
  { id: 'd4', startupId: 'startup_4', stage: 'term_sheet', notes: 'Drafting $150K SAFE note', addedAt: new Date(Date.now() - 10 * 86400000), priority: 'high', dealAmount: 150000 },
  { id: 'd5', startupId: 'startup_5', stage: 'closed', notes: 'Deal closed. Board observer seat.', addedAt: new Date(Date.now() - 20 * 86400000), priority: 'low', dealAmount: 500000 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvestorCRMPage() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [dragId, setDragId] = useState<string | null>(null);
  const [addModal, setAddModal] = useState<PipelineStage | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [noteEdit, setNoteEdit] = useState('');
  const [dealAmountEdit, setDealAmountEdit] = useState<number | ''>('');

  const getStartup = (id: string) => MOCK_STARTUPS.find(s => s.id === id);

  const move = (dealId: string, toStage: PipelineStage) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: toStage } : d));
    const stageCfg = STAGES.find(s => s.key === toStage);
    toast.success(`Moved to ${stageCfg?.label}`, { icon: stageCfg?.icon as any });
  };

  const addDeal = (startupId: string, stage: PipelineStage) => {
    if (deals.find(d => d.startupId === startupId)) {
      toast.error('Already in pipeline'); return;
    }
    setDeals(prev => [...prev, {
      id: `d_${Date.now()}`, startupId, stage,
      notes: '', addedAt: new Date(), priority: 'medium',
    }]);
    setAddModal(null);
    toast.success('Added to pipeline ✓');
  };

  const removeDeal = (dealId: string) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
    setSelectedDeal(null);
    toast('Removed from pipeline');
  };

  const saveNote = () => {
    if (!selectedDeal) return;
    setDeals(prev => prev.map(d => d.id === selectedDeal.id ? { ...d, notes: noteEdit, dealAmount: dealAmountEdit === '' ? undefined : dealAmountEdit } : d));
    setSelectedDeal(null);
    toast.success('Notes saved');
  };

  const totalValue = deals
    .filter(d => d.stage === 'closed' || d.stage === 'term_sheet')
    .reduce((a, d) => {
      const s = getStartup(d.startupId);
      return a + (d.dealAmount || (s?.metrics.arr || 0) * 0.1);
    }, 0);

  const exportCsv = () => {
    const header = 'Startup,Stage,MRR,Runway,AI Score,Deal Amount,Notes\n';
    const rows = deals.map(d => {
      const s = getStartup(d.startupId);
      return `"${s?.name}","${d.stage}",${s?.metrics.mrr},${s?.metrics.runwayMonths},${s?.aiScores.overallReadinessScore},${d.dealAmount || 0},"${d.notes.replace(/"/g, '""')}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investor_crm.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV Exported');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Investor CRM</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Deal pipeline — drag cards between stages</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportCsv} className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
            Export CSV
          </button>
          <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 13, color: '#34d399', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
            Portfolio est. {fmt(totalValue)}
          </div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {STAGES.map(stage => {
          const count = deals.filter(d => d.stage === stage.key).length;
          return (
            <div key={stage.key} style={{ padding: '12px 16px', borderRadius: '12px', background: `${stage.color}08`, border: `1px solid ${stage.color}20`, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: stage.color, marginBottom: 4 }}>
                {stage.icon}
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stage.label}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 800, color: stage.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', minHeight: '500px' }}>
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          return (
            <div
              key={stage.key}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (dragId) { move(dragId, stage.key); setDragId(null); }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '400px', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: `1px dashed ${dragId ? stage.color + '40' : 'rgba(255,255,255,0.05)'}`, transition: 'border 0.15s' }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ color: stage.color }}>{stage.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stage.label}</span>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${stage.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: stage.color }}>{stageDeals.length}</span>
                </div>
                <button onClick={() => setAddModal(stage.key)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${stage.color}30`, background: `${stage.color}10`, color: stage.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={12} />
                </button>
              </div>

              {/* Cards */}
              {stageDeals.map(deal => {
                const s = getStartup(deal.startupId);
                if (!s) return null;
                const score = s.aiScores.overallReadinessScore || 0;
                const sc = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDragId(deal.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => { setSelectedDeal(deal); setNoteEdit(deal.notes); setDealAmountEdit(deal.dealAmount || ''); }}
                    style={{
                      padding: '14px', borderRadius: '12px', cursor: 'grab',
                      background: dragId === deal.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${dragId === deal.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.15s', userSelect: 'none',
                    }}
                  >
                    {/* Priority dot */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[deal.priority], boxShadow: `0 0 4px ${PRIORITY_COLORS[deal.priority]}` }} />
                      <span style={{ fontSize: 10, color: '#334155' }}>{deal.addedAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <MapPin size={9} />{s.industry}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, color: '#10b981' }}>{fmt(s.metrics.mrr)} MRR</span>
                      <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, color: sc }}>{score}</span>
                    </div>

                    {deal.notes && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#475569', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📝 {deal.notes}
                      </div>
                    )}

                    {/* Quick move buttons */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                      {STAGES.filter(st => st.key !== stage.key).slice(0, 2).map(st => (
                        <button key={st.key} onClick={e => { e.stopPropagation(); move(deal.id, st.key); }} style={{ flex: 1, padding: '4px 6px', borderRadius: '6px', border: `1px solid ${st.color}30`, background: `${st.color}10`, color: st.color, fontSize: 9, cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <ArrowRight size={8} />{st.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {stageDeals.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e2840', fontSize: 12, flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 20, opacity: 0.3 }}>{stage.icon}</div>
                  <span>Drop here</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add deal modal */}
      {addModal && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Add to {STAGES.find(s => s.key === addModal)?.label}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {MOCK_STARTUPS
                .filter(s => !deals.find(d => d.startupId === s.id))
                .map(s => {
                  const score = s.aiScores.overallReadinessScore || 0;
                  const sc = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <button key={s.id} onClick={() => addDeal(s.id, addModal!)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Inter', transition: 'all 0.15s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, color: '#a78bfa', flexShrink: 0 }}>{s.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{s.industry} · {fmt(s.metrics.mrr)} MRR</div>
                      </div>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 800, color: sc }}>{score}</div>
                    </button>
                  );
                })}
            </div>
            <button onClick={() => setAddModal(null)} className="btn-secondary" style={{ marginTop: 16, width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Deal detail modal */}
      {selectedDeal && (() => {
        const s = getStartup(selectedDeal.startupId)!;
        return (
          <div className="modal-overlay" onClick={() => setSelectedDeal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700 }}>{s?.name}</h2>
                <button onClick={() => setSelectedDeal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {[
                  { l: 'MRR', v: fmt(s.metrics.mrr) },
                  { l: 'MAU', v: s.metrics.mau.toLocaleString() },
                  { l: 'AI Score', v: `${s.aiScores.overallReadinessScore}/100` },
                  { l: 'Runway', v: `${s.metrics.runwayMonths} мес.` },
                ].map((kv, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{kv.l}</div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700 }}>{kv.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Deal Amount ($)</label>
                <input className="input-field" type="number" placeholder="e.g. 150000" value={dealAmountEdit} onChange={e => setDealAmountEdit(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Notes</label>
              <textarea className="input-field" rows={4} value={noteEdit} onChange={e => setNoteEdit(e.target.value)} style={{ resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => removeDeal(selectedDeal.id)} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontFamily: 'Inter' }}>Remove</button>
                <button onClick={saveNote} className="btn-primary" style={{ flex: 1 }}>Save Notes</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
