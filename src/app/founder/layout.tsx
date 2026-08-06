'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SpotlightSearch from '@/components/SpotlightSearch';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { doc, getDoc } from 'firebase/firestore';
import { db, isDemoConfig } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

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
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 md:pl-[260px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="text-sm text-gray-500">Loading protocol...</p>
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
