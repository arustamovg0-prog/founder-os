'use client';

import { useState } from 'react';
import { Users, MessageSquare, Briefcase, Code, BarChart3, Megaphone, Star, MapPin, Link, ChevronRight, X } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  avatar: string;
  role: 'CTO' | 'CMO' | 'COO' | 'CPO' | 'CFO' | 'Designer' | 'Sales' | 'AI/ML';
  skills: string[];
  equity: string;
  location: string;
  startupName: string;
  startupStage: string;
  startupIndustry: string;
  startupDescription: string;
  experience: string;
  linkedinUrl: string;
  isOpen: boolean;
  commitment: 'full-time' | 'part-time';
}

const PROFILES: Profile[] = [
  {
    id: 'p1', name: 'Alibek Seitkali', avatar: '👨‍💻', role: 'CTO',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'PostgreSQL', 'System Design'],
    equity: '5–15%', location: 'Алматы, KZ', commitment: 'full-time',
    startupName: 'AgriTech стартап (стелс)', startupStage: 'Idea / Pre-seed',
    startupIndustry: 'AgriTech', startupDescription: 'Платформа для умного управления ирригацией в Центральной Азии с IoT-датчиками. Ищу ко-фаундера с бизнес-экспертизой.',
    experience: '5 лет в разработке, ex-Yandex, tech lead в двух стартапах.',
    linkedinUrl: '#', isOpen: true,
  },
  {
    id: 'p2', name: 'Madina Bekova', avatar: '👩‍💼', role: 'CMO',
    skills: ['Performance Marketing', 'SEO', 'Content', 'Brand Strategy', 'Growth Hacking', 'Analytics'],
    equity: '5–10%', location: 'Ташкент, UZ', commitment: 'full-time',
    startupName: 'EduTech (идея)', startupStage: 'Idea Stage',
    startupIndustry: 'EdTech', startupDescription: 'Хочу строить платформу онлайн-обучения для детей в Центральной Азии. Ищу CTO/разработчика как ко-фаундера.',
    experience: '6 лет в маркетинге. Вырастила 3 продукта с 0 до 100K+ пользователей.',
    linkedinUrl: '#', isOpen: true,
  },
  {
    id: 'p3', name: 'Rustam Yusupov', avatar: '👨‍💼', role: 'COO',
    skills: ['Operations', 'Fundraising', 'Business Development', 'Strategy', 'P&L'],
    equity: '7–12%', location: 'Астана, KZ', commitment: 'full-time',
    startupName: 'FinTech стартап', startupStage: 'MVP',
    startupIndustry: 'FinTech', startupDescription: 'Работаю в небольшом FinTech, который строит BNPL для МСБ. Ищем операционного директора для масштабирования.',
    experience: 'MBA, 4 года в McKinsey, 2 года в стартапах. Поднимал два раунда.',
    linkedinUrl: '#', isOpen: true,
  },
  {
    id: 'p4', name: 'Dilnoza Rahimova', avatar: '👩‍🎨', role: 'Designer',
    skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Motion Design'],
    equity: '3–8%', location: 'Ташкент, UZ', commitment: 'part-time',
    startupName: 'Свободный агент', startupStage: 'Любая',
    startupIndustry: 'Любая', startupDescription: 'Product Designer с фокусом на финтех и e-commerce. Готова работать part-time за equity. Хочу присоединиться к амбициозному стартапу на ранней стадии.',
    experience: '4 года дизайна, работала с Uzum Market, Payme, несколькими стартапами.',
    linkedinUrl: '#', isOpen: true,
  },
  {
    id: 'p5', name: 'Amir Khasanov', avatar: '🤖', role: 'AI/ML',
    skills: ['Python', 'PyTorch', 'LLMs', 'Computer Vision', 'MLOps', 'Data Engineering'],
    equity: '10–20%', location: 'Бишкек, KG', commitment: 'full-time',
    startupName: 'AI стартап (стелс)', startupStage: 'Pre-seed',
    startupIndustry: 'AI/ML', startupDescription: 'Строю AI-ассистента для автоматизации юридической работы в ЦА. Ищу ко-фаундера с юридической/лegaltech экспертизой.',
    experience: 'PhD в ML, публикации на NeurIPS, 3 года в индустрии (Сбер AI, Hugging Face).',
    linkedinUrl: '#', isOpen: true,
  },
  {
    id: 'p6', name: 'Kamila Dosova', avatar: '💰', role: 'CFO',
    skills: ['Financial Modeling', 'Fundraising', 'Accounting', 'Tax Planning', 'Investor Relations'],
    equity: '5–10%', location: 'Алматы, KZ', commitment: 'part-time',
    startupName: 'Открыта к предложениям', startupStage: 'Seed+',
    startupIndustry: 'FinTech / SaaS', startupDescription: 'CFO-функция для стартапов на part-time. 5 лет в Big4, строила финмодели для 20+ стартапов. Ищу проект с equity-компенсацией.',
    experience: 'ACCA, ex-Deloitte KZ, помогла 3 стартапам закрыть раунды.',
    linkedinUrl: '#', isOpen: true,
  },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  CTO: <Code size={14} />,
  CMO: <Megaphone size={14} />,
  COO: <Briefcase size={14} />,
  CPO: <Star size={14} />,
  CFO: <BarChart3 size={14} />,
  Designer: <Star size={14} />,
  Sales: <MessageSquare size={14} />,
  'AI/ML': <Star size={14} />,
};

const ROLE_COLORS: Record<string, string> = {
  CTO: '#A1A1AA',
  CMO: '#71717A',
  COO: '#D4D4D8',
  CPO: '#8b5cf6',
  CFO: '#3F3F46',
  Designer: '#52525B',
  Sales: '#f97316',
  'AI/ML': '#9333EA',
};

const ALL_ROLES = ['Все', 'CTO', 'CMO', 'COO', 'CPO', 'CFO', 'Designer', 'AI/ML', 'Sales'];

export default function CommunityPage() {
  const [activeRole, setActiveRole] = useState('Все');
  const [activeTab, setActiveTab] = useState<'browse' | 'post'>('browse');
  const [contactId, setContactId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [myPost, setMyPost] = useState({ role: '', skills: '', equity: '', description: '', commitment: 'full-time' });

  const filtered = PROFILES.filter(p => activeRole === 'Все' || p.role === activeRole);

  const connect = (id: string) => {
    setConnectedIds(prev => new Set([...prev, id]));
    setContactId(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#D4D4D8,#A1A1AA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>Co-founder Match</h1>
          <span className="badge badge-green">Community</span>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Найди ко-фаундера или ключевого члена команды внутри экосистемы UNTITLED</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {([['browse', '🔍  Найти'], ['post', '✏️  Разместить объявление']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: activeTab === tab ? 'rgba(212,212,216,0.15)' : 'transparent',
            border: activeTab === tab ? '1px solid rgba(212,212,216,0.3)' : '1px solid transparent',
            color: activeTab === tab ? '#D4D4D8' : '#64748b', fontFamily: 'Inter', transition: 'var(--transition-standard)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Role Filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {ALL_ROLES.map(role => {
              const color = role === 'Все' ? '#D8B4FE' : ROLE_COLORS[role] || '#64748b';
              return (
                <button key={role} onClick={() => setActiveRole(role)} style={{
                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: activeRole === role ? `${color}15` : 'rgba(255,255,255,0.04)',
                  border: activeRole === role ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.08)',
                  color: activeRole === role ? color : '#64748b', fontFamily: 'Inter', transition: 'var(--transition-standard)',
                }}>
                  {role !== 'Все' && ROLE_ICONS[role] && <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 4 }}>{ROLE_ICONS[role]}</span>}
                  {role}
                </button>
              );
            })}
          </div>

          {/* Profile Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(profile => {
              const roleColor = ROLE_COLORS[profile.role] || '#64748b';
              const isConnected = connectedIds.has(profile.id);

              return (
                <div key={profile.id} style={{
                  padding: 20, borderRadius: 16, background: 'rgba(13,13,32,0.8)',
                  border: `1px solid ${isConnected ? 'rgba(212,212,216,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'var(--transition-standard)', position: 'relative',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isConnected ? 'rgba(212,212,216,0.4)' : 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = isConnected ? 'rgba(212,212,216,0.25)' : 'rgba(255,255,255,0.06)'; }}
                >
                  {/* Commitment badge */}
                  <div style={{ position: 'absolute', top: 14, right: 14 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: profile.commitment === 'full-time' ? 'rgba(212,212,216,0.15)' : 'rgba(113,113,122,0.15)', border: `1px solid ${profile.commitment === 'full-time' ? 'rgba(212,212,216,0.3)' : 'rgba(113,113,122,0.3)'}`, color: profile.commitment === 'full-time' ? '#D4D4D8' : '#71717A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {profile.commitment === 'full-time' ? 'Full-time' : 'Part-time'}
                    </span>
                  </div>

                  {/* Profile header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: `${roleColor}15`, border: `1px solid ${roleColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {profile.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{profile.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: roleColor, background: `${roleColor}10`, border: `1px solid ${roleColor}20`, borderRadius: 6, padding: '2px 8px' }}>
                          {ROLE_ICONS[profile.role]}{profile.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Startup info */}
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {profile.startupIndustry} · {profile.startupStage}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{profile.startupName}</div>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{profile.startupDescription}</p>
                  </div>

                  {/* Experience */}
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>{profile.experience}</p>

                  {/* Skills */}
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {profile.skills.slice(0, 4).map(skill => (
                      <span key={skill} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontWeight: 600 }}>
                        {skill}
                      </span>
                    ))}
                    {profile.skills.length > 4 && (
                      <span style={{ fontSize: 10, color: '#334155' }}>+{profile.skills.length - 4}</span>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: '#475569' }}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{profile.location}
                      <span style={{ marginLeft: 10, fontWeight: 700, color: '#D4D4D8' }}>Equity: {profile.equity}</span>
                    </div>

                    {isConnected ? (
                      <span style={{ fontSize: 12, color: '#D4D4D8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>✅ Запрос отправлен</span>
                    ) : (
                      <button onClick={() => setContactId(profile.id)} style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: `${roleColor}15`, border: `1px solid ${roleColor}30`, color: roleColor,
                        display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', transition: 'var(--transition-standard)',
                      }}>
                        <MessageSquare size={12} />Связаться
                      </button>
                    )}
                  </div>

                  {/* Contact modal */}
                  {contactId === profile.id && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: 'rgba(5,5,16,0.97)', padding: 20, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Написать {profile.name}</span>
                        <button onClick={() => setContactId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
                      </div>
                      <textarea
                        placeholder={`Привет, ${profile.name.split(' ')[0]}! Меня зовут [имя]. Мы строим [стартап] и ищем ${profile.role}...`}
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontSize: 13, fontFamily: 'Inter', outline: 'none', resize: 'none', minHeight: 100 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => connect(profile.id)} style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: `${roleColor}20`, border: `1px solid ${roleColor}40`, color: roleColor, fontFamily: 'Inter' }}>
                          <ChevronRight size={12} style={{ display: 'inline', marginRight: 4 }} />Отправить запрос
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Post form */
        <div style={{ maxWidth: 600 }}>
          <div style={{ padding: 24, borderRadius: 16, background: 'rgba(13,13,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, fontFamily: 'Space Grotesk' }}>Разместить объявление</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Расскажи о себе и о том, кого ты ищешь</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Какую роль ты ищешь?</label>
                <select value={myPost.role} onChange={e => setMyPost(p => ({ ...p, role: e.target.value }))}
                  className="input-field" style={{ width: '100%' }}>
                  <option value="">Выберите роль</option>
                  {ALL_ROLES.filter(r => r !== 'Все').map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Ключевые навыки (через запятую)</label>
                <input className="input-field" style={{ width: '100%' }} placeholder="React, Node.js, Python..." value={myPost.skills} onChange={e => setMyPost(p => ({ ...p, skills: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Предлагаемый Equity</label>
                <input className="input-field" style={{ width: '100%' }} placeholder="5–15%" value={myPost.equity} onChange={e => setMyPost(p => ({ ...p, equity: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Расскажи о своём стартапе и о том, кого ищешь</label>
                <textarea className="input-field" style={{ width: '100%', minHeight: 120, resize: 'vertical' }} placeholder="Мы строим [X] для [аудитории]. Ищем [роль] с опытом в [область]..." value={myPost.description} onChange={e => setMyPost(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button style={{ padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(212,212,216,0.2), rgba(161,161,170,0.2))', border: '1px solid rgba(212,212,216,0.3)', color: '#D4D4D8', fontFamily: 'Space Grotesk', transition: 'var(--transition-standard)' }}>
                <Link size={14} style={{ display: 'inline', marginRight: 8 }} />Опубликовать объявление
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
