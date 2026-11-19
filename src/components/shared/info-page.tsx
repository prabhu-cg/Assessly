import Link from 'next/link'
import { Wordmark } from '@/components/shared/logo'
import { Footer } from '@/components/shared/footer'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'

/** Shared frame for About, Privacy and Terms: the landing header, a reading column, the public footer. */
export function InfoPage({
  title,
  lead,
  updated,
  children,
}: {
  title: string
  lead?: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Assessly home"><Wordmark /></Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" className="px-3 sm:px-4" render={<Link href="/student-login" />}>
              <span className="sm:hidden">Students</span>
              <span className="hidden sm:inline">Student portal</span>
            </Button>
            <Button className="px-3 sm:px-4" render={<Link href="/login" />}>Teacher sign in</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1" style={{ backgroundColor: 'var(--surface)' }}>
        <article className="mx-auto w-full max-w-[51rem] px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="text-5xl leading-none sm:text-6xl">{title}</h1>
          {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
          {updated && <p className="mt-3 text-sm text-muted-foreground">Last updated {updated}</p>}
          <div className="mt-10 space-y-9 rounded-card border border-border bg-card p-6 [counter-reset:sec] sm:p-10">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="[counter-increment:sec]">
      <h2 className="font-sans! text-lg! font-semibold! tracking-normal! text-ink-strong before:content-[counter(sec)'._']">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary-text [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

/** Label and value rows, as on the Doxa About page. Sits inside the page card, so it has no box of its own. */
export function InfoFacts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-border border-y border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
          <dt className="text-sm font-semibold text-ink-strong">{label}</dt>
          <dd className="text-sm text-muted-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
