'use client';

import { useState } from 'react';
import { Scale, FileText, ChevronDown, ChevronRight, Download, Copy, CheckCircle, BookOpen, AlertCircle, Lightbulb } from 'lucide-react';

const DOC_CATEGORIES = [
  { id: 'corp', label: 'Корпоративные', icon: '🏢' },
  { id: 'invest', label: 'Инвестиционные', icon: '💰' },
  { id: 'hr', label: 'HR / Команда', icon: '👥' },
  { id: 'commercial', label: 'Коммерческие', icon: '🤝' },
];

interface Document {
  id: string;
  title: string;
  category: string;
  description: string;
  format: string;
  jurisdiction: string;
  tags: string[];
  popular: boolean;
}

const DOCUMENTS: Document[] = [
  { id: 'd1', title: 'NDA (Соглашение о неразглашении)', category: 'corp', description: 'Двустороннее соглашение о конфиденциальности для переговоров с партнёрами и инвесторами. Адаптировано под законодательство Казахстана и Узбекистана.', format: 'DOCX / PDF', jurisdiction: 'KZ / UZ', tags: ['nda', 'confidentiality', 'bilateral'], popular: true },
  { id: 'd2', title: 'SAFE Agreement (Simple Agreement for Future Equity)', category: 'invest', description: 'Стандартный SAFE-договор для привлечения seed-инвестиций. Адаптированный вариант Y Combinator SAFE для юрисдикций ЦА.', format: 'DOCX', jurisdiction: 'International', tags: ['safe', 'investment', 'seed'], popular: true },
  { id: 'd3', title: 'Term Sheet (Предварительный инвестиционный договор)', category: 'invest', description: 'Шаблон Term Sheet с ключевыми условиями: оценка, участие, права вето, anti-dilution и liquidation preference.', format: 'DOCX', jurisdiction: 'International', tags: ['term-sheet', 'valuation', 'series-a'], popular: true },
  { id: 'd4', title: 'Трудовой договор для IT-специалиста (UZ)', category: 'hr', description: 'Трудовой договор с техническим специалистом по законодательству Республики Узбекистан с NDA-условиями и IP assignment.', format: 'DOCX', jurisdiction: 'UZ', tags: ['employment', 'it', 'hr'], popular: false },
  { id: 'd5', title: 'Co-founder Agreement (Соглашение ко-фаундеров)', category: 'corp', description: 'Регулирует распределение долей, вестинг, роли и порядок выхода ко-фаундеров. Критически важен на ранних стадиях.', format: 'DOCX', jurisdiction: 'International', tags: ['cofounder', 'equity', 'vesting'], popular: true },
  { id: 'd6', title: 'IP Assignment Agreement', category: 'corp', description: 'Передача прав на интеллектуальную собственность от разработчиков и сотрудников к компании.', format: 'DOCX', jurisdiction: 'International', tags: ['ip', 'copyright', 'assignment'], popular: false },
  { id: 'd7', title: 'SaaS Customer Agreement', category: 'commercial', description: 'Стандартный договор на использование SaaS-продукта: условия использования, SLA, ответственность, данные.', format: 'DOCX', jurisdiction: 'International', tags: ['saas', 'customer', 'b2b'], popular: false },
  { id: 'd8', title: 'Advisor Agreement + Vesting', category: 'invest', description: 'Договор с советником (advisor): роль, компенсация в виде equity/SAFENote + cliff + vesting schedule.', format: 'DOCX', jurisdiction: 'International', tags: ['advisor', 'equity', 'vesting'], popular: false },
  { id: 'd9', title: 'Contractor Agreement (Договор подряда)', category: 'hr', description: 'Договор с фрилансером или подрядчиком: deliverables, оплата, IP assignment, конфиденциальность.', format: 'DOCX', jurisdiction: 'KZ / UZ', tags: ['contractor', 'freelance', 'ip'], popular: false },
  { id: 'd10', title: 'Shareholder Agreement', category: 'invest', description: 'Соглашение акционеров: защита прав миноритариев, механизмы drag-along, tag-along, right of first refusal.', format: 'DOCX', jurisdiction: 'International', tags: ['shareholders', 'rights', 'governance'], popular: true },
];

interface Checklist {
  id: string;
  title: string;
  emoji: string;
  category: string;
  steps: { text: string; detail?: string }[];
}

const CHECKLISTS: Checklist[] = [
  {
    id: 'c1', emoji: '🏢', title: 'Регистрация ТОО в Казахстане', category: 'corp',
    steps: [
      { text: 'Выберите наименование компании (проверка уникальности на egov.kz)', detail: 'Используйте портал egov.kz → Бизнес → Регистрация ЮЛ' },
      { text: 'Подготовьте учредительные документы (Устав)', detail: 'Минимальный уставной капитал для ТОО — 0 тенге (с 2021 года)' },
      { text: 'Зарегистрируйтесь через eGov (3-5 рабочих дней)' },
      { text: 'Откройте расчётный счёт в банке', detail: 'Kaspi Business, Halyk Bank, или Jusan — самые быстрые для стартапов' },
      { text: 'Зарегистрируйтесь как налогоплательщик в КГД МФ РК' },
      { text: 'Выберите режим налогообложения (ОУР или упрощёнка)', detail: 'Упрощённый налоговый режим: 3% от дохода, отчётность раз в полгода' },
      { text: 'Получите ЭЦП (электронная цифровая подпись)' },
      { text: 'Опционально: подайте заявку на резидентство Astana Hub (0% налогов)' },
    ],
  },
  {
    id: 'c2', emoji: '🇺🇿', title: 'Регистрация ООО в Узбекистане', category: 'corp',
    steps: [
      { text: 'Проверьте название на сайте mybusiness.uz' },
      { text: 'Подготовьте Устав и решение учредителей' },
      { text: 'Оплатите государственную пошлину (0.5 МЗП)' },
      { text: 'Зарегистрируйтесь через my.gov.uz (1-3 дня)' },
      { text: 'Встаньте на учёт в налоговых органах, получите ИНН' },
      { text: 'Откройте счёт в банке (Orient Finance, Kapitalbank — популярные для IT)' },
      { text: 'Рассмотрите регистрацию в IT Park Uzbekistan (0% налог)' },
      { text: 'Оформите сотрудников по трудовым договорам' },
    ],
  },
  {
    id: 'c3', emoji: '💡', title: 'Стать резидентом IT Park Uzbekistan', category: 'invest',
    steps: [
      { text: 'Убедитесь, что деятельность соответствует IT (разработка ПО, IT-сервисы, экспорт)' },
      { text: 'Зарегистрируйтесь на портале my.gov.uz и подайте заявку в IT Park' },
      { text: 'Пройдите оценку проекта (online-форма + pitch если нужен грант)' },
      { text: 'Получите свидетельство резидента (2-4 недели)' },
      { text: 'Льготы: 0% налог на прибыль, 0% НДС, льготные страховые взносы', detail: '1% от зарплаты вместо 25.5%' },
      { text: 'Ежегодно подтверждайте соответствие критериям резидентства' },
    ],
  },
  {
    id: 'c4', emoji: '💰', title: 'Подготовка к привлечению первых инвестиций', category: 'invest',
    steps: [
      { text: 'Приведите в порядок cap table (таблицу капитализации)' },
      { text: 'Оформите IP assignment от всех ко-фаундеров и ключевых разработчиков' },
      { text: 'Подпишите Co-founder Agreement с вестингом (4-year / 1-year cliff)' },
      { text: 'Создайте Data Room (pitch deck, финмодель, метрики, юридические документы)' },
      { text: 'Проверьте отсутствие налоговых задолженностей' },
      { text: 'Выберите инструмент инвестирования (SAFE, конвертируемый займ, доля)', detail: 'SAFE — наиболее стандартный и быстрый инструмент для seed' },
      { text: 'Проконсультируйтесь с юристом по ЦА венчурному праву', detail: 'UNTITLED рекомендует: Nexum Legal, Aequitas Legal (KZ)' },
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'Нужен ли мне юрист для регистрации компании?', a: 'Для простой регистрации ТОО/ООО юрист не обязателен — используйте наши чек-листы и порталы egov.kz / my.gov.uz. Юрист рекомендуется при создании Co-founder Agreement, оформлении инвестиций и IP-защите.' },
  { q: 'Какую юрисдикцию выбрать для стартапа (KZ, UZ или Delaware)?', a: 'Для локального рынка: ТОО (KZ) или ООО (UZ). Для привлечения зарубежных инвесторов — Delaware C-Corp (США) + subsidiary в ЦА. Большинство зарубежных VC требуют Delaware или Cayman Islands holding.' },
  { q: 'Что такое SAFE и как это работает?', a: 'SAFE (Simple Agreement for Future Equity) — это инструмент, при котором инвестор даёт деньги сейчас, а конвертирует их в акции на следующем раунде с дисконтом. Проще и быстрее прямой продажи доли, не требует оценки компании.' },
  { q: 'Что такое вестинг и почему он важен?', a: 'Вестинг — это механизм, при котором ко-фаундеры "зарабатывают" свои акции со временем (обычно 4 года с 1-летним cliff). Защищает компанию от ситуации, когда ко-фаундер уходит через 3 месяца с 30% доли.' },
  { q: 'Нужно ли оформлять IP Assignment?', a: 'Обязательно! IP Assignment гарантирует, что вся интеллектуальная собственность (код, дизайн, брэнд) принадлежит компании, а не физическим лицам. Это критически важно для due diligence инвесторов.' },
];

export default function LegalToolkitPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>('c1');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Set<number>>>({});

  const filteredDocs = DOCUMENTS.filter(d => activeCategory === 'all' || d.category === activeCategory);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStep = (checklistId: string, stepIndex: number) => {
    setCheckedSteps(prev => {
      const set = new Set(prev[checklistId] || []);
      if (set.has(stepIndex)) set.delete(stepIndex);
      else set.add(stepIndex);
      return { ...prev, [checklistId]: set };
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#A1A1AA,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={16} color="white" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>Legal Toolkit</h1>
          <span className="badge badge-blue">Центральная Азия</span>
        </div>
        <p style={{ color: '#64748b', fontSize: 13 }}>Юридические шаблоны, чек-листы и ответы на вопросы — всё для запуска и роста стартапа</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Шаблонов', value: DOCUMENTS.length, color: '#A1A1AA' },
          { label: 'Чек-листов', value: CHECKLISTS.length, color: '#9333EA' },
          { label: 'Юрисдикций', value: 3, color: '#D4D4D8' },
          { label: 'FAQ вопросов', value: FAQ_ITEMS.length, color: '#71717A' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Documents */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FileText size={16} color="#A1A1AA" />
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Шаблоны документов</h2>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {[{ id: 'all', label: 'Все' }, ...DOC_CATEGORIES].map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: activeCategory === cat.id ? 'rgba(161,161,170,0.15)' : 'rgba(255,255,255,0.04)',
                  border: activeCategory === cat.id ? '1px solid rgba(161,161,170,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: activeCategory === cat.id ? '#A1A1AA' : '#64748b', fontFamily: 'Inter',
                }}>
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredDocs.map(doc => (
              <div key={doc.id} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(13,13,32,0.8)', border: '1px solid rgba(255,255,255,0.06)', transition: 'var(--transition-standard)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(161,161,170,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{doc.title}</span>
                      {doc.popular && <span className="badge badge-purple" style={{ fontSize: 9 }}>Popular</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 8 }}>{doc.description}</p>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#334155' }}>
                      <span>📄 {doc.format}</span>
                      <span>🌍 {doc.jurisdiction}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleCopy(doc.id)} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedId === doc.id ? '#D4D4D8' : '#64748b' }}>
                      {copiedId === doc.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                    </button>
                    <button style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(161,161,170,0.1)', border: '1px solid rgba(161,161,170,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA' }}>
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Checklists + FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Checklists */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <CheckCircle size={16} color="#D4D4D8" />
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Чек-листы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHECKLISTS.map(cl => {
                const steps = checkedSteps[cl.id] || new Set();
                const progress = Math.round((steps.size / cl.steps.length) * 100);
                const isExpanded = expandedChecklist === cl.id;

                return (
                  <div key={cl.id} style={{ borderRadius: 12, background: 'rgba(13,13,32,0.8)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedChecklist(isExpanded ? null : cl.id)}
                      style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Inter' }}>
                      <span style={{ fontSize: 18 }}>{cl.emoji}</span>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>{cl.title}</span>
                      <span style={{ fontSize: 11, color: progress === 100 ? '#D4D4D8' : '#64748b', fontWeight: 700 }}>{progress}%</span>
                      {isExpanded ? <ChevronDown size={14} color="#64748b" /> : <ChevronRight size={14} color="#64748b" />}
                    </button>

                    {/* Progress bar */}
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }}>
                      <div style={{ height: '100%', background: progress === 100 ? '#D4D4D8' : '#9333EA', width: `${progress}%`, transition: 'width 0.3s', borderRadius: 99 }} />
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cl.steps.map((step, i) => (
                          <div key={i} onClick={() => toggleStep(cl.id, i)}
                            style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: '6px 0', alignItems: 'flex-start' }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                              border: `2px solid ${steps.has(i) ? '#D4D4D8' : 'rgba(255,255,255,0.2)'}`,
                              background: steps.has(i) ? '#D4D4D8' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-standard)',
                            }}>
                              {steps.has(i) && <CheckCircle size={10} color="white" />}
                            </div>
                            <div>
                              <span style={{ fontSize: 12, color: steps.has(i) ? '#475569' : '#94a3b8', textDecoration: steps.has(i) ? 'line-through' : 'none', lineHeight: 1.4 }}>{step.text}</span>
                              {step.detail && <p style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{step.detail}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BookOpen size={16} color="#71717A" />
              <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Часто задаваемые вопросы</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{ borderRadius: 10, background: 'rgba(13,13,32,0.8)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter' }}>
                    <AlertCircle size={12} color="#71717A" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{item.q}</span>
                    {openFaq === i ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 14px 12px 34px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Lightbulb size={12} color="#D4D4D8" style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
