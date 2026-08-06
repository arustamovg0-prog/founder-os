'use client';

import { useState } from 'react';
import { Flame, Calendar, DollarSign, Tag, Send, ChevronRight, Clock, Building2, Trophy, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  company: string;
  companyLogo: string;
  industry: string;
  title: string;
  problem: string;
  reward: string;
  rewardType: 'pilot' | 'grant' | 'investment';
  deadline: string;
  daysLeft: number;
  tags: string[];
  applied: boolean;
  applicants: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'open' | 'review' | 'closed';
}

const CHALLENGES: Challenge[] = [
  {
    id: 'ch1', company: 'Uzum Bank', companyLogo: '🏦',
    industry: 'FinTech / Banking',
    title: 'AI-скоринг для МСБ без кредитной истории',
    problem: 'Более 70% малого бизнеса в Узбекистане не может получить кредит из-за отсутствия кредитной истории. Нам нужно AI-решение для альтернативного скоринга на основе транзакционных данных, поведения в соцсетях и данных из госреестров.',
    reward: 'Pilot-контракт на $50,000 + приоритетное рассмотрение в качестве поставщика',
    rewardType: 'pilot', deadline: '2026-08-01', daysLeft: 35,
    tags: ['ai', 'fintech', 'scoring', 'ml', 'banking'],
    applied: false, applicants: 7, difficulty: 'hard', status: 'open',
  },
  {
    id: 'ch2', company: 'Astana Hub', companyLogo: '🌐',
    industry: 'GovTech / EdTech',
    title: 'Платформа мониторинга прогресса студентов IT-курсов',
    problem: 'Tech Orda финансирует обучение тысяч студентов, но у нас нет единой системы отслеживания: посещаемость, прогресс по модулям, результаты тестов, Employment Rate выпускников. Нужна B2G SaaS-платформа.',
    reward: 'Грант $30,000 + 2-летний контракт с Astana Hub',
    rewardType: 'grant', deadline: '2026-07-20', daysLeft: 23,
    tags: ['edtech', 'b2g', 'analytics', 'saas'],
    applied: false, applicants: 12, difficulty: 'medium', status: 'open',
  },
  {
    id: 'ch3', company: 'Kazmunaigas', companyLogo: '⛽',
    industry: 'Energy / Industrial IoT',
    title: 'Предиктивное обслуживание нефтяного оборудования',
    problem: 'Незапланированные поломки оборудования обходятся нам в $2M+ в год. Ищем IoT + ML решение для предиктивного обслуживания: сбор данных с датчиков, предсказание отказов за 72 часа, интеграция с SAP.',
    reward: 'Пилот на 6 месяцев + потенциальный контракт $500K/год',
    rewardType: 'pilot', deadline: '2026-09-15', daysLeft: 80,
    tags: ['iot', 'ml', 'industrial', 'sap', 'energy'],
    applied: false, applicants: 4, difficulty: 'hard', status: 'open',
  },
  {
    id: 'ch4', company: 'OZON KZ', companyLogo: '🛒',
    industry: 'E-commerce / Logistics',
    title: 'Оптимизация последней мили в регионах Казахстана',
    problem: 'Стоимость доставки в малые города и сёла в 4x выше, чем в Алматы/Астане. Нужно решение для агрегации грузов, оптимизации маршрутов и управления локальными курьерами в населённых пунктах менее 50 000 человек.',
    reward: '$20,000 грант + возможность интеграции в сеть OZON',
    rewardType: 'grant', deadline: '2026-07-31', daysLeft: 34,
    tags: ['logistics', 'lastmile', 'optimization', 'rural'],
    applied: false, applicants: 9, difficulty: 'medium', status: 'open',
  },
  {
    id: 'ch5', company: 'Ministry of Health UZ', companyLogo: '🏥',
    industry: 'HealthTech / GovTech',
    title: 'Телемедицина для отдалённых районов',
    problem: 'В 30% районов Узбекистана нет специализированных врачей. Нужна простая платформа телемедицины с поддержкой низкоскоростного интернета, оффлайн-режимом и интеграцией с Единой системой здравоохранения.',
    reward: 'Государственный контракт + $100,000 на разработку',
    rewardType: 'investment', deadline: '2026-10-01', daysLeft: 96,
    tags: ['healthtech', 'telemedicine', 'b2g', 'rural', 'offline'],
    applied: true, applicants: 15, difficulty: 'hard', status: 'open',
  },
  {
    id: 'ch6', company: 'Magnum Cash&Carry', companyLogo: '',
    industry: 'Retail / AI',
    title: 'AI-рекомендации для персонализации промо-акций',
    problem: 'Наши промо-кампании ориентированы на всех покупателей, хотя у нас есть данные о 2M+ клиентах. Нужна система персонализированных скидок и предложений на основе истории покупок с интеграцией в кассовую систему.',
    reward: 'Pilot $15,000 + equity-free инвестиция $50,000',
    rewardType: 'investment', deadline: '2026-08-20', daysLeft: 54,
    tags: ['ai', 'retail', 'recommendation', 'personalization'],
    applied: false, applicants: 11, difficulty: 'easy', status: 'open',
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#D4D4D8',
  medium: '#71717A',
  hard: '#52525B',
};
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};
const REWARD_COLORS: Record<string, string> = {
  pilot: '#A1A1AA',
  grant: '#D4D4D8',
  investment: '#FFFFFF',
};
const REWARD_LABELS: Record<string, string> = {
  pilot: 'Pilot Deal',
  grant: 'Grant',
  investment: 'Investment',
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [filter, setFilter] = useState<'all' | 'pilot' | 'grant' | 'investment'>('all');
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applicationText, setApplicationText] = useState('');
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const filtered = challenges.filter(c => filter === 'all' || c.rewardType === filter);

  const submitApplication = (id: string) => {
    setSubmittedIds(prev => new Set([...prev, id]));
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, applied: true, applicants: c.applicants + 1 } : c));
    setApplyingTo(null);
    setApplicationText('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#52525B,#71717A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={16} color="currentColor" />
              </div>
              <h1 style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700 }}>Corporate Challenges</h1>
              <span className="badge badge-red">{CHALLENGES.filter(c => c.status === 'open').length} активных</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 13 }}>Реальные задачи от корпораций — решай и получай первых enterprise-клиентов</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Задач открыто', value: CHALLENGES.filter(c => c.status === 'open').length, color: '#D4D4D8' },
              { label: 'Всего заявок', value: CHALLENGES.reduce((s, c) => s + c.applicants, 0), color: 'var(--text-primary)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 16px', borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-space-grotesk), sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <Filter size={14} color="#64748b" />
        {(['all', 'pilot', 'grant', 'investment'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === f ? (f === 'all' ? 'rgba(0,0,0,0.15)' : `${REWARD_COLORS[f]}15`) : 'rgba(0,0,0,0.04)',
            border: filter === f ? `1px solid ${f === 'all' ? 'rgba(0,0,0,0.4)' : `${REWARD_COLORS[f]}40`}` : '1px solid rgba(0,0,0,0.08)',
            color: filter === f ? (f === 'all' ? '#D8B4FE' : REWARD_COLORS[f]) : '#64748b', fontFamily: 'Inter',
          }}>
            {f === 'all' ? 'Все задачи' : REWARD_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(ch => (
          <Card key={ch.id} className={cn(
            "overflow-hidden transition-all duration-200 border",
            ch.applied || submittedIds.has(ch.id) ? "border-zinc-300 dark:border-zinc-700" : "hover:border-zinc-300 dark:hover:border-zinc-700"
          )}>
            {/* Top bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${REWARD_COLORS[ch.rewardType]}, transparent)` }} />

            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-xl shrink-0 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[22px]">
                  {ch.companyLogo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100">{ch.company}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border" style={{ background: `${REWARD_COLORS[ch.rewardType]}15`, borderColor: `${REWARD_COLORS[ch.rewardType]}30`, color: REWARD_COLORS[ch.rewardType] }}>
                      {REWARD_LABELS[ch.rewardType]}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: DIFFICULTY_COLORS[ch.difficulty] }}>
                      ● {DIFFICULTY_LABELS[ch.difficulty]}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center">
                    <Building2 size={10} className="inline mr-1" />
                    {ch.industry}
                  </div>
                </div>
              </div>

              <h3 className="text-[15px] font-bold mb-2.5 font-display leading-snug text-zinc-900 dark:text-zinc-100">{ch.title}</h3>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3.5">{ch.problem}</p>

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap mb-3.5">
                {ch.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center">
                    <Tag size={8} className="inline mr-1" />{tag}
                  </span>
                ))}
              </div>

              {/* Reward */}
              <div className="p-2.5 px-3.5 rounded-lg mb-3.5 border" style={{ background: `${REWARD_COLORS[ch.rewardType]}08`, borderColor: `${REWARD_COLORS[ch.rewardType]}20` }}>
                <div className="flex items-center gap-1.5">
                  <Trophy size={12} color={REWARD_COLORS[ch.rewardType]} />
                  <span className="text-xs font-semibold" style={{ color: REWARD_COLORS[ch.rewardType] }}>Вознаграждение:</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{ch.reward}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className={cn("flex items-center gap-1", ch.daysLeft <= 30 ? "text-red-500" : "")}>
                    <Clock size={10} />
                    {ch.daysLeft} дней
                  </span>
                  <span className="flex items-center gap-1">
                    <Send size={10} />
                    {ch.applicants} заявок
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(ch.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {ch.applied || submittedIds.has(ch.id) ? (
                  <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    ✅ Заявка подана
                  </span>
                ) : (
                  <button onClick={() => setApplyingTo(ch.id)} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-colors flex items-center gap-1.5 font-sans">
                    <ChevronRight size={12} />Подать заявку
                  </button>
                )}
              </div>
            </CardContent>

            {/* Apply form */}
            {applyingTo === ch.id && (
              <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">Опишите ваш подход к решению задачи и почему именно ваша команда:</p>
                <textarea
                  value={applicationText}
                  onChange={e => setApplicationText(e.target.value)}
                  placeholder="Мы планируем решить эту задачу с помощью..."
                  className="w-full min-h-[100px] p-3 rounded-lg resize-y bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[13px] font-sans focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
                <div className="flex gap-2 mt-2.5 justify-end">
                  <button onClick={() => setApplyingTo(null)} className="px-3.5 py-1.5 rounded-lg text-xs bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer font-sans hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    Отмена
                  </button>
                  <button onClick={() => submitApplication(ch.id)} disabled={!applicationText.trim()} className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center font-sans",
                    applicationText.trim() 
                      ? "cursor-pointer bg-zinc-900 dark:bg-zinc-100 border border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white" 
                      : "cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
                  )}>
                    <Send size={12} className="inline mr-1.5" />Отправить
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
