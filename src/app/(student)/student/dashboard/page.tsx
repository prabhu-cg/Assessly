import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { NoticeToast } from '@/components/shared/notice-toast'
import { StudentTests, type StudentTest } from '@/components/student/student-tests'
import { listStudentAssignments } from '@/lib/student-assignments'
import Link from 'next/link'
import { NotebookPen, ChevronRight } from 'lucide-react'

interface StudentDashboardProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentDashboard({ searchParams }: StudentDashboardProps) {
  const { tab = 'tests' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: accessRows } = await supabase
    .from('test_access')
    .select('test_id, test:tests(id, title, description, duration_minutes, status)')
    .eq('student_id', user.id)

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, test_id, status, submitted_at, obtained_marks, total_marks')
    .eq('student_id', user.id)

  const subMap = new Map((submissions ?? []).map(s => [s.test_id, s]))

  const items: StudentTest[] = []
  for (const row of accessRows ?? []) {
    const t = Array.isArray(row.test) ? row.test[0] : row.test
    if (!t) continue
    const sub = subMap.get(t.id)
    if (sub && (sub.status === 'submitted' || sub.status === 'evaluated')) {
      items.push({
        id: t.id, title: t.title, description: t.description, minutes: t.duration_minutes,
        state: sub.status === 'evaluated' ? 'marked' : 'waiting',
        submissionId: sub.id, submittedAt: sub.submitted_at,
        obtained: sub.obtained_marks, total: sub.total_marks,
      })
    } else if (t.status === 'published') {
      items.push({
        id: t.id, title: t.title, description: t.description, minutes: t.duration_minutes,
        state: sub?.status === 'in_progress' ? 'in_progress' : 'ready',
        submissionId: sub?.id ?? null, submittedAt: null, obtained: null, total: null,
      })
    }
  }

  // Assignments still to do (including ones sent back for changes), soonest due first.
  const { items: assignmentItems } = await listStudentAssignments(user.id)
  const openAssignments = assignmentItems
    .filter(a => a.state === 'todo' || a.state === 'in_progress' || a.state === 'returned')
    .sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999'))
  const needChanges = openAssignments.filter(a => a.state === 'returned').length

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="w-full">
      <Suspense><NoticeToast /></Suspense>
      {openAssignments.length > 0 && (
        <Link
          href="/student/assignments"
          className="group mb-6 flex items-center gap-3 rounded-card border bg-card px-4 py-3 outline-none transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
            <NotebookPen className="size-5 text-primary-text" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold tabular-nums">
              {openAssignments.length} assignment{openAssignments.length !== 1 ? 's' : ''} to do
              {needChanges > 0 && <span className="text-warning"> · {needChanges} sent back for changes</span>}
            </span>
            <span className="block truncate text-sm text-muted-foreground">Next: {openAssignments[0].title}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      )}
      <StudentTests firstName={firstName} items={items} initialTab={tab === 'done' ? 'done' : 'todo'} />
    </div>
  )
}
