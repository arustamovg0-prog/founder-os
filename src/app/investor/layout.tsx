'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpotlightSearch from '@/components/SpotlightSearch';
import SideNav from '@/components/SideNav';
import { useTranslations } from 'next-intl';

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
      <div className="dashboard-layout">
        <SideNav />
        <main className="dashboard-main flex items-center justify-center flex-col gap-4 min-h-screen">
          <div style={{ width: 36, height: 36, border: '3px solid rgba(212,212,216,0.2)', borderTopColor: '#D4D4D8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#52525B', fontSize: 14 }}>{t('loadingProtocol')}</p>
        </main>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <SideNav />
      <SpotlightSearch />
      <main className="dashboard-main animate-fade-in">
        {children}
      </main>
    </div>
  );
}
