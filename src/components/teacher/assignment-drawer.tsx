'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { assignmentSchema, type AssignmentInput } from '@/lib/validators/schemas'
import { createAssignment, updateAssignment } from '@/app/actions/assignments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DateTimeField } from '@/components/teacher/date-time-field'
import { Drawer } from '@/components/shared/drawer'
import { useUnsavedGuard } from '@/components/shared/unsaved-guard'
import type { Assignment } from '@/types/database'

/** ISO timestamp -> `YYYY-MM-DDTHH:mm` in the viewer's timezone, as the date/time inputs expect. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function AssignmentForm({
  assignment,
  onCancel,
  onSuccess,
  onDirtyChange,
}: {
  assignment?: Assignment
  onCancel: () => void
  onSuccess?: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const { register, control, handleSubmit, formState: { errors, isDirty } } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema) as Resolver<AssignmentInput>,
    defaultValues: {
      title: assignment?.title ?? '',
      description: assignment?.description ?? '',
      instructions: assignment?.instructions ?? '',
      due_at: toLocalInput(assignment?.due_at),
      response_marks: assignment?.response_marks ?? 10,
      pass_mark: assignment?.pass_mark ?? undefined,
    },
  })

  useEffect(() => { onDirtyChange(isDirty) }, [isDirty, onDirtyChange])

  const onSubmit = (data: AssignmentInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) return
      // Local input values carry no timezone; send an absolute instant so the server stores what was picked.
      if (key === 'due_at') formData.append(key, new Date(String(value)).toISOString())
      else formData.append(key, String(value))
    })
    startTransition(async () => {
      const result = assignment ? await updateAssignment(assignment.id, formData) : await createAssignment(formData)
      if (result?.error) toast.error(result.error)
      else if (result && 'success' in result && result.success) {
        toast.success('Assignment updated')
        onSuccess?.()
      }
    })
  }

  return (
    <form id="assignment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="a-title">Title *</Label>
        <Input id="a-title" {...register('title')} placeholder="e.g. Persuasive essay: school uniforms" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="a-description">Summary</Label>
        <Textarea id="a-description" {...register('description')} rows={2} placeholder="One or two lines students see in their list" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="a-instructions">Brief</Label>
        <Textarea
          id="a-instructions"
          {...register('instructions')}
          rows={6}
          placeholder="What students should do, what to hand in, and how it will be marked"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_at">Due</Label>
        <Controller
          control={control}
          name="due_at"
          render={({ field }) => (
            <DateTimeField id="due_at" value={field.value ?? ''} onChange={field.onChange} fallbackTime="23:59" emptyTimeHint="due at the end of the day" />
          )}
        />
        <p className="text-xs text-muted-foreground">Late work is still accepted and marked Late.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="a-response-marks">Marks for typed work and files</Label>
          <Input id="a-response-marks" type="number" min={0} max={1000} {...register('response_marks')} className="w-28" />
          {errors.response_marks && <p className="text-sm text-destructive">{errors.response_marks.message}</p>}
          <p className="text-xs text-muted-foreground">For what students type or upload in Your files. Use 0 if only questions are marked.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="a-pass">Pass mark</Label>
          <Input id="a-pass" type="number" min={0} {...register('pass_mark', { setValueAs: v => (v === '' || v == null ? undefined : Number(v)) })} placeholder="Optional" className="w-28" />
          {errors.pass_mark && <p className="text-sm text-destructive">{errors.pass_mark.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {assignment ? 'Save changes' : 'Create assignment'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

interface AssignmentDrawerProps {
  assignment?: Assignment
  label?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  defaultOpen?: boolean
  /** Controlled mode (opened from a card menu): no trigger button is rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AssignmentDrawer({
  assignment, label = 'New assignment', variant, size, defaultOpen = false, open: controlledOpen, onOpenChange,
}: AssignmentDrawerProps) {
  const controlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const open = controlled ? controlledOpen : internalOpen
  const setOpen = useCallback((next: boolean) => {
    if (!controlled) setInternalOpen(next)
    onOpenChange?.(next)
  }, [controlled, onOpenChange])
  const close = useCallback(() => setOpen(false), [setOpen])

  const { setDirty, requestClose, dialog } = useUnsavedGuard({
    formId: 'assignment-form',
    close,
    active: open,
    description: assignment
      ? 'Your changes to this assignment have not been saved. If you close now, they will be lost.'
      : 'This assignment has not been saved yet. If you close now, everything you entered will be lost.',
  })

  return (
    <>
      {!controlled && (
        <Button variant={variant ?? (assignment ? 'outline' : 'default')} size={size ?? (assignment ? 'sm' : 'default')} onClick={() => setOpen(true)}>
          {assignment ? <Pencil className="mr-1.5 size-4" /> : <Plus className="mr-2 size-4" />}
          {assignment ? 'Edit' : label}
        </Button>
      )}
      <Drawer
        open={open}
        onClose={requestClose}
        title={assignment ? 'Edit assignment' : 'New assignment'}
        description={assignment ? assignment.title : 'Set it up now. Add questions, files and students after saving.'}
      >
        <AssignmentForm assignment={assignment} onCancel={requestClose} onSuccess={close} onDirtyChange={setDirty} />
      </Drawer>
      {dialog}
    </>
  )
}
