'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Command, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="inline-flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white">
            <Command size={22} />
          </div>
          <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white">Founder OS</span>
        </div>

        <Card className="p-2">
          <CardContent className="p-8 sm:p-10 text-center">
            {/* Checking */}
            {(state === 'checking' || state === 'signing_in') && (
              <FadeIn>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white animate-spin" />
                <h2 className="font-display text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                  {state === 'checking' ? 'Проверяем ссылку...' : 'Входим в систему...'}
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Подождите несколько секунд</p>
              </FadeIn>
            )}

            {/* Email needed */}
            {state === 'email_needed' && (
              <FadeIn>
                <h2 className="font-display text-2xl font-bold mb-2 text-zinc-900 dark:text-white">
                  Подтверди Email
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                  Ты открыл ссылку в другом браузере. Введи email, на который был отправлен Magic Link.
                </p>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white outline-none transition-colors mb-4 text-center"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMagicLink(email)}
                />
                <Button 
                  className="w-full py-6 text-base bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                  onClick={() => handleMagicLink(email)} 
                  disabled={!email}
                >
                  Подтвердить и войти
                </Button>
              </FadeIn>
            )}

            {/* Success */}
            {state === 'success' && (
              <FadeIn>
                <CheckCircle size={64} className="mx-auto mb-6 text-zinc-400 dark:text-zinc-500" />
                <h2 className="font-display text-2xl font-bold mb-2 text-zinc-400 dark:text-zinc-500">
                  Вход выполнен!
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Перенаправляем в дашборд...</p>
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-zinc-900 dark:bg-white rounded-full animate-[progress_1.5s_ease_forwards]" />
                </div>
              </FadeIn>
            )}

            {/* Error */}
            {state === 'error' && (
              <FadeIn>
                <XCircle size={64} className="mx-auto mb-6 text-red-400" />
                <h2 className="font-display text-2xl font-bold mb-2 text-red-500 dark:text-red-400">
                  Ссылка недействительна
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">{error}</p>
                <Button 
                  className="w-full py-6 text-base bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold" 
                  onClick={() => router.push('/')}
                >
                  Вернуться на главную
                </Button>
              </FadeIn>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes progress { from { width: 0; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
