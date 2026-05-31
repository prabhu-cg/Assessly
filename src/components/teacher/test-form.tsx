'use client'

import { useTransition } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { testSchema, type TestInput } from '@/lib/validators/schemas'
import { createTest, updateTest } from '@/app/actions/tests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Test } from '@/types/database'

interface TestFormProps {
  test?: Test
  onCancel?: () => void
  onSuccess?: () => void
}

export function TestForm({ test, onCancel, onSuccess }: TestFormProps) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<TestInput>({
    resolver: zodResolver(testSchema) as Resolver<TestInput>,
    defaultValues: {
      title: test?.title ?? '',
      description: test?.description ?? '',
      duration_minutes: test?.duration_minutes ?? 60,
      instructions: test?.instructions ?? '',
      pass_mark: test?.pass_mark ?? undefined,
    },
  })

  const onSubmit = (data: TestInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== '') formData.append(key, String(value))
    })

    startTransition(async () => {
      const result = test
        ? await updateTest(test.id, formData)
        : await createTest(formData)

      if (result?.error) {
        toast.error(result.error)
      } else if ('success' in result && result.success) {
        toast.success('Test updated')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Test Title *</Label>
        <Input id="title" {...register('title')} placeholder="e.g. Chapter 5 — Algebra Quiz" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Brief description of the test"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
          <Input
            id="duration_minutes"
            type="number"
            {...register('duration_minutes')}
            min={1}
            max={480}
          />
          {errors.duration_minutes && (
            <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pass_mark">Pass Mark</Label>
          <Input
            id="pass_mark"
            type="number"
            {...register('pass_mark')}
            placeholder="Optional"
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="starts_at">Available From</Label>
          <Input id="starts_at" type="datetime-local" {...register('starts_at')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_at">Available Until</Label>
          <Input id="ends_at" type="datetime-local" {...register('ends_at')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Test Instructions</Label>
        <Textarea
          id="instructions"
          {...register('instructions')}
          placeholder="Instructions shown to students before the test begins"
          rows={4}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {test ? 'Save Changes' : 'Create Test'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel ?? (() => history.back())}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
