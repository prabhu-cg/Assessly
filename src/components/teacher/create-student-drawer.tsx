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
import { Plus, X, Loader2, Copy, Check, Link2 } from 'lucide-react'
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
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    setGeneratedLink(null)
    setCopied(false)
    setMounted(true)
  }

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => {
      setMounted(false)
      setGeneratedLink(null)
      setCopied(false)
    }, 300)
  }

  const handleCopy = async () => {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = (data: CreateStudentInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, v))
    setError(null)

    startTransition(async () => {
      const result = await createStudent(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.accessToken) {
        const link = `${window.location.origin}/s/${result.accessToken}`
        setGeneratedLink(link)
        router.refresh()
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
            onClick={!generatedLink ? closeDrawer : undefined}
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
                <h2 className="text-base font-semibold">
                  {generatedLink ? 'Student Added!' : 'Add Student'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {generatedLink
                    ? 'Copy the link below and share it with the student or parent.'
                    : 'Create a login link for a new student'}
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
              {generatedLink ? (
                <div className="space-y-5">
                  {/* Success */}
                  <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Account created successfully</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        The student can use this personal link to access their dashboard — no password needed.
                      </p>
                    </div>
                  </div>

                  {/* Link box */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Student login link</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs break-all text-muted-foreground leading-relaxed">
                      {generatedLink}
                    </div>
                  </div>

                  <Button className="w-full gap-2" onClick={handleCopy}>
                    {copied ? (
                      <><Check className="h-4 w-4" />Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4" />Copy Link</>
                    )}
                  </Button>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800 font-medium mb-1">Share this link via:</p>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                      <li>Email to the student's parent</li>
                      <li>Paste into a QR code generator (e.g. qr-code-generator.com)</li>
                      <li>Print and hand to the student directly</li>
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => {
                    reset()
                    setError(null)
                    setGeneratedLink(null)
                    setCopied(false)
                  }}>
                    Add Another Student
                  </Button>
                </div>
              ) : (
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
                    <p className="text-xs text-muted-foreground">
                      Used to identify the account. The student does not need to know or use this email to log in.
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      A unique personal link will be generated for this student. No password is needed — they simply click their link to access their tests.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create & Get Link
                    </Button>
                    <Button type="button" variant="outline" onClick={closeDrawer} disabled={isPending}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
