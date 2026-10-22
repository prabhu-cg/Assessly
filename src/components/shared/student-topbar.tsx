'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/shared/logo'

const links = [
  { href: '/student/dashboard', label: 'My tests', icon: BookOpen },
  { href: '/student/join', label: 'Join a test', icon: KeyRound },
]

export function StudentTopbar({ fullName }: { fullName: string }) {
  const pathname = usePathname()
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="app-page flex h-16 items-center gap-3 px-4 sm:px-5 lg:px-6">
        <Link href="/student/dashboard" aria-label="Assessly home" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-7 w-auto" />
          <span className="hidden font-bold text-base tracking-tight sm:block">Assessly</span>
        </Link>

        <nav aria-label="Student" className="ml-2 flex items-center gap-1 sm:ml-6">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-lg px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'bg-primary-soft font-semibold text-primary-text'
                    : 'font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <span className="hidden text-sm font-medium sm:block">{fullName}</span>
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
            {initials}
          </span>
        </div>
      </div>
    </header>
  )
}
