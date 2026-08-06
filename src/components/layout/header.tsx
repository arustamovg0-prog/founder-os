"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "../LanguageSwitcher"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Header() {
  const pathname = usePathname()
  const t = useTranslations('Navigation')

  // Generate breadcrumbs from pathname (e.g. /founder/roadmap -> Dashboard / Roadmap)
  const segments = pathname.split('/').filter(Boolean)
  const isRoot = segments.length === 1

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-500 capitalize">{segments[0]}</span>
        {!isRoot && (
          <>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{segments[1]?.replace('-', ' ')}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* We can trigger Spotlight Search from here instead of the floating button */}
        <div className="hidden items-center gap-2 sm:flex">
           <span className="text-xs text-gray-400 dark:text-gray-500">Press</span>
           <kbd className="flex h-6 items-center justify-center rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111] px-2 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
             ⌘K
           </kbd>
           <span className="text-xs text-gray-400 dark:text-gray-500">to search</span>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
        
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  )
}
