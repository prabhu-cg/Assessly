'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EntityCard, EntityGrid, EntityMeta } from '@/components/shared/entity-card'
import { TestCardMenu } from '@/components/teacher/test-card-menu'
import type { Test } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Clock, Hash, Share2, Search, SearchX } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

type TestRow = {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  duration_minutes: number
  invite_code: string
  created_at: string
  questions: { count: number }[] | null
  [key: string]: unknown
}


const FILTERS = ['all', 'published', 'draft', 'archived'] as const
type Filter = (typeof FILTERS)[number]

const statusVariant = { draft: 'muted', published: 'success', archived: 'outline' } as const

export function TestsBrowser({ tests }: { tests: TestRow[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: tests.length, published: 0, draft: 0, archived: 0 }
    tests.forEach(t => { c[t.status]++ })
    return c
  }, [tests])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tests
      .filter(t => (filter === 'all' || t.status === filter) &&
        (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q) || t.invite_code.toLowerCase().includes(q)))
      .sort((a, b) => (newestFirst ? -1 : 1) * a.created_at.localeCompare(b.created_at))
  }, [tests, filter, query, newestFirst])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search title or code"
            aria-label="Search tests"
            className="pl-8"
          />
        </div>

        <div role="group" aria-label="Filter by status" className="flex rounded-lg border border-border bg-card p-0.5">
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === f ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f} <span className="ml-1 tabular-nums font-medium opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>

        <label className="ml-auto flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground">
          Newest first
          <Switch checked={newestFirst} onCheckedChange={setNewestFirst} aria-label="Show newest tests first" />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <SearchX className="mx-auto mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">No tests match</p>
          <button
            type="button"
            onClick={() => { setFilter('all'); setQuery('') }}
            className="mt-2 text-sm font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <EntityGrid>
          {visible.map((test, i) => {
            const qCount = test.questions?.[0]?.count ?? 0
            return (
              <EntityCard
                key={test.id}
                index={i}
                href={`/teacher/tests/${test.id}`}
                title={test.title}
                badges={<Badge variant={statusVariant[test.status]}>{test.status}</Badge>}
                description={test.description}
                meta={
                  <>
                    <EntityMeta icon={Clock}>{test.duration_minutes} min</EntityMeta>
                    <EntityMeta icon={Hash} className="tabular-nums">{qCount} question{qCount !== 1 ? 's' : ''}</EntityMeta>
                    <EntityMeta icon={Share2}><code className="font-mono font-semibold">{test.invite_code}</code></EntityMeta>
                  </>
                }
                footer={`Created ${formatRelativeTime(test.created_at)}`}
                menu={<TestCardMenu test={test as unknown as Test} />}
              />
            )
          })}
        </EntityGrid>
      )}
    </div>
  )
}
