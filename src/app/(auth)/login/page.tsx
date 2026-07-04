'use client'

import { useTransition, useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { LogoMark } from '@/components/shared/logo'
import { toast } from 'sonner'

const QUOTES = [
  { text: 'Education is not the filling of a pail, but the lighting of a fire.', author: 'W.B. Yeats' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', author: 'Malcolm X' },
  { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', author: 'Plutarch' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
  { text: 'It is not that I\'m so smart. But I stay with the questions much longer.', author: 'Albert Einstein' },
  { text: 'The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.', author: 'Brian Herbert' },
  { text: 'A teacher affects eternity; he can never tell where his influence stops.', author: 'Henry Adams' },
  { text: 'What we learn with pleasure, we never forget.', author: 'Alfred Mercier' },
  { text: 'The whole art of teaching is only the art of awakening the natural curiosity of young minds.', author: 'Anatole France' },
  { text: 'Education is not preparation for life; education is life itself.', author: 'John Dewey' },
  { text: 'In learning you will teach, and in teaching you will learn.', author: 'Phil Collins' },
  { text: 'The highest result of education is tolerance.', author: 'Helen Keller' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'Learning is not attained by chance, it must be sought for with ardour and attended to with diligence.', author: 'Abigail Adams' },
  { text: 'One child, one teacher, one book, one pen can change the world.', author: 'Malala Yousafzai' },
  { text: 'The function of education is to teach one to think intensively and to think critically.', author: 'Martin Luther King Jr.' },
  { text: 'Curiosity is the wick in the candle of learning.', author: 'William Arthur Ward' },
  { text: 'Teaching is the greatest act of optimism.', author: 'Colleen Wilcox' },
  { text: 'To teach is to touch a life forever.', author: 'Unknown' },
  { text: 'The art of teaching is the art of assisting discovery.', author: 'Mark Van Doren' },
  { text: 'A good teacher can inspire hope, ignite the imagination, and instil a love of learning.', author: 'Brad Henry' },
] as const

function getDailyQuote() {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const quote = getDailyQuote()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <div className="min-h-svh flex flex-col">
    <div className="flex-1 flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: '#ee661d' }}
      >
        {/* Giant watermark logo */}
        <div className="absolute inset-y-0 right-0 translate-x-1/2 pointer-events-none select-none flex items-center">
          <LogoMark white className="h-full w-auto opacity-[0.15]" />
        </div>

        {/* Top — wordmark */}
        <Link href="/" className="relative flex items-center gap-3">
          <LogoMark white className="h-8 w-auto" />
          <span className="text-white text-xl font-bold tracking-tight">Assessly</span>
        </Link>

        {/* Centre — quote */}
        <div className="relative max-w-lg">
          <span
            aria-hidden
            className="block text-white/15 leading-none select-none -ml-3 mb-0"
            style={{ fontSize: '10rem', lineHeight: 1 }}
          >
            &ldquo;
          </span>
          <blockquote className="text-white text-[1.6rem] font-semibold leading-snug -mt-6">
            {quote.text}
          </blockquote>
          <p className="text-white/60 text-sm mt-5 font-medium tracking-wide">— {quote.author}</p>
        </div>

        {/* Bottom — copyright */}
        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} Assessly. All rights reserved.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 sm:py-12" style={{ backgroundColor: '#FFF9EB' }}>
        <div className="w-full max-w-sm">

          {/* Logo + tagline */}
          <Link href="/" className="flex flex-col items-center mb-6 sm:mb-8">
            <LogoMark className="h-10 sm:h-14 w-auto mb-2 sm:mb-3" />
            <h1 className="text-2xl font-bold tracking-tight">Assessly</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Assess smarter. Teach better.
            </p>
          </Link>

          {/* Form card */}
          <div className="rounded-2xl border border-border bg-white p-7">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Teacher Sign In</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and password to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="pl-8 pr-9"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 group">
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded px-2 py-1 text-xs font-medium text-white bg-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {showPassword ? 'Hide password' : 'Show password'}
                    </span>
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-1" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>

          </div>

        </div>
      </div>

    </div>
    </div>
  )
}
