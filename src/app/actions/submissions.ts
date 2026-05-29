'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { evaluationSchema } from '@/lib/validators/schemas'

export async function startSubmission(testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already has an in-progress submission
  const { data: existing } = await supabase
    .from('submissions')
    .select('id, status')
    .eq('test_id', testId)
    .eq('student_id', user.id)
    .single()

  if (existing) {
    if (existing.status === 'submitted' || existing.status === 'evaluated') {
      return { error: 'You have already submitted this test' }
    }
    return { submissionId: existing.id }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({ test_id: testId, student_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }
  return { submissionId: data.id }
}

export async function saveAnswer(
  submissionId: string,
  questionId: string,
  answer: { answer_text?: string; selected_option_id?: string; is_skipped?: boolean }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('answers').upsert(
    {
      submission_id: submissionId,
      question_id: questionId,
      answer_text: answer.answer_text ?? null,
      selected_option_id: answer.selected_option_id ?? null,
      is_skipped: answer.is_skipped ?? false,
      last_saved_at: new Date().toISOString(),
    },
    { onConflict: 'submission_id,question_id' }
  )

  if (error) return { error: error.message }
  return { success: true }
}

export async function submitTest(submissionId: string, testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Calculate auto-score for MCQ questions
  const { data: answers } = await supabase
    .from('answers')
    .select('question_id, selected_option_id, is_skipped')
    .eq('submission_id', submissionId)

  const { data: questions } = await supabase
    .from('questions')
    .select('id, type, correct_option_id, marks')
    .eq('test_id', testId)

  let totalMarks = 0
  let obtainedMarks = 0
  let hasMcq = false

  if (questions && answers) {
    for (const question of questions) {
      totalMarks += question.marks
      if (question.type === 'mcq') {
        hasMcq = true
        const answer = answers.find(a => a.question_id === question.id)
        if (answer?.selected_option_id === question.correct_option_id) {
          obtainedMarks += question.marks
          // Update answer with auto-graded marks
          await supabase
            .from('answers')
            .update({ marks_obtained: question.marks })
            .eq('submission_id', submissionId)
            .eq('question_id', question.id)
        } else if (answer && !answer.is_skipped) {
          await supabase
            .from('answers')
            .update({ marks_obtained: 0 })
            .eq('submission_id', submissionId)
            .eq('question_id', question.id)
        }
      }
    }
  }

  const hasSubjectiveQuestions = questions?.some(q => q.type !== 'mcq')

  await supabase
    .from('submissions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      total_marks: totalMarks,
      // Only set obtained_marks if no manual grading needed
      obtained_marks: hasSubjectiveQuestions ? null : obtainedMarks,
    })
    .eq('id', submissionId)
    .eq('student_id', user.id)

  revalidatePath('/student/dashboard')
  redirect(`/student/tests/${testId}/results?submission=${submissionId}`)
}

export async function evaluateAnswer(answerId: string, data: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = evaluationSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('answers')
    .update({
      marks_obtained: parsed.data.marks_obtained,
      teacher_comment: parsed.data.teacher_comment ?? null,
    })
    .eq('id', answerId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function finalizeEvaluation(submissionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: answers } = await supabase
    .from('answers')
    .select('marks_obtained')
    .eq('submission_id', submissionId)

  const obtainedMarks = answers?.reduce((sum, a) => sum + (a.marks_obtained ?? 0), 0) ?? 0

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'evaluated', obtained_marks: obtainedMarks })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath('/teacher/submissions')
  return { success: true }
}
