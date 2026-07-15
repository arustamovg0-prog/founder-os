'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, Map, FolderOpen, Presentation, Brain, 
  Users, TrendingUp, Briefcase, BarChart3, Kanban, CheckCircle, Flame, Heart, LogOut, Command, Scale, Gift, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const NAV = {
  founder: [
    { href: '/founder', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/founder/roadmap', icon: <Map size={18} />, label: 'Roadmap' },
    { href: '/founder/data-room', icon: <FolderOpen size={18} />, label: 'Data Room' },
    { href: '/founder/pitches', icon: <Presentation size={18} />, label: 'Pitches' },
    { href: '/founder/ai-copilot', icon: <Brain size={18} />, label: 'AI Copilot' },
    { href: '/founder/perks', icon: <Gift size={18} />, label: 'Ecosystem Perks' },
    { href: '/founder/legal', icon: <Scale size={18} />, label: 'Legal Toolkit' },
    { href: '/founder/challenges', icon: <Flame size={18} />, label: 'Challenges' },
    { href: '/founder/community', icon: <Users size={18} />, label: 'Co-founder Match' },
    { href: '/founder/chat', icon: <MessageSquare size={18} />, label: 'Support Chat' },
  ],
  investor: [
    { href: '/investor', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/investor/deal-flow', icon: <TrendingUp size={18} />, label: 'Deal Flow' },
    { href: '/investor/pitches', icon: <Briefcase size={18} />, label: 'Pitches' },
    { href: '/investor/portfolio', icon: <BarChart3 size={18} />, label: 'Portfolio' },
    { href: '/investor/crm', icon: <Kanban size={18} />, label: 'CRM Pipeline' },
  ],
  admin: [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/admin/startups', icon: <Users size={18} />, label: 'Startups' },
    { href: '/admin/stages', icon: <CheckCircle size={18} />, label: 'Stage Review' },
    { href: '/admin/challenges', icon: <Flame size={18} />, label: 'Challenges' },
    { href: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
    { href: '/admin/health', icon: <Heart size={18} />, label: 'Ecosystem Health' },
  ]
};

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  
  if (!profile) return null;

  const role = profile.role || 'founder';
  const navItems = NAV[role as keyof typeof NAV] || [];

  const handleLogout = async () => {
    try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
    await logout();
    toast.success('Выход выполнен');
    router.push('/');
  };

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', marginBottom: '24px' }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 8, 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <Command size={16} color="white" />
        </div>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '16px', fontWeight: 600, color: '#f8fafc', letterSpacing: '0.5px' }}>Founder OS</div>
          <div style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>by UNTITLED</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', padding: '0 14px 8px 14px', letterSpacing: '1px' }}>
          Menu
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
              <div className="nav-icon" style={{ color: isActive ? 'var(--text-primary)' : '#52525B' }}>
                {item.icon}
              </div>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <div style={{ width: 4, height: 16, background: 'var(--text-primary)', borderRadius: 4, position: 'absolute', right: 12 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
        <div className="user-profile-mini" style={{ padding: '0 14px 16px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#D4D4D8' }}>{profile.displayName}</span>
          <span style={{ fontSize: 11, color: '#52525B' }}>{profile.email}</span>
        </div>
        
        <button onClick={handleLogout} className="nav-item logout-btn" style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}>
          <LogOut size={18} style={{ color: '#FCA5A5' }} />
          <span style={{ color: '#FCA5A5' }}>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
