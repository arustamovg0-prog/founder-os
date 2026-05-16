'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Map, FolderOpen, Presentation, Brain,
  Users, TrendingUp, Briefcase, LogOut, Zap,
  BarChart3, CheckCircle, ChevronRight, Bell, X, Heart, MessageSquare, Kanban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Notification types ───────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'pitch_request' | 'stage_approved' | 'stage_rejected' | 'feedback_received' | 'ai_score_ready' | 'new_startup';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV = {
  founder: [
    { href: '/founder', icon: <LayoutDashboard size={16} />, label: 'Dashboard', notifKey: null },
    { href: '/founder/roadmap', icon: <Map size={16} />, label: 'Roadmap', notifKey: 'stage' },
    { href: '/founder/data-room', icon: <FolderOpen size={16} />, label: 'Data Room', notifKey: 'ai_score' },
    { href: '/founder/pitches', icon: <Presentation size={16} />, label: 'Pitches', notifKey: 'pitch' },
    { href: '/founder/ai-copilot', icon: <Brain size={16} />, label: 'AI Copilot', notifKey: null },
    { href: '/founder/chat', icon: <MessageSquare size={16} />, label: 'Support Chat', notifKey: null },
  ],
  investor: [
    { href: '/investor', icon: <LayoutDashboard size={16} />, label: 'Dashboard', notifKey: null },
    { href: '/investor/deal-flow', icon: <TrendingUp size={16} />, label: 'Deal Flow', notifKey: 'new_startup' },
    { href: '/investor/pitches', icon: <Briefcase size={16} />, label: 'Pitches', notifKey: 'pitch' },
    { href: '/investor/portfolio', icon: <BarChart3 size={16} />, label: 'Portfolio', notifKey: null },
    { href: '/investor/crm', icon: <Kanban size={16} />, label: 'CRM Pipeline', notifKey: null },
  ],
  admin: [
    { href: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard', notifKey: null },
    { href: '/admin/startups', icon: <Users size={16} />, label: 'Startups', notifKey: 'new_startup' },
    { href: '/admin/stages', icon: <CheckCircle size={16} />, label: 'Stage Review', notifKey: 'stage' },
    { href: '/admin/analytics', icon: <BarChart3 size={16} />, label: 'Analytics', notifKey: null },
    { href: '/admin/health', icon: <Heart size={16} />, label: 'Ecosystem Health', notifKey: null },
  ],
};

const ROLE_COLORS = { founder: '#7c3aed', investor: '#3b82f6', admin: '#10b981' };
const ROLE_LABELS = { founder: '🚀 Founder Portal', investor: '💼 Investor Portal', admin: '⚡ Admin Panel' };

// ─── Demo notifications по роли ───────────────────────────────────────────────

const DEMO_NOTIFS: Record<string, Notification[]> = {
  founder: [
    { id: 'n1', type: 'pitch_request', title: 'Питч принят!', body: 'Aibek Ventures подтвердил встречу на 20 мая', timestamp: new Date(Date.now() - 2 * 60000), read: false, href: '/founder/pitches' },
    { id: 'n2', type: 'ai_score_ready', title: 'AI Score обновлён', body: 'Pitch Deck проанализирован: 82/100 — Strong', timestamp: new Date(Date.now() - 15 * 60000), read: false, href: '/founder/data-room' },
    { id: 'n3', type: 'stage_approved', title: 'Стадия одобрена!', body: 'UNTITLED верифицировал MVP Development ✅', timestamp: new Date(Date.now() - 3600000), read: true, href: '/founder/roadmap' },
  ],
  investor: [
    { id: 'n4', type: 'pitch_request', title: 'Новый питч-запрос', body: 'EduStack запрашивает встречу — Score: 78/100', timestamp: new Date(Date.now() - 5 * 60000), read: false, href: '/investor/pitches' },
    { id: 'n5', type: 'new_startup', title: 'Новый стартап в Deal Flow', body: 'AgriSense UZ достиг investment_ready статуса', timestamp: new Date(Date.now() - 25 * 60000), read: false, href: '/investor/deal-flow' },
  ],
  admin: [
    { id: 'n6', type: 'stage_approved', title: 'Стадия ждёт верификации', body: 'PayFlow UZ: Investment Ready — проверь артефакты', timestamp: new Date(Date.now() - 1 * 60000), read: false, href: '/admin/stages' },
    { id: 'n7', type: 'new_startup', title: 'Новая регистрация', body: 'Alibek Dzhaksybekov зарегистрировался как Founder', timestamp: new Date(Date.now() - 8 * 60000), read: false, href: '/admin/startups' },
    { id: 'n8', type: 'ai_score_ready', title: 'AI анализ завершён', body: 'EduStack Pitch Deck: Score 71/100 — сформирован отчёт', timestamp: new Date(Date.now() - 45 * 60000), read: true },
  ],
};

const NOTIF_ICONS: Record<string, string> = {
  pitch_request: '📋', stage_approved: '✅', stage_rejected: '❌',
  feedback_received: '💬', ai_score_ready: '🤖', new_startup: '🚀', stage: '🔑',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return `${Math.floor(hrs / 24)} дн назад`;
}

// ─── Notification Bell Component ──────────────────────────────────────────────

function NotificationBell({ role }: { role: keyof typeof DEMO_NOTIFS }) {
  const [notifs, setNotifs] = useState<Notification[]>(DEMO_NOTIFS[role] || []);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  // Закрываем при клике снаружи
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Realtime notifications — Firestore onSnapshot (с fallback на demo data)
  useEffect(() => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (isDemoMode) {
      // Demo mode — статичные данные, без Firestore
      return;
    }

    // Production — Firestore realtime listener
    // Слушаем коллекцию notifications для текущего пользователя
    let userId: string | undefined;
    try {
      // Импортируем auth динамически чтобы не сломать SSR
      const { getAuth } = require('firebase/auth');
      userId = getAuth().currentUser?.uid;
    } catch { return; }

    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifs: Notification[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type as Notification['type'],
          title: data.title,
          body: data.body,
          timestamp: data.createdAt?.toDate() || new Date(),
          read: data.read || false,
          href: data.href,
        };
      });

      if (newNotifs.length > 0) {
        const prevUnread = notifs.filter(n => !n.read).length;
        const newUnread = newNotifs.filter(n => !n.read).length;
        if (newUnread > prevUnread) {
          toast('🔔 Новое уведомление', { duration: 2500 });
        }
        setNotifs(newNotifs);
      }
    }, (error) => {
      console.warn('[Notifications] Firestore error:', error.message);
    });

    return () => unsubscribe();
  }, []);

  const markAllRead = async () => {
    // Demo mode — только локально
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));

    // Production — обновляем Firestore
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      await Promise.allSettled(
        unreadIds.map(id => updateDoc(doc(db, 'notifications', id), { read: true }))
      );
    }
  };

  const dismiss = async (id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      await updateDoc(doc(db, 'notifications', id), { dismissed: true }).catch(() => {});
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 12px', borderRadius: '10px', border: 'none',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: '#94a3b8', cursor: 'pointer', fontFamily: 'Inter', fontSize: 14,
          transition: 'all 0.15s', position: 'relative',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Bell size={16} />
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#ef4444', border: '2px solid var(--bg-sidebar, #050510)',
              fontSize: 8, fontWeight: 700, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: unread > 0 ? 'pulse 2s infinite' : 'none',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
        <span style={{ flex: 1, textAlign: 'left' }}>Уведомления</span>
        {unread > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444' }}>{unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', left: '240px', bottom: '80px', zIndex: 9000,
          width: '340px', maxHeight: '480px', overflow: 'hidden',
          background: 'rgba(10,10,28,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={14} color="#a78bfa" />
              <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 700 }}>Уведомления</span>
              {unread > 0 && <span style={{ padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>{unread} новых</span>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>Прочитать все</button>}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={14} /></button>
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#334155' }}>
                <Bell size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>Нет уведомлений</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', gap: '12px', padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.read ? 'transparent' : 'rgba(124,58,237,0.05)',
                    transition: 'background 0.15s', cursor: n.href ? 'pointer' : 'default',
                  }}
                  onClick={() => { if (n.href) { setOpen(false); } }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: n.read ? '#94a3b8' : '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.title}
                      </span>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginLeft: 6 }} />}
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 4 }}>{n.body}</p>
                    <span style={{ fontSize: 10, color: '#334155' }}>{timeAgo(n.timestamp)}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'flex-start', flexShrink: 0, padding: '2px' }}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const role = profile.role;
  const navItems = NAV[role] || [];
  const color = ROLE_COLORS[role];

  const handleLogout = async () => {
    // Удаляем session cookie на сервере
    try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
    await logout();
    toast.success('Выход выполнен');
    router.push('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: '28px', display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: `linear-gradient(135deg, ${color}, ${color}aa)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${color}50`,
          }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 15, fontWeight: 700 }}>Founder OS</div>
            <div style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>UNTITLED</div>
          </div>
        </div>
      </Link>

      {/* Role badge */}
      <div style={{
        padding: '8px 12px', borderRadius: '8px', marginBottom: '20px',
        background: `${color}15`, border: `1px solid ${color}30`,
        fontSize: '11px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '1px',
      }}>
        {ROLE_LABELS[role]}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={isActive ? { '--active-color': color } as any : {}}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && <ChevronRight size={12} style={{ color }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '16px' }}>
        {/* Notification Bell */}
        <div style={{ marginBottom: '10px' }}>
          <NotificationBell role={role} />
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${color}, ${color}80)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'white',
          }}>
            {profile.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.displayName || profile.email}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>{profile.email}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
      `}</style>
    </aside>
  );
}
