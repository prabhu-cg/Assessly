'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { joinTestSchema, type JoinTestInput } from '@/lib/validators/schemas'
import { joinTest } from '@/app/actions/tests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Hash } from 'lucide-react'

export default function JoinTestPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<JoinTestInput>({
    resolver: zodResolver(joinTestSchema),
  })

  const onSubmit = (data: JoinTestInput) => {
    const formData = new FormData()
    formData.append('invite_code', data.invite_code.toUpperCase())
    startTransition(async () => {
      const result = await joinTest(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Join a Test</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the invite code your teacher shared with you
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite_code">Invite Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite_code"
                  {...register('invite_code')}
                  placeholder="e.g. A1B2C3D4"
                  className="pl-9 font-mono text-lg tracking-widest uppercase"
                  autoComplete="off"
                  maxLength={20}
                />
              </div>
              {errors.invite_code && (
                <p className="text-sm text-destructive">{errors.invite_code.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Join Test
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
