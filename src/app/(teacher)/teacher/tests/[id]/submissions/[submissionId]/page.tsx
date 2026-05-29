'use client'

import { useState, useTransition, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { evaluateAnswer, finalizeEvaluation } from '@/app/actions/submissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Loader2, Save } from 'lucide-react'

export default function EvaluationPage() {
  const params = useParams()
  const testId = params.id as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = async () => {
    const supabase = createClient()
    const [{ data: sub }, { data: q }, { data: a }] = await Promise.all([
      supabase.from('submissions').select('*, student:profiles(full_name, email), test:tests(title, pass_mark)').eq('id', submissionId).single(),
      supabase.from('questions').select('*').eq('test_id', testId).order('order_index'),
      supabase.from('answers').select('*').eq('submission_id', submissionId),
    ])
    setSubmission(sub)
    setQuestions(q ?? [])
    setAnswers(a ?? [])

    const initialMarks: Record<string, string> = {}
    const initialComments: Record<string, string> = {}
    a?.forEach(ans => {
      initialMarks[ans.id] = ans.marks_obtained !== null ? String(ans.marks_obtained) : ''
      initialComments[ans.id] = ans.teacher_comment ?? ''
    })
    setMarks(initialMarks)
    setComments(initialComments)
  }

  useEffect(() => { refresh() }, [submissionId])

  const handleSaveAnswer = async (answerId: string, questionMarks: number) => {
    setSaving(s => ({ ...s, [answerId]: true }))
    const result = await evaluateAnswer(answerId, {
      marks_obtained: Number(marks[answerId] ?? 0),
      teacher_comment: comments[answerId] || undefined,
    })
    setSaving(s => ({ ...s, [answerId]: false }))
    if (result?.error) setError(result.error)
    else refresh()
  }

  const handleFinalize = () => {
    startTransition(async () => {
      const result = await finalizeEvaluation(submissionId)
      if (result?.error) setError(result.error)
      else refresh()
    })
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  const evaluatedCount = answers.filter(a => a.marks_obtained !== null).length
  const currentScore = answers.reduce((sum, a) => sum + (a.marks_obtained ?? 0), 0)
  const progressPct = answers.length > 0 ? (evaluatedCount / answers.length) * 100 : 0

  const getAnswerForQuestion = (questionId: string) =>
    answers.find(a => a.question_id === questionId)

  const typeLabel: Record<string, string> = {
    mcq: 'MCQ',
    short_answer: 'Short Answer',
    long_answer: 'Essay',
  }

  if (!submission) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold">Evaluate Submission</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {submission.student?.full_name} — {submission.test?.title}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Evaluated: {evaluatedCount}/{answers.length} answers
            </span>
            <span className="font-semibold">
              Score so far: {currentScore}/{totalMarks}
            </span>
          </div>
          <Progress value={progressPct} />
          <div className="flex items-center gap-2">
            <Badge
              variant={
                submission.status === 'evaluated'
                  ? 'default'
                  : 'secondary'
              }
            >
              {submission.status}
            </Badge>
            {submission.status === 'evaluated' && (
              <span className="text-sm text-muted-foreground">
                Final score: {submission.obtained_marks}/{submission.total_marks}
                {submission.test?.pass_mark && (
                  <> · {submission.obtained_marks >= submission.test.pass_mark ? '✓ Passed' : '✗ Failed'}</>
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      {questions.map((question, index) => {
        const answer = getAnswerForQuestion(question.id)
        const isAutoGraded = question.type === 'mcq'
        const isCorrect =
          question.type === 'mcq' &&
          answer?.selected_option_id === question.correct_option_id

        return (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium leading-snug">{question.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{typeLabel[question.type]}</Badge>
                    <span className="text-xs text-muted-foreground">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
                    {isAutoGraded && (
                      <Badge variant="outline" className="text-xs">Auto-graded</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student's answer */}
              {question.type === 'mcq' && (
                <div className="space-y-2">
                  {question.options?.map((opt: any, i: number) => (
                    <div
                      key={opt.id}
                      className={`text-sm px-3 py-2 rounded border ${
                        opt.id === question.correct_option_id
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : opt.id === answer?.selected_option_id
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : 'border-transparent bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}. {opt.text}
                      {opt.id === question.correct_option_id && ' ✓'}
                      {opt.id === answer?.selected_option_id && opt.id !== question.correct_option_id && ' ✗'}
                    </div>
                  ))}
                </div>
              )}

              {(question.type === 'short_answer' || question.type === 'long_answer') && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student's Answer</p>
                  {answer?.answer_text ? (
                    <div className="text-sm p-3 bg-muted/50 rounded border min-h-[60px] whitespace-pre-wrap">
                      {answer.answer_text}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No answer provided</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Grading */}
              {answer && !isAutoGraded && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Marks (max {question.marks})</Label>
                      <Input
                        type="number"
                        min={0}
                        max={question.marks}
                        value={marks[answer.id] ?? ''}
                        onChange={e => setMarks(m => ({ ...m, [answer.id]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Comment (optional)</Label>
                    <Textarea
                      value={comments[answer.id] ?? ''}
                      onChange={e => setComments(c => ({ ...c, [answer.id]: e.target.value }))}
                      placeholder="Feedback for the student..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveAnswer(answer.id, question.marks)}
                    disabled={saving[answer.id]}
                  >
                    {saving[answer.id] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              )}

              {answer && isAutoGraded && (
                <p className="text-sm text-muted-foreground">
                  Auto-graded: {answer.marks_obtained}/{question.marks} marks
                  {isCorrect ? ' — Correct' : ' — Incorrect'}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Finalize */}
      {submission.status === 'submitted' && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <p className="font-medium text-sm">Ready to finalize?</p>
            <p className="text-xs text-muted-foreground">
              This will mark the submission as evaluated and calculate the final score.
            </p>
          </div>
          <Button onClick={handleFinalize} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Finalize Evaluation
          </Button>
        </div>
      )}
    </div>
  )
}
