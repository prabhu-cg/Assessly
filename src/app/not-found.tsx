'use client'

import Link from 'next/link'
import { LogoMark } from '@/components/shared/logo'
import { Footer } from '@/components/shared/footer'

export default function NotFound() {
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#FFF9EB' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-14">
          <LogoMark className="h-8 w-auto" />
          <span className="font-bold text-base tracking-tight">Assessly</span>
        </Link>

        {/* Score card */}
        <div className="relative w-full max-w-sm mb-10">
          {/* Torn paper edge effect */}
          <div
            className="absolute -top-3 left-0 right-0 h-3"
            style={{
              background: 'white',
              clipPath: 'polygon(0% 100%, 2% 0%, 4% 100%, 6% 0%, 8% 100%, 10% 0%, 12% 100%, 14% 0%, 16% 100%, 18% 0%, 20% 100%, 22% 0%, 24% 100%, 26% 0%, 28% 100%, 30% 0%, 32% 100%, 34% 0%, 36% 100%, 38% 0%, 40% 100%, 42% 0%, 44% 100%, 46% 0%, 48% 100%, 50% 0%, 52% 100%, 54% 0%, 56% 100%, 58% 0%, 60% 100%, 62% 0%, 64% 100%, 66% 0%, 68% 100%, 70% 0%, 72% 100%, 74% 0%, 76% 100%, 78% 0%, 80% 100%, 82% 0%, 84% 100%, 86% 0%, 88% 100%, 90% 0%, 92% 100%, 94% 0%, 96% 100%, 98% 0%, 100% 100%)',
            }}
          />

          {/* Card */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4 border-b border-dashed border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Assessly · Exam Results
              </p>
              <p className="text-sm font-medium text-foreground">Subject: Page Navigation</p>
            </div>

            {/* Score */}
            <div className="px-6 py-8 flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Mark obtained</p>
                <p
                  className="text-7xl font-black leading-none tracking-tight"
                  style={{ color: '#ee661d' }}
                >
                  404
                </p>
                <p className="text-sm text-muted-foreground mt-2">out of 200</p>
              </div>

              {/* Grade circle */}
              <div
                className="h-20 w-20 rounded-full border-4 flex flex-col items-center justify-center shrink-0"
                style={{ borderColor: '#ee661d' }}
              >
                <span className="text-2xl font-black" style={{ color: '#ee661d' }}>F</span>
                <span className="text-[10px] text-muted-foreground font-medium">Not Found</span>
              </div>
            </div>

            {/* Teacher comment */}
            <div className="px-6 pb-6">
              <div className="rounded-xl bg-muted/40 border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Teacher's note
                </p>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "This page appears to have missed the exam entirely. It may have moved,
                  been archived, or never existed. Please navigate back and try again."
                </p>
              </div>
            </div>
          </div>

          {/* Torn paper edge bottom */}
          <div
            className="absolute -bottom-3 left-0 right-0 h-3"
            style={{
              background: 'white',
              clipPath: 'polygon(0% 0%, 2% 100%, 4% 0%, 6% 100%, 8% 0%, 10% 100%, 12% 0%, 14% 100%, 16% 0%, 18% 100%, 20% 0%, 22% 100%, 24% 0%, 26% 100%, 28% 0%, 30% 100%, 32% 0%, 34% 100%, 36% 0%, 38% 100%, 40% 0%, 42% 100%, 44% 0%, 46% 100%, 48% 0%, 50% 100%, 52% 0%, 54% 100%, 56% 0%, 58% 100%, 60% 0%, 62% 100%, 64% 0%, 66% 100%, 68% 0%, 70% 100%, 72% 0%, 74% 100%, 76% 0%, 78% 100%, 80% 0%, 82% 100%, 84% 0%, 86% 100%, 88% 0%, 90% 100%, 92% 0%, 94% 100%, 96% 0%, 98% 100%, 100% 0%)',
            }}
          />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#ee661d' }}
          >
            Take me home
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold border border-border bg-white text-foreground hover:bg-muted transition-colors"
          >
            Go back
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
