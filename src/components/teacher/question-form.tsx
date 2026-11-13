'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { createQuestion, updateQuestion, createQuestionImageUpload, discardQuestionImage } from '@/app/actions/questions'
import { createClient } from '@/lib/supabase/client'
import { QuestionImageField } from '@/components/teacher/question-image-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Question } from '@/types/database'
import type { QuestionType } from '@/types/database'

interface QuestionFormProps {
  testId: string
  question?: Question
  onSuccess?: () => void
  onCancel?: () => void
}

interface MCQFormValues {
  type: 'mcq'
  content: string
  marks: number
  options: { id: string; text: string }[]
  correct_option_id: string
}

interface OpenFormValues {
  type: 'short_answer' | 'long_answer'
  content: string
  marks: number
  options?: null
  correct_option_id?: null
}

type FormValues = MCQFormValues | OpenFormValues

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer / Essay',
}

export function QuestionForm({ testId, question, onSuccess, onCancel }: QuestionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [qType, setQType] = useState<QuestionType>(question?.type ?? 'mcq')
  const initialImage = question?.image_url ?? null
  const [imageUrl, setImageUrl] = useState<string | null>(initialImage)
  const [uploading, setUploading] = useState(false)

  const defaultOptions = question?.options ?? [
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
    { id: uuidv4(), text: '' },
  ]

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<any>({
    defaultValues: {
      type: question?.type ?? 'mcq',
      content: question?.content ?? '',
      marks: question?.marks ?? 1,
      options: defaultOptions,
      correct_option_id: question?.correct_option_id ?? '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'options' })
  const correctOptionId = watch('correct_option_id')
  const watchedOptions = watch('options') as { id: string; text: string }[]

  // An image uploaded in this form but not saved yet: delete its file if it is removed, replaced or the form is cancelled.
  function discardIfUnsaved(url: string | null) {
    if (url && url !== initialImage) void discardQuestionImage(testId, url)
  }

  function removeImage() {
    discardIfUnsaved(imageUrl)
    setImageUrl(null)
  }

  function handleCancel() {
    discardIfUnsaved(imageUrl)
    onCancel?.()
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('That file is not an image.')
    setUploading(true)
    try {
      const prepared = await prepareImage(file)
      const ticket = await createQuestionImageUpload(testId, prepared.type, prepared.size)
      if ('error' in ticket && ticket.error) return toast.error(ticket.error)
      const { path, token, publicUrl } = ticket as { path: string; token: string; publicUrl: string }
      const { error } = await createClient().storage
        .from('question-images')
        .uploadToSignedUrl(path, token, prepared, { contentType: prepared.type })
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
    const file = Array.from(e.clipboardData.items)
      .find(i => i.kind === 'file' && i.type.startsWith('image/'))
      ?.getAsFile()
    if (!file) return
    e.preventDefault()
    void uploadImage(file)
  }

  const onSubmit = (data: any) => {
    if (uploading) return toast.error('Wait for the image to finish uploading.')
    const payload = {
      type: qType,
      content: data.content,
      marks: Number(data.marks),
      options: qType === 'mcq' ? data.options : null,
      correct_option_id: qType === 'mcq' ? data.correct_option_id : null,
      // Only sent when changed: undefined leaves the saved image alone, null removes it.
      image_url: imageUrl !== initialImage ? imageUrl : undefined,
    }

    startTransition(async () => {
      const result = question
        ? await updateQuestion(question.id, testId, payload)
        : await createQuestion(testId, payload)

      if (result?.error) {
        toast.error(result.error)
      } else {
        onSuccess?.()
      }
    })
  }

  const handleTypeChange = (val: string | null) => {
    if (!val) return
    setQType(val as QuestionType)
    setValue('type', val)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onPaste={onPaste} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select value={qType} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string) => QUESTION_TYPE_LABELS[v] ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="short_answer">Short Answer</SelectItem>
              <SelectItem value="long_answer">Long Answer / Essay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            type="number"
            {...register('marks', { min: 1 })}
            min={1}
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Question *</Label>
        <Textarea
          id="content"
          {...register('content', { required: true })}
          placeholder="Enter the question text..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Image (optional)</Label>
        <QuestionImageField value={imageUrl} uploading={uploading} onFile={uploadImage} onRemove={removeImage} />
      </div>

      {qType === 'mcq' && (
        <div className="space-y-3">
          <Label>Options (select the correct answer)</Label>
          <RadioGroup
            value={correctOptionId}
            onValueChange={val => setValue('correct_option_id', val)}
          >
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <RadioGroupItem value={watchedOptions?.[index]?.id ?? ''} id={`opt-${index}`} />
                <Input
                  {...register(`options.${index}.text`, { required: true })}
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  className="flex-1"
                />
                {fields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>
          {fields.length < 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: uuidv4(), text: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          )}
          {!correctOptionId && (
            <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending} size="sm">
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {question ? 'Save Changes' : 'Add Question'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

/** Pasted retina screenshots are big. Shrink anything over 2 MB or 1800 px wide to a WebP before uploading (GIFs are left alone). */
async function prepareImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const MAX = 1800
  if (file.size <= 2 * 1024 * 1024 && bitmap.width <= MAX) return file
  const scale = Math.min(1, MAX / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', 0.9))
  return blob ? new File([blob], 'question.webp', { type: 'image/webp' }) : file
}
