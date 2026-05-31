'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createStudentSchema, type CreateStudentInput } from '@/lib/validators/schemas'
import { createStudent } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreateStudentDrawerProps {
  label?: string
  defaultOpen?: boolean
}

export function CreateStudentDrawer({ label = 'Add Student', defaultOpen = false }: CreateStudentDrawerProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(defaultOpen)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
  })

  useEffect(() => {
    if (mounted) {
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [mounted])

  function openDrawer() {
    reset()
    setError(null)
    setMounted(true)
  }

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => setMounted(false), 300)
  }

  const onSubmit = (data: CreateStudentInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, v))
    setError(null)

    startTransition(async () => {
      const result = await createStudent(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        closeDrawer()
        router.refresh()
        toast.success('Student account created')
      }
    })
  }

  return (
    <>
      <Button onClick={openDrawer}>
        <Plus className="h-4 w-4 mr-2" />
        {label}
      </Button>

      {mounted && (
        <>
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[480px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Add Student</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a login account for a new student
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" {...register('full_name')} placeholder="Jane Smith" />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="jane@example.com" />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Min. 8 characters"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Share this password with the student. They can use it to sign in.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDrawer} disabled={isPending}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
