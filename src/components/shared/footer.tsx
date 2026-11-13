import Link from 'next/link'
import { LogoMark } from '@/components/shared/logo'

const LINKS = [
  { href: '/student-login', label: 'Student portal' },
  { href: '/login', label: 'Teacher sign in' },
]

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-background px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 py-12 sm:flex-row sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="h-7 w-auto" />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-ink-strong">
              Assess<span className="text-primary-text">ly</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
              Assess smarter. Teach better.
            </span>
          </div>
        </Link>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Assessly. Assess smarter. Teach better.
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-ink-strong">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
