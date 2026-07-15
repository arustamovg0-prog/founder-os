'use client';

import { useState } from 'react';
import { ROADMAP_STAGES } from '@/lib/constants';
import { CheckCircle, Clock, AlertCircle, Shield, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PENDING_REVIEWS = [
  { startupId: 'startup_1', startupName: 'PayFlow UZ', stageId: 'stage_5_fundraising', stageTitle: 'Investment Ready', submittedAt: new Date('2026-05-08'), score: 85, artifacts: ['Pitch Deck (82/100)', 'Financial Model (78/100)', 'Executive Summary'] },
  { startupId: 'startup_2', startupName: 'EduStack', stageId: 'stage_3_mvp', stageTitle: 'MVP Development', submittedAt: new Date('2026-05-10'), score: 62, artifacts: ['MVP Demo', 'Unit Economics Model'] },
];

const STAGE_COLORS: Record<string, string> = {
  discovery: '#3F3F46', validation: '#71717A', building: '#FFFFFF', scaling: '#D4D4D8', fundraising: '#52525B',
};

export default function StageReviewPage() {
  const [reviews] = useState(PENDING_REVIEWS);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [comment, setComment] = useState<Record<string, string>>({});

  const approve = (id: string, name: string) => {
    setVerifiedMap(p => ({ ...p, [id]: 'approved' }));
    toast.success(`${name} — stage approved! Startup unlocked next stage.`, { icon: '✅' });
  };

  const reject = (id: string, name: string) => {
    if (!comment[id]?.trim()) { toast.error('Add a rejection reason first'); return; }
    setVerifiedMap(p => ({ ...p, [id]: 'rejected' }));
    toast.error(`${name} — stage rejected. Feedback sent.`, { icon: '❌' });
  };

  const pending = reviews.filter(r => !verifiedMap[r.startupId]);
  const done = reviews.filter(r => verifiedMap[r.startupId]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Stage Review</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Verify and approve startup roadmap stage completions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Pending Review', value: pending.length, color: '#71717A', icon: <Clock size={18} /> },
          { label: 'Approved Today', value: done.filter(d => verifiedMap[d.startupId] === 'approved').length, color: '#D4D4D8', icon: <CheckCircle size={18} /> },
          { label: 'Total Gatekeeper Stages', value: ROADMAP_STAGES.filter(s => s.isGatekeeper).length, color: '#FFFFFF', icon: <Shield size={18} /> },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}20`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#475569' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: 13, color: '#71717A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} /> Awaiting Review ({pending.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pending.map((r) => {
              const stage = ROADMAP_STAGES.find(s => s.id === r.stageId);
              const phaseColor = stage ? STAGE_COLORS[stage.phase] : '#FFFFFF';

              return (
                <div key={r.startupId} className="card" style={{ borderColor: 'rgba(113,113,122,0.2)', background: 'rgba(113,113,122,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700 }}>{r.startupName}</span>
                        <ChevronRight size={14} color="#475569" />
                        <span style={{ padding: '2px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${phaseColor}15`, color: phaseColor, border: `1px solid ${phaseColor}25` }}>
                          {r.stageTitle}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        Submitted {r.submittedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • AI Score: <strong style={{ color: '#D8B4FE' }}>{r.score}/100</strong>
                      </div>
                    </div>
                    <span className="badge badge-yellow"><Clock size={10} /> Pending</span>
                  </div>

                  {/* Artifacts */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Submitted Artifacts</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.artifacts.map((art, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(212,212,216,0.08)', border: '1px solid rgba(212,212,216,0.2)' }}>
                          <CheckCircle size={12} color="#D4D4D8" />
                          <span style={{ fontSize: 12, color: '#A1A1AA' }}>{art}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <textarea
                    className="input-field"
                    placeholder="Add review notes or rejection reason..."
                    value={comment[r.startupId] || ''}
                    onChange={e => setComment(p => ({ ...p, [r.startupId]: e.target.value }))}
                    rows={2}
                    style={{ marginBottom: '14px', resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" style={{ flex: 1 }} onClick={() => approve(r.startupId, r.startupName)}>
                      <CheckCircle size={14} /> Approve Stage — Unlock Next
                    </button>
                    <button onClick={() => reject(r.startupId, r.startupName)} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '10px', borderRadius: '10px', fontSize: 14, fontWeight: 600,
                      background: 'rgba(82,82,91,0.1)', border: '1px solid rgba(82,82,91,0.25)',
                      color: '#f87171', cursor: 'pointer', fontFamily: 'Inter',
                    }}>
                      <AlertCircle size={14} /> Reject & Send Feedback
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Reviewed ({done.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {done.map(r => {
              const status = verifiedMap[r.startupId];
              return (
                <div key={r.startupId} style={{ padding: '16px 20px', borderRadius: '14px', border: `1px solid ${status === 'approved' ? 'rgba(212,212,216,0.2)' : 'rgba(82,82,91,0.2)'}`, background: status === 'approved' ? 'rgba(212,212,216,0.04)' : 'rgba(82,82,91,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {status === 'approved' ? <CheckCircle size={18} color="#D4D4D8" /> : <AlertCircle size={18} color="#52525B" />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.startupName}</div>
                      <div style={{ fontSize: 12, color: '#475569' }}>{r.stageTitle}</div>
                    </div>
                  </div>
                  <span className={`badge ${status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                    {status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && done.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '80px' }}>
          <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
          <p style={{ color: '#475569', fontSize: 16 }}>All caught up! No reviews pending.</p>
        </div>
      )}
    </div>
  );
}
