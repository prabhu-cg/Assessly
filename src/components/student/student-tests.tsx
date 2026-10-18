'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Clock, Hourglass, PartyPopper, Play, Search, SearchX, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type StudentTest = {
  id: string
  title: string
  description: string | null
  minutes: number
  state: 'ready' | 'in_progress' | 'waiting' | 'marked'
  submissionId: string | null
  submittedAt: string | null
  obtained: number | null
  total: number | null
}

const PAGE = 8

function pctOf(t: StudentTest) {
  return t.total ? Math.round(((t.obtained ?? 0) / t.total) * 100) : null
}

function Row({ t, i }: { t: StudentTest; i: number }) {
  const style = { '--i': i } as React.CSSProperties
  const base = 'rise-in group/row flex min-h-[4.5rem] items-center gap-4 rounded-card border bg-surface-raised px-4 py-3 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0'

  if (t.state === 'ready' || t.state === 'in_progress') {
    const live = t.state === 'in_progress'
    return (
      <li style={style}>
        <Link href={`/student/tests/${t.id}/instructions`} className={cn(base, 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50')}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-snug">{t.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span className="tabular-nums">{t.minutes} min</span>
              {live && (
                <span className="flex items-center gap-1.5 font-semibold text-warning">
                  <span className="pulse-dot size-2 rounded-full bg-warning" aria-hidden />
                  In progress
                </span>
              )}
            </p>
          </div>
          <span className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors group-hover/row:bg-primary-hover">
            <Play className="size-4 fill-current" aria-hidden />
            {live ? 'Continue' : 'Start'}
          </span>
        </Link>
      </li>
    )
  }

  const marked = t.state === 'marked'
  const pct = pctOf(t)
  return (
    <li style={style}>
      <Link
        href={`/student/tests/${t.id}/results?submission=${t.submissionId}`}
        className={cn(base, 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50')}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-snug">{t.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t.submittedAt
              ? `Handed in ${new Date(t.submittedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Handed in'}
          </p>
        </div>
        {marked && pct !== null ? (
          <span
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums"
            style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${10 + Math.min(Math.max(pct, 0), 100) * 0.4}%, var(--card))` }}
          >
            {t.obtained} / {t.total}
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-1.5 text-sm font-semibold text-warning">
            <Hourglass className="size-3.5" aria-hidden />
            Waiting for marks
          </span>
        )}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/row:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </Link>
    </li>
  )
}

function Group({ label, items, start }: { label: string; items: StudentTest[]; start: number }) {
  if (!items.length) return null
  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">
        {label} <span className="tabular-nums font-medium">{items.length}</span>
      </h2>
      <ul className="space-y-2.5">
        {items.map((t, i) => <Row key={t.id} t={t} i={start + i} />)}
      </ul>
    </section>
  )
}

export function StudentTests({ firstName, items, initialTab }: { firstName: string; items: StudentTest[]; initialTab: 'todo' | 'done' }) {
  const [tab, setTab] = useState<'todo' | 'done'>(initialTab)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const todo = useMemo(() => items.filter(t => t.state === 'ready' || t.state === 'in_progress'), [items])
  const done = useMemo(() => items.filter(t => t.state === 'waiting' || t.state === 'marked'), [items])

  const q = query.trim().toLowerCase()
  const pool = (tab === 'todo' ? todo : done).filter(t => !q || t.title.toLowerCase().includes(q))
  const shown = pool.slice(0, limit)

  const groups = tab === 'todo'
    ? [['In progress', shown.filter(t => t.state === 'in_progress')], ['Ready to start', shown.filter(t => t.state === 'ready')]] as const
    : [['Waiting for marks', shown.filter(t => t.state === 'waiting')], ['Marked', shown.filter(t => t.state === 'marked')]] as const

  const switchTab = (next: 'todo' | 'done') => { setTab(next); setLimit(PAGE) }
  const readyCount = todo.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {readyCount > 0 ? `${readyCount} test${readyCount !== 1 ? 's' : ''} ready for you.` : 'No tests waiting for you right now.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Tests" className="flex rounded-xl border border-border bg-card p-1">
          {([['todo', 'To do', todo.length], ['done', 'Completed', done.length]] as const).map(([key, label, n]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              type="button"
              onClick={() => switchTab(key)}
              className={cn(
                'flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                tab === key ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', tab === key ? 'bg-primary/15' : 'bg-foreground/10')}>{n}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setLimit(PAGE) }}
            placeholder="Search tests"
            aria-label="Search tests"
            className="h-10 pl-8"
          />
        </div>
      </div>

      <div key={tab} className="space-y-6">
        {pool.length === 0 ? (
          <div className="rise-in rounded-card border border-dashed border-border bg-card px-6 py-14 text-center">
            {q ? (
              <>
                <SearchX className="mx-auto mb-3 size-7 text-primary" />
                <p className="text-sm font-semibold">No tests match &ldquo;{query.trim()}&rdquo;</p>
                <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-semibold text-primary-text hover:underline">Clear search</button>
              </>
            ) : tab === 'todo' ? (
              <>
                <PartyPopper className="mx-auto mb-3 size-7 text-primary" />
                <p className="text-sm font-semibold">You&apos;re all caught up</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Your teacher will add the next test. Got an invite code? Use Join a test.</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto mb-3 size-7 text-primary" />
                <p className="text-sm font-semibold">Nothing completed yet</p>
                <Button variant="outline" className="mt-3" onClick={() => switchTab('todo')}>See your tests</Button>
              </>
            )}
          </div>
        ) : (
          <>
            {(() => {
              let n = 0
              return groups.map(([label, list]) => {
                const el = <Group key={label} label={label} items={[...list]} start={n} />
                n += list.length
                return el
              })
            })()}
            {pool.length > shown.length && (
              <div className="flex justify-center">
                <Button variant="outline" className="h-11 px-6" onClick={() => setLimit(l => l + PAGE)}>
                  Show {Math.min(PAGE, pool.length - shown.length)} more
                  <span className="ml-1 tabular-nums text-muted-foreground">({pool.length - shown.length} left)</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
