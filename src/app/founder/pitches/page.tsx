'use client';

import { useState, useEffect } from 'react';
import { PitchEvent } from '@/types';
import { Calendar, MapPin, Video, CheckCircle, Clock, XCircle, Send, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { variant: 'secondary', icon: <Clock size={14} /> },
  accepted: { variant: 'default', icon: <CheckCircle size={14} /> },
  rejected: { variant: 'destructive', icon: <XCircle size={14} /> },
  feedback_pending: { variant: 'secondary', icon: <Clock size={14} /> },
  completed: { variant: 'outline', icon: <CheckCircle size={14} /> },
  closed: { variant: 'outline', icon: <CheckCircle size={14} /> },
};

export default function FounderPitchesPage() {
  const t = useTranslations('FounderPitches');
  const { profile, isDemoMode } = useAuth();
  const [pitches, setPitches] = useState<PitchEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ investorName: '', proposedDate: '', message: '' });

  useEffect(() => {
    if (isDemoMode) {
      setPitches([{
        id: 'demo_pitch_1',
        startupId: 'demo_uid',
        startupName: 'Nexus AI',
        investorId: 'inv_1',
        investorName: 'Acme Ventures',
        status: 'accepted',
        request: {
          message: 'Мы хотели бы обсудить возможности интеграции AI в ваши бизнес-процессы.',
          snapshotScore: 88,
          sentAt: new Date(Date.now() - 86400000 * 2),
          proposedDate: new Date(Date.now() + 86400000 * 5)
        },
        meeting: {
          confirmedDate: new Date(Date.now() + 86400000 * 5),
          calendarEventId: 'evt_1',
          location: 'online',
          meetingUrl: 'https://zoom.us/j/demo123'
        }
      } as PitchEvent]);
      return;
    }

    if (!profile) return;

    const q = query(collection(db, 'pitches'), where('startupId', '==', profile.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PitchEvent));
      setPitches(data);
    });

    return () => unsubscribe();
  }, [profile, isDemoMode]);

  const handleSend = async () => {
    if (!form.investorName || !form.proposedDate || !form.message) {
      toast.error(t('fillAllFields'));
      return;
    }
    
    if (profile && !isDemoMode) {
      const newPitch: Partial<PitchEvent> = {
        startupId: profile.uid,
        startupName: profile.displayName || 'My Startup',
        investorId: 'investor_1', // MVP
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
    
    toast.success(t('pitchSent'));
    setShowModal(false);
    setForm({ investorName: '', proposedDate: '', message: '' });
  };

  return (
    <FadeIn>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t('title')}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Send size={14} className="mr-2" /> {t('requestPitch')}
        </Button>
      </div>

      {/* Analytics Funnel */}
      <Card className="mb-6 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6">
            {t('analyticsTitle')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative gap-6">
            {[
              { label: t('funnel.sent'), val: pitches.length, pct: 100 },
              { label: t('funnel.viewed'), val: pitches.filter(p => p.status !== 'pending').length, pct: Math.round((pitches.filter(p => p.status !== 'pending').length / pitches.length) * 100) || 0 },
              { label: t('funnel.meeting'), val: pitches.filter(p => p.meeting.confirmedDate).length, pct: Math.round((pitches.filter(p => p.meeting.confirmedDate).length / pitches.length) * 100) || 0 },
              { label: t('funnel.decision'), val: pitches.filter(p => p.status === 'accepted' || p.status === 'rejected' || p.status === 'closed').length, pct: Math.round((pitches.filter(p => p.status === 'accepted' || p.status === 'rejected' || p.status === 'closed').length / pitches.length) * 100) || 0 },
            ].map((step, i) => (
              <div key={i} className="text-center px-3 relative">
                {i > 0 && <div className="hidden lg:block absolute left-[-1rem] top-1/2 -translate-y-1/2 text-2xl text-zinc-300 dark:text-zinc-700">→</div>}
                <div className="font-display text-4xl font-extrabold text-zinc-900 dark:text-white mb-1">{step.val}</div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">{step.label}</div>
                <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-500" style={{ width: `${step.pct}%` }} />
                </div>
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-2">{step.pct}%</div>
              </div>
            ))}
          </div>

          {/* Response time + rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            {[
              { label: t('kpis.responseRate'), value: `${Math.round((pitches.filter(p => p.status !== 'pending').length / pitches.length) * 100) || 0}%`, desc: t('kpis.responseRateDesc') },
              { label: t('kpis.avgResponseTime'), value: '4.2', desc: t('kpis.avgResponseTimeDesc') },
              { label: t('kpis.acceptRate'), value: `${Math.round((pitches.filter(p => p.status === 'accepted' || p.status === 'feedback_pending').length / pitches.length) * 100) || 0}%`, desc: t('kpis.acceptRateDesc') },
            ].map((kpi, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white mb-1">{kpi.value}</div>
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">{kpi.label}</div>
                <div className="text-xs text-zinc-500">{kpi.desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('stats.total'), value: pitches.length },
          { label: t('stats.accepted'), value: pitches.filter(p => p.status === 'accepted' || p.status === 'feedback_pending').length },
          { label: t('stats.pending'), value: pitches.filter(p => p.status === 'pending').length },
          { label: t('stats.closed'), value: pitches.filter(p => p.status === 'closed').length },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 text-center">
              <div className="font-display text-4xl font-extrabold text-zinc-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 font-medium mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pitch List */}
      <div className="space-y-4">
        {pitches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center flex flex-col items-center">
              <Send size={48} className="mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-zinc-500 mb-6">{t('noRequests')}</p>
              <Button onClick={() => setShowModal(true)}>{t('sendFirstRequest')}</Button>
            </CardContent>
          </Card>
        ) : (
          pitches.map((pitch) => {
            const cfg = STATUS_CONFIG[pitch.status] || { variant: 'outline', icon: <CheckCircle size={14} /> };
            return (
              <Card key={pitch.id} className="transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">{pitch.investorName}</h3>
                        <Badge variant={cfg.variant} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full">
                          {cfg.icon} <span>{t(`status.${pitch.status}` as any)}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {t('aiScoreAtRequest')} <strong className="text-zinc-900 dark:text-white">{pitch.request.snapshotScore}/100</strong>
                      </p>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {pitch.request.sentAt instanceof Date ? pitch.request.sentAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date((pitch.request.sentAt as any).seconds * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border-l-2 border-zinc-300 dark:border-zinc-700">
                    &ldquo;{pitch.request.message}&rdquo;
                  </p>

                  {pitch.meeting.confirmedDate && (
                    <div className="flex gap-4 flex-wrap mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <Calendar size={14} />
                        {pitch.meeting.confirmedDate instanceof Date ? pitch.meeting.confirmedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date((pitch.meeting.confirmedDate as any).seconds * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {pitch.meeting.location === 'online' ? <Video size={14} /> : <MapPin size={14} />}
                        {pitch.meeting.location === 'online' ? t('onlineMeeting') : t('inPerson')}
                      </div>
                      {pitch.meeting.meetingUrl && (
                        <a href={pitch.meeting.meetingUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-white hover:underline">
                          {t('joinMeeting')} <ArrowRight size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6">
              <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-white mb-2">
                {t('modal.title')}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                {t('modal.currentScore')} <strong className="text-zinc-900 dark:text-white">85/100</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('modal.investorName')}</label>
                  <input 
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                    placeholder={t('modal.investorPlaceholder')} 
                    value={form.investorName} 
                    onChange={e => setForm(p => ({ ...p, investorName: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('modal.meetingDate')}</label>
                  <input 
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white" 
                    type="date" 
                    value={form.proposedDate} 
                    onChange={e => setForm(p => ({ ...p, proposedDate: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">{t('modal.message')}</label>
                  <textarea
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white resize-y"
                    placeholder={t('modal.messagePlaceholder')}
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>{t('modal.cancel')}</Button>
                  <Button className="flex-[2]" onClick={handleSend}>
                    <Send size={14} className="mr-2" /> {t('modal.send')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </FadeIn>
  );
}
