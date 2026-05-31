'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, FileText, Users, ClipboardList, LogIn, LogOut, ChevronDown,
} from 'lucide-react'
import type { Profile } from '@/types/database'
import { LogoMark } from '@/components/shared/logo'

const teacherTabs = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/tests',     label: 'Tests',      icon: FileText },
  { href: '/teacher/students',  label: 'Students',   icon: Users },
  { href: '/teacher/submissions', label: 'Submissions', icon: ClipboardList },
]

const studentTabs = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/join',      label: 'Join Test',  icon: LogIn },
]

interface TopNavProps {
  profile: Profile
}

export function TopNav({ profile }: TopNavProps) {
  const pathname = usePathname()
  const tabs = profile.role === 'teacher' ? teacherTabs : studentTabs
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between px-6 max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link href={tabs[0].href} className="flex items-center gap-2.5 shrink-0">
          <LogoMark className="h-7 w-auto" />
          <span className="font-bold text-base tracking-tight">Assessly</span>
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-sm text-muted-foreground hidden sm:block">{profile.full_name}</span>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-2 ring-border">
              {initials}
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-border rounded-lg shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-semibold">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.email}</p>
                <span className="inline-block mt-1 text-xs font-medium text-primary capitalize">{profile.role}</span>
              </div>
              {/* Sign out */}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-end gap-0 px-6 max-w-screen-xl mx-auto overflow-x-auto scrollbar-none">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
