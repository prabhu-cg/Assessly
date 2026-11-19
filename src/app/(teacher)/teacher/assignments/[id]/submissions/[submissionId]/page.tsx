import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { withSignedUrls } from '@/lib/assignment-files'
import { SubmissionReview } from '@/components/teacher/assignment-review'
import type { AssignmentAnswer, AssignmentQuestion, AssignmentSubmission } from '@/types/database'

export default async function AssignmentReviewPage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments').select('id, title, response_marks, pass_mark, due_at').eq('id', id).eq('teacher_id', user.id).maybeSingle()
  if (!assignment) notFound()

  const { data: submission } = await supabase
    .from('assignment_submissions').select('*').eq('id', submissionId).eq('assignment_id', id).maybeSingle()
  if (!submission) notFound()

  const [{ data: student }, { data: questions }, { data: answers }, { data: files }, { data: queue }] = await Promise.all([
    supabase.from('profiles').select('full_name, year_level').eq('id', submission.student_id).maybeSingle(),
    supabase.from('assignment_questions').select('*').eq('assignment_id', id).order('order_index'),
    supabase.from('assignment_answers').select('*').eq('submission_id', submissionId),
    supabase.from('assignment_submission_files').select('id, name, path, size_bytes, content_type').eq('submission_id', submissionId).order('created_at'),
    supabase.from('assignment_submissions').select('id').eq('assignment_id', id).eq('status', 'submitted').neq('id', submissionId).order('submitted_at').limit(1),
  ])

  return (
    <SubmissionReview
      assignment={assignment}
      submission={submission as AssignmentSubmission}
      studentName={student?.full_name ?? 'Student'}
      yearLevel={student?.year_level ?? null}
      questions={(questions ?? []) as AssignmentQuestion[]}
      answers={(answers ?? []) as AssignmentAnswer[]}
      files={await withSignedUrls(files)}
      nextId={queue?.[0]?.id ?? null}
    />
  )
}
