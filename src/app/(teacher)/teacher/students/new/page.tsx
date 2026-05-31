'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createStudentSchema, type CreateStudentInput } from '@/lib/validators/schemas'
import { createStudent } from '@/app/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Check, Link2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NewStudentPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
  })

  const handleCopy = async () => {
    if (!generatedLink) return
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = (data: CreateStudentInput) => {
    const formData = new FormData()
    Object.entries(data).forEach(([k, v]) => formData.append(k, v))

    startTransition(async () => {
      const result = await createStudent(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.accessToken) {
        setGeneratedLink(`${window.location.origin}/s/${result.accessToken}`)
        reset()
      }
    })
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Add Student</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a personal login link for a new student</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {generatedLink ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Student account created!</p>
                  <p className="text-xs text-green-700 mt-0.5">Share the link below with the student or their parent.</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  Student login link
                </div>
                <div className="rounded-xl border bg-muted/40 p-3 font-mono text-xs break-all text-muted-foreground">
                  {generatedLink}
                </div>
              </div>
              <Button className="w-full gap-2" onClick={handleCopy}>
                {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Link</>}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setGeneratedLink(null); setError(null) }}>
                  Add Another
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => router.push('/teacher/students')}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" {...register('first_name')} placeholder="Jane" />
                  {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" {...register('last_name')} placeholder="Smith" />
                  {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs text-blue-800">
                  A unique personal link will be generated. The student simply clicks their link — no password needed.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create & Get Link
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/teacher/students')}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
