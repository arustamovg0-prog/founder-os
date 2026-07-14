'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Send, Bot, User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `**Привет! Я AI-ассистент UNTITLED.**

Я здесь чтобы помочь с любыми вопросами о платформе, экосистеме и твоём стартапе:
- 📋 Как работает роадмап и верификация стадий
- 📊 Как интерпретировать AI Score
- 💼 Как подготовиться к питчу инвесторам
- 🔥 Что нужно сделать чтобы попасть в Deal Flow

Чем могу помочь?`,
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  'Что нужно для перехода на следующую стадию?',
  'Как улучшить AI Score?',
  'Что такое Investment Ready статус?',
  'Как запросить питч инвестору?',
];

async function callGemini(messages: Message[], userMessage: string): Promise<string> {
  const history = messages
    .filter(m => m.role !== 'system')
    .slice(-8)
    .map(m => `${m.role === 'user' ? 'Founder' : 'AI'}: ${m.content}`)
    .join('\n');

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message: userMessage }),
  });

  if (!res.ok) throw new Error('Chat API error');
  const data = await res.json();
  return data.reply;
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin:8px 0 8px 16px;display:flex;flex-direction:column;gap:4px">$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function FounderChatPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = onSnapshot(doc(db, 'support_threads', profile.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().messages) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msgs = docSnap.data().messages.map((m: any) => ({
          ...m,
          timestamp: m.timestamp?.toDate ? m.timestamp.toDate() : new Date(m.timestamp)
        }));
        if (msgs.length > 0) setMessages(msgs);
      }
    });
    return () => unsub();
  }, [profile?.uid]);

  const clearChat = async () => {
    setMessages([WELCOME]);
    if (profile?.uid) {
      await setDoc(doc(db, 'support_threads', profile.uid), { messages: [WELCOME], updatedAt: serverTimestamp() });
    }
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: `u_${Date.now()}`, role: 'user', content: msg, timestamp: new Date(),
    };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    if (profile?.uid) {
      await setDoc(doc(db, 'support_threads', profile.uid), { messages: newMsgs, updatedAt: serverTimestamp() }, { merge: true });
    }

    try {
      const reply = await callGemini(messages, msg);
      const botMsg: Message = {
        // eslint-disable-next-line react-hooks/purity
        id: `a_${Date.now()}`, role: 'assistant', content: reply, timestamp: new Date(),
      };
      const finalMsgs = [...newMsgs, botMsg];
      setMessages(finalMsgs);
      if (profile?.uid) {
        await setDoc(doc(db, 'support_threads', profile.uid), { messages: finalMsgs, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch {
      toast.error('Ошибка соединения с AI');
      const errMsg: Message = {
        // eslint-disable-next-line react-hooks/purity
        id: `e_${Date.now()}`, role: 'assistant',
        content: 'Извини, не могу ответить прямо сейчас. Попробуй ещё раз или напиши нам на support@untitled.vc',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', maxHeight: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg,rgba(147,51,234,0.3),rgba(161,161,170,0.2))', border: '1px solid rgba(147,51,234,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={20} color="#D8B4FE" />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 2 }}>UNTITLED AI Support</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#D4D4D8' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4D4D8', boxShadow: '0 0 4px #D4D4D8' }} />
            AI ассистент онлайн
          </div>
        </div>
        <button onClick={clearChat} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', fontSize: 12, fontFamily: 'Inter' }}>
          <RefreshCw size={12} /> Новый чат
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px', marginBottom: '16px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'user' ? 'linear-gradient(135deg,#9333EA,#A1A1AA)' : 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {msg.role === 'user' ? <User size={14} color="white" /> : <Brain size={14} color="#D8B4FE" />}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '70%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(147,51,234,0.25),rgba(161,161,170,0.15))' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(147,51,234,0.3)' : 'rgba(255,255,255,0.07)'}`,
              fontSize: 14, lineHeight: 1.7, color: '#e2e8f0',
            }}>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              <div style={{ fontSize: 10, color: '#334155', marginTop: 6, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={14} color="#D8B4FE" />
            </div>
            <div style={{ padding: '16px 20px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#9333EA', animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q)} style={{ padding: '8px 14px', borderRadius: '99px', fontSize: 12, background: 'rgba(147,51,234,0.1)', border: '1px solid rgba(147,51,234,0.2)', color: '#D8B4FE', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 500, transition: 'var(--transition-standard)' }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Задай вопрос... (Enter — отправить, Shift+Enter — новая строка)"
          rows={2}
          style={{
            width: '100%', padding: '14px 56px 14px 16px', borderRadius: '14px', resize: 'none',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f8fafc', fontSize: 14, fontFamily: 'Inter', lineHeight: 1.6,
            outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(147,51,234,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            position: 'absolute', right: 12, bottom: 12,
            width: 36, height: 36, borderRadius: '10px',
            background: input.trim() ? 'linear-gradient(135deg,#9333EA,#A1A1AA)' : 'rgba(255,255,255,0.05)',
            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'var(--transition-standard)', boxShadow: input.trim() ? '0 0 12px rgba(147,51,234,0.4)' : 'none',
          }}
        >
          <Send size={15} color={input.trim() ? 'white' : '#334155'} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
