import { createAdminClient } from '@/lib/supabase/admin'
import { withSignedUrls } from '@/lib/assignment-files'

/**
 * Students have no RLS access to assignment tables. These loaders use the service role, only ever for the signed-in
 * student's own assignments, and strip marks, comments and answer keys until the teacher has shared the result.
 */

export type StudentAssignmentState = 'todo' | 'in_progress' | 'returned' | 'waiting' | 'marked'

export type StudentAssignmentItem = {
  id: string
  title: string
  description: string | null
  due_at: string | null
  state: StudentAssignmentState
  submitted_at: string | null
  is_late: boolean
  obtained: number | null
  total: number | null
}

export async function listStudentAssignments(studentId: string): Promise<{ items: StudentAssignmentItem[]; missingTables: boolean }> {
  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from('assignment_assignees')
    .select('assignment:assignments(id, title, description, due_at, status, response_marks)')
    .eq('student_id', studentId)
  if (error) return { items: [], missingTables: /does not exist|schema cache/i.test(error.message) || error.code === 'PGRST205' }

  const { data: subs } = await admin
    .from('assignment_submissions')
    .select('assignment_id, status, submitted_at, is_late, obtained_marks, total_marks, released_at')
    .eq('student_id', studentId)
  const subBy = new Map((subs ?? []).map(s => [s.assignment_id, s]))

  const items: StudentAssignmentItem[] = []
  for (const r of rows ?? []) {
    const a = Array.isArray(r.assignment) ? r.assignment[0] : r.assignment
    if (!a || a.status !== 'published') continue
    const s = subBy.get(a.id)
    let state: StudentAssignmentState = 'todo'
    if (s?.status === 'in_progress') state = 'in_progress'
    else if (s?.status === 'returned') state = 'returned'
    else if (s?.status === 'submitted') state = 'waiting'
    else if (s?.status === 'evaluated') state = s.released_at ? 'marked' : 'waiting'
    items.push({
      id: a.id, title: a.title, description: a.description, due_at: a.due_at, state,
      submitted_at: s?.submitted_at ?? null,
      is_late: !!s?.is_late,
      obtained: state === 'marked' ? s?.obtained_marks ?? null : null,
      total: state === 'marked' ? s?.total_marks ?? null : null,
    })
  }
  return { items, missingTables: false }
}

export async function loadStudentAssignment(studentId: string, assignmentId: string) {
  const admin = createAdminClient()
  const { data: assignee } = await admin
    .from('assignment_assignees').select('student_id').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle()
  if (!assignee) return null

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, title, description, instructions, due_at, status, response_marks, pass_mark')
    .eq('id', assignmentId).eq('status', 'published').maybeSingle()
  if (!assignment) return null

  const [{ data: questions }, { data: resources }, { data: submission }] = await Promise.all([
    admin.from('assignment_questions').select('*').eq('assignment_id', assignmentId).order('order_index'),
    admin.from('assignment_files').select('id, name, path, size_bytes, content_type').eq('assignment_id', assignmentId).order('created_at'),
    admin.from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle(),
  ])

  const released = !!submission?.released_at && submission.status === 'evaluated'
  const [answers, myFiles] = submission
    ? await Promise.all([
        admin.from('assignment_answers').select('question_id, answer_text, selected_option_id, marks_obtained, teacher_comment').eq('submission_id', submission.id).then(r => r.data ?? []),
        admin.from('assignment_submission_files').select('id, name, path, size_bytes, content_type').eq('submission_id', submission.id).order('created_at').then(r => r.data ?? []),
      ])
    : [[], []]

  return {
    assignment,
    // Answer keys leave the server only once the teacher has shared the result.
    questions: (questions ?? []).map(q => ({
      id: q.id as string,
      type: q.type as 'mcq' | 'short_answer' | 'long_answer',
      content: q.content as string,
      options: q.options as { id: string; text: string }[] | null,
      image_url: (q.image_url ?? null) as string | null,
      marks: q.marks as number,
      // Answer keys leave the server only once the teacher has shared the result.
      correct_option_id: (released ? q.correct_option_id : null) as string | null,
    })),
    resources: await withSignedUrls(resources),
    submission: submission
      ? {
          id: submission.id as string,
          status: submission.status as 'in_progress' | 'submitted' | 'returned' | 'evaluated',
          response_text: submission.response_text as string | null,
          submitted_at: submission.submitted_at as string | null,
          is_late: submission.is_late as boolean,
          released,
          // A returned submission carries the teacher's note; marks and comments stay hidden until shared.
          return_note: submission.status === 'returned' ? (submission.overall_feedback as string | null) : null,
          overall_feedback: released ? (submission.overall_feedback as string | null) : null,
          response_marks_obtained: released ? (submission.response_marks_obtained as number | null) : null,
          obtained_marks: released ? (submission.obtained_marks as number | null) : null,
          total_marks: released ? (submission.total_marks as number | null) : null,
        }
      : null,
    answers: answers.map(a => ({
      question_id: a.question_id as string,
      answer_text: a.answer_text as string | null,
      selected_option_id: a.selected_option_id as string | null,
      marks_obtained: released ? (a.marks_obtained as number | null) : null,
      teacher_comment: released ? (a.teacher_comment as string | null) : null,
    })),
    files: await withSignedUrls(myFiles),
  }
}

export type LoadedStudentAssignment = NonNullable<Awaited<ReturnType<typeof loadStudentAssignment>>>
