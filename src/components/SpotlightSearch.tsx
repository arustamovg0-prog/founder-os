'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, LayoutDashboard, Map, FolderOpen, Presentation, Brain, 
  Users, TrendingUp, Briefcase, LogOut, Command, Zap, ChevronRight, BarChart3, Heart, Kanban, Scale, Flame, Gift, CheckCircle, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

const NAV = {
  founder: [
    { href: '/founder', icon: <LayoutDashboard size={18} />, i18nKey: 'dashboard' },
    { href: '/founder/roadmap', icon: <Map size={18} />, i18nKey: 'roadmap' },
    { href: '/founder/data-room', icon: <FolderOpen size={18} />, i18nKey: 'dataRoom' },
    { href: '/founder/pitches', icon: <Presentation size={18} />, i18nKey: 'pitches' },
    { href: '/founder/ai-copilot', icon: <Brain size={18} />, i18nKey: 'aiCopilot' },
    { href: '/founder/perks', icon: <Gift size={18} />, i18nKey: 'perks' },
    { href: '/founder/legal', icon: <Scale size={18} />, i18nKey: 'legal' },
    { href: '/founder/challenges', icon: <Flame size={18} />, i18nKey: 'challenges' },
    { href: '/founder/community', icon: <Users size={18} />, i18nKey: 'community' },
    { href: '/founder/chat', icon: <MessageSquare size={18} />, i18nKey: 'chat' },
  ],
  investor: [
    { href: '/investor', icon: <LayoutDashboard size={18} />, i18nKey: 'dashboard' },
    { href: '/investor/deal-flow', icon: <TrendingUp size={18} />, i18nKey: 'dealFlow' },
    { href: '/investor/pitches', icon: <Briefcase size={18} />, i18nKey: 'pitches' },
    { href: '/investor/portfolio', icon: <BarChart3 size={18} />, i18nKey: 'portfolio' },
    { href: '/investor/crm', icon: <Kanban size={18} />, i18nKey: 'crm' },
  ],
  admin: [
    { href: '/admin', icon: <LayoutDashboard size={18} />, i18nKey: 'dashboard' },
    { href: '/admin/startups', icon: <Users size={18} />, i18nKey: 'startups' },
    { href: '/admin/stages', icon: <CheckCircle size={18} />, i18nKey: 'stages' },
    { href: '/admin/challenges', icon: <Flame size={18} />, i18nKey: 'challenges' },
    { href: '/admin/analytics', icon: <BarChart3 size={18} />, i18nKey: 'analytics' },
    { href: '/admin/health', icon: <Heart size={18} />, i18nKey: 'health' },
  ]
};

export default function SpotlightSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  const tCommon = useTranslations('Common');

  const role = profile?.role || 'founder';
  const navItems = NAV[role as keyof typeof NAV] || [];
  
  const filteredItems = navItems.filter(item => 
    t(item.i18nKey as any).toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setTimeout(() => {
        setSearch('');
        setSelectedIndex(0);
      }, 0);
    }
  }, [isOpen]);

  // Handle arrow navigation
  const handleNavKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length + 1)); // +1 for logout
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length + 1) % (filteredItems.length + 1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredItems.length) {
        handleNavigate(filteredItems[selectedIndex].href);
      } else {
        handleLogout();
      }
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/session', { method: 'DELETE' }); } catch {}
    await logout();
    toast.success(tCommon('logout'));
    router.push('/');
    setIsOpen(false);
  };

  if (!profile) return null;

  return (
    <>
      {/* Floating Trigger Button (if user forgets shortcut) */}
      <div 
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 50,
        }}
      >
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(18, 18, 18, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '99px',
            color: '#A1A1AA',
            fontSize: '13px',
            fontFamily: 'Space Grotesk',
            cursor: 'pointer',
            transition: 'var(--transition-standard)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#A1A1AA';
          }}
        >
          <Search size={14} />
          <span>{tCommon('menu')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', fontSize: '10px' }}>
            <Command size={10} /> K
          </div>
        </button>
      </div>

      {/* Spotlight Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.2 }}
            className="spotlight-overlay" 
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="spotlight-menu" 
              onClick={e => e.stopPropagation()}
              style={{ background: '#050510', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
            >
            {/* Search Input Header */}
            <div style={{ 
              display: 'flex', alignItems: 'center', padding: '20px 24px', 
              borderBottom: '1px solid rgba(255,255,255,0.06)' 
            }}>
              <Search size={20} color="#A1A1AA" style={{ marginRight: '16px' }} />
              <input
                ref={inputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleNavKeyDown}
                placeholder={tCommon('searchPlaceholder')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontFamily: 'Inter Tight',
                  fontWeight: 500
                }}
              />
              <div style={{ fontSize: '10px', color: '#52525B', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>{tCommon('escToClose')}</div>
            </div>

            {/* Results List */}
            <div style={{ padding: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '1px' }}>
                {t('menu')}
              </div>
              
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isActive = pathname === item.href;
                return (
                  <div
                    key={item.href}
                    className="spotlight-item"
                    onClick={() => handleNavigate(item.href)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      color: isSelected ? '#FFFFFF' : (isActive ? '#FFFFFF' : '#A1A1AA'),
                      transition: 'background 160ms var(--ease-out), color 160ms var(--ease-out)',
                      animationDelay: `${index * 30}ms`
                    }}
                  >
                    <div style={{ color: isSelected || isActive ? '#D4D4D8' : '#52525B' }}>
                      {item.icon}
                    </div>
                    <span style={{ flex: 1, fontSize: '15px', fontWeight: isSelected ? 600 : 500 }}>
                      {t(item.i18nKey as any)}
                    </span>
                    {isActive && <span style={{ fontSize: '11px', color: '#FFFFFF', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '99px' }}>{tCommon('active')}</span>}
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#52525B', fontSize: '14px' }}>
                  {tCommon('noResults')}
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', margin: '12px 0', padding: '0 12px' }} />

              <div
                className="spotlight-item"
                onClick={handleLogout}
                onMouseEnter={() => setSelectedIndex(filteredItems.length)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: selectedIndex === filteredItems.length ? 'rgba(82, 82, 91, 0.1)' : 'transparent',
                  color: selectedIndex === filteredItems.length ? '#FCA5A5' : '#52525B',
                  transition: 'background 160ms var(--ease-out), color 160ms var(--ease-out)',
                  animationDelay: `${filteredItems.length * 30}ms`
                }}
              >
                <LogOut size={18} />
                <span style={{ fontSize: '15px', fontWeight: 500 }}>{tCommon('logout')}</span>
              </div>
            </div>
            
            <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Command size={12} color="white" />
                </div>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '13px', fontWeight: 700, color: '#A1A1AA' }}>Founder OS</span>
              </div>
              <div style={{ fontSize: '11px', color: '#52525B' }}>
                {profile.email}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
