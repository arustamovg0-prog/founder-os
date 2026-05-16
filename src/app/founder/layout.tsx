'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  const { profile, isDemoMode } = useAuth();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== 'founder') {
      setOnboardingChecked(true);
      return;
    }

    // Demo mode — пропускаем проверку онбординга
    if (isDemoMode) {
      setOnboardingChecked(true);
      return;
    }

    // Проверяем статус онбординга в Firestore
    const checkOnboarding = async () => {
      try {
        const snap = await getDoc(doc(db, 'onboarding', profile.uid));
        if (snap.exists() && snap.data().completed === false) {
          router.replace('/onboarding');
          return;
        }
      } catch {
        // Firebase недоступен или документа нет — онбординг уже завершён
      }
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [profile?.uid]);

  // Показываем ничего пока проверяем онбординг (избегаем flash)
  if (!onboardingChecked) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main className="page-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#475569', fontSize: 13 }}>Загружаем твой профиль...</p>
          </div>
        </main>
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="page-content">{children}</main>
    </div>
  );
}
