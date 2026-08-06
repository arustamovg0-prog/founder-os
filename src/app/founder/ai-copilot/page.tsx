'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, TrendingUp, FileText, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, isDemoConfig, auth } from '@/lib/firebase';
import { Startup } from '@/types';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Removing hardcoded SUGGESTED, moved to translations

const DEMO_RESPONSES: Record<string, string> = {
  default: `Based on your startup profile, here's my analysis:

**PayFlow UZ — AI Copilot Assessment**

Your current readiness score is **85/100** — excellent position for Series A fundraising.

**Strengths:**
• LTV/CAC ratio of **15x** is exceptional (industry benchmark: 3-5x)
• MRR growth trajectory at $28K shows strong product-market fit
• 18-month runway gives comfortable time to close a round

**Action Items:**
1. **Pitch Deck** — Score 82/100. Strengthen the competitive moat section (currently weakest slide)
2. **Traction Slide** — Add cohort retention analysis to demonstrate stickiness
3. **Market Size** — Expand Central Asia TAM calculation with bottom-up approach

**Investor Readiness:** You're 2-3 improvements away from a 90+ score. I recommend completing the financial model upload first.`,

  metrics: `**Metrics Deep Dive for PayFlow UZ:**

**Revenue Health**
- MRR: $28,000 (+16.7% MoM) — Strong
- ARR Run Rate: $336,000
- Net Revenue Retention: ~97.9% (based on 2.1% churn)

**Growth Efficiency**
- CAC: $320 — Moderate for B2B FinTech
- LTV: $4,800 — Excellent
- LTV/CAC: **15x** — Top decile performance

**Areas of Concern**
- Churn at 2.1% is acceptable but worth monitoring — any uptick above 3% should trigger investigation
- Team size at 12 may need to scale ahead of Series A deployment

**My Recommendation:** Your unit economics are investor-grade. Focus next sprint on increasing MAU from 1,200 to 1,500+ before your pitch meetings.`,

  pitch: `**Pitch Deck Analysis (Score: 82/100)**

Here's a breakdown by section:

| Slide | Score | Notes |
|-------|-------|-------|
| Problem | 88 | Clear, well-quantified |
| Solution | 85 | Strong demo needed |
| Market Size | 79 | TAM needs bottom-up validation |
| Business Model | 90 | Revenue streams are clear |
| Traction | 84 | Add cohort charts |
| Team | 88 | Strong backgrounds |
| Competitive Moat | 65 | Weakest section |
| Financials | 78 | 3-year model needs detail |
| Ask | 82 | Use of funds is clear |

**Priority Fix:** The competitive moat slide needs a defensible answer to "why can't a bank do this?" — consider regulatory relationships, switching costs, or proprietary data assets as your moat narrative.`,
};

function getResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('metric') || lower.includes('mrr') || lower.includes('growth')) return DEMO_RESPONSES.metrics;
  if (lower.includes('pitch') || lower.includes('deck') || lower.includes('slide')) return DEMO_RESPONSES.pitch;
  return DEMO_RESPONSES.default;
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-sans space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
          return <div key={i} className="font-bold text-zinc-900 dark:text-zinc-100">{line.slice(2, -2)}</div>;
        }
        if (line.startsWith('• ')) {
          return <div key={i} className="pl-4 text-zinc-600 dark:text-zinc-400">• {formatInline(line.slice(2))}</div>;
        }
        if (/^\d+\./.test(line)) {
          return <div key={i} className="pl-4 text-zinc-600 dark:text-zinc-400">{formatInline(line)}</div>;
        }
        if (line.startsWith('|')) {
          return null; // skip table lines for simplicity
        }
        if (line.startsWith('**Areas of Concern**') || line.startsWith('**Revenue Health**') || line.startsWith('**Growth Efficiency**')) {
          return <div key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{line}</div>;
        }
        if (line === '') return <div key={i} className="h-1.5" />;
        return <div key={i}>{formatInline(line)}</div>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>
      : part
  );
}

export default function AICopilotPage() {
  const t = useTranslations('FounderAICopilot');
  const suggested = (t.raw('suggested') as { icon: string; text: string }[]) || [];
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('chat.initialMsg'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadStartup() {
      if (profile?.linkedStartupId && !isDemoConfig) {
        try {
          const snap = await getDoc(doc(db, 'startups', profile.linkedStartupId));
          if (snap.exists()) {
            setStartup({ id: snap.id, ...snap.data() } as Startup);
          }
        } catch (e) {
          console.warn('Failed to fetch startup for AI Copilot', e);
        }
      }
    }
    loadStartup();
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          message: msg,
          history: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          startupData: startup
        })
      });
      const data = await res.json();
      
      const reply: Message = {
        role: 'assistant',
        content: data.reply || data.error || t('chat.error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, reply]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: t('chat.connectionError'), timestamp: new Date() }]);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-64px)] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <Brain size={16} />
            </div>
            <h1 className="font-display font-bold text-zinc-900 dark:text-zinc-100">{t('title')}</h1>
            <span className="badge badge-purple"><Sparkles size={10} /> {t('poweredBy')}</span>
          </div>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{t('subtitle')}</p>
        </div>

        {/* Context cards */}
        <div className="flex gap-2.5 items-center">
          {[
            { icon: <TrendingUp size={12} />, label: t('context.aiScore'), value: `${startup?.aiScores?.overallReadinessScore || 0}/100`, colorClass: 'text-zinc-900 dark:text-zinc-100' },
            { icon: <Target size={12} />, label: t('context.stage'), value: startup?.stage || t('context.idea'), colorClass: 'text-zinc-600 dark:text-zinc-400' },
            { icon: <FileText size={12} />, label: t('context.pitchDeck'), value: startup?.dataRoom?.pitchDeckUrl ? t('context.uploaded') : t('context.missing'), colorClass: 'text-zinc-500 dark:text-zinc-500' },
          ].map((c, i) => (
            <div key={i} className="px-3.5 py-2 rounded-xl bg-transparent border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
              <span className={c.colorClass}>{c.icon}</span>
              <div>
                <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{c.label}</div>
                <div className={cn("text-[13px] font-bold", c.colorClass)}>{c.value}</div>
              </div>
            </div>
          ))}

          <button
            onClick={async () => {
              if (!startup) return;
              setLoading(true);
              try {
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/ai/score', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ startupId: startup.id })
                });
                const data = await res.json();
                if (data.scores) {
                  setStartup({ ...startup, aiScores: data.scores });
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: t('assessment.complete', { 
                      score: data.scores.overallReadinessScore, 
                      deck: data.scores.pitchDeck, 
                      market: data.scores.marketFit, 
                      traction: data.scores.traction, 
                      team: data.scores.team 
                    }),
                    timestamp: new Date()
                  }]);
                }
              } catch (e) {
                console.error(e);
              }
              setLoading(false);
            }}
            disabled={loading || !startup}
            className={cn(
              "px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-[13px] transition-colors border",
              loading ? "cursor-wait opacity-70" : "cursor-pointer",
              "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? t('assessment.analyzing') : t('assessment.run')}
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-auto flex flex-col gap-4 p-5 rounded-2xl bg-transparent border border-zinc-200 dark:border-zinc-800 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full shrink-0 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                <Brain size={15} />
              </div>
            )}
            <div className={cn(
              "max-w-[75%] px-4.5 py-3.5 rounded-2xl border",
              msg.role === 'user' 
                ? "rounded-tr-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100" 
                : "rounded-tl-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            )}>
              {msg.role === 'assistant' ? <MarkdownText text={msg.content} /> : (
                <p className="text-sm font-sans">{msg.content}</p>
              )}
              <div className={cn("text-[10px] mt-2 text-right opacity-70", msg.role === 'user' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400')}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full shrink-0 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[13px] font-bold">
                {startup?.founderName?.charAt(0) || profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
              <Brain size={15} />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-1.5 items-center">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: `${delay}s` }} />
                ))}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">{t('chat.analyzing')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mb-3 shrink-0">
          {suggested.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s.text)}
              className="px-3.5 py-2 rounded-full text-xs font-medium bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 font-sans"
            >
              {s.icon} {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2.5 shrink-0">
        <input
          className="input-field flex-1"
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button
          className="btn-primary px-5 shrink-0"
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          <Send size={15} />
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
