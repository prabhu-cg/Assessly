import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UserPlus, ChevronRight, Clock, ClipboardCheck, BookOpen } from 'lucide-react'

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

  const titleOf = new Map(allTests.map(t => [t.id, t.title]))
  const queue = [...byTest.entries()]
    .filter(([, v]) => v.waiting > 0)
    .map(([id, v]) => ({ id, title: titleOf.get(id) ?? 'Untitled test', ...v }))
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
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/teacher/students?new=true" />} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add student
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
              <ClipboardCheck className="h-4 w-4 text-primary" />
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
                <li key={q.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/teacher/submissions?test=${q.id}&status=submitted`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-foreground/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{q.title}</p>
                      <p className="text-xs text-muted-foreground">Oldest waiting {ago(q.oldest)}</p>
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
                  +{queue.length - QUEUE_LIMIT} more tests with submissions waiting.{' '}
                  <Link href="/teacher/submissions?status=submitted" className="font-semibold text-primary-text hover:underline">See all</Link>
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Published tests */}
        <section className="lg:col-span-2 rounded-xl border border-border bg-card" aria-labelledby="active-h">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 id="active-h" className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
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
                  <Link href={`/teacher/tests/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/5 transition-colors">
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
      </div>
    </div>
  )
}
