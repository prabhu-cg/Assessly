'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, CornerUpLeft, Hourglass, Loader2, Save, Send, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  saveAssignmentDraft, submitAssignment, createSubmissionUpload, registerSubmissionFile, removeSubmissionFile,
} from '@/app/actions/assignment-submissions'
import { ASSIGNMENT_BUCKET, FILE_ACCEPT, FILE_LIMIT_HINT, MAX_SUBMISSION_FILES } from '@/lib/assignment-files'
import type { LoadedStudentAssignment } from '@/lib/student-assignments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { QuestionImage } from '@/components/shared/question-image'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { AssignmentWorkspace } from '@/components/shared/workspace-tabs'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DueIn, FileList, LateBadge, When } from '@/components/shared/assignment-ui'
import { cn } from '@/lib/utils'

const TYPE_LABEL: Record<string, string> = { mcq: 'Multiple choice', short_answer: 'Short answer', long_answer: 'Essay' }

type Answers = Record<string, { answer_text: string; selected_option_id: string }>

function Header({ data }: { data: LoadedStudentAssignment }) {
  const a = data.assignment
  return (
    <div className="space-y-3">
      <Breadcrumbs items={[{ label: 'Assignments', href: '/student/assignments' }, { label: a.title }]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{a.title}</h1>
        {a.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{a.description}</p>}
        {a.due_at && (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            Due <When iso={a.due_at} /> {!data.submission?.submitted_at && <DueIn iso={a.due_at} />}
          </p>
        )}
      </div>
    </div>
  )
}

function Brief({ data, showEmpty = false }: { data: LoadedStudentAssignment; showEmpty?: boolean }) {
  const { instructions } = data.assignment
  if (!instructions && !data.resources.length) {
    return showEmpty
      ? <p className="rounded-card border border-dashed border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">Your teacher did not add a brief. Go to Questions or Your files to start.</p>
      : null
  }
  return (
    <section className="space-y-3 rounded-card border bg-card p-5" aria-labelledby="brief-h">
      <h2 id="brief-h" className="text-base">The brief</h2>
      {instructions && <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed">{instructions}</p>}
      {data.resources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Files from your teacher. Click one to preview it.</p>
          <FileList files={data.resources} />
        </div>
      )}
    </section>
  )
}

// ── Read-only: handed in, waiting, or marked and shared ────────────────────

function ReadOnly({ data }: { data: LoadedStudentAssignment }) {
  const sub = data.submission!
  const a = data.assignment
  const answerFor = (id: string) => data.answers.find(x => x.question_id === id)
  const total = sub.total_marks ?? 0
  const pct = total ? Math.round(((sub.obtained_marks ?? 0) / total) * 100) : 0
  const passed = !!a.pass_mark && sub.obtained_marks !== null ? sub.obtained_marks >= a.pass_mark : null

  return (
    <div className="space-y-6">
      {sub.released ? (
        <section className="space-y-3 rounded-card border bg-card p-5" aria-labelledby="result-h">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="result-h" className="text-base">Your result</h2>
            <p className="text-2xl font-semibold tabular-nums">{sub.obtained_marks} <span className="text-base font-medium text-muted-foreground">/ {sub.total_marks}</span></p>
          </div>
          <Progress value={pct} />
          <p className="text-sm tabular-nums text-muted-foreground">
            {pct}%{passed !== null && <> · {passed ? 'Passed' : 'Did not pass'} (pass mark {a.pass_mark})</>}
          </p>
          {sub.overall_feedback && (
            <div className="rounded-lg bg-primary-soft p-4">
              <p className="mb-1 text-xs font-semibold text-primary-text">Feedback from your teacher</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{sub.overall_feedback}</p>
            </div>
          )}
        </section>
      ) : (
        <div className="flex items-start gap-3 rounded-card bg-warning-soft p-4 text-warning" role="status">
          <Hourglass className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Handed in. Waiting for your teacher&apos;s marks.</p>
            <p className="text-sm">You will see your result here when it is shared. Your work is locked.</p>
          </div>
        </div>
      )}

      <section className="space-y-3 rounded-card border bg-card p-5" aria-labelledby="work-h">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="work-h" className="text-base">Your work</h2>
          <div className="flex items-center gap-2">
            {sub.is_late && <LateBadge />}
            {sub.released && a.response_marks > 0 && (
              <span className="text-sm font-semibold tabular-nums">{sub.response_marks_obtained ?? 0} / {a.response_marks}</span>
            )}
          </div>
        </div>
        {sub.response_text ? <div className="max-w-prose whitespace-pre-wrap rounded-lg border bg-surface p-4 text-sm leading-relaxed">{sub.response_text}</div> : <p className="text-sm italic text-muted-foreground">No written response.</p>}
        <FileList files={data.files} />
      </section>

      {data.questions.map((q, i) => {
        const ans = answerFor(q.id)
        return (
          <section key={q.id} className="space-y-3 rounded-card border bg-card p-5" aria-label={`Question ${i + 1}`}>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm font-medium leading-snug">{q.content}</p>
                <QuestionImage src={q.image_url} />
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[q.type]}</Badge>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {sub.released ? `${ans?.marks_obtained ?? 0} / ${q.marks}` : q.marks} mark{q.marks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            {q.type === 'mcq' ? (
              <div className="space-y-2">
                {(q.options as { id: string; text: string }[] | null)?.map((opt, j) => {
                  const mine = opt.id === ans?.selected_option_id
                  const right = sub.released && opt.id === q.correct_option_id
                  return (
                    <div key={opt.id} className={cn('rounded border px-3 py-2 text-sm',
                      right ? 'border-success/40 bg-success-soft text-success'
                        : mine && sub.released ? 'border-destructive/40 bg-destructive-soft text-destructive'
                        : mine ? 'border-primary bg-primary-soft' : 'border-transparent bg-secondary/60 text-muted-foreground')}>
                      {String.fromCharCode(65 + j)}. {opt.text}{mine && ' (your answer)'}{right && ' ✓'}
                    </div>
                  )
                })}
              </div>
            ) : (
              ans?.answer_text ? <div className="whitespace-pre-wrap rounded-lg border bg-surface p-3 text-sm">{ans.answer_text}</div> : <p className="text-sm italic text-muted-foreground">No answer given.</p>
            )}
            {sub.released && ans?.teacher_comment && (
              <div className="rounded-lg bg-primary-soft p-3">
                <p className="mb-0.5 text-xs font-semibold text-primary-text">Comment</p>
                <p className="whitespace-pre-wrap text-sm">{ans.teacher_comment}</p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ── Editable: not started, in progress, or returned for changes ────────────

function Editor({ data }: { data: LoadedStudentAssignment }) {
  const router = useRouter()
  const a = data.assignment
  const sub = data.submission
  const fileInput = useRef<HTMLInputElement>(null)

  const [text, setText] = useState(sub?.response_text ?? '')
  const [answers, setAnswers] = useState<Answers>(() => {
    const m: Answers = {}
    data.questions.forEach(q => {
      const saved = data.answers.find(x => x.question_id === q.id)
      m[q.id] = { answer_text: saved?.answer_text ?? '', selected_option_id: saved?.selected_option_id ?? '' }
    })
    return m
  })
  const [dirty, setDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, startSubmit] = useTransition()

  const payload = useMemo(() => ({
    response_text: text,
    answers: Object.entries(answers).map(([question_id, v]) => ({ question_id, ...v })),
  }), [text, answers])
  const latest = useRef(payload)
  useEffect(() => { latest.current = payload }, [payload])
  const [now] = useState(() => Date.now())

  async function saveDraft(quiet = false) {
    setSaving(true)
    const r = await saveAssignmentDraft(a.id, latest.current)
    setSaving(false)
    if (r?.error) { if (!quiet) toast.error(r.error); return false }
    setDirty(false); setSavedAt(new Date())
    return true
  }

  // Autosave 1.5 seconds after the last change, like the test page.
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(() => { void saveDraft(true) }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, payload])

  // Warn before leaving with an unsaved edit.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const setAnswer = (qid: string, patch: Partial<Answers[string]>) => {
    setAnswers(m => ({ ...m, [qid]: { ...m[qid], ...patch } }))
    setDirty(true)
  }

  async function upload(list: FileList | File[]) {
    const picked = Array.from(list)
    if (!picked.length) return
    setUploading(true)
    try {
      await saveDraft(true)
      let room = MAX_SUBMISSION_FILES - data.files.length
      for (const file of picked) {
        if (room <= 0) { toast.error(`You can attach up to ${MAX_SUBMISSION_FILES} files.`); break }
        const ticket = await createSubmissionUpload(a.id, file.name, file.type, file.size)
        if ('error' in ticket && ticket.error) { toast.error(`${file.name}: ${ticket.error}`); continue }
        const { path, token } = ticket as { path: string; token: string }
        const { error } = await createClient().storage.from(ASSIGNMENT_BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type })
        if (error) { toast.error(`${file.name}: ${error.message}`); continue }
        const saved = await registerSubmissionFile(a.id, { path, name: file.name, size: file.size, contentType: file.type })
        if (saved?.error) { toast.error(saved.error); continue }
        room--
      }
      router.refresh()
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function removeFile(id: string) {
    setRemoving(id)
    const r = await removeSubmissionFile(a.id, id)
    setRemoving(null)
    if (r?.error) toast.error(r.error)
    else router.refresh()
  }

  const answered = data.questions.filter(q => answers[q.id]?.answer_text.trim() || answers[q.id]?.selected_option_id).length
  const hasWork = !!text.trim() || data.files.length > 0 || answered > 0
  const overdue = !!a.due_at && now > new Date(a.due_at).getTime()
  const full = data.files.length >= MAX_SUBMISSION_FILES
  const briefHasContent = !!a.instructions || data.resources.length > 0

  const handIn = () => startSubmit(async () => {
    const r = await submitAssignment(a.id, latest.current)
    if (r?.error) { toast.error(r.error); setConfirmOpen(false); return }
    setDirty(false); setConfirmOpen(false)
    toast.success('Handed in. Your teacher will mark it.')
    router.refresh()
  })

  return (
    <div className="space-y-6">
      {sub?.status === 'returned' && (
        <div className="flex items-start gap-3 rounded-card bg-warning-soft p-4 text-warning" role="status">
          <CornerUpLeft className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Your teacher asked for changes</p>
            {sub.return_note && <p className="mt-1 whitespace-pre-wrap text-sm">{sub.return_note}</p>}
            <p className="mt-1 text-sm">Update your work below and hand it in again.</p>
          </div>
        </div>
      )}

      <AssignmentWorkspace
        initial={briefHasContent ? 'brief' : data.questions.length ? 'questions' : 'files'}
        tabs={[
          { key: 'brief', label: 'Brief', content: <Brief data={data} showEmpty /> },
          ...(data.questions.length
            ? [{
                key: 'questions',
                label: 'Questions',
                count: data.questions.length,
                content: (
                  <div className="space-y-6">
                    <p className="text-sm tabular-nums text-muted-foreground">{answered} of {data.questions.length} answered. Your answers save as you go.</p>
                    {data.questions.map((q, i) => (
                      <section key={q.id} className="space-y-3 rounded-card border bg-card p-5" aria-label={`Question ${i + 1}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold tabular-nums text-primary-foreground">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-wrap text-sm font-medium leading-snug">{q.content}</p>
                            <QuestionImage src={q.image_url} />
                            <p className="mt-1 text-xs tabular-nums text-muted-foreground">{TYPE_LABEL[q.type]} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {q.type === 'mcq' ? (
                          <div role="radiogroup" aria-label={`Answer for question ${i + 1}`} className="space-y-2">
                            {(q.options as { id: string; text: string }[] | null)?.map((opt, j) => {
                              const on = answers[q.id]?.selected_option_id === opt.id
                              return (
                                <button key={opt.id} type="button" role="radio" aria-checked={on} onClick={() => setAnswer(q.id, { selected_option_id: opt.id })}
                                  className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50', on ? 'border-primary bg-primary-soft' : 'border-border hover:bg-secondary')}>
                                  <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', on ? 'border-primary bg-primary' : 'border-control-border')} aria-hidden>
                                    {on && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                                  </span>
                                  <span><span className="font-semibold">{String.fromCharCode(65 + j)}.</span> {opt.text}</span>
                                </button>
                              )
                            })}
                          </div>
                        ) : q.type === 'short_answer' ? (
                          <Input value={answers[q.id]?.answer_text ?? ''} onChange={e => setAnswer(q.id, { answer_text: e.target.value })} placeholder="Your answer" aria-label={`Answer for question ${i + 1}`} />
                        ) : (
                          <Textarea value={answers[q.id]?.answer_text ?? ''} onChange={e => setAnswer(q.id, { answer_text: e.target.value })} rows={6} placeholder="Write your answer" aria-label={`Answer for question ${i + 1}`} />
                        )}
                      </section>
                    ))}
                  </div>
                ),
              }]
            : []),
          {
            key: 'files',
            label: 'Your files',
            count: data.files.length,
            content: (
              <section className="space-y-5 rounded-card border bg-card p-5" aria-labelledby="work-h">
                <div>
                  <h2 id="work-h" className="text-base">Type or upload your work</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">Type your answer, attach files, or both. Everything here is optional.</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="typed-work" className="text-sm font-semibold">Type your work</label>
                  <Textarea
                    id="typed-work"
                    value={text}
                    onChange={e => { setText(e.target.value); setDirty(true) }}
                    rows={9}
                    placeholder="Start writing here. It saves as you type."
                    className="leading-relaxed"
                  />
                </div>

                <div className="space-y-3 border-t pt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold">Upload files</p>
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">{data.files.length} of {MAX_SUBMISSION_FILES}</p>
                  </div>
                  <FileList files={data.files} onRemove={removeFile} removingId={removing} />
                  {!full ? (
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files) }}
                      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left"
                    >
                      <input ref={fileInput} type="file" multiple accept={FILE_ACCEPT} className="sr-only" aria-label="Choose files to attach" onChange={e => e.target.files && void upload(e.target.files)} />
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                          <UploadCloud className="size-5 text-primary-text" aria-hidden />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{uploading ? 'Uploading…' : data.files.length ? 'Add another file' : 'Add a file'}</p>
                          <p className="text-xs text-muted-foreground">{FILE_LIMIT_HINT}</p>
                        </div>
                      </div>
                      <Button variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
                        {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
                        Choose files
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">You have attached the most files allowed. Remove one to add another.</p>
                  )}
                </div>
              </section>
            ),
          },
        ]}
      />

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-5 sm:px-5 md:bottom-0">
        <p className="flex basis-full items-center gap-2 text-sm text-muted-foreground sm:mr-auto sm:basis-auto" role="status" aria-live="polite">
          {saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : dirty ? 'Unsaved changes' : savedAt ? <><CheckCircle2 className="size-4 text-success" /> Saved</> : 'Your work saves as you type.'}
        </p>
        <Button variant="outline" className="flex-1 sm:flex-none" disabled={saving || !dirty} onClick={() => saveDraft()}>
          <Save className="mr-2 size-4" /> Save draft
        </Button>
        <Button className="flex-1 sm:flex-none" disabled={!hasWork || uploading || saving} onClick={() => setConfirmOpen(true)}>
          <Send className="mr-2 size-4" /> Hand in
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Hand in this assignment?"
        description={
          (overdue ? 'It is past the due date, so it will be marked Late. ' : '') +
          (data.questions.length ? `You answered ${answered} of ${data.questions.length} questions. ` : '') +
          'You cannot edit it after handing in unless your teacher returns it.'
        }
        confirmLabel="Hand in"
        isPending={submitting}
        onConfirm={handIn}
        tone="primary"
      />
    </div>
  )
}

export function AssignmentWork({ data }: { data: LoadedStudentAssignment }) {
  const status = data.submission?.status
  const editable = !status || status === 'in_progress' || status === 'returned'
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Header data={data} />
      {editable && overdueNotice(data)}
      {editable ? <Editor data={data} /> : <><Brief data={data} /><ReadOnly data={data} /></>}
    </div>
  )
}

function overdueNotice(data: LoadedStudentAssignment) {
  const due = data.assignment.due_at
  if (!due || new Date(due).getTime() > Date.now()) return null
  return (
    <div className="flex items-start gap-3 rounded-card bg-warning-soft p-4 text-warning" role="status">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="text-sm font-semibold">This is past due. You can still hand it in and it will be marked Late.</p>
    </div>
  )
}
