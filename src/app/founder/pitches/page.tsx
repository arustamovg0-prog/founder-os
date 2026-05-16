'use client';

import { useState } from 'react';
import { MOCK_PITCHES } from '@/lib/mockData';
import { Calendar, MapPin, Video, CheckCircle, Clock, XCircle, Send, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  pending: { label: 'Ожидает ответа', badge: 'badge-yellow', icon: <Clock size={14} /> },
  accepted: { label: 'Принят', badge: 'badge-green', icon: <CheckCircle size={14} /> },
  rejected: { label: 'Отклонён', badge: 'badge-red', icon: <XCircle size={14} /> },
  feedback_pending: { label: 'Ожидает фидбек', badge: 'badge-blue', icon: <Clock size={14} /> },
  completed: { label: 'Завершён', badge: 'badge-gray', icon: <CheckCircle size={14} /> },
  closed: { label: 'Закрыт', badge: 'badge-gray', icon: <CheckCircle size={14} /> },
};

export default function FounderPitchesPage() {
  const [pitches] = useState(MOCK_PITCHES.filter(p => p.startupId === 'startup_1'));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ investorName: '', proposedDate: '', message: '' });

  const handleSend = () => {
    if (!form.investorName || !form.proposedDate || !form.message) {
      toast.error('Заполните все поля');
      return;
    }
    toast.success('Запрос на питч отправлен!', { icon: '🚀' });
    setShowModal(false);
    setForm({ investorName: '', proposedDate: '', message: '' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>My Pitches</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Manage your investor pitch requests and meetings</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Send size={14} /> Request Pitch
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Pitches', value: pitches.length, color: '#7c3aed' },
          { label: 'Accepted', value: pitches.filter(p => p.status === 'accepted' || p.status === 'feedback_pending').length, color: '#10b981' },
          { label: 'Pending', value: pitches.filter(p => p.status === 'pending').length, color: '#f59e0b' },
          { label: 'Closed', value: pitches.filter(p => p.status === 'closed').length, color: '#64748b' },
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pitch List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pitches.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Send size={40} style={{ marginBottom: 16, opacity: 0.2, display: 'block', margin: '0 auto 16px' }} />
            <p style={{ color: '#475569', marginBottom: 20 }}>No pitch requests yet</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>Send First Pitch Request</button>
          </div>
        ) : (
          pitches.map((pitch) => {
            const cfg = STATUS_CONFIG[pitch.status];
            return (
              <div key={pitch.id} className="card glass-hover">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{pitch.investorName}</h3>
                      <span className={`badge ${cfg.badge}`}>{cfg.icon}&nbsp;{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569' }}>
                      AI Score at request: <strong style={{ color: '#a78bfa' }}>{pitch.request.snapshotScore}/100</strong>
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    {pitch.request.sentAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid rgba(124,58,237,0.3)' }}>
                  &ldquo;{pitch.request.message}&rdquo;
                </p>

                {pitch.meeting.confirmedDate && (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#94a3b8' }}>
                      <Calendar size={13} color="#7c3aed" />
                      {pitch.meeting.confirmedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#94a3b8' }}>
                      {pitch.meeting.location === 'online' ? <Video size={13} color="#3b82f6" /> : <MapPin size={13} color="#10b981" />}
                      {pitch.meeting.location === 'online' ? 'Online Meeting' : 'In-Person'}
                    </div>
                    {pitch.meeting.meetingUrl && (
                      <a href={pitch.meeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Join Meeting <ArrowRight size={12} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: '8px' }}>
              Request Investor Pitch
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: '24px' }}>
              Your current AI Readiness Score: <strong style={{ color: '#a78bfa' }}>85/100</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Investor Name / Fund</label>
                <input className="input-field" placeholder="e.g. Aibek Ventures" value={form.investorName} onChange={e => setForm(p => ({ ...p, investorName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Proposed Meeting Date</label>
                <input className="input-field" type="date" value={form.proposedDate} onChange={e => setForm(p => ({ ...p, proposedDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Message to Investor</label>
                <textarea
                  className="input-field"
                  placeholder="Briefly describe your startup and what you're looking for..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn-primary" onClick={handleSend} style={{ flex: 2 }}>
                  <Send size={14} /> Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
