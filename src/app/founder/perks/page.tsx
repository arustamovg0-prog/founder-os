'use client';

import { useState } from 'react';
import { Gift, ExternalLink, Zap, Shield, BarChart3, Cloud, Scale, Users, Star, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const CATEGORIES = [
  { id: 'all', label: 'Все перки', icon: '✨' },
  { id: 'saas', label: 'SaaS Tools', icon: '⚙️' },
  { id: 'cloud', label: 'Cloud & Infra', icon: '☁️' },
  { id: 'legal', label: 'Legal & Finance', icon: '⚖️' },
  { id: 'marketing', label: 'Marketing', icon: '📣' },
  { id: 'hr', label: 'HR & Talent', icon: '👥' },
];

interface Perk {
  id: string;
  company: string;
  logo: string;
  tagline: string;
  description: string;
  discount: string;
  value: string;
  category: string;
  usedBy: number;
  link: string;
  featured: boolean;
  tags: string[];
}

const PERKS: Perk[] = [
  {
    id: 'p1', company: 'Notion', logo: '📓', tagline: 'All-in-one workspace',
    description: 'Бесплатный Notion Plus на 6 месяцев для всей команды. Документы, базы данных, планирование.',
    discount: '6 мес бесплатно', value: '$96', category: 'saas', usedBy: 18, link: '#', featured: true,
    tags: ['productivity', 'docs', 'team'],
  },
  {
    id: 'p2', company: 'AWS Activate', logo: '☁️', tagline: 'Cloud Credits for Startups',
    description: 'До $100,000 кредитов AWS для резидентов UNTITLED. Покрывает EC2, RDS, S3 и другие сервисы.',
    discount: 'до $100K кредитов', value: '$100,000', category: 'cloud', usedBy: 12, link: '#', featured: true,
    tags: ['cloud', 'infrastructure', 'hosting'],
  },
  {
    id: 'p3', company: 'Stripe', logo: '💳', tagline: 'Global Payments Infrastructure',
    description: 'Нулевая комиссия на первые $50K транзакций + приоритетный онбординг для стартапов ЦА.',
    discount: 'Комиссия 0% на $50K', value: '$1,500', category: 'saas', usedBy: 9, link: '#', featured: false,
    tags: ['payments', 'fintech', 'b2b'],
  },
  {
    id: 'p4', company: 'Figma', logo: '🎨', tagline: 'Collaborative Design Tool',
    description: 'Figma Professional бесплатно на 1 год. Безлимитные проекты и редакторы.',
    discount: '12 мес бесплатно', value: '$180', category: 'saas', usedBy: 22, link: '#', featured: false,
    tags: ['design', 'ui', 'collaboration'],
  },
  {
    id: 'p5', company: 'Vercel', logo: '▲', tagline: 'Frontend Cloud Platform',
    description: 'Vercel Pro на 12 месяцев для деплоя ваших Next.js и React приложений.',
    discount: '12 мес Pro', value: '$240', category: 'cloud', usedBy: 14, link: '#', featured: false,
    tags: ['hosting', 'frontend', 'nextjs'],
  },
  {
    id: 'p6', company: 'PandaDoc', logo: '📄', tagline: 'Document Automation',
    description: 'Автоматизация контрактов, NDA и Term Sheet. 50% скидка на Business план навсегда.',
    discount: '50% навсегда', value: '$600/год', category: 'legal', usedBy: 7, link: '#', featured: false,
    tags: ['legal', 'contracts', 'automation'],
  },
  {
    id: 'p7', company: 'HubSpot', logo: '🔶', tagline: 'CRM & Marketing Platform',
    description: 'HubSpot Starter CRM бесплатно на 1 год + $500 дополнительных кредитов на рекламу.',
    discount: '1 год бесплатно', value: '$1,200', category: 'marketing', usedBy: 11, link: '#', featured: true,
    tags: ['crm', 'marketing', 'sales'],
  },
  {
    id: 'p8', company: 'Linear', logo: '🔷', tagline: 'Issue Tracking for Modern Teams',
    description: 'Linear Plus на 12 месяцев. Лучший инструмент для управления задачами и спринтами.',
    discount: '12 мес Plus', value: '$480', category: 'saas', usedBy: 16, link: '#', featured: false,
    tags: ['project-management', 'engineering', 'agile'],
  },
  {
    id: 'p9', company: 'Deel', logo: '🌍', tagline: 'Global Payroll & HR',
    description: '3 месяца без комиссий при найме первых 5 международных сотрудников или подрядчиков.',
    discount: '3 мес без комиссий', value: '$750', category: 'hr', usedBy: 5, link: '#', featured: false,
    tags: ['hr', 'payroll', 'remote', 'hiring'],
  },
  {
    id: 'p10', company: 'Legalpad', logo: '⚖️', tagline: 'US Visas for Founders',
    description: '$500 скидка на консультации по O-1 и EB-1 визам для фаундеров, планирующих экспансию в США.',
    discount: '$500 скидка', value: '$500', category: 'legal', usedBy: 3, link: '#', featured: false,
    tags: ['legal', 'visa', 'usa', 'expansion'],
  },
  {
    id: 'p11', company: 'Google Workspace', logo: '🔵', tagline: 'Business Email & Collaboration',
    description: 'Google Workspace Business Standard бесплатно на 12 месяцев для до 10 пользователей.',
    discount: '12 мес бесплатно', value: '$1,440', category: 'saas', usedBy: 19, link: '#', featured: false,
    tags: ['email', 'collaboration', 'google'],
  },
  {
    id: 'p12', company: 'Brevo (Sendinblue)', logo: '📧', tagline: 'Email & SMS Marketing',
    description: 'Brevo Business на 6 месяцев бесплатно. Email-кампании, автоматизация и CRM-лайт.',
    discount: '6 мес Business', value: '$360', category: 'marketing', usedBy: 8, link: '#', featured: false,
    tags: ['email-marketing', 'automation', 'crm'],
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  saas: <Zap size={14} />,
  cloud: <Cloud size={14} />,
  legal: <Scale size={14} />,
  marketing: <BarChart3 size={14} />,
  hr: <Users size={14} />,
  security: <Shield size={14} />,
};

export default function PerksPage() {
  const t = useTranslations('FounderPerks');
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const filtered = PERKS.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const desc = t(`items.${p.id}.description` as any);
    const matchSearch = !search || p.company.toLowerCase().includes(search.toLowerCase()) || desc.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featured = filtered.filter(p => p.featured);
  const regular = filtered.filter(p => !p.featured);
  const totalValue = PERKS.reduce((sum, p) => {
    const num = parseInt(p.value.replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const claim = (id: string) => {
    setClaimed(prev => new Set([...prev, id]));
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#71717A,#52525B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={16} color="white" />
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{t('title')}</h1>
              <span className="badge badge-green">{t('exclusive')}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 13 }}>{t('subtitle')}</p>
          </div>
          <div style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#71717A', fontFamily: 'Space Grotesk' }}>
              ${(totalValue).toLocaleString()}+
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t('totalValue')}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="input-field"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 480 }}
        />
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'var(--transition-standard)', fontFamily: 'Inter',
              background: activeCategory === cat.id ? 'rgba(113,113,122,0.15)' : 'rgba(255,255,255,0.04)',
              border: activeCategory === cat.id ? '1px solid rgba(113,113,122,0.4)' : '1px solid rgba(255,255,255,0.08)',
              color: activeCategory === cat.id ? '#71717A' : '#64748b',
            }}
          >
            {cat.icon} {t(`categories.${cat.id}` as any)}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Star size={14} color="#71717A" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('featuredTitle')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {featured.map(perk => (
              <PerkCard key={perk.id} perk={perk} claimed={claimed.has(perk.id)} onClaim={claim} featured />
            ))}
          </div>
        </div>
      )}

      {/* All perks */}
      {regular.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t('allTitle', { count: regular.length })}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {regular.map(perk => (
              <PerkCard key={perk.id} perk={perk} claimed={claimed.has(perk.id)} onClaim={claim} featured={false} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
          <Gift size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>{t('notFound')}</p>
        </div>
      )}
    </div>
  );
}

function PerkCard({ perk, claimed, onClaim, featured }: { perk: Perk; claimed: boolean; onClaim: (id: string) => void; featured: boolean }) {
  const t = useTranslations('FounderPerks');
  return (
    <div
      style={{
        padding: 20, borderRadius: 16,
        background: featured ? 'rgba(113,113,122,0.06)' : 'rgba(13,13,32,0.8)',
        border: `1px solid ${featured ? 'rgba(113,113,122,0.2)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'var(--transition-standard)', cursor: 'default',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = featured ? 'rgba(113,113,122,0.4)' : 'rgba(255,255,255,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = featured ? 'rgba(113,113,122,0.2)' : 'rgba(255,255,255,0.06)'; }}
    >
      {featured && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <Star size={12} color="#71717A" fill="#71717A" />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {perk.logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Space Grotesk', marginBottom: 2 }}>{perk.company}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{perk.tagline}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>{t(`items.${perk.id}.description` as any)}</p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {perk.tags.slice(0, 3).map(tag => (
          <span key={tag} style={{
            padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4D4D8' }}>{t(`items.${perk.id}.discount` as any)}</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{t('card.value')} {perk.value} · {t('card.usedBy', { count: perk.usedBy })}</div>
        </div>
        <button
          onClick={() => onClaim(perk.id)}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', transition: 'var(--transition-standard)',
            background: claimed ? 'rgba(212,212,216,0.15)' : 'rgba(113,113,122,0.15)',
            border: `1px solid ${claimed ? 'rgba(212,212,216,0.3)' : 'rgba(113,113,122,0.3)'}`,
            color: claimed ? '#D4D4D8' : '#71717A',
          }}
        >
          {claimed ? <><CheckCircle size={12} /> {t('card.claimed')}</> : <><ExternalLink size={12} /> {t('card.claim')}</>}
        </button>
      </div>
    </div>
  );
}
