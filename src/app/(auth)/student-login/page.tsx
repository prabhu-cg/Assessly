import Link from 'next/link'
import { LogoMark } from '@/components/shared/logo'
import { Footer } from '@/components/shared/footer'
import { Link2 } from 'lucide-react'

export default function StudentLoginPage() {
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF9EB' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <LogoMark className="h-10 w-auto" />
          <span className="text-xl font-bold tracking-tight">Assessly</span>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          {/* Icon */}
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#fff0e6' }}
          >
            <Link2 className="h-8 w-8" style={{ color: '#ee661d' }} />
          </div>

          <h1 className="text-2xl font-bold mb-2">Use your link!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            You have a special personal link to get into your tests.
            <br />
            Ask your <strong className="text-foreground">teacher or parent</strong> for your link if you can't find it.
          </p>

          {/* Steps */}
          <div className="rounded-xl bg-muted/50 p-4 text-left space-y-3 text-sm mb-6">
            {[
              { num: '1', text: 'Find the link your teacher gave you' },
              { num: '2', text: 'Click the link to open your tests' },
              { num: '3', text: 'Bookmark it so you always have it!' },
            ].map(({ num, text }) => (
              <div key={num} className="flex items-center gap-3">
                <span
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: '#ee661d' }}
                >
                  {num}
                </span>
                <span className="text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Are you a teacher?{' '}
            <Link href="/login" className="font-semibold text-foreground underline underline-offset-2">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
