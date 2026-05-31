'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuidv4 } from 'uuid'
import { createQuestion, updateQuestion } from '@/app/actions/questions'
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

export function QuestionForm({ testId, question, onSuccess, onCancel }: QuestionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [qType, setQType] = useState<QuestionType>(question?.type ?? 'mcq')

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

  const onSubmit = (data: any) => {
    const payload = {
      type: qType,
      content: data.content,
      marks: Number(data.marks),
      options: qType === 'mcq' ? data.options : null,
      correct_option_id: qType === 'mcq' ? data.correct_option_id : null,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Question Type</Label>
          <Select value={qType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
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
            className="w-full"
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

      {qType === 'mcq' && (
        <div className="space-y-3">
          <Label>Options (select the correct answer)</Label>
          <RadioGroup
            value={correctOptionId}
            onValueChange={val => setValue('correct_option_id', val)}
          >
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <RadioGroupItem value={(field as any).id} id={`opt-${index}`} />
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
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
