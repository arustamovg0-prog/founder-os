'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Map, FolderOpen, Presentation, Brain,
  Users, TrendingUp, Briefcase, Settings, LogOut, Zap,
  BarChart3, CheckCircle, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = {
  founder: [
    { href: '/founder', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { href: '/founder/roadmap', icon: <Map size={16} />, label: 'Roadmap' },
    { href: '/founder/data-room', icon: <FolderOpen size={16} />, label: 'Data Room' },
    { href: '/founder/pitches', icon: <Presentation size={16} />, label: 'Pitches' },
    { href: '/founder/ai-copilot', icon: <Brain size={16} />, label: 'AI Copilot' },
  ],
  investor: [
    { href: '/investor', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { href: '/investor/deal-flow', icon: <TrendingUp size={16} />, label: 'Deal Flow' },
    { href: '/investor/pitches', icon: <Briefcase size={16} />, label: 'Pitches' },
    { href: '/investor/portfolio', icon: <BarChart3 size={16} />, label: 'Portfolio' },
  ],
  admin: [
    { href: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { href: '/admin/startups', icon: <Users size={16} />, label: 'Startups' },
    { href: '/admin/stages', icon: <CheckCircle size={16} />, label: 'Stage Review' },
    { href: '/admin/analytics', icon: <BarChart3 size={16} />, label: 'Analytics' },
  ],
};

const ROLE_COLORS = {
  founder: '#7c3aed',
  investor: '#3b82f6',
  admin: '#10b981',
};

const ROLE_LABELS = {
  founder: '🚀 Founder Portal',
  investor: '💼 Investor Portal',
  admin: '⚡ Admin Panel',
};

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!profile) return null;

  const role = profile.role;
  const navItems = NAV[role] || [];
  const color = ROLE_COLORS[role];

  const handleLogout = async () => {
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
    </aside>
  );
}
