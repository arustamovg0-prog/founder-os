'use client';

import { useState, useEffect } from 'react';
import { PitchEvent } from '@/types';
import { Calendar, MapPin, Video, CheckCircle, Clock, XCircle, Send, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_CONFIG: Record<string, { badge: string; icon: React.ReactNode }> = {
  pending: { badge: 'badge-yellow', icon: <Clock size={14} /> },
  accepted: { badge: 'badge-green', icon: <CheckCircle size={14} /> },
  rejected: { badge: 'badge-red', icon: <XCircle size={14} /> },
  feedback_pending: { badge: 'badge-blue', icon: <Clock size={14} /> },
  completed: { badge: 'badge-gray', icon: <CheckCircle size={14} /> },
  closed: { badge: 'badge-gray', icon: <CheckCircle size={14} /> },
};

export default function FounderPitchesPage() {
  const t = useTranslations('FounderPitches');
  const { profile } = useAuth();
  const [pitches, setPitches] = useState<PitchEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ investorName: '', proposedDate: '', message: '' });

  useEffect(() => {
    if (!profile) {
      return;
    }

    // В MVP считаем, что ID фаундера = ID его стартапа
    const q = query(collection(db, 'pitches'), where('startupId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PitchEvent));
      setPitches(data);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleSend = async () => {
    if (!form.investorName || !form.proposedDate || !form.message) {
      toast.error(t('fillAllFields'));
      return;
    }
    
    if (profile) {
      const newPitch: Partial<PitchEvent> = {
        startupId: profile.uid,
        startupName: profile.displayName || 'My Startup',
        investorId: 'investor_1', // MVP: отправляем любому хардкоженому инвестору или заглушке
        investorName: form.investorName,
        status: 'pending',
        request: {
          message: form.message,
          snapshotScore: 85,
          sentAt: new Date(),
          proposedDate: new Date(form.proposedDate)
        },
        meeting: {
          confirmedDate: null,
          calendarEventId: null,
          location: 'online',
          meetingUrl: null
        }
      };
      await addDoc(collection(db, 'pitches'), newPitch);
    }
    
    toast.success(t('pitchSent'), { icon: '🚀' });
    setShowModal(false);
    setForm({ investorName: '', proposedDate: '', message: '' });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, marginBottom: 6 }}>{t('title')}</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('subtitle')}</p>
        </div>
        <button className="btn-primary btn-mobile-full" onClick={() => setShowModal(true)}>
          <Send size={14} /> {t('requestPitch')}
        </button>
      </div>

      {/* Analytics Funnel */}
      <div className="card" style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)' }}>
        <div style={{ fontSize: 12, color: '#D8B4FE', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
          {t('analyticsTitle')}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative">
          {[
            { label: t('funnel.sent'), val: pitches.length, color: '#FFFFFF', pct: 100 },
            { label: t('funnel.viewed'), val: pitches.filter(p => p.status !== 'pending').length, color: '#A1A1AA', pct: Math.round((pitches.filter(p => p.status !== 'pending').length / pitches.length) * 100) || 0 },
            { label: t('funnel.meeting'), val: pitches.filter(p => p.meeting.confirmedDate).length, color: '#71717A', pct: Math.round((pitches.filter(p => p.meeting.confirmedDate).length / pitches.length) * 100) || 0 },
            { label: t('funnel.decision'), val: pitches.filter(p => p.status === 'accepted' || p.status === 'rejected' || p.status === 'closed').length, color: '#D4D4D8', pct: Math.round((pitches.filter(p => p.status === 'accepted' || p.status === 'rejected' || p.status === 'closed').length / pitches.length) * 100) || 0 },
          ].map((step, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 12px', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-80%)', fontSize: 20, color: '#334155' }}>→</div>}
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 800, color: step.color, marginBottom: 4 }}>{step.val}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{step.label}</div>
              <div className="progress-bar">
                <div style={{ height: '100%', width: `${step.pct}%`, borderRadius: 99, background: step.color, boxShadow: `0 0 8px ${step.color}50` }} />
              </div>
              <div style={{ fontSize: 11, color: step.color, marginTop: 4, fontWeight: 700 }}>{step.pct}%</div>
            </div>
          ))}
        </div>

        {/* Response time + rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/5">
          {[
            { label: t('kpis.responseRate'), value: `${Math.round((pitches.filter(p => p.status !== 'pending').length / pitches.length) * 100) || 0}%`, color: '#A1A1AA', desc: t('kpis.responseRateDesc') },
            { label: t('kpis.avgResponseTime'), value: '4.2', color: '#71717A', desc: t('kpis.avgResponseTimeDesc') },
            { label: t('kpis.acceptRate'), value: `${Math.round((pitches.filter(p => p.status === 'accepted' || p.status === 'feedback_pending').length / pitches.length) * 100) || 0}%`, color: '#D4D4D8', desc: t('kpis.acceptRateDesc') },
          ].map((kpi, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '14px', borderRadius: '12px', background: `${kpi.color}08`, border: `1px solid ${kpi.color}20` }}>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: kpi.color, marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 2 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{kpi.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {[
          { label: t('stats.total'), value: pitches.length, color: '#FFFFFF' },
          { label: t('stats.accepted'), value: pitches.filter(p => p.status === 'accepted' || p.status === 'feedback_pending').length, color: '#D4D4D8' },
          { label: t('stats.pending'), value: pitches.filter(p => p.status === 'pending').length, color: '#71717A' },
          { label: t('stats.closed'), value: pitches.filter(p => p.status === 'closed').length, color: '#64748b' },
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
            <p style={{ color: '#475569', marginBottom: 20 }}>{t('noRequests')}</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>{t('sendFirstRequest')}</button>
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
                      <span className={`badge ${cfg.badge}`}>{cfg.icon}&nbsp;{t(`status.${pitch.status}` as any)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569' }}>
                      {t('aiScoreAtRequest')} <strong style={{ color: '#D8B4FE' }}>{pitch.request.snapshotScore}/100</strong>
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: '#334155' }}>
                    {pitch.request.sentAt instanceof Date ? pitch.request.sentAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date((pitch.request.sentAt as any).seconds * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid rgba(255,255,255,0.3)' }}>
                  &ldquo;{pitch.request.message}&rdquo;
                </p>

                {pitch.meeting.confirmedDate && (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#94a3b8' }}>
                      <Calendar size={13} color="#FFFFFF" />
                      {pitch.meeting.confirmedDate instanceof Date ? pitch.meeting.confirmedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date((pitch.meeting.confirmedDate as any).seconds * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#94a3b8' }}>
                      {pitch.meeting.location === 'online' ? <Video size={13} color="#A1A1AA" /> : <MapPin size={13} color="#D4D4D8" />}
                      {pitch.meeting.location === 'online' ? t('onlineMeeting') : t('inPerson')}
                    </div>
                    {pitch.meeting.meetingUrl && (
                      <a href={pitch.meeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: '#FFFFFF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {t('joinMeeting')} <ArrowRight size={12} />
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
              {t('modal.title')}
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: '24px' }}>
              {t('modal.currentScore')} <strong style={{ color: '#D8B4FE' }}>85/100</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('modal.investorName')}</label>
                <input className="input-field" placeholder={t('modal.investorPlaceholder')} value={form.investorName} onChange={e => setForm(p => ({ ...p, investorName: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('modal.meetingDate')}</label>
                <input className="input-field" type="date" value={form.proposedDate} onChange={e => setForm(p => ({ ...p, proposedDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>{t('modal.message')}</label>
                <textarea
                  className="input-field"
                  placeholder={t('modal.messagePlaceholder')}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('modal.cancel')}</button>
                <button className="btn-primary" onClick={handleSend} style={{ flex: 2 }}>
                  <Send size={14} /> {t('modal.send')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
