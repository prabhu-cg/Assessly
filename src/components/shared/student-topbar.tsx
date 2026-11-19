'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, KeyRound, NotebookPen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/shared/logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { MobileMenu } from '@/components/shared/mobile-menu'

const links = [
  { href: '/student/dashboard', label: 'My tests', icon: BookOpen },
  { href: '/student/assignments', label: 'Assignments', icon: NotebookPen },
  { href: '/student/join', label: 'Join a test', icon: KeyRound },
]

export function StudentTopbar({ fullName }: { fullName: string }) {
  const pathname = usePathname()
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="app-page flex h-16 items-center gap-3 px-4 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 sm:justify-self-start">
          <MobileMenu links={links} label="Student" above={640} className="-ml-2 sm:hidden" />
          <Link href="/student/dashboard" aria-label="Assessly home" className="flex shrink-0 items-center gap-2.5">
            <LogoMark className="h-7 w-auto" />
            <span className="font-display text-xl text-ink-strong hidden sm:block">Assessly</span>
          </Link>
        </div>

        <nav aria-label="Student" className="hidden items-center gap-1 sm:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-full px-4 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'bg-primary-soft font-semibold text-primary-text'
                    : 'font-medium text-muted-foreground hover:bg-secondary hover:text-ink-strong',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5 sm:ml-0 sm:justify-self-end">
          <ThemeToggle />
          <span className="hidden text-sm font-medium md:block">{fullName}</span>
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
