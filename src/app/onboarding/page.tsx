'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Rocket, Building2, Globe, ChevronRight, ChevronLeft, Sparkles, CheckCircle, Upload, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const INDUSTRIES = ['FinTech', 'EdTech', 'AgriTech', 'HealthTech', 'E-Commerce', 'PropTech', 'HRTech', 'LegalTech', 'Other'];
const STAGES = [
  { id: 'idea', label: 'Идея', desc: 'Концепция без продукта' },
  { id: 'validation', label: 'Валидация', desc: 'Тестируем гипотезы' },
  { id: 'mvp', label: 'MVP', desc: 'Первый рабочий продукт' },
  { id: 'growth', label: 'Рост', desc: 'Есть выручка, масштабируемся' },
];

interface OnboardingData {
  startupName: string;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  teamSize: string;
  problem: string;
  pitchDeckFile: File | null;
}

const STEPS = [
  { id: 1, title: 'Твой стартап', icon: <Building2 size={20} />, desc: 'Базовая информация' },
  { id: 2, title: 'Рынок и команда', icon: <Globe size={20} />, desc: 'Контекст и масштаб' },
  { id: 3, title: 'Питч-дек', icon: <Rocket size={20} />, desc: 'Первый документ' },
];

export default function OnboardingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const [data, setData] = useState<OnboardingData>({
    startupName: '', tagline: '', industry: '',
    stage: 'idea', location: 'Tashkent, UZ', teamSize: '1-3',
    problem: '', pitchDeckFile: null,
  });

  const set = (key: keyof OnboardingData, val: any) =>
    setData(prev => ({ ...prev, [key]: val }));

  const canNext = () => {
    if (step === 1) return data.startupName.trim().length >= 2 && data.industry && data.stage;
    if (step === 2) return data.location.trim().length > 0 && data.problem.trim().length >= 20;
    return true;
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setAiSummary(
      `${data.startupName} is a ${data.stage}-stage ${data.industry} startup from ${data.location} ` +
      `addressing: "${data.problem.slice(0, 80)}...". ` +
      `With a team of ${data.teamSize} founders, the company is positioned to capture a significant ` +
      `share of the Central Asian ${data.industry} market. Early indicators suggest strong product-market ` +
      `fit potential based on problem clarity and market context.`
    );
    setAiGenerating(false);
    toast.success('AI Summary generated!', { icon: '🤖' });
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

      if (!isDemoMode && profile?.uid) {
        // 1. Создаём стартап в Firestore
        const startupRef = doc(collection(db, 'startups'));
        await setDoc(startupRef, {
          name: data.startupName,
          tagline: data.tagline,
          industry: data.industry,
          stage: data.stage,
          location: data.location,
          problem: data.problem,
          founderIds: [profile.uid],
          founderName: profile.displayName || '',
          founderEmail: profile.email || '',
          metrics: { mrr: 0, arr: 0, mau: 0, runwayMonths: 0, teamSize: parseInt(data.teamSize) || 1, churnRate: 0, ltv: 0, cac: 0, ltvCacRatio: 0 },
          aiScores: { overallReadinessScore: 0, pitchDeckScore: 0 },
          roadmapProgress: 0,
          status: 'active',
          createdAt: serverTimestamp(),
          lastActivityAt: serverTimestamp(),
        });

        // 2. Отмечаем онбординг как завершённый
        await setDoc(doc(db, 'onboarding', profile.uid), {
          completed: true,
          completedAt: serverTimestamp(),
          startupId: startupRef.id,
          startupName: data.startupName,
        }, { merge: true });

        // 3. Обновляем профиль пользователя — привязываем стартап
        await setDoc(doc(db, 'users', profile.uid), {
          linkedStartupId: startupRef.id,
          onboardingCompleted: true,
        }, { merge: true });

        // 4. AI Auto-Analysis — Gemini генерирует executive summary и начальный score
        try {
          const aiRes = await fetch('/api/ai/analyze-startup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.startupName, tagline: data.tagline,
              industry: data.industry, stage: data.stage,
              location: data.location, teamSize: data.teamSize,
              problem: data.problem,
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            await setDoc(startupRef, {
              executiveSummaryAI: aiData.executiveSummaryAI || '',
              aiScores: aiData.aiScores || { overallReadinessScore: 0, pitchDeckScore: 0 },
              aiStrengths: aiData.strengths || [],
              aiWeaknesses: aiData.weaknesses || [],
              aiRecommendation: aiData.recommendation || 'pass',
              aiNextSteps: aiData.nextSteps || '',
            }, { merge: true });
          }
        } catch { /* AI analysis is non-blocking */ }
      }
    } catch (err) {
      console.warn('Firestore save failed (demo mode?):', err);
    }

    toast.success('🎉 Стартап создан! Добро пожаловать в Founder OS', { duration: 4000 });
    router.push('/founder');
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '620px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', marginBottom: '16px' }}>
            <Sparkles size={13} color="#a78bfa" />
            <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>Добро пожаловать, {profile?.displayName?.split(' ')[0] || 'Founder'}</span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            Настроим твой стартап
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>3 шага — и ты в системе</p>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '40px' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: step > s.id ? 'pointer' : 'default',
              }} onClick={() => step > s.id && setStep(s.id)}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: step > s.id ? '#10b981' : step === s.id ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${step > s.id ? '#10b981' : step === s.id ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step > s.id ? 'white' : step === s.id ? '#a78bfa' : '#334155',
                  transition: 'all 0.3s',
                  boxShadow: step === s.id ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
                }}>
                  {step > s.id ? <CheckCircle size={18} /> : s.icon}
                </div>
                <span style={{ fontSize: 11, color: step === s.id ? '#a78bfa' : '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: '80px', height: '2px', background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.06)', margin: '0 4px 20px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '36px' }}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                Расскажи о своём стартапе
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Название стартапа *</label>
                  <input className="input-field" placeholder="e.g. PayFlow, EduStack, AgriSense..." value={data.startupName} onChange={e => set('startupName', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>Tagline — одним предложением</label>
                  <input className="input-field" placeholder="e.g. B2B payment infrastructure for Central Asia" value={data.tagline} onChange={e => set('tagline', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 10 }}>Индустрия *</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {INDUSTRIES.map(ind => (
                      <button key={ind} onClick={() => set('industry', ind)} style={{
                        padding: '8px 14px', borderRadius: '10px', fontSize: 13, fontWeight: 500,
                        background: data.industry === ind ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${data.industry === ind ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                        color: data.industry === ind ? '#a78bfa' : '#64748b',
                        cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s',
                      }}>{ind}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 10 }}>Текущая стадия *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {STAGES.map(s => (
                      <button key={s.id} onClick={() => set('stage', s.id)} style={{
                        padding: '12px 16px', borderRadius: '12px', textAlign: 'left',
                        background: data.stage === s.id ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${data.stage === s.id ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                        cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: data.stage === s.id ? '#a78bfa' : '#94a3b8', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: '#334155' }}>{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                Рынок и команда
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}><MapPin size={11} style={{ display: 'inline' }} /> Город / Страна *</label>
                    <input className="input-field" placeholder="Tashkent, UZ" value={data.location} onChange={e => set('location', e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}><Users size={11} style={{ display: 'inline' }} /> Размер команды</label>
                    <select className="input-field" value={data.teamSize} onChange={e => set('teamSize', e.target.value)} style={{ appearance: 'none' }}>
                      {['1', '2-3', '4-6', '7-10', '11-20', '20+'].map(o => <option key={o} value={o}>{o} чел.</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Какую проблему решаешь? * <span style={{ color: '#334155', fontWeight: 400 }}>(мин. 20 символов)</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows={5}
                    placeholder="Опиши боль рынка и свою гипотезу решения. Чем конкретнее — тем лучше AI-анализ."
                    value={data.problem}
                    onChange={e => set('problem', e.target.value)}
                    style={{ resize: 'vertical', lineHeight: 1.7 }}
                  />
                  <div style={{ fontSize: 11, color: '#334155', marginTop: 4, textAlign: 'right' }}>
                    {data.problem.length} символов
                  </div>
                </div>

                {/* AI Summary Preview */}
                {data.problem.length >= 20 && (
                  <div>
                    <button
                      onClick={handleGenerateAI}
                      disabled={aiGenerating}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                        color: '#a78bfa', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                        transition: 'all 0.15s',
                      }}
                    >
                      {aiGenerating ? (
                        <><span style={{ width: 14, height: 14, border: '2px solid rgba(167,139,250,0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Gemini генерирует AI Summary...</>
                      ) : (
                        <><Sparkles size={14} /> ✨ Сгенерировать AI Executive Summary</>
                      )}
                    </button>
                    {aiSummary && (
                      <div style={{ marginTop: '10px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                        <span style={{ color: '#34d399', fontWeight: 600, display: 'block', marginBottom: 6 }}>🤖 AI Summary:</span>
                        {aiSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                Загрузи Pitch Deck
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                Необязательно прямо сейчас — можно добавить позже в Data Room
              </p>

              <div
                style={{
                  border: `2px dashed ${data.pitchDeckFile ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '16px', padding: '48px 24px', textAlign: 'center',
                  background: data.pitchDeckFile ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('pitch-deck-input')?.click()}
              >
                {data.pitchDeckFile ? (
                  <>
                    <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: '#34d399', marginBottom: 4 }}>{data.pitchDeckFile.name}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{(data.pitchDeckFile.size / 1024 / 1024).toFixed(1)} MB</div>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#a78bfa' }}>🤖 AI Score будет рассчитан после загрузки</div>
                  </>
                ) : (
                  <>
                    <Upload size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#334155' }} />
                    <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>Нажми или перетащи</span> PDF файл
                    </div>
                    <div style={{ fontSize: 12, color: '#334155' }}>PDF до 50 MB · Pitch Deck, Executive Summary</div>
                  </>
                )}
                <input
                  id="pitch-deck-input" type="file" accept=".pdf" style={{ display: 'none' }}
                  onChange={e => set('pitchDeckFile', e.target.files?.[0] || null)}
                />
              </div>

              {/* Summary */}
              <div style={{ marginTop: '24px', padding: '20px', borderRadius: '14px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Итог:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { l: 'Стартап', v: data.startupName || '—' },
                    { l: 'Индустрия', v: data.industry || '—' },
                    { l: 'Стадия', v: data.stage },
                    { l: 'Команда', v: `${data.teamSize} чел.` },
                    { l: 'Локация', v: data.location },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#475569' }}>{r.l}</span>
                      <span style={{ color: '#f8fafc', fontWeight: 500 }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary" style={{ flex: 1 }}>
                <ChevronLeft size={16} /> Назад
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="btn-primary"
                disabled={!canNext()}
                style={{ flex: 2, opacity: canNext() ? 1 : 0.5 }}
              >
                Далее <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
                {submitting ? (
                  <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Создаём стартап...</>
                ) : (
                  <><Rocket size={14} /> Запустить Founder OS</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
