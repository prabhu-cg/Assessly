'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
import { ArrowDown, ArrowUp, HelpCircle, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createAssignmentQuestion, updateAssignmentQuestion, deleteAssignmentQuestion, moveAssignmentQuestion,
  createAssignmentQuestionImageUpload, discardAssignmentQuestionImage,
} from '@/app/actions/assignments'
import { createClient } from '@/lib/supabase/client'
import { QuestionImageField } from '@/components/teacher/question-image-field'
import { prepareImage } from '@/components/teacher/question-form'
import { QuestionImage } from '@/components/shared/question-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Drawer } from '@/components/shared/drawer'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useUnsavedGuard } from '@/components/shared/unsaved-guard'
import type { AssignmentQuestion, QuestionType } from '@/types/database'

const TYPE_LABEL: Record<string, string> = {
  mcq: 'Multiple Choice',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer / Essay',
}

type FormValues = {
  content: string
  marks: number
  options: { id: string; text: string }[]
  correct_option_id: string
}

function QuestionForm({
  assignmentId, question, onSuccess, onCancel, onDirtyChange,
}: {
  assignmentId: string
  question?: AssignmentQuestion
  onSuccess: () => void
  onCancel: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [pending, start] = useTransition()
  const [qType, setQType] = useState<QuestionType>(question?.type ?? 'mcq')
  const initialImage = question?.image_url ?? null
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, setValue, watch, control, formState: { isDirty } } = useForm<FormValues>({
    defaultValues: {
      content: question?.content ?? '',
      marks: question?.marks ?? 1,
      options: question?.options ?? [1, 2, 3, 4].map(() => ({ id: uuidv4(), text: '' })),
      correct_option_id: question?.correct_option_id ?? '',
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const correct = watch('correct_option_id')
  const options = watch('options')

  const dirty = isDirty || qType !== (question?.type ?? 'mcq') || imageUrl !== initialImage
  useEffect(() => { onDirtyChange(dirty) }, [dirty, onDirtyChange])

  // An image uploaded in this form but not saved yet is deleted if it is removed, replaced or the form goes away.
  function discardIfUnsaved(url: string | null) {
    if (url && url !== initialImage) void discardAssignmentQuestionImage(assignmentId, url)
  }
  const unsavedRef = useRef<string | null>(null)
  const savedRef = useRef(false)
  useEffect(() => { unsavedRef.current = imageUrl !== initialImage ? imageUrl : null }, [imageUrl, initialImage])
  useEffect(() => () => {
    const url = unsavedRef.current
    if (url && !savedRef.current) void discardAssignmentQuestionImage(assignmentId, url)
  }, [assignmentId])

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('That file is not an image.')
    setUploading(true)
    try {
      const prepared = await prepareImage(file)
      const ticket = await createAssignmentQuestionImageUpload(assignmentId, prepared.type, prepared.size)
      if ('error' in ticket && ticket.error) return toast.error(ticket.error)
      const { path, token, publicUrl } = ticket as { path: string; token: string; publicUrl: string }
      const { error } = await createClient().storage.from('question-images').uploadToSignedUrl(path, token, prepared, { contentType: prepared.type })
      if (error) return toast.error(error.message)
      discardIfUnsaved(imageUrl)
      setImageUrl(publicUrl)
    } catch {
      toast.error('Could not upload the image. Try again.')
    } finally {
      setUploading(false)
    }
  }

  // Paste a screenshot from the clipboard anywhere in the form. Plain text pastes are left alone.
  function onPaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.items).find(i => i.kind === 'file' && i.type.startsWith('image/'))?.getAsFile()
    if (!file) return
    e.preventDefault()
    void uploadImage(file)
  }

  const onSubmit = (data: FormValues) => {
    if (uploading) { toast.error('Wait for the image to finish uploading.'); return }
    const payload = {
      type: qType,
      content: data.content,
      marks: Number(data.marks),
      options: qType === 'mcq' ? data.options : null,
      correct_option_id: qType === 'mcq' ? data.correct_option_id : null,
      // Only sent when changed: undefined leaves the saved image alone, null removes it.
      image_url: imageUrl !== initialImage ? imageUrl : undefined,
    }
    start(async () => {
      const r = question
        ? await updateAssignmentQuestion(question.id, assignmentId, payload)
        : await createAssignmentQuestion(assignmentId, payload)
      if (r?.error) toast.error(r.error)
      else { savedRef.current = true; onSuccess() }
    })
  }

  return (
    <form id="assignment-question-form" onSubmit={handleSubmit(onSubmit)} onPaste={onPaste} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question type</Label>
          <Select value={qType} onValueChange={v => v && setQType(v as QuestionType)}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => TYPE_LABEL[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="long_answer">Long Answer / Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aq-marks">Marks</Label>
          <Input id="aq-marks" type="number" min={1} {...register('marks')} className="w-24" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aq-content">Question *</Label>
        <Textarea id="aq-content" {...register('content', { required: true })} rows={3} placeholder="Enter the question text..." />
      </div>

      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <QuestionImageField
          value={imageUrl}
          uploading={uploading}
          onFile={uploadImage}
          onRemove={() => { discardIfUnsaved(imageUrl); setImageUrl(null) }}
        />
      </div>

      {qType === 'mcq' && (
        <div className="space-y-3">
          <Label>Options (select the correct answer)</Label>
          <RadioGroup value={correct} onValueChange={v => setValue('correct_option_id', v, { shouldDirty: true })}>
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <RadioGroupItem value={options?.[i]?.id ?? ''} id={`aq-opt-${i}`} />
                <Input {...register(`options.${i}.text`, { required: true })} placeholder={`Option ${String.fromCharCode(65 + i)}`} className="flex-1" />
                {fields.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remove option ${String.fromCharCode(65 + i)}`} onClick={() => remove(i)} className="size-8 shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>
          {fields.length < 6 && (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ id: uuidv4(), text: '' })}>
              <Plus className="mr-2 size-4" /> Add option
            </Button>
          )}
          {!correct && <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {question ? 'Save changes' : 'Add question'}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export function AssignmentQuestions({ assignmentId, questions }: { assignmentId: string; questions: AssignmentQuestion[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<AssignmentQuestion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssignmentQuestion | null>(null)
  const [pending, start] = useTransition()
  // The page keys this component on the saved questions, so it restarts from fresh data after every save or move.
  const [order, setOrder] = useState(questions)

  const close = useCallback(() => { setDrawerOpen(false); setTimeout(() => setEditing(null), 300) }, [])
  const { setDirty, requestClose, dialog } = useUnsavedGuard({
    formId: 'assignment-question-form',
    close,
    active: drawerOpen,
    description: editing
      ? 'Your changes to this question have not been saved. If you close now, they will be lost, along with any image you uploaded.'
      : 'This question has not been saved yet. If you close now, it will be lost, along with any image you uploaded.',
  })

  const open = (q: AssignmentQuestion | null) => { setEditing(q); setDrawerOpen(true) }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    setOrder(next)
    void moveAssignmentQuestion(assignmentId, next.map(q => q.id))
  }

  const total = order.reduce((n, q) => n + q.marks, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {order.length} question{order.length !== 1 ? 's' : ''} · {total} mark{total !== 1 ? 's' : ''}. Multiple choice is marked automatically.
        </p>
        <Button size="sm" onClick={() => open(null)}>
          <Plus className="mr-2 size-4" /> Add question
        </Button>
      </div>

      {order.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <HelpCircle className="mx-auto mb-3 size-6 text-primary-text" />
          <p className="text-sm font-semibold">No questions</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Optional. Without questions, students type their work or upload files in Your files, marked out of the marks you set for typed work and files.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {order.map((q, i) => (
            <li key={q.id} className="rounded-card border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm font-medium leading-snug">{q.content}</p>
                  <QuestionImage src={q.image_url} className="max-h-40" />
                  {q.type === 'mcq' && q.options && (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((opt, j) => (
                        <li key={opt.id} className={opt.id === q.correct_option_id ? 'rounded border border-success/30 bg-success-soft px-2 py-1 text-xs text-success' : 'px-2 py-1 text-xs text-muted-foreground'}>
                          {String.fromCharCode(65 + j)}. {opt.text}{opt.id === q.correct_option_id && ' ✓'}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary">{TYPE_LABEL[q.type]}</Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Edit question" onClick={() => open(q)}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label="Delete question" onClick={() => setDeleteTarget(q)}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Drawer
        open={drawerOpen}
        onClose={requestClose}
        width="max-w-[520px]"
        title={editing ? 'Edit question' : 'Add question'}
        description={editing ? 'Update the question details below' : 'Fill in the details to add a question'}
      >
        <QuestionForm
          key={editing?.id ?? 'new'}
          assignmentId={assignmentId}
          question={editing ?? undefined}
          onSuccess={close}
          onCancel={requestClose}
          onDirtyChange={setDirty}
        />
      </Drawer>
      {dialog}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => { if (!o) setDeleteTarget(null) }}
        title="Delete question?"
        description={deleteTarget ? `"${deleteTarget.content.slice(0, 80)}${deleteTarget.content.length > 80 ? '…' : ''}" and any student answers to it will be removed.` : ''}
        confirmLabel="Delete question"
        isPending={pending}
        onConfirm={() => deleteTarget && start(async () => {
          const r = await deleteAssignmentQuestion(deleteTarget.id, assignmentId)
          if (r?.error) toast.error(r.error)
          else setDeleteTarget(null)
        })}
      />
    </div>
  )
}
