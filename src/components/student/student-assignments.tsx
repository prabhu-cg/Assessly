'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, CheckCircle2, ChevronRight, CornerUpLeft, Hourglass, NotebookPen, PartyPopper, Pencil, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DueIn, LateBadge, When } from '@/components/shared/assignment-ui'
import { cn } from '@/lib/utils'

export type StudentAssignment = {
  id: string
  title: string
  description: string | null
  due_at: string | null
  state: 'todo' | 'in_progress' | 'returned' | 'waiting' | 'marked'
  submitted_at: string | null
  is_late: boolean
  obtained: number | null
  total: number | null
}

const PAGE = 8
const isOpen = (a: StudentAssignment) => a.state === 'todo' || a.state === 'in_progress' || a.state === 'returned'

function Row({ a, i }: { a: StudentAssignment; i: number }) {
  const pct = a.total ? Math.round(((a.obtained ?? 0) / a.total) * 100) : null
  return (
    <li style={{ '--i': i } as React.CSSProperties}>
      <Link
        href={`/student/assignments/${a.id}`}
        className="rise-in group/row flex min-h-[4.5rem] items-center gap-4 rounded-card border bg-surface-raised px-4 py-3 shadow-card outline-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-base font-semibold leading-snug">{a.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {isOpen(a) ? (
              a.due_at ? (
                <>
                  <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                  <When iso={a.due_at} />
                  <DueIn iso={a.due_at} />
                </>
              ) : 'No due date'
            ) : (
              <>
                {a.submitted_at ? <>Handed in <When iso={a.submitted_at} /></> : 'Handed in'}
                {a.is_late && <LateBadge />}
              </>
            )}
            {a.state === 'in_progress' && (
              <span className="flex items-center gap-1.5 font-semibold text-warning">
                <span className="pulse-dot size-2 rounded-full bg-warning" aria-hidden /> Draft saved
              </span>
            )}
          </p>
        </div>

        {a.state === 'marked' && pct !== null ? (
          <span className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums" style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${10 + Math.min(Math.max(pct, 0), 100) * 0.4}%, var(--card))` }}>
            {a.obtained} / {a.total}
          </span>
        ) : a.state === 'waiting' ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-1.5 text-sm font-semibold text-warning">
            <Hourglass className="size-3.5" aria-hidden /> Waiting for marks
          </span>
        ) : (
          <span className={cn('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors', a.state === 'returned' ? 'bg-warning-soft text-warning' : 'bg-primary text-primary-foreground group-hover/row:bg-primary-hover')}>
            {a.state === 'returned' ? <CornerUpLeft className="size-4" aria-hidden /> : <Pencil className="size-4" aria-hidden />}
            {a.state === 'todo' ? 'Start' : a.state === 'in_progress' ? 'Continue' : 'Revise'}
          </span>
        )}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover/row:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </Link>
    </li>
  )
}

function Group({ label, items, start }: { label: string; items: StudentAssignment[]; start: number }) {
  if (!items.length) return null
  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">{label} <span className="tabular-nums font-medium">{items.length}</span></h2>
      <ul className="space-y-2.5">{items.map((a, i) => <Row key={a.id} a={a} i={start + i} />)}</ul>
    </section>
  )
}

export function StudentAssignments({ items, initialTab }: { items: StudentAssignment[]; initialTab: 'todo' | 'done' }) {
  const [tab, setTab] = useState<'todo' | 'done'>(initialTab)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)

  const todo = useMemo(
    () => items.filter(isOpen).sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999')),
    [items],
  )
  const done = useMemo(() => items.filter(a => !isOpen(a)), [items])

  const q = query.trim().toLowerCase()
  const pool = (tab === 'todo' ? todo : done).filter(a => !q || a.title.toLowerCase().includes(q))
  const shown = pool.slice(0, limit)
  const groups = tab === 'todo'
    ? ([['Needs changes', shown.filter(a => a.state === 'returned')], ['In progress', shown.filter(a => a.state === 'in_progress')], ['Ready to start', shown.filter(a => a.state === 'todo')]] as const)
    : ([['Waiting for marks', shown.filter(a => a.state === 'waiting')], ['Marked', shown.filter(a => a.state === 'marked')]] as const)
  const switchTab = (next: 'todo' | 'done') => { setTab(next); setLimit(PAGE) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm tabular-nums text-muted-foreground">
          {todo.length > 0 ? `${todo.length} assignment${todo.length !== 1 ? 's' : ''} for you to do.` : 'Nothing to hand in right now.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Assignments" className="flex rounded-full border border-border bg-surface p-1">
          {([['todo', 'To do', todo.length], ['done', 'Completed', done.length]] as const).map(([key, label, n]) => (
            <button key={key} role="tab" aria-selected={tab === key} type="button" onClick={() => switchTab(key)}
              className={cn('flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50', tab === key ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-ink-strong')}>
              {label}
              <span className={cn('rounded-full px-1.5 text-xs tabular-nums', tab === key ? 'bg-primary/20' : 'bg-secondary')}>{n}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE) }} placeholder="Search assignments" aria-label="Search assignments" className="h-10 pl-8" />
        </div>
      </div>

      <div key={tab} className="space-y-6">
        {pool.length === 0 ? (
          <div className="rise-in rounded-card border border-dashed border-border bg-card px-6 py-14 text-center">
            {q ? (
              <>
                <SearchX className="mx-auto mb-3 size-7 text-primary-text" />
                <p className="text-sm font-semibold">No assignments match &ldquo;{query.trim()}&rdquo;</p>
                <button type="button" onClick={() => setQuery('')} className="mt-2 text-sm font-semibold text-primary-text hover:underline">Clear search</button>
              </>
            ) : tab === 'todo' ? (
              <>
                {items.length === 0 ? <NotebookPen className="mx-auto mb-3 size-7 text-primary-text" /> : <PartyPopper className="mx-auto mb-3 size-7 text-primary-text" />}
                <p className="text-sm font-semibold">{items.length === 0 ? 'No assignments yet' : "You're all caught up"}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Your teacher will assign work here. It shows up as soon as it is published.</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto mb-3 size-7 text-primary-text" />
                <p className="text-sm font-semibold">Nothing handed in yet</p>
                <Button variant="outline" className="mt-3" onClick={() => switchTab('todo')}>See what to do</Button>
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
