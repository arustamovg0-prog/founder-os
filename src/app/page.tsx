'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, Users, TrendingUp, Brain, Mail } from 'lucide-react';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const DEMO_ACCOUNTS = [
  { role: 'founder' as UserRole, email: 'founder@demo.com', password: 'demo123', label: 'Founder Demo', color: '#7c3aed', icon: '🚀' },
  { role: 'investor' as UserRole, email: 'investor@demo.com', password: 'demo123', label: 'Investor Demo', color: '#3b82f6', icon: '💼' },
  { role: 'admin' as UserRole, email: 'admin@demo.com', password: 'demo123', label: 'Admin Demo', color: '#10b981', icon: '⚡' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('founder');
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');

  const { login, loginDemo, register, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      redirectByRole(profile.role);
    }
  }, [profile]);

  const redirectByRole = (r: UserRole) => {
    if (r === 'admin') router.push('/admin');
    else if (r === 'investor') router.push('/investor');
    else router.push('/founder');
  };

  const handleDemoLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setDemoRole(demo.role);
    loginDemo(demo.role);
    toast.success(`${demo.label} — добро пожаловать!`, { icon: demo.icon });
    setTimeout(() => redirectByRole(demo.role), 300);
    setDemoRole(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Добро пожаловать!');
      } else {
        if (!name) { toast.error('Введите имя'); setLoading(false); return; }
        await register(email, password, name, role);
        toast.success('Аккаунт создан!');
      }
    } catch (err: any) {
      toast.error(err.message?.replace('Firebase: ', '') || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!magicEmail) { toast.error('Введи email адрес'); return; }
    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/magic`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, magicEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', magicEmail);
      setMagicLinkSent(true);
      toast.success('Magic Link отправлен!', { icon: '✉️', duration: 5000 });
    } catch (err: any) {
      // Demo mode — Firebase не подключён
      setMagicLinkSent(true);
      toast.success('Magic Link отправлен! (Demo Mode)', { icon: '✉️' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>

        {/* Left — Branding */}
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
            }}>
              <Zap size={24} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700 }}>Founder OS</div>
              <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>by UNTITLED</div>
            </div>
          </div>

          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 48, fontWeight: 700, lineHeight: 1.1, marginBottom: 20 }}>
            Turn Chaos<br />
            <span className="gradient-text">Into System</span>
          </h1>

          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 440 }}>
            AI-powered CRM и платформа управления экосистемой для стартапов UNTITLED. От идеи до инвестиций — один путь.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: <Brain size={18} />, title: 'AI Copilot', desc: 'Автоматический анализ питч-деков и скоринг стартапов' },
              { icon: <TrendingUp size={18} />, title: 'Roadmap Engine', desc: 'Поэтапный путь от идеи до инвестиционной готовности' },
              { icon: <Users size={18} />, title: 'Deal Flow', desc: 'Прямая связь фаундеров с инвесторами через платформу' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#a78bfa',
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Auth Form */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card" style={{ padding: '32px' }}>
            {/* Demo Accounts */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                🎯 Быстрый вход (Демо)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.role}
                    onClick={() => handleDemoLogin(demo)}
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '10px',
                      background: demoRole === demo.role ? `${demo.color}20` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${demoRole === demo.role ? demo.color + '50' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer', transition: 'all 0.15s', color: '#f8fafc',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{demo.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{demo.label}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{demo.email}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="#64748b" />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>или войдите</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px' }}>
              {(['login', 'register', 'magic'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '7px', border: 'none',
                    background: mode === m ? 'rgba(124,58,237,0.3)' : 'transparent',
                    color: mode === m ? '#a78bfa' : '#64748b',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {m === 'login' ? 'Войти' : m === 'register' ? 'Регистрация' : '✉️ Magic Link'}
                </button>
              ))}
            </div>

            {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mode === 'register' && (
                <>
                  <input className="input-field" placeholder="Имя и фамилия" value={name} onChange={e => setName(e.target.value)} />
                  <select
                    className="input-field"
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    style={{ appearance: 'none' }}
                  >
                    <option value="founder">🚀 Founder</option>
                    <option value="investor">💼 Investor</option>
                  </select>
                </>
              )}
              <input className="input-field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '4px', padding: '12px' }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    Загрузка...
                  </span>
                ) : (
                  <>{mode === 'login' ? 'Войти' : 'Создать аккаунт'} <ArrowRight size={16} /></>
                )}
              </button>
            </form>
            )}

            {/* Magic Link Form */}
            {(mode as string) === 'magic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {magicLinkSent ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                    <Mail size={48} color="#7c3aed" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Письмо отправлено!</div>
                    <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>
                      Мы отправили Magic Link на <strong style={{ color: '#a78bfa' }}>{magicEmail}</strong>.<br />
                      Перейди по ссылке в письме для входа без пароля.
                    </p>
                    <button onClick={() => { setMagicLinkSent(false); setMagicEmail(''); }} style={{ marginTop: 16, fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', textDecoration: 'underline' }}>
                      Отправить ещё раз
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                      Введи email — мы пришлём ссылку для мгновенного входа без пароля.
                    </p>
                    <input
                      className="input-field"
                      type="email"
                      placeholder="your@email.com"
                      value={magicEmail}
                      onChange={e => setMagicEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                    />
                    <button onClick={handleMagicLink} className="btn-primary" disabled={loading} style={{ padding: '12px' }}>
                      {loading ? 'Отправляем...' : <><Mail size={15} /> Отправить Magic Link</>}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#334155' }}>
            UNTITLED Ecosystem © 2026 • Turn Chaos Into System
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
