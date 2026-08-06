'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, Send, Bot, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/ui/animations';

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
- Как работает роадмап и верификация стадий
- Как интерпретировать AI Score
- Как подготовиться к питчу инвесторам
- Что нужно сделать чтобы попасть в Deal Flow

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
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="list-disc pl-4 my-2 flex flex-col gap-1">$1</ul>')
    .replace(/\n/g, '<br/>');
}

export default function FounderChatPage() {
  const { profile, isDemoMode } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!profile?.uid || isDemoMode) return;
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
  }, [profile?.uid, isDemoMode]);

  const clearChat = async () => {
    setMessages([WELCOME]);
    if (profile?.uid && !isDemoMode) {
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

    if (profile?.uid && !isDemoMode) {
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
      if (profile?.uid && !isDemoMode) {
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
    <FadeIn className="flex flex-col h-[calc(100vh-48px)] max-h-[900px]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-center shrink-0">
          <Bot size={20} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold mb-0.5 text-zinc-900 dark:text-white">UNTITLED AI Support</h1>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
            AI ассистент онлайн
          </div>
        </div>
        <button 
          onClick={clearChat} 
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw size={12} /> Новый чат
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1 mb-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {messages.map(msg => (
          <div key={msg.id} className={cn(
            "flex gap-3 items-start",
            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}>
            {/* Avatar */}
            <div className={cn(
              "w-8 h-8 rounded-full shrink-0 flex items-center justify-center border",
              msg.role === 'user' 
                ? "bg-zinc-900 dark:bg-white border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900" 
                : "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400"
            )}>
              {msg.role === 'user' ? <User size={14} /> : <Brain size={14} />}
            </div>

            {/* Bubble */}
            <div className={cn(
              "max-w-[75%] sm:max-w-[70%] p-3 sm:p-4 text-sm leading-relaxed",
              msg.role === 'user' 
                ? "rounded-[16px_4px_16px_16px] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200" 
                : "rounded-[4px_16px_16px_16px] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            )}>
              <div 
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} 
              />
              <div className={cn(
                "text-[10px] mt-1.5",
                msg.role === 'user' ? "text-right text-zinc-400 dark:text-zinc-500" : "text-left text-zinc-400 dark:text-zinc-500"
              )}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Brain size={14} />
            </div>
            <div className="p-4 rounded-[4px_16px_16px_16px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" 
                  style={{ animationDelay: `${i * 0.2}s` }} 
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {QUICK_QUESTIONS.map((q, i) => (
            <button 
              key={i} 
              onClick={() => send(q)} 
              className="px-3 py-2 rounded-full text-xs font-medium bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Задай вопрос... (Enter — отправить, Shift+Enter — новая строка)"
          rows={2}
          className="w-full py-3.5 pl-4 pr-14 rounded-xl resize-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-500 text-sm text-zinc-900 dark:text-white outline-none transition-colors shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          disabled={loading}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className={cn(
            "absolute right-3 bottom-3 w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            input.trim() 
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-200" 
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
          )}
        >
          <Send size={16} className={cn(input.trim() ? "translate-x-[-1px] translate-y-[1px]" : "")} />
        </button>
      </div>

      <style jsx global>{`
        .markdown-body strong {
          font-weight: 700;
        }
        .markdown-body em {
          font-style: italic;
        }
      `}</style>
    </FadeIn>
  );
}
