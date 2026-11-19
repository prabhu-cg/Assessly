import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LocalDate } from '@/components/shared/local-date'
import { Plus, UserPlus, ChevronRight, Clock, ClipboardCheck, BookOpen, NotebookPen } from 'lucide-react'

const QUEUE_LIMIT = 6
const ACTIVE_LIMIT = 6

function ago(iso: string | null) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins || 1} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: tests }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('tests').select('id, title, status, duration_minutes, created_at')
      .eq('teacher_id', user.id).order('created_at', { ascending: false }),
  ])

  const allTests = tests ?? []
  const published = allTests.filter(t => t.status === 'published')
  const testIds = allTests.map(t => t.id)

  const [{ data: subs }, { data: access }] = testIds.length
    ? await Promise.all([
        supabase.from('submissions')
          .select('test_id, status, submitted_at')
          .in('test_id', testIds)
          .in('status', ['submitted', 'in_progress']),
        supabase.from('test_access').select('test_id').in('test_id', published.map(t => t.id)),
      ])
    : [{ data: [] }, { data: [] }]

  const byTest = new Map<string, { waiting: number; live: number; oldest: string | null }>()
  for (const s of subs ?? []) {
    const e = byTest.get(s.test_id) ?? { waiting: 0, live: 0, oldest: null }
    if (s.status === 'submitted') {
      e.waiting++
      if (s.submitted_at && (!e.oldest || s.submitted_at < e.oldest)) e.oldest = s.submitted_at
    } else e.live++
    byTest.set(s.test_id, e)
  }
  const enrolled = new Map<string, number>()
  for (const a of access ?? []) enrolled.set(a.test_id, (enrolled.get(a.test_id) ?? 0) + 1)

  // Assignments: what is waiting for review, and what is out with students. Empty until the assignments migration has run.
  const { data: assignmentRows } = await supabase
    .from('assignments').select('id, title, status, due_at').eq('teacher_id', user.id)
  const myAssignments = assignmentRows ?? []
  const assignmentIds = myAssignments.map(a => a.id)
  const [{ data: aSubs }, { data: aAssignees }] = assignmentIds.length
    ? await Promise.all([
        supabase.from('assignment_submissions').select('assignment_id, status, submitted_at').in('assignment_id', assignmentIds).eq('status', 'submitted'),
        supabase.from('assignment_assignees').select('assignment_id').in('assignment_id', assignmentIds),
      ])
    : [{ data: [] }, { data: [] }]

  const aWaiting = new Map<string, { waiting: number; oldest: string | null }>()
  for (const x of aSubs ?? []) {
    const e = aWaiting.get(x.assignment_id) ?? { waiting: 0, oldest: null }
    e.waiting++
    if (x.submitted_at && (!e.oldest || x.submitted_at < e.oldest)) e.oldest = x.submitted_at
    aWaiting.set(x.assignment_id, e)
  }
  const aAssigned = new Map<string, number>()
  for (const x of aAssignees ?? []) aAssigned.set(x.assignment_id, (aAssigned.get(x.assignment_id) ?? 0) + 1)
  const aTitle = new Map(myAssignments.map(a => [a.id, a.title]))
  const assignmentQueue = [...aWaiting.entries()].map(([id, v]) => ({
    kind: 'assignment' as const, id, title: aTitle.get(id) ?? 'Untitled assignment', waiting: v.waiting, live: 0, oldest: v.oldest,
  }))
  const publishedAssignments = myAssignments
    .filter(a => a.status === 'published')
    .map(a => ({ ...a, assigned: aAssigned.get(a.id) ?? 0, waiting: aWaiting.get(a.id)?.waiting ?? 0 }))
    .sort((x, y) => (x.due_at ?? '9999').localeCompare(y.due_at ?? '9999'))

  const titleOf = new Map(allTests.map(t => [t.id, t.title]))
  const testQueue = [...byTest.entries()]
    .filter(([, v]) => v.waiting > 0)
    .map(([id, v]) => ({ kind: 'test' as const, id, title: titleOf.get(id) ?? 'Untitled test', ...v }))
  const queue = [...testQueue, ...assignmentQueue]
    .sort((a, b) => (a.oldest ?? '').localeCompare(b.oldest ?? ''))
  const totalWaiting = queue.reduce((n, q) => n + q.waiting, 0)

  const active = published
    .map(t => ({ ...t, ...(byTest.get(t.id) ?? { waiting: 0, live: 0, oldest: null }), enrolled: enrolled.get(t.id) ?? 0 }))
    .sort((a, b) => b.live - a.live || b.waiting - a.waiting)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hello, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalWaiting > 0
              ? `${totalWaiting} ${totalWaiting === 1 ? 'submission needs' : 'submissions need'} your marks.`
              : 'Nothing is waiting for your marks.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/teacher/students?new=true" />} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add student
          </Button>
          <Button variant="outline" render={<Link href="/teacher/assignments?new=true" />} className="gap-2">
            <NotebookPen className="h-4 w-4" />
            New assignment
          </Button>
          <Button render={<Link href="/teacher/tests?new=true" />} className="gap-2">
            <Plus className="h-4 w-4" />
            New test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Needs grading */}
        <section className="lg:col-span-3 rounded-xl border border-border bg-card" aria-labelledby="queue-h">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 id="queue-h" className="text-base font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary-text" />
              Needs grading
              {totalWaiting > 0 && <Badge variant="secondary" className="tabular-nums">{totalWaiting}</Badge>}
            </h2>
            <Link href="/teacher/submissions?status=submitted" className="text-sm font-semibold text-primary-text hover:underline">
              All submissions
            </Link>
          </div>
          {queue.length === 0 ? (
            <p className="border-t border-border px-5 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up. New submissions show up here, oldest first.
            </p>
          ) : (
            <ul className="border-t border-border">
              {queue.slice(0, QUEUE_LIMIT).map(q => (
                <li key={`${q.kind}-${q.id}`} className="border-b border-border last:border-b-0">
                  <Link
                    href={q.kind === 'assignment' ? `/teacher/assignments/${q.id}` : `/teacher/submissions?test=${q.id}&status=submitted`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-secondary transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{q.title}</p>
                      <p className="text-xs text-muted-foreground">{q.kind === 'assignment' ? 'Assignment' : 'Test'} · oldest waiting {ago(q.oldest)}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-primary px-2.5 py-0.5 text-xs font-bold text-primary-text tabular-nums">
                      {q.waiting} to grade
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
              {queue.length > QUEUE_LIMIT && (
                <li className="px-5 py-3 text-xs text-muted-foreground">
                  +{queue.length - QUEUE_LIMIT} more with submissions waiting.{' '}
                  <Link href="/teacher/submissions?status=submitted" className="font-semibold text-primary-text hover:underline">See all</Link>
                </li>
              )}
            </ul>
          )}
        </section>

        <div className="space-y-5 lg:col-span-2">
        {/* Published tests */}
        <section className="rounded-xl border border-border bg-card" aria-labelledby="active-h">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 id="active-h" className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-text" />
              Published tests
              <Badge variant="secondary" className="tabular-nums">{published.length}</Badge>
            </h2>
            <Link href="/teacher/tests" className="text-sm font-semibold text-primary-text hover:underline">All tests</Link>
          </div>
          {active.length === 0 ? (
            <p className="border-t border-border px-5 py-10 text-center text-sm text-muted-foreground">
              No published tests yet. Publish one and students can start.
            </p>
          ) : (
            <ul className="border-t border-border">
              {active.slice(0, ACTIVE_LIMIT).map(t => (
                <li key={t.id} className="border-b border-border last:border-b-0">
                  <Link href={`/teacher/tests/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{t.duration_minutes} min
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">{t.enrolled}</span> {t.enrolled === 1 ? 'student' : 'students'}
                      </p>
                    </div>
                    {t.live > 0 && (
                      <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning tabular-nums">
                        {t.live} taking now
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              {active.length > ACTIVE_LIMIT && (
                <li className="px-5 py-3 text-xs text-muted-foreground">
                  +{active.length - ACTIVE_LIMIT} more.{' '}
                  <Link href="/teacher/tests" className="font-semibold text-primary-text hover:underline">See all</Link>
                </li>
              )}
            </ul>
          )}
        </section>

          {/* Published assignments */}
          <section className="rounded-xl border border-border bg-card" aria-labelledby="assign-h">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 id="assign-h" className="text-base font-semibold flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-primary-text" />
                Assignments out
                <Badge variant="secondary" className="tabular-nums">{publishedAssignments.length}</Badge>
              </h2>
              <Link href="/teacher/assignments" className="text-sm font-semibold text-primary-text hover:underline">All assignments</Link>
            </div>
            {publishedAssignments.length === 0 ? (
              <p className="border-t border-border px-5 py-10 text-center text-sm text-muted-foreground">
                No published assignments yet. Publish one and assigned students can start.
              </p>
            ) : (
              <ul className="border-t border-border">
                {publishedAssignments.slice(0, ACTIVE_LIMIT).map(a => (
                  <li key={a.id} className="border-b border-border last:border-b-0">
                    <Link href={`/teacher/assignments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="tabular-nums">{a.assigned}</span> {a.assigned === 1 ? 'student' : 'students'}
                          {a.due_at && <> · due <LocalDate iso={a.due_at} /></>}
                        </p>
                      </div>
                      {a.waiting > 0 && (
                        <span className="shrink-0 rounded-full border border-primary px-2 py-0.5 text-xs font-bold text-primary-text tabular-nums">{a.waiting} to review</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
