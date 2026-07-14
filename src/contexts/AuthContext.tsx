'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isDemoConfig } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types';

// ─── Cookie helpers (edge-compatible) ────────────────────────────────────────

const ROLE_COOKIE = '__founder_os_role';
const SESSION_COOKIE = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 дней

function setCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Demo accounts (без Firebase) ────────────────────────────────────────────

const DEMO_PROFILES: Record<string, UserProfile> = {
  'founder@demo.com': {
    uid: 'demo_founder', email: 'founder@demo.com', displayName: 'Alibek Dzhaksybekov',
    role: 'founder', isVerified: true, createdAt: new Date(), lastActiveAt: new Date(),
    linkedStartupId: 'startup_1',
  },
  'investor@demo.com': {
    uid: 'demo_investor', email: 'investor@demo.com', displayName: 'Aibek Ventures',
    role: 'investor', isVerified: true, createdAt: new Date(), lastActiveAt: new Date(),
  },
  'admin@demo.com': {
    uid: 'demo_admin', email: 'admin@demo.com', displayName: 'UNTITLED Admin',
    role: 'admin', isVerified: true, createdAt: new Date(), lastActiveAt: new Date(),
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Синхронизируем role cookie при изменении профиля
  useEffect(() => {
    if (profile?.role) {
      setCookie(ROLE_COOKIE, profile.role);
    }
  }, [profile?.role]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          if (isDemoConfig) throw new Error('Demo config: skipping Firebase fetch');
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data() as Omit<UserProfile, 'uid'>;
            const p = { uid: u.uid, ...data };
            setProfile(p);
          } else {
            // Firebase auth есть, но документа в Firestore нет
            const fallback: UserProfile = {
              uid: u.uid, email: u.email || '', displayName: u.displayName || '',
              role: 'founder', isVerified: false, createdAt: new Date(), lastActiveAt: new Date(),
            };
            setProfile(fallback);
            // Auto-heal: create the missing document in Firestore
            try {
              const { uid, ...profileData } = fallback;
              await setDoc(doc(db, 'users', u.uid), {
                ...profileData,
                createdAt: serverTimestamp(),
                lastActiveAt: serverTimestamp(),
              });
            } catch (e) {
              console.error('Failed to auto-create user document:', e);
            }
          }
        } catch {
          // Demo mode — Firebase недоступен, проверяем demo email
          const demoProfile = u.email ? DEMO_PROFILES[u.email] : null;
          const fallback = demoProfile || {
            uid: u.uid, email: u.email || '', displayName: u.displayName || '',
            role: 'founder' as UserRole, isVerified: true, createdAt: new Date(), lastActiveAt: new Date(),
          };
          setProfile(fallback);
          setIsDemoMode(true);
        }
      } else {
        // Попытка восстановить Demo сессию из куки
        const match = document.cookie.match(new RegExp('(^| )' + ROLE_COOKIE + '=([^;]+)'));
        if (match && match[2]) {
          const r = match[2] as UserRole;
          const emailMap: Record<UserRole, string> = {
            founder: 'founder@demo.com',
            investor: 'investor@demo.com',
            admin: 'admin@demo.com',
          };
          const demoProfile = DEMO_PROFILES[emailMap[r]];
          if (demoProfile) {
            setProfile(demoProfile);
            setIsDemoMode(true);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ─── Login (Firebase) ───────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const { user: u } = await signInWithEmailAndPassword(auth, email, password);
      // Session cookie записывается через Firebase Admin на сервере в продакшене.
      // В dev режиме используем UID как временную сессию.
      setCookie(SESSION_COOKIE, u.uid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Если Firebase недоступен — пробуем demo mode
      const demoProfile = DEMO_PROFILES[email];
      if (demoProfile && password === 'demo123') {
        setProfile(demoProfile);
        setIsDemoMode(true);
        setCookie(SESSION_COOKIE, demoProfile.uid);
        setCookie(ROLE_COOKIE, demoProfile.role);
        return;
      }
      throw err;
    }
  };

  // ─── Demo Login (без пароля) ────────────────────────────────────────────────
  const loginDemo = (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      founder: 'founder@demo.com',
      investor: 'investor@demo.com',
      admin: 'admin@demo.com',
    };
    const demoProfile = DEMO_PROFILES[emailMap[role]];
    setProfile(demoProfile);
    setIsDemoMode(true);
    setCookie(SESSION_COOKIE, demoProfile.uid);
    setCookie(ROLE_COOKIE, role);
    setLoading(false);
  };

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
    deleteCookie(SESSION_COOKIE);
    deleteCookie(ROLE_COOKIE);
  };

  // ─── Register ───────────────────────────────────────────────────────────────
  const register = async (email: string, password: string, name: string, role: UserRole) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });

    const profileData: Omit<UserProfile, 'uid'> = {
      email, displayName: name, role,
      isVerified: false, createdAt: new Date(), lastActiveAt: new Date(),
    };

    await setDoc(doc(db, 'users', newUser.uid), {
      ...profileData,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });

    setProfile({ uid: newUser.uid, ...profileData });
    setCookie(SESSION_COOKIE, newUser.uid);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, role: profile?.role ?? null,
      loading, isDemoMode,
      login, loginDemo, logout, register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
