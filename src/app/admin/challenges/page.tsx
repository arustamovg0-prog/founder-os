'use client';

import { useState } from 'react';
import { Flame, Plus, Trash2, Edit3, Eye, Users, CheckCircle, X, Save } from 'lucide-react';

interface AdminChallenge {
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
  applicants: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'open' | 'review' | 'closed';
}

const INITIAL_CHALLENGES: AdminChallenge[] = [
  { id: 'ch1', company: 'Uzum Bank', companyLogo: '🏦', industry: 'FinTech', title: 'AI-скоринг для МСБ', problem: 'Нужно AI-решение для скоринга МСБ без кредитной истории.', reward: 'Pilot $50,000', rewardType: 'pilot', deadline: '2026-08-01', daysLeft: 35, tags: ['ai', 'fintech', 'ml'], applicants: 7, difficulty: 'hard', status: 'open' },
  { id: 'ch2', company: 'Astana Hub', companyLogo: '🌐', industry: 'GovTech', title: 'Мониторинг IT-студентов', problem: 'Единая система отслеживания прогресса студентов Tech Orda.', reward: 'Грант $30,000 + контракт', rewardType: 'grant', deadline: '2026-07-20', daysLeft: 23, tags: ['edtech', 'b2g', 'saas'], applicants: 12, difficulty: 'medium', status: 'open' },
  { id: 'ch3', company: 'Kazmunaigas', companyLogo: '⛽', industry: 'Industrial IoT', title: 'Предиктивное обслуживание', problem: 'IoT + ML для предсказания поломок нефтяного оборудования.', reward: 'Пилот 6 мес + $500K/год', rewardType: 'pilot', deadline: '2026-09-15', daysLeft: 80, tags: ['iot', 'ml', 'energy'], applicants: 4, difficulty: 'hard', status: 'open' },
  { id: 'ch4', company: 'OZON KZ', companyLogo: '🛒', industry: 'Logistics', title: 'Оптимизация последней мили', problem: 'Агрегация грузов и оптимизация маршрутов в малых городах.', reward: '$20,000 + интеграция OZON', rewardType: 'grant', deadline: '2026-07-31', daysLeft: 34, tags: ['logistics', 'optimization'], applicants: 9, difficulty: 'medium', status: 'review' },
  { id: 'ch5', company: 'MoH UZ', companyLogo: '🏥', industry: 'HealthTech', title: 'Телемедицина для регионов', problem: 'Платформа телемедицины с оффлайн-режимом для отдалённых районов.', reward: 'Госконтракт + $100,000', rewardType: 'investment', deadline: '2026-10-01', daysLeft: 96, tags: ['healthtech', 'b2g', 'rural'], applicants: 15, difficulty: 'hard', status: 'closed' },
];

const REWARD_COLORS: Record<string, string> = { pilot: '#A1A1AA', grant: '#D4D4D8', investment: '#9333EA' };
const STATUS_COLORS: Record<string, string> = { open: '#D4D4D8', review: '#71717A', closed: '#52525B' };
const STATUS_LABELS: Record<string, string> = { open: 'Открыт', review: 'На рассмотрении', closed: 'Закрыт' };

type FormState = {
  company: string; companyLogo: string; industry: string; title: string;
  problem: string; reward: string; rewardType: 'grant' | 'pilot' | 'investment';
  deadline: string; tags: string; difficulty: 'easy' | 'medium' | 'hard';
};

const EMPTY_FORM: FormState = { company: '', companyLogo: '🏢', industry: '', title: '', problem: '', reward: '', rewardType: 'grant', deadline: '', tags: '', difficulty: 'medium' };

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState(INITIAL_CHALLENGES);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (ch: AdminChallenge) => {
    setForm({
      company: ch.company, companyLogo: ch.companyLogo, industry: ch.industry,
      title: ch.title, problem: ch.problem, reward: ch.reward,
      rewardType: ch.rewardType as 'grant' | 'pilot' | 'investment',
      deadline: ch.deadline, tags: ch.tags.join(', '),
      difficulty: ch.difficulty as 'easy' | 'medium' | 'hard',
    });
    setEditId(ch.id); setShowForm(true);
  };

  const save = () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const deadline = form.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const daysLeft = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));

    if (editId) {
      setChallenges(prev => prev.map(ch => ch.id === editId ? { ...ch, ...form, tags, deadline, daysLeft } : ch));
    } else {
      const newCh: AdminChallenge = { id: `ch_${Date.now()}`, ...form, tags, deadline, daysLeft, applicants: 0, status: 'open' };
      setChallenges(prev => [newCh, ...prev]);
    }
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id !== id) return ch;
      const next: AdminChallenge['status'][] = ['open', 'review', 'closed'];
      const i = next.indexOf(ch.status);
      return { ...ch, status: next[(i + 1) % next.length] };
    }));
  };

  const deleteChallenge = (id: string) => {
    setChallenges(prev => prev.filter(ch => ch.id !== id));
    setDeletingId(null);
  };

  const viewing = challenges.find(ch => ch.id === viewingId);

  const stats = {
    total: challenges.length,
    open: challenges.filter(c => c.status === 'open').length,
    applications: challenges.reduce((s, c) => s + c.applicants, 0),
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#52525B,#71717A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>Управление задачами</h1>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Создавайте и управляйте Corporate Challenges от партнёров</p>
        </div>
        <button onClick={openCreate} style={{ padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(82,82,91,0.2), rgba(113,113,122,0.2))', border: '1px solid rgba(82,82,91,0.3)', color: '#52525B', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Space Grotesk', transition: 'var(--transition-standard)' }}>
          <Plus size={16} />Добавить задачу
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Всего задач', value: stats.total, color: '#9333EA' },
          { label: 'Открытых', value: stats.open, color: '#D4D4D8' },
          { label: 'Всего заявок', value: stats.applications, color: '#71717A' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '16px', borderRadius: 12, background: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 80px 120px', gap: 0, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Задача', 'Компания', 'Вознаграждение', 'Заявки', 'Дней', 'Статус / Действия'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {challenges.map((ch, i) => (
          <div key={ch.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 80px 120px', gap: 0, padding: '14px 16px', borderBottom: i < challenges.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 160ms var(--ease-out)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{ch.title}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{ch.industry}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{ch.companyLogo}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{ch.company}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, background: `${REWARD_COLORS[ch.rewardType]}15`, border: `1px solid ${REWARD_COLORS[ch.rewardType]}30`, color: REWARD_COLORS[ch.rewardType] }}>
                {ch.rewardType}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
              <Users size={12} color="#64748b" />{ch.applicants}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: ch.daysLeft <= 30 ? '#52525B' : '#64748b' }}>
              {ch.daysLeft}д
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => toggleStatus(ch.id)} style={{ padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: `${STATUS_COLORS[ch.status]}15`, border: `1px solid ${STATUS_COLORS[ch.status]}30`, color: STATUS_COLORS[ch.status], fontFamily: 'Inter' }}>
                {STATUS_LABELS[ch.status]}
              </button>
              <button onClick={() => setViewingId(ch.id)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <Eye size={12} />
              </button>
              <button onClick={() => openEdit(ch)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(161,161,170,0.1)', border: '1px solid rgba(161,161,170,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA' }}>
                <Edit3 size={12} />
              </button>
              <button onClick={() => setDeletingId(ch.id)} style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(82,82,91,0.1)', border: '1px solid rgba(82,82,91,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525B' }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 560, borderRadius: 20, background: 'rgba(10,10,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700 }}>{editId ? 'Редактировать задачу' : 'Создать задачу'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Компания</label>
                  <input className="input-field" style={{ width: '100%' }} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Uzum Bank" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Логотип (emoji)</label>
                  <input className="input-field" style={{ width: '100%' }} value={form.companyLogo} onChange={e => setForm(p => ({ ...p, companyLogo: e.target.value }))} placeholder="🏦" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Индустрия</label>
                <input className="input-field" style={{ width: '100%' }} value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} placeholder="FinTech / Banking" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Заголовок задачи</label>
                <input className="input-field" style={{ width: '100%' }} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="AI-скоринг для МСБ" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Описание проблемы</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: 100, resize: 'vertical' }} value={form.problem} onChange={e => setForm(p => ({ ...p, problem: e.target.value }))} placeholder="Детальное описание проблемы и контекст..." />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Вознаграждение</label>
                <input className="input-field" style={{ width: '100%' }} value={form.reward} onChange={e => setForm(p => ({ ...p, reward: e.target.value }))} placeholder="Pilot-контракт $50,000" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Тип награды</label>
                  <select className="input-field" style={{ width: '100%' }} value={form.rewardType} onChange={e => setForm(p => ({ ...p, rewardType: e.target.value as typeof form.rewardType }))}>
                    <option value="pilot">Pilot</option>
                    <option value="grant">Grant</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Сложность</label>
                  <select className="input-field" style={{ width: '100%' }} value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as typeof form.difficulty }))}>
                    <option value="easy">Лёгкий</option>
                    <option value="medium">Средний</option>
                    <option value="hard">Сложный</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Дедлайн</label>
                  <input type="date" className="input-field" style={{ width: '100%' }} value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 5 }}>Теги (через запятую)</label>
                <input className="input-field" style={{ width: '100%' }} value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="ai, fintech, ml" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', cursor: 'pointer', fontFamily: 'Inter' }}>
                Отмена
              </button>
              <button onClick={save} disabled={!form.title || !form.company} style={{ flex: 2, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(82,82,91,0.2), rgba(113,113,122,0.2))', border: '1px solid rgba(82,82,91,0.3)', color: '#52525B', fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={14} />{editId ? 'Сохранить изменения' : 'Создать задачу'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: 28, borderRadius: 16, background: 'rgba(10,10,28,0.98)', border: '1px solid rgba(82,82,91,0.3)', maxWidth: 360, width: '90%' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Удалить задачу?</h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>Это действие нельзя отменить. Все заявки будут удалены.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeletingId(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#64748b', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13 }}>Отмена</button>
              <button onClick={() => deleteChallenge(deletingId)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid rgba(82,82,91,0.4)', background: 'rgba(82,82,91,0.15)', color: '#52525B', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: 700 }}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 520, borderRadius: 20, background: 'rgba(10,10,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 32 }}>{viewing.companyLogo}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{viewing.company}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{viewing.industry}</div>
                </div>
              </div>
              <button onClick={() => setViewingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{viewing.title}</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 }}>{viewing.problem}</p>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: `${REWARD_COLORS[viewing.rewardType]}08`, border: `1px solid ${REWARD_COLORS[viewing.rewardType]}20`, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: REWARD_COLORS[viewing.rewardType], fontWeight: 600 }}>Вознаграждение:</div>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{viewing.reward}</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b' }}>
              <span><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{viewing.applicants} заявок</span>
              <span><CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Дедлайн: {new Date(viewing.deadline).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
