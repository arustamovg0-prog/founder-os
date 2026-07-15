'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpotlightSearch from '@/components/SpotlightSearch';
import SideNav from '@/components/SideNav';
import { useTranslations } from 'next-intl';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    if (profile.role !== 'admin') {
      router.replace(profile.role === 'founder' ? '/founder' : '/investor');
      return;
    }
    setTimeout(() => setIsInitializing(false), 0);
  }, [profile, loading, router]);

  if (loading || isInitializing || !profile) {
    return (
      <div className="dashboard-layout">
        <SideNav />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(212,212,216,0.2)', borderTopColor: '#D4D4D8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#52525B', fontSize: 14 }}>{t('loadingProtocol')}</p>
        </div>
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
