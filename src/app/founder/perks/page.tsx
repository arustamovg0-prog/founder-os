'use client';

import { useState } from 'react';
import { Gift, ExternalLink, Zap, Shield, BarChart3, Cloud, Scale, Users, Star, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'Все перки' },
  { id: 'saas', label: 'SaaS Tools' },
  { id: 'cloud', label: 'Cloud & Infra' },
  { id: 'legal', label: 'Legal & Finance' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'hr', label: 'HR & Talent' },
];

interface Perk {
  id: string;
  company: string;

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
    id: 'p1', company: 'Notion', tagline: 'All-in-one workspace',
    description: 'Бесплатный Notion Plus на 6 месяцев для всей команды. Документы, базы данных, планирование.',
    discount: '6 мес бесплатно', value: '$96', category: 'saas', usedBy: 18, link: '#', featured: true,
    tags: ['productivity', 'docs', 'team'],
  },
  {
    id: 'p2', company: 'AWS Activate', tagline: 'Cloud Credits for Startups',
    description: 'До $100,000 кредитов AWS для резидентов UNTITLED. Покрывает EC2, RDS, S3 и другие сервисы.',
    discount: 'до $100K кредитов', value: '$100,000', category: 'cloud', usedBy: 12, link: '#', featured: true,
    tags: ['cloud', 'infrastructure', 'hosting'],
  },
  {
    id: 'p3', company: 'Stripe', tagline: 'Global Payments Infrastructure',
    description: 'Нулевая комиссия на первые $50K транзакций + приоритетный онбординг для стартапов ЦА.',
    discount: 'Комиссия 0% на $50K', value: '$1,500', category: 'saas', usedBy: 9, link: '#', featured: false,
    tags: ['payments', 'fintech', 'b2b'],
  },
  {
    id: 'p4', company: 'Figma', tagline: 'Collaborative Design Tool',
    description: 'Figma Professional бесплатно на 1 год. Безлимитные проекты и редакторы.',
    discount: '12 мес бесплатно', value: '$180', category: 'saas', usedBy: 22, link: '#', featured: false,
    tags: ['design', 'ui', 'collaboration'],
  },
  {
    id: 'p5', company: 'Vercel', tagline: 'Frontend Cloud Platform',
    description: 'Vercel Pro на 12 месяцев для деплоя ваших Next.js и React приложений.',
    discount: '12 мес Pro', value: '$240', category: 'cloud', usedBy: 14, link: '#', featured: false,
    tags: ['hosting', 'frontend', 'nextjs'],
  },
  {
    id: 'p6', company: 'PandaDoc', tagline: 'Document Automation',
    description: 'Автоматизация контрактов, NDA и Term Sheet. 50% скидка на Business план навсегда.',
    discount: '50% навсегда', value: '$600/год', category: 'legal', usedBy: 7, link: '#', featured: false,
    tags: ['legal', 'contracts', 'automation'],
  },
  {
    id: 'p7', company: 'HubSpot', tagline: 'CRM & Marketing Platform',
    description: 'HubSpot Starter CRM бесплатно на 1 год + $500 дополнительных кредитов на рекламу.',
    discount: '1 год бесплатно', value: '$1,200', category: 'marketing', usedBy: 11, link: '#', featured: true,
    tags: ['crm', 'marketing', 'sales'],
  },
  {
    id: 'p8', company: 'Linear', tagline: 'Issue Tracking for Modern Teams',
    description: 'Linear Plus на 12 месяцев. Лучший инструмент для управления задачами и спринтами.',
    discount: '12 мес Plus', value: '$480', category: 'saas', usedBy: 16, link: '#', featured: false,
    tags: ['project-management', 'engineering', 'agile'],
  },
  {
    id: 'p9', company: 'Deel', tagline: 'Global Payroll & HR',
    description: '3 месяца без комиссий при найме первых 5 международных сотрудников или подрядчиков.',
    discount: '3 мес без комиссий', value: '$750', category: 'hr', usedBy: 5, link: '#', featured: false,
    tags: ['hr', 'payroll', 'remote', 'hiring'],
  },
  {
    id: 'p10', company: 'Legalpad', tagline: 'US Visas for Founders',
    description: '$500 скидка на консультации по O-1 и EB-1 визам для фаундеров, планирующих экспансию в США.',
    discount: '$500 скидка', value: '$500', category: 'legal', usedBy: 3, link: '#', featured: false,
    tags: ['legal', 'visa', 'usa', 'expansion'],
  },
  {
    id: 'p11', company: 'Google Workspace', tagline: 'Business Email & Collaboration',
    description: 'Google Workspace Business Standard бесплатно на 12 месяцев для до 10 пользователей.',
    discount: '12 мес бесплатно', value: '$1,440', category: 'saas', usedBy: 19, link: '#', featured: false,
    tags: ['email', 'collaboration', 'google'],
  },
  {
    id: 'p12', company: 'Brevo (Sendinblue)', tagline: 'Email & SMS Marketing',
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
      <div className="mb-7">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-500 to-zinc-600 flex items-center justify-center text-white">
                <Gift size={16} color="currentColor" />
              </div>
              <h1 className="font-display font-bold text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
              <span className="badge badge-green">{t('exclusive')}</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-[13px]">{t('subtitle')}</p>
          </div>
          <div className="px-4.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="text-[20px] font-extrabold text-zinc-700 dark:text-zinc-300 font-display">
              ${(totalValue).toLocaleString()}+
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">{t('totalValue')}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          className="input-field w-full max-w-[480px]"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap mb-7">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors font-sans border",
              activeCategory === cat.id 
                ? "bg-zinc-200 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200" 
                : "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            )}
          >
            {t(`categories.${cat.id}` as any)}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
              {t('featuredTitle')}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featured.map(perk => (
              <PerkCard key={perk.id} perk={perk} claimed={claimed.has(perk.id)} onClaim={claim} featured />
            ))}
          </div>
        </div>
      )}

      {/* All perks */}
      {regular.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              {t('allTitle', { count: regular.length })}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {regular.map(perk => (
              <PerkCard key={perk.id} perk={perk} claimed={claimed.has(perk.id)} onClaim={claim} featured={false} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600 dark:text-zinc-400">
          <Gift size={40} className="mx-auto mb-3 opacity-30 block" />
          <p className="text-sm">{t('notFound')}</p>
        </div>
      )}
    </div>
  );
}

function PerkCard({ perk, claimed, onClaim, featured }: { perk: Perk; claimed: boolean; onClaim: (id: string) => void; featured: boolean }) {
  const t = useTranslations('FounderPerks');
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 border",
      featured ? "bg-zinc-100/50 dark:bg-zinc-800/30 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600" : "hover:border-zinc-300 dark:hover:border-zinc-700"
    )}>
      {featured && (
        <div className="absolute top-3 right-3">
          <Star size={12} className="text-zinc-500 dark:text-zinc-400 fill-zinc-500 dark:fill-zinc-400" />
        </div>
      )}

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] font-display mb-0.5 text-zinc-900 dark:text-zinc-100">{perk.company}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{perk.tagline}</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3.5">{t(`items.${perk.id}.description` as any)}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {perk.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <div className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">{t(`items.${perk.id}.discount` as any)}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('card.value')} {perk.value} · {t('card.usedBy', { count: perk.usedBy })}</div>
          </div>
          <button
            onClick={() => onClaim(perk.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 font-sans transition-colors border",
              claimed 
                ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200" 
                : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {claimed ? <><CheckCircle size={12} /> {t('card.claimed')}</> : <><ExternalLink size={12} /> {t('card.claim')}</>}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
