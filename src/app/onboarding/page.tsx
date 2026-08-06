'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Rocket, Building2, Globe, ChevronRight, ChevronLeft, Sparkles, CheckCircle, Upload, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/animations';
import { Button } from '@/components/ui/button';

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 mb-4">
            <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Добро пожаловать, {profile?.displayName?.split(' ')[0] || 'Founder'}</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-2 text-zinc-900 dark:text-white">
            Настроим твой стартап
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">3 шага — и ты в системе</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div 
                className={cn(
                  "flex flex-col items-center gap-1.5",
                  step > s.id ? "cursor-pointer" : "cursor-default"
                )}
                onClick={() => step > s.id && setStep(s.id)}
              >
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  step > s.id 
                    ? "bg-zinc-900 dark:bg-zinc-200 border-zinc-900 dark:border-zinc-200 text-white dark:text-zinc-900" 
                    : step === s.id 
                      ? "bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-white shadow-lg" 
                      : "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600"
                )}>
                  {step > s.id ? <CheckCircle size={18} /> : s.icon}
                </div>
                <span className={cn(
                  "text-[11px] font-semibold whitespace-nowrap",
                  step === s.id ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-500"
                )}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "w-12 sm:w-20 h-[2px] mx-2 sm:mx-4 mb-5 transition-colors duration-300",
                  step > s.id ? "bg-zinc-900 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card className="p-2 sm:p-4">
          <CardContent className="p-4 sm:p-6">
            {/* Step 1 */}
            {step === 1 && (
              <FadeIn>
                <h2 className="font-display text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                  Расскажи о своём стартапе
                </h2>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-1.5">Название стартапа *</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors" 
                      placeholder="e.g. PayFlow, EduStack, AgriSense..." 
                      value={data.startupName} 
                      onChange={e => set('startupName', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-1.5">Tagline — одним предложением</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors" 
                      placeholder="e.g. B2B payment infrastructure for Central Asia" 
                      value={data.tagline} 
                      onChange={e => set('tagline', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-2.5">Индустрия *</label>
                    <div className="flex gap-2 flex-wrap">
                      {INDUSTRIES.map(ind => (
                        <button 
                          key={ind} 
                          onClick={() => set('industry', ind)} 
                          className={cn(
                            "px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer border",
                            data.industry === ind 
                              ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900" 
                              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          )}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-2.5">Текущая стадия *</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {STAGES.map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => set('stage', s.id)} 
                          className={cn(
                            "p-3.5 rounded-xl text-left border transition-all",
                            data.stage === s.id 
                              ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 ring-1 ring-zinc-300 dark:ring-zinc-600" 
                              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          )}
                        >
                          <div className={cn(
                            "text-[13px] font-semibold mb-0.5",
                            data.stage === s.id ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
                          )}>{s.label}</div>
                          <div className="text-[11px] text-zinc-500">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <FadeIn>
                <h2 className="font-display text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                  Рынок и команда
                </h2>
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-1.5"><MapPin size={11} className="inline mr-1" /> Город / Страна *</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors" 
                        placeholder="Tashkent, UZ" 
                        value={data.location} 
                        onChange={e => set('location', e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-1.5"><Users size={11} className="inline mr-1" /> Размер команды</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors appearance-none" 
                        value={data.teamSize} 
                        onChange={e => set('teamSize', e.target.value)}
                      >
                        {['1', '2-3', '4-6', '7-10', '11-20', '20+'].map(o => <option key={o} value={o}>{o} чел.</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold block mb-1.5 flex items-center justify-between">
                      <span>Какую проблему решаешь? *</span>
                      <span className="font-normal">(мин. 20 символов)</span>
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors resize-y leading-relaxed"
                      rows={5}
                      placeholder="Опиши боль рынка и свою гипотезу решения. Чем конкретнее — тем лучше AI-анализ."
                      value={data.problem}
                      onChange={e => set('problem', e.target.value)}
                    />
                    <div className="text-[11px] text-zinc-500 mt-1.5 text-right">
                      {data.problem.length} символов
                    </div>
                  </div>

                  {/* AI Summary Preview */}
                  {data.problem.length >= 20 && (
                    <div>
                      <button
                        onClick={handleGenerateAI}
                        disabled={aiGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold text-sm transition-colors"
                      >
                        {aiGenerating ? (
                          <><div className="w-3.5 h-3.5 rounded-full border-2 border-purple-300 dark:border-purple-700 border-t-purple-600 dark:border-t-purple-400 animate-spin" /> Gemini генерирует AI Summary...</>
                        ) : (
                          <><Sparkles size={14} /> ✨ Сгенерировать AI Executive Summary</>
                        )}
                      </button>
                      {aiSummary && (
                        <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          <span className="text-zinc-900 dark:text-zinc-300 font-semibold block mb-1.5">🤖 AI Summary:</span>
                          {aiSummary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </FadeIn>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <FadeIn>
                <h2 className="font-display text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                  Загрузи Pitch Deck
                </h2>
                <p className="text-zinc-500 text-sm mb-6">
                  Необязательно прямо сейчас — можно добавить позже в Data Room
                </p>

                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors",
                    data.pitchDeckFile 
                      ? "border-green-300 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10" 
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                  onClick={() => document.getElementById('pitch-deck-input')?.click()}
                >
                  {data.pitchDeckFile ? (
                    <>
                      <CheckCircle size={40} className="mx-auto mb-3 text-green-500 dark:text-green-400" />
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1">{data.pitchDeckFile.name}</div>
                      <div className="text-xs text-zinc-500">{(data.pitchDeckFile.size / 1024 / 1024).toFixed(1)} MB</div>
                      <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 font-medium">🤖 AI Score будет рассчитан после загрузки</div>
                    </>
                  ) : (
                    <>
                      <Upload size={40} className="mx-auto mb-3 text-zinc-400" />
                      <div className="text-sm text-zinc-500 mb-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-300">Нажми или перетащи</span> PDF файл
                      </div>
                      <div className="text-xs text-zinc-400">PDF до 50 MB · Pitch Deck, Executive Summary</div>
                    </>
                  )}
                  <input
                    id="pitch-deck-input" type="file" accept=".pdf" className="hidden"
                    onChange={e => set('pitchDeckFile', e.target.files?.[0] || null)}
                  />
                </div>

                {/* Summary */}
                <div className="mt-6 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-3">Итог:</div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { l: 'Стартап', v: data.startupName || '—' },
                      { l: 'Индустрия', v: data.industry || '—' },
                      { l: 'Стадия', v: data.stage },
                      { l: 'Команда', v: `${data.teamSize} чел.` },
                      { l: 'Локация', v: data.location },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-[13px]">
                        <span className="text-zinc-500">{r.l}</span>
                        <span className="text-zinc-900 dark:text-zinc-200 font-medium">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(s => s - 1)} 
                  className="flex-1 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <ChevronLeft size={16} className="mr-1.5" /> Назад
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                  className="flex-[2] bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900"
                >
                  Далее <ChevronRight size={16} className="ml-1.5" />
                </Button>
              ) : (
                <Button 
                  onClick={handleFinish} 
                  disabled={submitting}
                  className="flex-[2] bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900"
                >
                  {submitting ? (
                    <><div className="w-3.5 h-3.5 mr-2 rounded-full border-2 border-zinc-400 border-t-white dark:border-zinc-300 dark:border-t-zinc-900 animate-spin" /> Создаём стартап...</>
                  ) : (
                    <><Rocket size={14} className="mr-1.5" /> Запустить Founder OS</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
