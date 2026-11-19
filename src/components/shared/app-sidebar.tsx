'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import { LogOut, ChevronDown } from 'lucide-react'
import { LogoMark } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { teacherLinks } from '@/components/shared/sidebar'
import { MobileMenu } from '@/components/shared/mobile-menu'
import type { Profile } from '@/types/database'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/teacher/dashboard" aria-label="Assessly home" className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <span className="font-display text-xl text-ink-strong">Assessly</span>
        </Link>
      </div>

      <nav aria-label="Teacher" className="flex flex-col gap-1 px-3 py-3">
        {teacherLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-full px-3.5 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-primary-soft font-semibold text-primary-text'
                  : 'font-medium text-muted-foreground hover:bg-secondary hover:text-ink-strong',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

    </aside>
  )
}

export function AppTopbar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initials = profile.full_name
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-1 md:invisible">
        <MobileMenu links={teacherLinks} label="Teacher" above={768} className="-ml-2 md:hidden" />
        <Link href="/teacher/dashboard" aria-label="Assessly home" className="flex items-center gap-2.5 rounded-full px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <LogoMark className="h-6 w-auto" />
          <span className="font-display text-xl text-ink-strong">Assessly</span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
      <ThemeToggle />
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 hover:bg-secondary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="hidden sm:block text-sm font-medium">{profile.full_name}</span>
          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {initials}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-border-strong bg-popover py-1">
            <div className="border-b border-border px-3 py-2.5">
              <p className="text-sm font-semibold">{profile.full_name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive-soft transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
      </div>
    </header>
  )
}
