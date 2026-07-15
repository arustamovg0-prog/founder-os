'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { Eye, EyeOff, Zap, ArrowRight, Users, TrendingUp, Brain, Mail, Command } from 'lucide-react';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_ACCOUNTS = [
  { role: 'founder' as UserRole, email: 'founder@demo.com', password: 'demo123', label: 'Founder Demo', icon: <Command size={16} /> },
  { role: 'investor' as UserRole, email: 'investor@demo.com', password: 'demo123', label: 'Investor Demo', icon: <Users size={16} /> },
  { role: 'admin' as UserRole, email: 'admin@demo.com', password: 'demo123', label: 'Admin Demo', icon: <Zap size={16} /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', damping: 20, stiffness: 100 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('founder');
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');

  const { login, loginDemo, register, profile } = useAuth();
  const router = useRouter();

  const redirectByProfile = (p: { role: UserRole; linkedStartupId?: string | null }) => {
    if (p.role === 'admin') router.push('/admin');
    else if (p.role === 'investor') router.push('/investor');
    else {
      if (p.role === 'founder' && !p.linkedStartupId) {
        router.push('/founder/onboarding');
      } else {
        router.push('/founder');
      }
    }
  };

  useEffect(() => {
    if (profile) {
      redirectByProfile(profile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDemoLogin = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setDemoRole(demo.role);
    loginDemo(demo.role);
    toast.success(`${demo.label} — добро пожаловать!`);
    setTimeout(() => redirectByProfile({ role: demo.role, linkedStartupId: 'demo_startup' }), 300);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      toast.success('Magic Link отправлен!', { duration: 5000 });
    } catch {
      setMagicLinkSent(true);
      toast.success('Magic Link отправлен! (Demo Mode)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 items-center">

        {/* Left — Branding (hidden on small mobile only) */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="hidden md:block pr-0 lg:pr-10">
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8 lg:mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Command size={22} color="white" />
            </div>
            <div>
              <div className="font-space font-semibold text-lg lg:text-xl">Founder OS</div>
              <div className="text-[10px] lg:text-[11px] text-[#a1a1aa] font-medium tracking-widest uppercase">by UNTITLED</div>
            </div>
          </motion.div>

          <motion.h1 variants={itemVariants} className="font-space font-bold leading-tight tracking-tight mb-6 text-4xl sm:text-5xl lg:text-[56px]">
            Turn Chaos<br />
            <span className="text-[#a1a1aa]">Into System.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-[#52525b] text-base lg:text-[17px] leading-relaxed mb-8 lg:mb-12 max-w-[440px]">
            The definitive operating system for startups. From inception to investment, meticulously engineered for founders and investors.
          </motion.p>

          <motion.div variants={containerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              { icon: <Brain size={18} />, title: 'Intelligence Engine', desc: 'Automated pitch deck analysis and startup scoring.' },
              { icon: <TrendingUp size={18} />, title: 'Structured Progression', desc: 'A deterministic roadmap from idea to funding readiness.' },
              { icon: <Users size={18} />, title: 'Curated Deal Flow', desc: 'Direct, high-signal connection between founders and investors.' },
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — Auth Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}>
          {/* Mobile-only branding (shown only on phones < 768px) */}
          <div className="flex md:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Command size={18} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16 }}>Founder OS</div>
              <div style={{ fontSize: 10, color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>by UNTITLED</div>
            </div>
          </div>
          <div className="card bg-black/80 backdrop-blur-3xl p-6 lg:p-10">
            
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
              {(['login', 'register', 'magic'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as 'login' | 'register' | 'magic')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                    background: 'transparent',
                    color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    position: 'relative', zIndex: 1,
                  }}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px', zIndex: -1, border: '1px solid rgba(255,255,255,0.05)'
                      }}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {m === 'login' ? 'Sign In' : m === 'register' ? 'Register' : 'Magic Link'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -5, filter: 'blur(4px)' }}
                transition={{ duration: 0.2 }}
              >
                {(mode === 'login' || mode === 'register') && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {mode === 'register' && (
                    <>
                      <input className="input-field" aria-label="Full Name" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                      <select
                        className="input-field"
                        aria-label="Role"
                        value={role}
                        onChange={e => setRole(e.target.value as UserRole)}
                        style={{ appearance: 'none', backgroundColor: '#000' }}
                      >
                        <option value="founder">Founder</option>
                        <option value="investor">Investor</option>
                      </select>
                    </>
                  )}
                  <input className="input-field" type="email" aria-label="Email address" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      aria-label="Password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                      }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                    {loading ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'black', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                        Authenticating...
                      </span>
                    ) : (
                      <>{mode === 'login' ? 'Continue' : 'Create Account'} <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>
                )}

                {/* Magic Link Form */}
                {mode === 'magic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {magicLinkSent ? (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Mail size={32} color="var(--text-primary)" style={{ margin: '0 auto 16px', display: 'block' }} />
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Check your inbox</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                          We sent a magic link to <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{magicEmail}</strong>.
                        </p>
                        <button onClick={() => { setMagicLinkSent(false); setMagicEmail(''); }} style={{ marginTop: 24, fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                          Send again
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          className="input-field"
                          aria-label="Email for Magic Link"
                          type="email"
                          placeholder="Email address"
                          value={magicEmail}
                          onChange={e => setMagicEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                        />
                        <button onClick={handleMagicLink} className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
                          {loading ? 'Sending...' : 'Send Magic Link'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0 24px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Demo Access</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Demo Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo)}
                  disabled={loading}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', padding: '12px 16px', fontWeight: 500 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{demo.icon}</div>
                    <span>{demo.label}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>

          </div>

          <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '8px' }}>UNTITLED Ecosystem © 2026</p>
            <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</Link>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
