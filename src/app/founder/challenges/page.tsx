'use client';

import { useState } from 'react';
import { Flame, Calendar, DollarSign, Tag, Send, ChevronRight, Clock, Building2, Trophy, Filter } from 'lucide-react';

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
    id: 'ch6', company: 'Magnum Cash&Carry', companyLogo: '🛍️',
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
  investment: '#9333EA',
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
                <Flame size={16} color="white" />
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>Corporate Challenges</h1>
              <span className="badge badge-red">{CHALLENGES.filter(c => c.status === 'open').length} активных</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 13 }}>Реальные задачи от корпораций — решай и получай первых enterprise-клиентов</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'Задач открыто', value: CHALLENGES.filter(c => c.status === 'open').length, color: '#D4D4D8' },
              { label: 'Всего заявок', value: CHALLENGES.reduce((s, c) => s + c.applicants, 0), color: '#9333EA' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '10px 16px', borderRadius: 10, background: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
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
            background: filter === f ? (f === 'all' ? 'rgba(147,51,234,0.15)' : `${REWARD_COLORS[f]}15`) : 'rgba(255,255,255,0.04)',
            border: filter === f ? `1px solid ${f === 'all' ? 'rgba(147,51,234,0.4)' : `${REWARD_COLORS[f]}40`}` : '1px solid rgba(255,255,255,0.08)',
            color: filter === f ? (f === 'all' ? '#D8B4FE' : REWARD_COLORS[f]) : '#64748b', fontFamily: 'Inter',
          }}>
            {f === 'all' ? 'Все задачи' : REWARD_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
        {filtered.map(ch => (
          <div key={ch.id} style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(13,13,32,0.8)', border: `1px solid ${ch.applied ? 'rgba(212,212,216,0.25)' : 'rgba(255,255,255,0.06)'}`,
            transition: 'var(--transition-standard)',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ch.applied ? 'rgba(212,212,216,0.4)' : 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ch.applied ? 'rgba(212,212,216,0.25)' : 'rgba(255,255,255,0.06)'; }}
          >
            {/* Top bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${REWARD_COLORS[ch.rewardType]}, transparent)` }} />

            <div style={{ padding: 20 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {ch.companyLogo}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{ch.company}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: `${REWARD_COLORS[ch.rewardType]}15`, border: `1px solid ${REWARD_COLORS[ch.rewardType]}30`, color: REWARD_COLORS[ch.rewardType] }}>
                      {REWARD_LABELS[ch.rewardType]}
                    </span>
                    <span style={{ fontSize: 10, color: DIFFICULTY_COLORS[ch.difficulty], fontWeight: 600 }}>
                      ● {DIFFICULTY_LABELS[ch.difficulty]}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    <Building2 size={10} style={{ display: 'inline', marginRight: 4 }} />
                    {ch.industry}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, fontFamily: 'Space Grotesk', lineHeight: 1.4 }}>{ch.title}</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 14 }}>{ch.problem}</p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {ch.tags.map(tag => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}>
                    <Tag size={8} style={{ display: 'inline', marginRight: 3 }} />{tag}
                  </span>
                ))}
              </div>

              {/* Reward */}
              <div style={{ padding: '10px 14px', borderRadius: 10, background: `${REWARD_COLORS[ch.rewardType]}08`, border: `1px solid ${REWARD_COLORS[ch.rewardType]}20`, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trophy size={12} color={REWARD_COLORS[ch.rewardType]} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: REWARD_COLORS[ch.rewardType] }}>Вознаграждение:</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{ch.reward}</p>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: ch.daysLeft <= 30 ? '#52525B' : '#64748b' }}>
                    <Clock size={10} />
                    {ch.daysLeft} дней
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={10} />
                    {ch.applicants} заявок
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={10} />
                    {new Date(ch.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {ch.applied || submittedIds.has(ch.id) ? (
                  <span style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(212,212,216,0.1)', border: '1px solid rgba(212,212,216,0.25)', color: '#D4D4D8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✅ Заявка подана
                  </span>
                ) : (
                  <button onClick={() => setApplyingTo(ch.id)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', color: '#D8B4FE',
                    display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', transition: 'var(--transition-standard)',
                  }}>
                    <ChevronRight size={12} />Подать заявку
                  </button>
                )}
              </div>
            </div>

            {/* Apply form */}
            {applyingTo === ch.id && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(147,51,234,0.04)' }}>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Опишите ваш подход к решению задачи и почему именно ваша команда:</p>
                <textarea
                  value={applicationText}
                  onChange={e => setApplicationText(e.target.value)}
                  placeholder="Мы планируем решить эту задачу с помощью..."
                  style={{
                    width: '100%', minHeight: 100, padding: '10px 12px', borderRadius: 8, resize: 'vertical',
                    background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc',
                    fontSize: 13, fontFamily: 'Inter', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setApplyingTo(null)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontFamily: 'Inter' }}>
                    Отмена
                  </button>
                  <button onClick={() => submitApplication(ch.id)} disabled={!applicationText.trim()} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: applicationText.trim() ? 'pointer' : 'not-allowed',
                    background: applicationText.trim() ? 'rgba(147,51,234,0.3)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${applicationText.trim() ? 'rgba(147,51,234,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: applicationText.trim() ? '#D8B4FE' : '#334155', fontFamily: 'Inter',
                  }}>
                    <Send size={12} style={{ display: 'inline', marginRight: 6 }} />Отправить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
