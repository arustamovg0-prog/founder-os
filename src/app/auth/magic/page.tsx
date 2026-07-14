'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type MagicState = 'checking' | 'email_needed' | 'signing_in' | 'success' | 'error';

export default function MagicLinkCallbackPage() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [state, setState] = useState<MagicState>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleMagicLink = async (manualEmail?: string) => {
    setState('checking');

    // Demo mode — если Firebase не подключён
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      setState('success');
      setTimeout(() => {
        loginDemo('founder');
        router.push('/founder');
      }, 1500);
      return;
    }

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setError('Ссылка недействительна или истекла');
      setState('error');
      return;
    }

    // Получаем email — из localStorage или запрашиваем у пользователя
    const savedEmail = manualEmail || window.localStorage.getItem('emailForSignIn');

    if (!savedEmail) {
      setState('email_needed');
      return;
    }

    setState('signing_in');
    try {
      const result = await signInWithEmailLink(auth, savedEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');

      // Создаём httpOnly Session Cookie через наш API
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();

      setState('success');
      toast.success('Вход выполнен!', { icon: '✅' });

      // Redirect by role
      setTimeout(() => {
        const role = data.role || 'founder';
        if (role === 'admin') router.push('/admin');
        else if (role === 'investor') router.push('/investor');
        else router.push('/founder');
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа. Ссылка могла истечь.');
      setState('error');
    }
  };

  useEffect(() => {
    handleMagicLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#9333EA,#A1A1AA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(147,51,234,0.5)' }}>
            <Zap size={22} color="white" />
          </div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, fontWeight: 700 }}>Founder OS</span>
        </div>

        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          {/* Checking */}
          {(state === 'checking' || state === 'signing_in') && (
            <div>
              <div style={{
                width: 64, height: 64, margin: '0 auto 20px',
                border: '3px solid rgba(147,51,234,0.2)',
                borderTopColor: '#9333EA',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                {state === 'checking' ? 'Проверяем ссылку...' : 'Входим в систему...'}
              </h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Подождите несколько секунд</p>
            </div>
          )}

          {/* Email needed */}
          {state === 'email_needed' && (
            <div>
              <div style={{ fontSize: 48, marginBottom: '16px' }}>✉️</div>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                Подтверди Email
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: '24px', lineHeight: 1.6 }}>
                Ты открыл ссылку в другом браузере. Введи email, на который был отправлен Magic Link.
              </p>
              <input
                className="input-field"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink(email)}
                style={{ marginBottom: '12px' }}
              />
              <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => handleMagicLink(email)} disabled={!email}>
                Подтвердить и войти
              </button>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div>
              <CheckCircle size={64} color="#D4D4D8" style={{ margin: '0 auto 20px', display: 'block' }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#A1A1AA' }}>
                Вход выполнен!
              </h2>
              <p style={{ color: '#64748b', fontSize: 14 }}>Перенаправляем в дашборд...</p>
              <div style={{ marginTop: 24 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '100%', animation: 'progress 1.5s ease forwards' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div>
              <XCircle size={64} color="#52525B" style={{ margin: '0 auto 20px', display: 'block' }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
                Ссылка недействительна
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: '24px', lineHeight: 1.6 }}>{error}</p>
              <button className="btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => router.push('/')}>
                Вернуться на главную
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
