'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, ClipboardCheck, HelpCircle, Search, SearchX, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { EntityCard, EntityGrid, EntityMeta } from '@/components/shared/entity-card'
import { AssignmentCardMenu } from '@/components/teacher/assignment-card-menu'
import { When } from '@/components/shared/assignment-ui'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Assignment } from '@/types/database'

export type AssignmentRow = Assignment & {
  question_count: number
  assigned: number
  handed_in: number
  to_review: number
}

const FILTERS = ['all', 'published', 'draft', 'archived'] as const
type Filter = (typeof FILTERS)[number]
const statusVariant = { draft: 'muted', published: 'success', archived: 'outline' } as const

export function AssignmentsBrowser({ assignments }: { assignments: AssignmentRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: assignments.length, published: 0, draft: 0, archived: 0 }
    assignments.forEach(a => { c[a.status]++ })
    return c
  }, [assignments])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assignments
      .filter(a => (filter === 'all' || a.status === filter) &&
        (!q || a.title.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q)))
      .sort((a, b) => (newestFirst ? -1 : 1) * a.created_at.localeCompare(b.created_at))
  }, [assignments, filter, query, newestFirst])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search assignments" aria-label="Search assignments" className="pl-8" />
        </div>

        <div role="group" aria-label="Filter by status" className="flex rounded-full border border-border bg-surface p-1">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === f ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-ink-strong',
              )}
            >
              {f} <span className="ml-1 tabular-nums font-medium opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>

        <label className="ml-auto flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground">
          Newest first
          <Switch checked={newestFirst} onCheckedChange={setNewestFirst} aria-label="Show newest assignments first" />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <SearchX className="mx-auto mb-3 size-6 text-primary-text" />
          <p className="text-sm font-semibold">No assignments match</p>
          <button type="button" onClick={() => { setFilter('all'); setQuery('') }} className="mt-2 text-sm font-semibold text-primary-text hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <EntityGrid>
          {visible.map((a, i) => (
            <EntityCard
              key={a.id}
              index={i}
              href={`/teacher/assignments/${a.id}`}
              title={a.title}
              badges={
                <>
                  <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                  {a.to_review > 0 && (
                    <span className="rounded-full border border-primary px-2 py-px text-xs font-bold tabular-nums text-primary-text">
                      {a.to_review} to review
                    </span>
                  )}
                </>
              }
              description={a.description}
              meta={
                <>
                  <EntityMeta icon={CalendarClock}>{a.due_at ? <When iso={a.due_at} /> : 'No due date'}</EntityMeta>
                  <EntityMeta icon={HelpCircle} className="tabular-nums">{a.question_count} question{a.question_count !== 1 ? 's' : ''}</EntityMeta>
                  <EntityMeta icon={Users} className="tabular-nums">{a.assigned} assigned</EntityMeta>
                  <EntityMeta icon={ClipboardCheck} className="tabular-nums">{a.handed_in} handed in</EntityMeta>
                </>
              }
              footer={`Created ${formatRelativeTime(a.created_at)}`}
              menu={<AssignmentCardMenu assignment={a} />}
            />
          ))}
        </EntityGrid>
      )}
    </div>
  )
}
