import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudentAssignmentEntry } from '@/components/teacher/student-types'

/**
 * Every assignment this teacher gave each student, with where their work stands.
 * Uses the teacher's own client, so row-level security limits it to their assignments.
 * Before the assignments migration has run this returns nothing instead of failing.
 */
export async function loadAssignmentEntries(
  supabase: SupabaseClient,
  teacherId: string,
  studentIds: string[],
): Promise<Map<string, StudentAssignmentEntry[]>> {
  const out = new Map<string, StudentAssignmentEntry[]>()
  if (!studentIds.length) return out

  const [{ data: rows, error }, { data: subs }] = await Promise.all([
    supabase
      .from('assignment_assignees')
      .select('student_id, assignment:assignments(id, title, teacher_id, status, due_at)')
      .in('student_id', studentIds),
    supabase
      .from('assignment_submissions')
      .select('id, assignment_id, student_id, status, is_late, obtained_marks, total_marks, submitted_at, released_at')
      .in('student_id', studentIds),
  ])
  if (error) return out

  const subBy = new Map((subs ?? []).map(s => [`${s.student_id}:${s.assignment_id}`, s]))
  for (const r of rows ?? []) {
    const a = Array.isArray(r.assignment) ? r.assignment[0] : r.assignment
    if (!a || a.teacher_id !== teacherId || a.status === 'draft') continue
    const s = subBy.get(`${r.student_id}:${a.id}`)
    const entry: StudentAssignmentEntry = {
      assignmentId: a.id,
      submissionId: s?.id ?? null,
      title: a.title,
      status: s?.status ?? 'not_started',
      released: !!s?.released_at,
      isLate: !!s?.is_late,
      obtained: s?.obtained_marks ?? null,
      total: s?.total_marks ?? null,
      submittedAt: s?.submitted_at ?? null,
      dueAt: a.due_at,
    }
    out.set(r.student_id, [...(out.get(r.student_id) ?? []), entry])
  }
  return out
}
