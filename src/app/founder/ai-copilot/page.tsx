'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, TrendingUp, FileText, Target, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db, isDemoConfig, auth } from '@/lib/firebase';
import { Startup } from '@/types';
import { useTranslations } from 'next-intl';


interface Message {
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

📈 **Revenue Health**
- MRR: $28,000 (+16.7% MoM) — Strong
- ARR Run Rate: $336,000
- Net Revenue Retention: ~97.9% (based on 2.1% churn)

👥 **Growth Efficiency**
- CAC: $320 — Moderate for B2B FinTech
- LTV: $4,800 — Excellent
- LTV/CAC: **15x** — Top decile performance

⚠️ **Areas of Concern**
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
| Competitive Moat | 65 ⚠️ | Weakest section |
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
    <div style={{ fontSize: 14, lineHeight: 1.7, color: '#e2e8f0' }}>
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
          return <div key={i} style={{ fontWeight: 700, color: '#f8fafc', marginTop: i > 0 ? 12 : 0 }}>{line.slice(2, -2)}</div>;
        }
        if (line.startsWith('• ')) {
          return <div key={i} style={{ paddingLeft: 16, color: '#94a3b8' }}>• {formatInline(line.slice(2))}</div>;
        }
        if (/^\d+\./.test(line)) {
          return <div key={i} style={{ paddingLeft: 16, color: '#94a3b8', marginTop: 4 }}>{formatInline(line)}</div>;
        }
        if (line.startsWith('|')) {
          return null; // skip table lines for simplicity
        }
        if (line.startsWith('⚠️') || line.startsWith('📈') || line.startsWith('👥')) {
          return <div key={i} style={{ fontWeight: 600, color: '#D8B4FE', marginTop: 12, marginBottom: 4 }}>{line}</div>;
        }
        if (line === '') return <div key={i} style={{ height: 6 }} />;
        return <div key={i}>{formatInline(line)}</div>;
      })}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: '#D8B4FE', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
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
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#FFFFFF,#71717A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>{t('title')}</h1>
            <span className="badge badge-purple"><Sparkles size={10} /> {t('poweredBy')}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>{t('subtitle')}</p>
        </div>

        {/* Context cards */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {[
            { icon: <TrendingUp size={12} />, label: t('context.aiScore'), value: `${startup?.aiScores?.overallReadinessScore || 0}/100`, color: '#FFFFFF' },
            { icon: <Target size={12} />, label: t('context.stage'), value: startup?.stage || t('context.idea'), color: '#D4D4D8' },
            { icon: <FileText size={12} />, label: t('context.pitchDeck'), value: startup?.dataRoom?.pitchDeckUrl ? t('context.uploaded') : t('context.missing'), color: '#A1A1AA' },
          ].map((c, i) => (
            <div key={i} style={{
              padding: '8px 14px', borderRadius: '10px',
              background: `${c.color}15`, border: `1px solid ${c.color}25`,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ color: c.color }}>{c.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.value}</div>
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
            style={{
              padding: '8px 16px', borderRadius: '10px', height: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(99,102,241,0.15))',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#D8B4FE', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'Inter'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? t('assessment.analyzing') : t('assessment.run')}
          </button>
        </div>
      </div>

      {/* Chat */}
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
        padding: '20px', borderRadius: '16px',
        background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '16px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#FFFFFF,#71717A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={15} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(99,102,241,0.2))'
                : 'rgba(13,13,32,0.9)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              {msg.role === 'assistant' ? <MarkdownText text={msg.content} /> : (
                <p style={{ fontSize: 14, color: '#f8fafc', lineHeight: 1.6 }}>{msg.content}</p>
              )}
              <div style={{ fontSize: 10, color: '#334155', marginTop: 8, textAlign: 'right' }}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {msg.role === 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#D8B4FE',
              }}>
                {startup?.founderName?.charAt(0) || profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FFFFFF,#71717A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={15} color="white" />
            </div>
            <div style={{ padding: '16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(13,13,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#FFFFFF',
                    animation: `bounce 1s ${delay}s infinite`,
                  }} />
                ))}
                <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>{t('chat.analyzing')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
          {suggested.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s.text)}
              style={{
                padding: '8px 14px', borderRadius: '99px', fontSize: 12, fontWeight: 500,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#D8B4FE', cursor: 'pointer', transition: 'var(--transition-standard)',
                fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {s.icon} {s.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <input
          className="input-field"
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ padding: '10px 20px', flexShrink: 0 }}
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
