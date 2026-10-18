import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import type { StudentRow, StudentTestEntry } from '@/components/teacher/student-types'
import { StudentsBrowser } from '@/components/teacher/students-browser'
import { Users } from 'lucide-react'
import { CreateStudentDrawer } from '@/components/teacher/create-student-drawer'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  type Base = { id: string; full_name: string; created_at: string; year_level?: string | null }
  const first = await supabase
    .from('profiles')
    .select('id, full_name, created_at, year_level')
    .eq('created_by', user.id)
    .eq('role', 'student')
    .order('full_name')
  let students = first.data
  if (first.error) {
    // year_level migration not applied yet: fall back so the page still works.
    const fallback = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('created_by', user.id)
      .eq('role', 'student')
      .order('full_name')
    students = fallback.data as typeof students
  }
  const list = (students ?? []) as Base[]
  const ids = list.map(s => s.id)

  const [{ data: access }, { data: subs }] = ids.length
    ? await Promise.all([
        supabase.from('test_access').select('student_id, test:tests(id, title, teacher_id)').in('student_id', ids),
        supabase.from('submissions')
          .select('id, test_id, student_id, status, obtained_marks, total_marks, submitted_at')
          .in('student_id', ids),
      ])
    : [{ data: [] }, { data: [] }]

  const subMap = new Map((subs ?? []).map(x => [`${x.student_id}:${x.test_id}`, x]))
  const rows: StudentRow[] = list.map(st => ({
    id: st.id,
    full_name: st.full_name,
    created_at: st.created_at,
    year_level: st.year_level ?? null,
    tests: (access ?? [])
      .filter(a => a.student_id === st.id)
      .flatMap(a => {
        const t = Array.isArray(a.test) ? a.test[0] : a.test
        if (!t || t.teacher_id !== user.id) return []
        const sub = subMap.get(`${st.id}:${t.id}`)
        const state: StudentTestEntry['state'] =
          sub?.status === 'evaluated' ? 'marked' : sub?.status === 'submitted' ? 'to_grade' : sub?.status === 'in_progress' ? 'in_progress' : 'not_started'
        return [{
          testId: t.id, submissionId: sub?.id ?? null, title: t.title, state,
          obtained: sub?.obtained_marks ?? null, total: sub?.total_marks ?? null, submittedAt: sub?.submitted_at ?? null,
        }]
      }),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${list.length} student${list.length !== 1 ? 's' : ''} registered`}
        actions={<CreateStudentDrawer defaultOpen={params.new === 'true'} />}
      />

      {list.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No students yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create student accounts to get started</p>
            <CreateStudentDrawer label="Add Student" />
          </CardContent>
        </Card>
      )}

      {(list.length) > 0 && <StudentsBrowser students={rows} />}
    </div>
  )
}
