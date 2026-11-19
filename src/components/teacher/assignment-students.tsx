'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Loader2, Search, Send, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { assignStudentsToAssignment, removeStudentFromAssignment, shareAllResults } from '@/app/actions/assignments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Drawer } from '@/components/shared/drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LateBadge, WorkBadge, When, workState, workStateMeta, type WorkState } from '@/components/shared/assignment-ui'
import { cn } from '@/lib/utils'

export type TrackedSubmission = {
  id: string
  status: 'in_progress' | 'submitted' | 'returned' | 'evaluated'
  submitted_at: string | null
  is_late: boolean
  obtained_marks: number | null
  total_marks: number | null
  released_at: string | null
}
export type TrackedStudent = { id: string; full_name: string; year_level: string | null; submission: TrackedSubmission | null }
export type AvailableStudent = { id: string; full_name: string; year_level: string | null }

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const FILTERS: ('all' | WorkState)[] = ['all', 'handed_in', 'in_progress', 'not_started', 'returned', 'marked', 'shared']

export function AssignmentStudents({
  assignmentId, published, students, available,
}: {
  assignmentId: string
  published: boolean
  students: TrackedStudent[]
  available: AvailableStudent[]
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | WorkState>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [pickQuery, setPickQuery] = useState('')
  const [assigning, startAssign] = useTransition()
  const [sharing, startShare] = useTransition()
  const [removing, startRemove] = useTransition()
  const [confirmRemove, setConfirmRemove] = useState<TrackedStudent | null>(null)

  const counts = useMemo(() => {
    const c = {} as Record<'all' | WorkState, number>
    FILTERS.forEach(f => { c[f] = 0 })
    students.forEach(s => { c.all++; c[workState(s.submission)]++ })
    return c
  }, [students])

  const visible = students.filter(s =>
    s.full_name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (filter === 'all' || workState(s.submission) === filter),
  )

  const pickable = available.filter(s => s.full_name.toLowerCase().includes(pickQuery.trim().toLowerCase()))
  const toggle = (id: string) => setPicked(p => {
    const n = new Set(p)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const allPicked = pickable.length > 0 && pickable.every(s => picked.has(s.id))

  const assign = () => startAssign(async () => {
    const r = await assignStudentsToAssignment(assignmentId, [...picked])
    if (r?.error) { toast.error(r.error); return }
    toast.success(`${picked.size} student${picked.size > 1 ? 's' : ''} assigned`)
    setPicked(new Set()); setDrawerOpen(false)
  })

  const shareAll = () => startShare(async () => {
    const r = await shareAllResults(assignmentId)
    if (!r.success) { toast.error(r.error); return }
    toast.success(`${r.count} result${r.count === 1 ? '' : 's'} shared`)
  })

  return (
    <section aria-label="Students" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {students.length} assigned{!published && students.length > 0 ? '. Students see it once you publish.' : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          {counts.marked > 0 && (
            <Button size="sm" variant="outline" onClick={shareAll} disabled={sharing}>
              {sharing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Share {counts.marked} marked result{counts.marked > 1 ? 's' : ''}
            </Button>
          )}
          <Button size="sm" onClick={() => { setPicked(new Set()); setPickQuery(''); setDrawerOpen(true) }} disabled={available.length === 0} title={available.length === 0 ? 'Every student you can see is already assigned' : undefined}>
            <UserPlus className="mr-2 size-4" /> Assign students
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <UserPlus className="mx-auto mb-3 size-6 text-primary-text" />
          <p className="text-sm font-semibold">Nobody has this yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {available.length > 0 ? 'Assign students and you can follow each one from not started to marked.' : 'Add students first, then assign them here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students" aria-label="Search students" className="pl-8" />
            </div>
            <div role="group" aria-label="Filter by progress" className="flex flex-wrap rounded-full border border-border bg-surface p-1">
              {FILTERS.filter(f => f === 'all' || counts[f] > 0 || filter === f).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    filter === f ? 'bg-primary-soft text-primary-text' : 'text-muted-foreground hover:text-ink-strong',
                  )}
                >
                  {f === 'all' ? 'All' : workStateMeta[f].label} <span className="ml-1 tabular-nums font-medium opacity-70">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="overflow-hidden rounded-card border bg-card">
            {visible.map((s, i) => {
              const state = workState(s.submission)
              const sub = s.submission
              const reviewable = !!sub && sub.status !== 'in_progress'
              return (
                <li key={s.id} style={{ '--i': i } as React.CSSProperties} className="rise-in flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-3 last:border-b-0 hover:bg-secondary/60">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground" aria-hidden>{initials(s.full_name)}</span>
                  <div className="min-w-0 flex-1 basis-0">
                    <p className="truncate text-sm font-semibold">{s.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sub?.submitted_at ? <>Handed in <When iso={sub.submitted_at} /></> : s.year_level ?? 'Not handed in'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(s)}
                    disabled={!!sub && sub.status !== 'in_progress'}
                    title={sub && sub.status !== 'in_progress' ? 'Has handed work in' : 'Unassign'}
                    aria-label={`Unassign ${s.full_name}`}
                    className="order-2 flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-destructive-soft hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground sm:order-last"
                  >
                    <X className="size-4" />
                  </button>
                  <div className="order-last flex w-full flex-wrap items-center gap-2 pl-12 sm:order-none sm:w-auto sm:flex-nowrap sm:pl-0">
                    <WorkBadge state={state} />
                    {sub?.is_late && sub.status !== 'in_progress' && <LateBadge />}
                    <span className="ml-auto text-sm font-semibold tabular-nums sm:ml-0 sm:w-16 sm:text-right">
                      {sub?.status === 'evaluated' && sub.obtained_marks !== null ? `${sub.obtained_marks} / ${sub.total_marks}` : ''}
                    </span>
                    {reviewable ? (
                      <Button size="sm" variant={sub!.status === 'submitted' ? 'default' : 'outline'} render={<Link href={`/teacher/assignments/${assignmentId}/submissions/${sub!.id}`} />}>
                        {sub!.status === 'submitted' ? 'Review' : 'Open'}
                      </Button>
                    ) : <span className="hidden w-[4.25rem] sm:block" aria-hidden />}
                  </div>
                </li>
              )
            })}
            {visible.length === 0 && (
              <li className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                No students match.
                <button type="button" onClick={() => { setQuery(''); setFilter('all') }} className="font-semibold text-primary-text hover:underline">Clear filters</button>
              </li>
            )}
          </ul>
        </>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="max-w-[440px]"
        title="Assign students"
        description={`${available.length} student${available.length !== 1 ? 's' : ''} available`}
        footer={
          <Button className="w-full" disabled={picked.size === 0 || assigning} onClick={assign}>
            {assigning ? <><Loader2 className="mr-2 size-4 animate-spin" />Assigning…</> : picked.size ? `Assign ${picked.size} student${picked.size > 1 ? 's' : ''}` : 'Select students to assign'}
          </Button>
        }
      >
        <div className="-mx-6 -mt-6">
          <div className="border-b border-border px-6 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={pickQuery} onChange={e => setPickQuery(e.target.value)} placeholder="Search students" aria-label="Search students to assign" className="pl-8" />
            </div>
          </div>
          <button type="button" onClick={() => setPicked(allPicked ? new Set() : new Set(pickable.map(s => s.id)))} className="flex w-full items-center gap-3 border-b border-border px-6 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary">
            <Box checked={allPicked} />
            Select all{pickQuery ? ' shown' : ''}
            {picked.size > 0 && <span className="ml-auto font-semibold tabular-nums text-ink-strong">{picked.size} selected</span>}
          </button>
          {pickable.map(s => (
            <button key={s.id} type="button" onClick={() => toggle(s.id)} className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-secondary">
              <Box checked={picked.has(s.id)} />
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground" aria-hidden>{initials(s.full_name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{s.full_name}</span>
                {s.year_level && <span className="block text-xs text-muted-foreground">{s.year_level}</span>}
              </span>
            </button>
          ))}
          {pickable.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted-foreground">No students match.</p>}
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!confirmRemove}
        onOpenChange={o => { if (!o) setConfirmRemove(null) }}
        title={`Unassign ${confirmRemove?.full_name ?? ''}?`}
        description="They lose this assignment and any draft they started. You can assign them again later."
        confirmLabel="Unassign"
        isPending={removing}
        onConfirm={() => confirmRemove && startRemove(async () => {
          const r = await removeStudentFromAssignment(assignmentId, confirmRemove.id)
          if (r?.error) toast.error(r.error)
          else toast.success(`${confirmRemove.full_name} unassigned`)
          setConfirmRemove(null)
        })}
      />
    </section>
  )
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors', checked ? 'border-primary bg-primary' : 'border-control-border')} aria-hidden>
      {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
    </span>
  )
}
