"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTranslations } from "next-intl"
import { 
  Command, 
  LogOut, 
  LayoutDashboard, 
  Map, 
  FolderOpen, 
  Presentation, 
  Brain, 
  Users, 
  TrendingUp, 
  Briefcase, 
  BarChart3, 
  Kanban, 
  CheckCircle, 
  Flame, 
  Heart, 
  Shield, 
  Scale, 
  Gift, 
  MessageSquare,
  Menu,
  X
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import LanguageSwitcher from "../SideNav" // Will fix this import later if we move it

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
    { href: '/admin/audit', icon: <Shield size={18} />, i18nKey: 'audit' },
  ]
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, logout } = useAuth()
  const t = useTranslations('Navigation')
  const tCommon = useTranslations('Common')
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (!profile) return null

  const role = profile.role || 'founder'
  const navItems = NAV[role as keyof typeof NAV] || []

  const handleLogout = async () => {
    try { await fetch('/api/auth/session', { method: 'DELETE' }) } catch {}
    await logout()
    toast.success(tCommon('logout'))
    router.push('/')
  }

  return (
    <>
      {/* Mobile Top Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 md:hidden">
        <div className="flex items-center gap-2">
           <Command size={16} className="text-gray-900 dark:text-white" />
           <span className="font-display text-sm font-semibold text-gray-900 dark:text-white">Founder OS</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-gray-900 dark:text-white">
          <Menu size={20} />
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed bottom-0 left-0 top-0 z-50 flex w-[260px] flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-6 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <div className="absolute right-4 top-4 md:hidden">
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Brand Logo */}
        <div className="mb-8 mt-2 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm">
            <Command size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">Founder OS</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">by UNTITLED</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pb-4 scrollbar-hide">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {t('menu')}
          </div>
          
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  isActive 
                    ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white" 
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r bg-gray-900 dark:bg-white" />
                )}
                <div className={cn("transition-colors", isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white")}>
                  {item.icon}
                </div>
                <span>{t(item.i18nKey as any)}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <div className="mb-4 flex flex-col gap-0.5 px-3">
            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{profile.displayName}</span>
            <span className="text-[11px] text-gray-500">{profile.email}</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 dark:text-red-500 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400"
          >
            <LogOut size={18} />
            <span>{tCommon('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
