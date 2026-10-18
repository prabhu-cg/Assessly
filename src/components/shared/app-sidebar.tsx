'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'
import { LogOut, ChevronDown } from 'lucide-react'
import { LogoMark } from '@/components/shared/logo'
import { teacherLinks } from '@/components/shared/sidebar'
import type { Profile } from '@/types/database'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/teacher/dashboard" aria-label="Assessly home" className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <span className="font-bold text-base tracking-tight">Assessly</span>
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
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-foreground/5 font-semibold text-foreground'
                  : 'font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
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
      <Link href="/teacher/dashboard" className="md:invisible flex items-center gap-2.5">
        <LogoMark className="h-6 w-auto" />
        <span className="font-bold text-base tracking-tight">Assessly</span>
      </Link>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 hover:bg-foreground/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="hidden sm:block text-sm font-medium">{profile.full_name}</span>
          <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            {initials}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border bg-popover py-1 shadow-lg">
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
    </header>
  )
}
