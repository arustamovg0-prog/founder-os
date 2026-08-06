'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpotlightSearch from '@/components/SpotlightSearch';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Common');
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/');
      return;
    }
    if (profile.role !== 'investor') {
      router.replace(profile.role === 'admin' ? '/admin' : '/founder');
      return;
    }
    setTimeout(() => setIsInitializing(false), 0);
  }, [profile, loading, router]);

  if (loading || isInitializing || !profile) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 md:pl-[260px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">{t('loadingProtocol')}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <SpotlightSearch />
      <div className="flex flex-1 flex-col md:pl-[260px]">
        <Header />
        <main className="flex-1 animate-fade-in p-4 sm:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
