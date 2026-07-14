'use client';

import { useState, useEffect } from 'react';
import { MOCK_PITCHES, MOCK_STARTUPS } from '@/lib/mockData';
import { PitchEvent, Startup } from '@/types';
import { Calendar, Video, MapPin, CheckCircle, XCircle, Clock, MessageSquare, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, isDemoConfig, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#71717A', bg: 'rgba(113,113,122,0.1)' },
  accepted: { label: 'Accepted', color: '#D4D4D8', bg: 'rgba(212,212,216,0.1)' },
  rejected: { label: 'Rejected', color: '#52525B', bg: 'rgba(82,82,91,0.1)' },
  feedback_pending: { label: 'Feedback Pending', color: '#A1A1AA', bg: 'rgba(161,161,170,0.1)' },
  completed: { label: 'Completed', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  closed: { label: 'Closed', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

function FeedbackModal({ pitch, onClose }: { pitch: PitchEvent; onClose: () => void }) {
  const [scores, setScores] = useState({ team: 3, market: 3, product: 3, traction: 3, financials: 3 });
  const [impression, setImpression] = useState<string>('neutral');
  const [text, setText] = useState('');
  const [nextStep, setNextStep] = useState('follow_up');

  const submit = () => {
    toast.success('Feedback submitted! AI analysis started.', { icon: '🤖' });
    onClose();
  };

  const IMPRESSIONS = [
    { value: 'strong_yes', label: '🔥 Strong Yes', color: '#D4D4D8' },
    { value: 'yes', label: '👍 Yes', color: '#A1A1AA' },
    { value: 'neutral', label: '😐 Neutral', color: '#71717A' },
    { value: 'no', label: '👎 No', color: '#f87171' },
    { value: 'strong_no', label: '❌ Strong No', color: '#52525B' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, marginBottom: '4px' }}>
          Submit Feedback
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: '24px' }}>{pitch.startupName} — Post-pitch review</p>

        {/* Overall Impression */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 10 }}>
            Overall Impression
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {IMPRESSIONS.map(imp => (
              <button key={imp.value} onClick={() => setImpression(imp.value)} style={{
                padding: '8px 14px', borderRadius: '10px', fontSize: 13, fontWeight: 500,
                background: impression === imp.value ? `${imp.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${impression === imp.value ? imp.color : 'rgba(255,255,255,0.08)'}`,
                color: impression === imp.value ? imp.color : '#64748b',
                cursor: 'pointer', fontFamily: 'Inter', transition: 'var(--transition-standard)',
              }}>
                {imp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Score Sliders */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 12 }}>
            Category Scores (1–5)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(Object.entries(scores) as [string, number][]).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: 80, fontSize: 13, color: '#94a3b8', textTransform: 'capitalize', flexShrink: 0 }}>{key}</span>
                <input type="range" min={1} max={5} value={val}
                  onChange={e => setScores(p => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: '#9333EA' }}
                />
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={12} fill={i <= val ? '#71717A' : 'none'} color={i <= val ? '#71717A' : '#334155'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text Feedback */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Written Feedback
          </label>
          <textarea className="input-field" rows={3} placeholder="Detailed feedback for the founder team..." value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        {/* Next Step */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Recommended Next Step
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { value: 'deal', label: '🤝 Deal', color: '#D4D4D8' },
              { value: 'follow_up', label: '📅 Follow Up', color: '#A1A1AA' },
              { value: 'traction', label: '📈 Improve Traction', color: '#71717A' },
              { value: 'pivot', label: '🔄 Pivot', color: '#9333EA' },
              { value: 'reject', label: '✖ Pass', color: '#52525B' },
            ].map(ns => (
              <button key={ns.value} onClick={() => setNextStep(ns.value)} style={{
                padding: '7px 14px', borderRadius: '10px', fontSize: 12, fontWeight: 500,
                background: nextStep === ns.value ? `${ns.color}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${nextStep === ns.value ? ns.color : 'rgba(255,255,255,0.08)'}`,
                color: nextStep === ns.value ? ns.color : '#64748b',
                cursor: 'pointer', fontFamily: 'Inter',
              }}>
                {ns.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn-primary" onClick={submit} style={{ flex: 2 }}>
            <MessageSquare size={14} /> Submit Feedback — AI Will Analyze
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvestorPitchesPage() {
  const { profile } = useAuth();
  const [pitches, setPitches] = useState<PitchEvent[]>(MOCK_PITCHES);
  const [startups, setStartups] = useState<Record<string, Startup>>({});
  const [activeFeedback, setActiveFeedback] = useState<PitchEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'closed'>('all');

  useEffect(() => {
    if (isDemoConfig || !profile) {
      setPitches(MOCK_PITCHES);
      const sMap: Record<string, Startup> = {};
      MOCK_STARTUPS.forEach(s => sMap[s.id!] = s);
      setStartups(sMap);
      return;
    }

    const q = query(collection(db, 'pitches'), where('investorId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PitchEvent));
      setPitches(data);
      
      // Fetch related startups if missing
      const newSMap = { ...startups };
      let missing = false;
      for (const p of data) {
        if (!newSMap[p.startupId]) {
          missing = true;
          break;
        }
      }
      
      if (missing) {
        const sSnap = await getDocs(collection(db, 'startups'));
        sSnap.forEach(s => newSMap[s.id] = { id: s.id, ...s.data() } as Startup);
        setStartups(newSMap);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const filtered = pitches.filter(p => {
    if (activeTab === 'pending') return p.status === 'pending';
    if (activeTab === 'active') return ['accepted', 'feedback_pending'].includes(p.status);
    if (activeTab === 'closed') return ['closed', 'rejected'].includes(p.status);
    return true;
  });

  const acceptPitch = async (pitchId: string) => {
    if (!isDemoConfig) await updateDoc(doc(db, 'pitches', pitchId), { status: 'accepted' });
    toast.success('Pitch accepted! Calendar invite sent.', { icon: '📅' });
  };

  const declinePitch = async (pitchId: string) => {
    if (!isDemoConfig) await updateDoc(doc(db, 'pitches', pitchId), { status: 'rejected' });
    toast.error('Pitch declined. Founder notified.', { icon: '❌' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Pitch Requests</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Manage incoming pitch requests and submit post-pitch feedback</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {(['all', 'pending', 'active', 'closed'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: '9px', border: 'none',
            background: activeTab === tab ? 'rgba(147,51,234,0.3)' : 'transparent',
            color: activeTab === tab ? '#D8B4FE' : '#64748b',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            transition: 'var(--transition-standard)', fontFamily: 'Inter', textTransform: 'capitalize',
          }}>
            {tab} {tab === 'all' ? `(${pitches.length})` : tab === 'pending' ? `(${pitches.filter(p => p.status === 'pending').length})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((pitch) => {
          const startup = startups[pitch.startupId] || MOCK_STARTUPS.find(s => s.id === pitch.startupId);
          const cfg = STATUS_CONFIG[pitch.status];

          return (
            <div key={pitch.id} className="card glass-hover">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 800, color: '#D8B4FE',
                }}>
                  {pitch.startupName?.charAt(0)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{pitch.startupName}</h3>
                      <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#334155' }}>
                      {pitch.request.sentAt instanceof Date ? pitch.request.sentAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date((pitch.request.sentAt as any).seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    &ldquo;{pitch.request.message}&rdquo;
                  </p>

                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#94a3b8' }}>
                      <Calendar size={13} color="#9333EA" />
                      Proposed: {pitch.request.proposedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {startup && (
                      <>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                          MRR: <strong style={{ color: '#D4D4D8' }}>${(startup.metrics.mrr / 1000).toFixed(1)}K</strong>
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                          AI Score: <strong style={{ color: '#D8B4FE' }}>{pitch.request.snapshotScore}/100</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {pitch.meeting.confirmedDate && (
                    <div style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(212,212,216,0.07)', border: '1px solid rgba(212,212,216,0.15)', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#A1A1AA' }}>
                        <CheckCircle size={13} />
                        Meeting: {pitch.meeting.confirmedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 13, color: '#A1A1AA' }}>
                        <Video size={13} /> Online
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {pitch.status === 'pending' && (
                      <>
                        <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }} onClick={() => acceptPitch(pitch.id)}>
                          <CheckCircle size={13} /> Accept
                        </button>
                        <button onClick={() => declinePitch(pitch.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '7px 16px', fontSize: 12, borderRadius: '8px', border: '1px solid rgba(82,82,91,0.3)',
                          background: 'rgba(82,82,91,0.1)', color: '#f87171', cursor: 'pointer', fontFamily: 'Inter',
                        }}>
                          <XCircle size={13} /> Decline
                        </button>
                      </>
                    )}
                    {pitch.status === 'feedback_pending' && (
                      <button className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }} onClick={() => setActiveFeedback(pitch)}>
                        <MessageSquare size={13} /> Submit Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.2, display: 'block' }} />
            <p style={{ color: '#475569' }}>No pitches in this category</p>
          </div>
        )}
      </div>

      {activeFeedback && <FeedbackModal pitch={activeFeedback} onClose={() => setActiveFeedback(null)} />}
    </div>
  );
}
