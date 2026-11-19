import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { AssignmentDrawer } from '@/components/teacher/assignment-drawer'
import { AssignmentStatusActions } from '@/components/teacher/assignment-status-actions'
import { AssignmentWorkspace } from '@/components/shared/workspace-tabs'
import { AssignmentStudents, type TrackedStudent, type AvailableStudent } from '@/components/teacher/assignment-students'
import { AssignmentQuestions } from '@/components/teacher/assignment-questions'
import { AssignmentMaterials } from '@/components/teacher/assignment-materials'
import { When, DueIn } from '@/components/shared/assignment-ui'
import { SetupNotice, isMissingTable } from '@/components/shared/setup-notice'
import { withSignedUrls } from '@/lib/assignment-files'
import type { Assignment, AssignmentQuestion } from '@/types/database'

const statusVariant = { draft: 'muted', published: 'success', archived: 'outline' } as const

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment, error } = await supabase
    .from('assignments').select('*').eq('id', id).eq('teacher_id', user.id).maybeSingle()
  if (isMissingTable(error)) return <SetupNotice />
  if (!assignment) notFound()
  const a = assignment as Assignment

  const [{ data: questions }, { data: files }, { data: assignees }, { data: subs }, { data: everyone }] = await Promise.all([
    supabase.from('assignment_questions').select('*').eq('assignment_id', id).order('order_index'),
    supabase.from('assignment_files').select('id, name, path, size_bytes, content_type').eq('assignment_id', id).order('created_at'),
    supabase.from('assignment_assignees').select('student_id').eq('assignment_id', id),
    supabase.from('assignment_submissions')
      .select('id, student_id, status, submitted_at, is_late, obtained_marks, total_marks, released_at').eq('assignment_id', id),
    supabase.from('profiles').select('id, full_name, year_level').eq('role', 'student').order('full_name'),
  ])

  const qs = (questions ?? []) as AssignmentQuestion[]
  const resources = await withSignedUrls(files)
  const subBy = new Map((subs ?? []).map(s => [s.student_id, s]))
  const assignedIds = new Set((assignees ?? []).map(r => r.student_id))
  const people = new Map((everyone ?? []).map(p => [p.id, p]))

  const students: TrackedStudent[] = [...assignedIds]
    .map(sid => ({
      id: sid,
      full_name: people.get(sid)?.full_name ?? 'Unknown student',
      year_level: people.get(sid)?.year_level ?? null,
      submission: (subBy.get(sid) as TrackedStudent['submission']) ?? null,
    }))
    .sort((x, y) => x.full_name.localeCompare(y.full_name))

  const available: AvailableStudent[] = (everyone ?? [])
    .filter(p => !assignedIds.has(p.id))
    .map(p => ({ id: p.id, full_name: p.full_name, year_level: p.year_level ?? null }))

  const totalMarks = a.response_marks + qs.reduce((n, q) => n + q.marks, 0)
  const handedIn = students.filter(s => s.submission && s.submission.status !== 'in_progress' && s.submission.status !== 'returned').length
  const toReview = students.filter(s => s.submission?.status === 'submitted').length
  const late = students.filter(s => s.submission?.is_late && s.submission.status !== 'in_progress').length
  const marked = students.filter(s => s.submission?.status === 'evaluated' && s.submission.total_marks)
  const avg = marked.length
    ? Math.round(marked.reduce((n, s) => n + (s.submission!.obtained_marks! / s.submission!.total_marks!) * 100, 0) / marked.length)
    : null
  const passRate = marked.length && !!a.pass_mark
    ? Math.round((marked.filter(s => s.submission!.obtained_marks! >= a.pass_mark!).length / marked.length) * 100)
    : null

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-3 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right tabular-nums">{value}</dd></div>
  )
  const none = (t: string) => <span className="text-muted-foreground">{t}</span>

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Assignments', href: '/teacher/assignments' }, { label: a.title }]}
        title={a.title}
        badges={<Badge variant={statusVariant[a.status]}>{a.status}</Badge>}
        description={a.description}
        actions={
          <>
            <AssignmentDrawer assignment={a} />
            <AssignmentStatusActions id={id} status={a.status} />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0">
          <AssignmentWorkspace
            tabs={[
              { key: 'students', label: 'Students', count: students.length, content: <AssignmentStudents assignmentId={id} published={a.status === 'published'} students={students} available={available} /> },
              { key: 'questions', label: 'Questions', count: qs.length, content: <AssignmentQuestions key={qs.map(q => `${q.id}:${q.order_index}:${q.marks}:${q.content}`).join('|')} assignmentId={id} questions={qs} /> },
              { key: 'materials', label: 'Brief', content: (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Brief students will read</h3>
                    {a.instructions
                      ? <p className="max-w-prose whitespace-pre-wrap text-sm text-muted-foreground">{a.instructions}</p>
                      : <p className="text-sm text-muted-foreground">No brief yet. Use Edit to write one.</p>}
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Files for students</h3>
                    <AssignmentMaterials assignmentId={id} files={resources} />
                  </div>
                </div>
              ) },
            ]}
          />
        </div>

        <aside className="space-y-3" aria-label="Assignment summary">
          <h2 className="text-sm font-semibold">At a glance</h2>
          <dl className="divide-y divide-border rounded-card border bg-card px-4 text-sm">
            {row('Due', a.due_at ? <span className="flex flex-col items-end"><When iso={a.due_at} /><DueIn iso={a.due_at} /></span> : none('No due date'))}
            {row('Total marks', totalMarks)}
            {row('Typed work and files', a.response_marks > 0 ? `${a.response_marks} marks` : none('Not marked'))}
            {row('Pass mark', !!a.pass_mark ? `${a.pass_mark} / ${totalMarks}` : none('Not set'))}
          </dl>
          <dl className="divide-y divide-border rounded-card border bg-card px-4 text-sm">
            {row('Assigned', students.length)}
            {row('Handed in', `${handedIn} of ${students.length}`)}
            {row('Waiting for review', toReview > 0 ? <span className="font-bold text-primary-text">{toReview}</span> : 0)}
            {row('Late', late)}
            {row('Average score', avg !== null ? `${avg}%` : none('No marks yet'))}
            {row('Pass rate', passRate !== null ? `${passRate}%` : none('-'))}
          </dl>
        </aside>
      </div>
    </div>
  )
}
