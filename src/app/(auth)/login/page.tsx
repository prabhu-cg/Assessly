'use client'

import { useTransition } from 'react'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { LogoMark } from '@/components/shared/logo'
import { toast } from 'sonner'

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: '#ee661d' }}
      >
        {/* Giant watermark logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <LogoMark white className="w-[480px] opacity-[0.08]" />
        </div>

        {/* Top — wordmark */}
        <div className="relative flex items-center gap-3">
          <LogoMark white className="h-8 w-auto" />
          <span className="text-white text-xl font-bold tracking-tight">Assessly</span>
        </div>

        {/* Centre — quote */}
        <div className="relative max-w-lg">
          <span
            aria-hidden
            className="block text-white/15 font-serif leading-none select-none -ml-3 mb-0"
            style={{ fontSize: '10rem', lineHeight: 1 }}
          >
            &ldquo;
          </span>
          <blockquote className="text-white text-[1.6rem] font-semibold leading-snug -mt-6">
            Education is not the filling of a pail, but the lighting of a fire.
          </blockquote>
          <p className="text-white/60 text-sm mt-5 font-medium tracking-wide">— W.B. Yeats</p>
        </div>

        {/* Bottom — copyright */}
        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} Assessly. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ backgroundColor: '#FFF9EB' }}>
        <div className="w-full max-w-sm">

          {/* Logo + tagline */}
          <div className="flex flex-col items-center mb-8">
            <LogoMark className="h-14 w-auto mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">Assessly</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Assess smarter. Teach better.
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and password to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-1" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <span className="text-foreground font-semibold">
                Contact your teacher to get access.
              </span>
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
