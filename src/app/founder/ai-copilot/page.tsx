'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Sparkles, TrendingUp, FileText, Target, RefreshCw } from 'lucide-react';
import { MOCK_STARTUPS } from '@/lib/mockData';

const MY_STARTUP = MOCK_STARTUPS[0];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED = [
  { icon: '📊', text: 'Analyze my current metrics and give growth recommendations' },
  { icon: '🎯', text: 'What should I focus on to reach investment readiness faster?' },
  { icon: '📋', text: 'Review my pitch deck score and suggest improvements' },
  { icon: '💡', text: 'What are the biggest risks investors might see in my startup?' },
];

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
          return <div key={i} style={{ fontWeight: 600, color: '#a78bfa', marginTop: 12, marginBottom: 4 }}>{line}</div>;
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
      ? <strong key={i} style={{ color: '#a78bfa', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your **AI Copilot** powered by Gemini. I have full context on PayFlow UZ — your metrics, roadmap progress, pitch deck scores, and digital footprint.

How can I help you today? You can ask me to analyze your metrics, review your pitch positioning, or plan your next fundraising steps.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    const reply: Message = {
      role: 'assistant',
      content: getResponse(msg),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, reply]);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="white" />
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 24, fontWeight: 700 }}>AI Copilot</h1>
            <span className="badge badge-purple"><Sparkles size={10} /> Powered by Gemini</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>Context-aware advisor with full access to your startup data</p>
        </div>

        {/* Context cards */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { icon: <TrendingUp size={12} />, label: 'AI Score', value: '85/100', color: '#7c3aed' },
            { icon: <Target size={12} />, label: 'Roadmap', value: '88%', color: '#10b981' },
            { icon: <FileText size={12} />, label: 'Pitch Deck', value: '82/100', color: '#3b82f6' },
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
                background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={15} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.2))'
                : 'rgba(13,13,32,0.9)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
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
                background: 'rgba(124,58,237,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#a78bfa',
              }}>
                {MY_STARTUP.founderName?.charAt(0)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={15} color="white" />
            </div>
            <div style={{ padding: '16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(13,13,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#7c3aed',
                    animation: `bounce 1s ${delay}s infinite`,
                  }} />
                ))}
                <span style={{ fontSize: 12, color: '#475569', marginLeft: 8 }}>Analyzing your startup data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
          {SUGGESTED.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s.text)}
              style={{
                padding: '8px 14px', borderRadius: '99px', fontSize: 12, fontWeight: 500,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                color: '#a78bfa', cursor: 'pointer', transition: 'all 0.15s',
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
          placeholder="Ask AI Copilot anything about your startup..."
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
