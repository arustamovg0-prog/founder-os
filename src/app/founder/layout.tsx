'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpotlightSearch from '@/components/SpotlightSearch';
import SideNav from '@/components/SideNav';
import { doc, getDoc } from 'firebase/firestore';
import { db, isDemoConfig } from '@/lib/firebase';

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, isDemoMode } = useAuth();
  const router = useRouter();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace('/');
      return;
    }
    if (profile.role !== 'founder') {
      router.replace(profile.role === 'admin' ? '/admin' : '/investor');
      return;
    }

    if (isDemoMode) {
      setTimeout(() => setOnboardingChecked(true), 0);
      return;
    }

    const checkOnboarding = async () => {
      if (isDemoConfig) {
        setTimeout(() => setOnboardingChecked(true), 0);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'onboarding', profile.uid));
        if (snap.exists() && snap.data().completed === false) {
          router.replace('/onboarding');
          return;
        }
      } catch {}
      setTimeout(() => setOnboardingChecked(true), 0);
    };

    checkOnboarding();
  }, [profile, loading, isDemoMode, router]);

  useEffect(() => {
    if (loading) return;
    if (onboardingChecked) {
      setTimeout(() => setIsInitializing(false), 0);
    }
  }, [onboardingChecked, loading]);

  if (loading || isInitializing || !onboardingChecked) {
    return (
      <div className="dashboard-layout">
        <SideNav />
        <main className="dashboard-main flex items-center justify-center flex-col gap-4 min-h-screen">
          <div style={{ width: 36, height: 36, border: '3px solid rgba(212,212,216,0.2)', borderTopColor: '#D4D4D8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#52525B', fontSize: 14 }}>Loading protocol...</p>
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
