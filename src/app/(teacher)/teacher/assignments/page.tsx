import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { NotebookPen } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { AssignmentDrawer } from '@/components/teacher/assignment-drawer'
import { AssignmentsBrowser, type AssignmentRow } from '@/components/teacher/assignments-browser'
import { SetupNotice, isMissingTable } from '@/components/shared/setup-notice'

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  if (isMissingTable(error)) return <SetupNotice />

  const ids = (assignments ?? []).map(a => a.id)
  const [{ data: questions }, { data: assignees }, { data: subs }] = ids.length
    ? await Promise.all([
        supabase.from('assignment_questions').select('assignment_id').in('assignment_id', ids),
        supabase.from('assignment_assignees').select('assignment_id').in('assignment_id', ids),
        supabase.from('assignment_submissions').select('assignment_id, status').in('assignment_id', ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const tally = (rows: { assignment_id: string }[] | null) => {
    const m = new Map<string, number>()
    for (const r of rows ?? []) m.set(r.assignment_id, (m.get(r.assignment_id) ?? 0) + 1)
    return m
  }
  const qCount = tally(questions)
  const aCount = tally(assignees)
  const handedIn = tally((subs ?? []).filter(s => s.status !== 'in_progress' && s.status !== 'returned'))
  const toReview = tally((subs ?? []).filter(s => s.status === 'submitted'))

  const rows: AssignmentRow[] = (assignments ?? []).map(a => ({
    ...a,
    question_count: qCount.get(a.id) ?? 0,
    assigned: aCount.get(a.id) ?? 0,
    handed_in: handedIn.get(a.id) ?? 0,
    to_review: toReview.get(a.id) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Set work for your students, then track, mark and share the results"
        actions={<AssignmentDrawer defaultOpen={params.new === 'true'} />}
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
              <NotebookPen className="size-6 text-primary-text" />
            </div>
            <h3 className="mb-1 font-semibold">No assignments yet</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Write a brief, attach files, add questions if you like, and give it to the students who should do it.
            </p>
            <AssignmentDrawer label="Create assignment" />
          </CardContent>
        </Card>
      ) : (
        <AssignmentsBrowser assignments={rows} />
      )}
    </div>
  )
}
