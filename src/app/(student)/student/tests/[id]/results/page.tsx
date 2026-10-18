import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Home, BookOpen, CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import type { Answer, MCQOption, Question } from '@/types/database'

interface ResultsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submission?: string }>
}

type Perf = 'full' | 'partial' | 'none' | 'pending' | 'skipped'

function getPerf(answer: Answer | undefined, question: Question): Perf {
  if (!answer || answer.is_skipped) return 'skipped'
  if (answer.marks_obtained === null) return 'pending'
  if (answer.marks_obtained === question.marks) return 'full'
  if (answer.marks_obtained > 0) return 'partial'
  return 'none'
}

const perfStyle: Record<Perf, { bar: string; chip: string; dot: string; label: string }> = {
  full:    { bar: 'bg-success', chip: 'bg-success-soft text-success',         dot: 'bg-success',          label: 'Full marks' },
  partial: { bar: 'bg-warning', chip: 'bg-warning-soft text-warning',         dot: 'bg-warning',          label: 'Partial'    },
  none:    { bar: 'bg-destructive',   chip: 'bg-destructive-soft text-destructive',             dot: 'bg-destructive',            label: 'No marks'   },
  pending: { bar: 'bg-border',    chip: 'bg-muted text-muted-foreground',      dot: 'bg-muted-foreground/40', label: 'Pending'   },
  skipped: { bar: 'bg-border',    chip: 'bg-muted text-muted-foreground',      dot: 'bg-muted-foreground/30', label: 'Skipped'   },
}

const typeLabel: Record<string, string> = {
  mcq: 'MCQ', short_answer: 'Short Answer', long_answer: 'Essay',
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const { id } = await params
  const { submission: submissionId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: test },
    { data: submission },
    { data: questions },
    { data: answers },
  ] = await Promise.all([
    supabase.from('tests').select('title, pass_mark').eq('id', id).single(),
    supabase.from('submissions').select('*').eq('id', submissionId ?? '').eq('student_id', user.id).single(),
    supabase.from('questions').select('*').eq('test_id', id).order('order_index'),
    supabase.from('answers').select('*').eq('submission_id', submissionId ?? ''),
  ])

  if (!submission) redirect('/student/dashboard')

  const isEvaluated = submission.status === 'evaluated'
  const answerMap = Object.fromEntries((answers ?? []).map(a => [a.question_id, a as Answer]))

  const obtained = submission.obtained_marks ?? 0
  const total = submission.total_marks ?? 0
  const pct = total > 0 ? Math.round((obtained / total) * 100) : 0
  const hasPassMark = test?.pass_mark != null && test.pass_mark > 0
  const hasPassed = hasPassMark && isEvaluated && obtained >= (test?.pass_mark ?? 0)

  const scoreBarColor = pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-destructive'

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">

      {/* ── Score Hero ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Top section */}
        <div className="px-6 pt-7 pb-6 text-center border-b border-border">
          <div className={cn(
            'h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center',
            isEvaluated ? 'bg-success-soft' : 'bg-primary-soft',
          )}>
            {isEvaluated
              ? <CheckCircle2 className="h-7 w-7 text-success" />
              : <Clock className="h-7 w-7 text-primary" />
            }
          </div>
          <h1 className="text-xl font-bold">
            {isEvaluated ? 'Results Ready' : 'Test Submitted'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{test?.title}</p>
          {submission.submitted_at && (
            <p className="text-xs text-muted-foreground/60 mt-1.5">
              Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Score body */}
        <div className="px-6 py-6">
          {isEvaluated ? (
            <div className="space-y-3">
              {/* Big score */}
              <div className="flex items-end justify-center gap-1.5">
                <span className="text-[4rem] font-bold text-primary leading-none">{obtained}</span>
                <span className="text-2xl text-muted-foreground pb-1">/ {total}</span>
              </div>
              {/* Score bar */}
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', scoreBarColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* Pct + pass/fail */}
              <div className="flex items-center justify-between text-sm pt-0.5">
                <span className="text-muted-foreground">{pct}% score</span>
                {hasPassMark && (
                  <span className={cn('font-semibold', hasPassed ? 'text-success' : 'text-destructive')}>
                    {hasPassed ? '✓ Passed' : '✗ Failed'}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 space-y-2.5">
              <Badge variant="secondary" className="px-4 py-1 text-sm">Awaiting Evaluation</Badge>
              <p className="text-sm text-muted-foreground">
                Your teacher will review and grade your submission. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance Grid ── */}
      {isEvaluated && (questions?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Performance at a glance
          </p>
          <div className="flex flex-wrap gap-2">
            {questions!.map((q, i) => {
              const p = getPerf(answerMap[q.id], q as unknown as Question)
              return (
                <div
                  key={q.id}
                  title={`Q${i + 1} · ${perfStyle[p].label} · ${answerMap[q.id]?.marks_obtained ?? '–'}/${q.marks}`}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-default',
                    perfStyle[p].bar,
                  )}
                >
                  {i + 1}
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {(['full', 'partial', 'none', 'skipped'] as Perf[]).map(p => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('h-2 w-2 rounded-full', perfStyle[p].dot)} />
                {perfStyle[p].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Question Cards ── */}
      {(questions?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isEvaluated ? 'Question breakdown' : 'Your answers'}
          </p>

          {questions!.map((q, index) => {
            const ans = answerMap[q.id]
            const p = getPerf(ans, q as unknown as Question)
            const options = q.options as MCQOption[] | null

            return (
              <div key={q.id} className="rounded-xl border border-border bg-card overflow-hidden flex">
                {/* Left colour strip */}
                <div className={cn('w-1 shrink-0', isEvaluated ? perfStyle[p].bar : 'bg-border')} />

                <div className="flex-1 p-5 space-y-4 min-w-0">

                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <Badge variant="secondary" className="text-xs">{typeLabel[q.type]}</Badge>
                      {q.type === 'mcq' && (
                        <Badge variant="outline" className="text-xs">Auto-graded</Badge>
                      )}
                    </div>

                    {/* Score chip — only when evaluated */}
                    {isEvaluated && (
                      <div className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0',
                        perfStyle[p].chip,
                      )}>
                        {ans?.marks_obtained ?? '–'} / {q.marks}
                        <span className="font-normal hidden sm:inline">· {perfStyle[p].label}</span>
                      </div>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-medium leading-relaxed">{q.content}</p>

                  {/* MCQ options */}
                  {q.type === 'mcq' && options && (
                    <div className="space-y-1.5">
                      {options.map((opt, i) => {
                        const isCorrect = opt.id === q.correct_option_id
                        const isSelected = opt.id === ans?.selected_option_id
                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              'text-sm px-3 py-2 rounded-lg border',
                              isEvaluated ? [
                                isCorrect && isSelected  && 'bg-success-soft border-success/40 text-success',
                                isCorrect && !isSelected && 'bg-success-soft border-success/30 text-success',
                                !isCorrect && isSelected && 'bg-destructive-soft border-destructive/40 text-destructive',
                                !isCorrect && !isSelected && 'border-transparent text-muted-foreground',
                              ] : [
                                isSelected && 'bg-primary/10 border-primary/40 text-foreground font-medium',
                                !isSelected && 'border-transparent text-muted-foreground',
                              ],
                            )}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                            {opt.text}
                            {isEvaluated && isCorrect && <span className="ml-2 text-success font-medium">✓</span>}
                            {isEvaluated && !isCorrect && isSelected && <span className="ml-2 text-destructive font-medium">✗</span>}
                            {!isEvaluated && isSelected && <span className="ml-2 text-primary text-xs font-medium">Your answer</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Text answer */}
                  {(q.type === 'short_answer' || q.type === 'long_answer') && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Your answer
                      </p>
                      {ans?.is_skipped ? (
                        <p className="text-sm text-muted-foreground italic">Skipped</p>
                      ) : ans?.answer_text ? (
                        <div className="text-sm p-3.5 bg-muted/40 rounded-lg border border-border/60 min-h-[48px] whitespace-pre-wrap leading-relaxed">
                          {ans.answer_text}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No answer provided</p>
                      )}
                    </div>
                  )}

                  {/* Teacher comment */}
                  {ans?.teacher_comment && (
                    <div className="flex gap-3 p-3.5 bg-warning-soft border border-warning/30 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-warning mb-1">Teacher&apos;s note</p>
                        <p className="text-sm text-warning leading-relaxed">{ans.teacher_comment}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" render={<Link href="/student/dashboard" />}>
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button render={<Link href="/student/join" />}>
          <BookOpen className="h-4 w-4 mr-2" />
          Join Another Test
        </Button>
      </div>

    </div>
  )
}
