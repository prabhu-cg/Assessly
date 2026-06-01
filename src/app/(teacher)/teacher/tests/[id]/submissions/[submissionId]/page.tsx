import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EvaluationForm } from './evaluation-form'

interface Props {
  params: Promise<{ id: string; submissionId: string }>
}

export default async function EvaluationPage({ params }: Props) {
  const { id: testId, submissionId } = await params
  const supabase = await createClient()

  const [{ data: submission }, { data: questions }, { data: answers }] = await Promise.all([
    supabase.from('submissions').select('*, student:profiles(full_name, email), test:tests(title, pass_mark)').eq('id', submissionId).single(),
    supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
    supabase.from('answers').select('*').eq('submission_id', submissionId),
  ])

  if (!submission) notFound()

  return (
    <EvaluationForm
      testId={testId}
      submissionId={submissionId}
      initialSubmission={submission}
      initialQuestions={questions ?? []}
      initialAnswers={answers ?? []}
    />
  )
}
