'use server'

import { createClient } from '@/lib/supabase/server'
import type { StudentRow, StudentTestEntry } from '@/components/teacher/student-types'

/** One student's profile plus their tests and results, for the details drawer. */
export async function getStudentDetails(studentId: string): Promise<{ error: string } | { student: StudentRow }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  type Base = { id: string; full_name: string; created_at: string; year_level?: string | null }
  const first = await supabase
    .from('profiles')
    .select('id, full_name, created_at, year_level')
    .eq('id', studentId)
    .eq('created_by', user.id)
    .eq('role', 'student')
    .single()
  let profile = first.data as Base | null
  if (first.error) {
    // year_level migration not applied yet: fall back so the drawer still works.
    const fallback = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('id', studentId)
      .eq('created_by', user.id)
      .eq('role', 'student')
      .single()
    profile = fallback.data as Base | null
  }
  if (!profile) return { error: 'Student not found' }

  const [{ data: access }, { data: subs }] = await Promise.all([
    supabase.from('test_access').select('student_id, test:tests(id, title, teacher_id)').eq('student_id', studentId),
    supabase.from('submissions')
      .select('id, test_id, student_id, status, obtained_marks, total_marks, submitted_at')
      .eq('student_id', studentId),
  ])

  const subMap = new Map((subs ?? []).map(x => [x.test_id, x]))
  const tests = (access ?? []).flatMap(a => {
    const t = Array.isArray(a.test) ? a.test[0] : a.test
    if (!t || t.teacher_id !== user.id) return []
    const sub = subMap.get(t.id)
    const state: StudentTestEntry['state'] =
      sub?.status === 'evaluated' ? 'marked' : sub?.status === 'submitted' ? 'to_grade' : sub?.status === 'in_progress' ? 'in_progress' : 'not_started'
    return [{
      testId: t.id, submissionId: sub?.id ?? null, title: t.title, state,
      obtained: sub?.obtained_marks ?? null, total: sub?.total_marks ?? null, submittedAt: sub?.submitted_at ?? null,
    }]
  })

  return {
    student: {
      id: profile.id,
      full_name: profile.full_name,
      created_at: profile.created_at,
      year_level: profile.year_level ?? null,
      tests,
    },
  }
}
