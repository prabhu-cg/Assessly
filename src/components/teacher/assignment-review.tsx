'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CornerUpLeft, EyeOff, Loader2, Save, Send, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { saveReview, finishReview, returnSubmission, setResultShared } from '@/app/actions/assignments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { QuestionImage } from '@/components/shared/question-image'
import { PageHeader } from '@/components/shared/page-header'
import { FileList, LateBadge, When, WorkBadge, workState } from '@/components/shared/assignment-ui'
import type { AssignmentAnswer, AssignmentFile, AssignmentQuestion, AssignmentSubmission } from '@/types/database'

const TYPE_LABEL: Record<string, string> = { mcq: 'Multiple choice', short_answer: 'Short answer', long_answer: 'Essay' }

const clamp = (raw: string, max: number) => (raw === '' ? '' : String(Math.min(Math.max(Math.round(Number(raw)), 0), max)))

export function SubmissionReview({
  assignment, submission, studentName, yearLevel, questions, answers, files, nextId,
}: {
  assignment: { id: string; title: string; response_marks: number; pass_mark: number | null; due_at: string | null }
  submission: AssignmentSubmission
  studentName: string
  yearLevel: string | null
  questions: AssignmentQuestion[]
  answers: AssignmentAnswer[]
  files: AssignmentFile[]
  nextId: string | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [respMarks, setRespMarks] = useState(submission.response_marks_obtained !== null ? String(submission.response_marks_obtained) : '')
  const [feedback, setFeedback] = useState(submission.status === 'returned' ? '' : submission.overall_feedback ?? '')
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(answers.map(a => [a.id, a.marks_obtained !== null ? String(a.marks_obtained) : ''])))
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(answers.map(a => [a.id, a.teacher_comment ?? ''])))
  const [returnOpen, setReturnOpen] = useState(false)
  const [note, setNote] = useState('')

  const answerFor = (qid: string) => answers.find(a => a.question_id === qid)
  const state = workState(submission)
  const totalMarks = assignment.response_marks + questions.reduce((n, q) => n + q.marks, 0)
  const live = useMemo(
    () => (respMarks === '' ? 0 : Number(respMarks)) + answers.reduce((n, a) => n + (marks[a.id] === '' ? 0 : Number(marks[a.id] ?? 0)), 0),
    [respMarks, answers, marks],
  )
  const needing = answers.filter(a => marks[a.id] === '').length + (assignment.response_marks > 0 && respMarks === '' ? 1 : 0)
  const open = submission.status === 'in_progress'
  const evaluated = submission.status === 'evaluated'
  const shared = !!submission.released_at

  const input = () => ({
    response_marks_obtained: assignment.response_marks > 0 && respMarks !== '' ? Number(respMarks) : assignment.response_marks > 0 ? null : 0,
    overall_feedback: feedback,
    answers: answers.map(a => ({ id: a.id, marks_obtained: marks[a.id] === '' ? null : Number(marks[a.id]), teacher_comment: comments[a.id] ?? '' })),
  })

  const run = (fn: () => Promise<{ error?: string } | { success?: boolean } | undefined>, done: string, then?: () => void) =>
    start(async () => {
      const r = await fn()
      if (r && 'error' in r && r.error) { toast.error(r.error); return }
      toast.success(done)
      if (then) then()
      else router.refresh()
    })


  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Assignments', href: '/teacher/assignments' },
          { label: assignment.title, href: `/teacher/assignments/${assignment.id}` },
          { label: studentName },
        ]}
        title={`${studentName}'s work`}
        badges={<><WorkBadge state={state} />{submission.is_late && <LateBadge />}</>}
        description={assignment.title}
        actions={nextId && (
          <Button variant="outline" size="sm" render={<Link href={`/teacher/assignments/${assignment.id}/submissions/${nextId}`} />}>
            <SkipForward className="mr-1.5 size-4" /> Next to review
          </Button>
        )}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:order-2" aria-label="Marking summary">
          <div className="space-y-4 rounded-card border bg-card p-5">
            <div>
              <p className="font-semibold leading-snug">{studentName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {yearLevel && <>{yearLevel} · </>}
                {submission.submitted_at ? <>Handed in <When iso={submission.submitted_at} /></> : 'Not handed in yet'}
              </p>
              {submission.revision_count > 0 && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Revised {submission.revision_count} time{submission.revision_count > 1 ? 's' : ''}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Score so far</span>
                <span className="font-semibold tabular-nums">{live} / {totalMarks}</span>
              </div>
              <Progress value={totalMarks ? (live / totalMarks) * 100 : 0} />
              <p className="text-xs tabular-nums text-muted-foreground">
                {needing > 0 ? `${needing} item${needing > 1 ? 's' : ''} without marks count as 0` : 'Everything has marks'}
                {!!assignment.pass_mark && <> · pass mark {assignment.pass_mark}</>}
              </p>
            </div>

            {open ? (
              <p className="border-t pt-4 text-sm text-muted-foreground">The student is still working. You can review once they hand in.</p>
            ) : (
              <div className="space-y-2 border-t pt-4">
                {evaluated ? (
                  <>
                    <Button className="w-full" disabled={pending} onClick={() => run(() => finishReview(submission.id, input(), shared), 'Marks updated')}>
                      {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />} Save changes
                    </Button>
                    <Button className="w-full" variant="outline" disabled={pending} onClick={() => run(() => setResultShared(submission.id, !shared), shared ? 'No longer shared' : 'Shared with the student')}>
                      {shared ? <><EyeOff className="mr-2 size-4" />Stop sharing</> : <><Send className="mr-2 size-4" />Share with student</>}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {shared ? 'The student can see marks and comments.' : 'The student sees nothing until you share.'}
                    </p>
                  </>
                ) : (
                  <>
                    <Button className="w-full" disabled={pending} onClick={() => run(() => finishReview(submission.id, input(), true), 'Marked and shared')}>
                      {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />} Mark and share
                    </Button>
                    <Button className="w-full" variant="outline" disabled={pending} onClick={() => run(() => finishReview(submission.id, input(), false), 'Marked. Not shared yet.')}>
                      <CheckCircle2 className="mr-2 size-4" /> Mark, share later
                    </Button>
                    <Button className="w-full" variant="ghost" disabled={pending} onClick={() => run(() => saveReview(submission.id, input()), 'Draft saved')}>
                      <Save className="mr-2 size-4" /> Save draft
                    </Button>
                  </>
                )}
                <Button className="w-full text-destructive hover:bg-destructive-soft" variant="ghost" disabled={pending} onClick={() => { setNote(''); setReturnOpen(true) }}>
                  <CornerUpLeft className="mr-2 size-4" /> Return for revision
                </Button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6 lg:order-1">
          <section className="space-y-3 rounded-card border bg-card p-5" aria-labelledby="resp-h">
            <div className="flex items-center justify-between gap-3">
              <h2 id="resp-h" className="text-base">Typed work and files</h2>
              {assignment.response_marks > 0 && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="resp-marks" className="text-xs">Marks (max {assignment.response_marks})</Label>
                  <Input id="resp-marks" type="number" min={0} max={assignment.response_marks} value={respMarks} disabled={open}
                    onChange={e => setRespMarks(clamp(e.target.value, assignment.response_marks))} className="h-9 w-20" />
                </div>
              )}
            </div>
            {submission.response_text
              ? <div className="max-w-prose whitespace-pre-wrap rounded-lg border bg-surface p-4 text-sm leading-relaxed">{submission.response_text}</div>
              : <p className="text-sm italic text-muted-foreground">No written response.</p>}
            <FileList files={files} empty="No files attached." />
          </section>

          {questions.map((q, i) => {
            const a = answerFor(q.id)
            const auto = q.type === 'mcq'
            return (
              <section key={q.id} className="space-y-4 rounded-card border bg-card p-5" aria-label={`Question ${i + 1}`}>
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-snug">{q.content}</p>
                    <QuestionImage src={q.image_url} />
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="secondary">{TYPE_LABEL[q.type]}</Badge>
                      <span className="text-xs tabular-nums text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      {auto && <Badge variant="outline">Auto-marked</Badge>}
                    </div>
                  </div>
                </div>

                {auto ? (
                  <div className="space-y-2">
                    {q.options?.map((opt, j) => (
                      <div key={opt.id} className={
                        opt.id === q.correct_option_id ? 'rounded border border-success/40 bg-success-soft px-3 py-2 text-sm text-success'
                          : opt.id === a?.selected_option_id ? 'rounded border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm text-destructive'
                          : 'rounded border border-transparent bg-secondary/60 px-3 py-2 text-sm text-muted-foreground'}>
                        {String.fromCharCode(65 + j)}. {opt.text}
                        {opt.id === q.correct_option_id && ' ✓ correct'}
                        {opt.id === a?.selected_option_id && opt.id !== q.correct_option_id && ' ✗ chosen'}
                      </div>
                    ))}
                    {a && <p className="text-sm tabular-nums text-muted-foreground">{a.marks_obtained ?? 0} / {q.marks} marks</p>}
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Student&apos;s answer</p>
                      {a?.answer_text
                        ? <div className="whitespace-pre-wrap rounded-lg border bg-surface p-3 text-sm">{a.answer_text}</div>
                        : <p className="text-sm italic text-muted-foreground">No answer given.</p>}
                    </div>
                    {a && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="space-y-1">
                          <Label htmlFor={`m-${a.id}`} className="text-xs">Marks (max {q.marks})</Label>
                          <Input id={`m-${a.id}`} type="number" min={0} max={q.marks} value={marks[a.id] ?? ''} disabled={open}
                            onChange={e => setMarks(m => ({ ...m, [a.id]: clamp(e.target.value, q.marks) }))} className="h-9 w-20" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`c-${a.id}`} className="text-xs">Comment for the student</Label>
                          <Textarea id={`c-${a.id}`} rows={2} value={comments[a.id] ?? ''} disabled={open} placeholder="What worked, what to improve" onChange={e => setComments(c => ({ ...c, [a.id]: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            )
          })}

          <section className="space-y-2 rounded-card border bg-card p-5" aria-labelledby="fb-h">
            <h2 id="fb-h" className="text-base">Overall feedback</h2>
            <p className="text-xs text-muted-foreground">Shown to the student with their marks once you share the result.</p>
            <Textarea value={feedback} rows={4} disabled={open} onChange={e => setFeedback(e.target.value)} placeholder="A short summary of how they did and what to do next" aria-label="Overall feedback" />
          </section>
        </div>
      </div>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return for revision</DialogTitle>
            <DialogDescription>{studentName} can edit their work and hand it in again. Any marks you have given are cleared.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="return-note">What should they change? *</Label>
            <Textarea id="return-note" rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Be specific so they know what to fix" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button disabled={pending || !note.trim()} onClick={() => run(() => returnSubmission(submission.id, note), 'Returned to the student', () => { setReturnOpen(false); router.refresh() })}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />} Return to student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
