'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wordmark, LogoMark } from '@/components/shared/logo'

type FooterModal = 'about' | 'terms' | 'privacy' | null

const APP_VERSION = 'v0.1.0 — Phase 1 MVP'

const TECH_STACK = [
  { label: 'Frontend', value: 'Next.js (App Router)' },
  { label: 'Styling', value: 'Tailwind CSS' },
  { label: 'Language', value: 'TypeScript' },
  { label: 'Backend', value: 'Supabase (Postgres, Auth)' },
  { label: 'Forms & validation', value: 'React Hook Form + Zod' },
  { label: 'Hosting', value: 'Vercel' },
]

const WHAT_IT_TRACKS = [
  { label: 'Invite-code access', body: 'an 8-character code is all a student needs to join a test — no self-signup.' },
  { label: 'Instant MCQ grading', body: 'multiple-choice answers are scored the moment a student submits.' },
  { label: 'Written-answer review', body: 'short and long answers are graded by the teacher in a dedicated screen.' },
  { label: 'Role-based access', body: 'row-level security keeps every teacher and student scoped to their own data.' },
]

const AboutBody = () => (
  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
    <div>
      <h3 className="mb-1.5 text-sm font-bold text-foreground">Why Assessly Exists</h3>
      <p>
        Running a test with spreadsheets, paper, and a shared drive folder means
        answer keys go stale, submissions get lost, and grading takes evenings.
        Assessly puts test creation, invite-based access, and grading in one place,
        so a teacher can go from a blank test to a graded submission in minutes.
      </p>
    </div>

    <div>
      <h3 className="mb-1.5 text-sm font-bold text-foreground">What It Tracks</h3>
      <ul className="list-disc space-y-1 pl-5">
        {WHAT_IT_TRACKS.map(item => (
          <li key={item.label}>
            <span className="font-medium text-foreground">{item.label}</span> — {item.body}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="mb-1.5 text-sm font-bold text-foreground">Tech Stack</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {TECH_STACK.map(item => (
          <div key={item.label}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{item.label}</p>
            <p className="text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="mb-1.5 text-sm font-bold text-foreground">Who Built This</h3>
      <p>
        Assessly is an independent side project by{' '}
        <a href="mailto:prabhu_cg@proton.me" className="text-primary hover:underline">
          Prabhu Raja
        </a>
        , a product designer with 15+ years across enterprise and B2B software — currently
        VP of User Experience at BNY, previously at Thomson Reuters HighQ, Sweepr, and
        Marston Holdings. Day to day, that work centres on design systems, accessibility,
        and turning ambiguous, high-stakes workflows into clear, systemised outcomes.
      </p>
      <p className="mt-3">
        Assessly applies that same discipline to the classroom: a small, focused tool for
        creating tests, granting access, and grading work — without spreadsheets or paper
        trails.
      </p>
      <p className="mt-3">
        Feedback, feature requests, or just want to say hello —{' '}
        <a href="mailto:prabhu_cg@proton.me" className="text-primary hover:underline">
          prabhu_cg@proton.me
        </a>
        .
      </p>
    </div>
  </div>
)

const MODAL_CONTENT: Record<
  Exclude<FooterModal, null>,
  { title: string; description?: string; body: React.ReactNode }
> = {
  about: {
    title: 'About Assessly',
    body: <AboutBody />,
  },
  terms: {
    title: 'Terms of Service',
    description: 'Last updated 2026.',
    body: (
      <>
        <p>
          By using Assessly, you agree to use it only for its intended purpose:
          creating, distributing, taking, and grading tests within your school or
          organization.
        </p>
        <p>
          <strong className="text-foreground">Accounts.</strong> Teacher accounts
          are provisioned by an administrator. Student accounts are created by a
          teacher and accessed via an invite code or personal link. You&apos;re
          responsible for keeping your login credentials confidential.
        </p>
        <p>
          <strong className="text-foreground">Content.</strong> Tests, questions,
          and submissions you create remain yours. You grant Assessly the limited
          right to store and display that content so the platform can function.
        </p>
        <p>
          <strong className="text-foreground">Acceptable use.</strong> Don&apos;t
          use Assessly to share unlawful content, attempt to access accounts that
          aren&apos;t yours, or disrupt the service for other users.
        </p>
        <p>
          <strong className="text-foreground">Availability.</strong> Assessly is
          provided as-is, without warranty of uninterrupted availability. We aim
          for reliability but can&apos;t guarantee zero downtime.
        </p>
      </>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'What we collect and how it\'s used.',
    body: (
      <>
        <p>
          Assessly collects the minimum information needed to run a classroom:
          your name, email address, role (teacher or student), and the tests,
          questions, and answers you create or submit.
        </p>
        <p>
          <strong className="text-foreground">Storage.</strong> Data is stored in
          a Supabase-managed PostgreSQL database with row-level security, so
          teachers and students can only access data tied to their own account
          and tests.
        </p>
        <p>
          <strong className="text-foreground">Use.</strong> Your data is used
          solely to operate the platform — authenticating you, showing your
          tests and submissions, and computing grades. We don&apos;t sell your
          data or share it with third parties for advertising.
        </p>
        <p>
          <strong className="text-foreground">Retention.</strong> Test and
          submission records are retained for as long as your account or
          organization uses Assessly, or until an administrator removes them.
        </p>
        <p>
          <strong className="text-foreground">Contact.</strong> To request
          access to or deletion of your data, contact the teacher or
          administrator who set up your account.
        </p>
      </>
    ),
  },
}

export function Footer() {
  const [modal, setModal] = useState<FooterModal>(null)
  const active = modal ? MODAL_CONTENT[modal] : null

  return (
    <footer className="shrink-0 border-t border-border/50 bg-background">
      <div className="max-w-screen-xl mx-auto flex flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <Wordmark />

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Assessly. Assess smarter. Teach better.
        </p>

        <div className="flex items-center gap-5">
          <button onClick={() => setModal('about')} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            About
          </button>
          <button onClick={() => setModal('terms')} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Terms
          </button>
          <button onClick={() => setModal('privacy')} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Privacy
          </button>
        </div>
      </div>

      <Dialog modal="trap-focus" open={modal !== null} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className={modal === 'about' ? 'gap-0 overflow-hidden rounded-4xl p-0 sm:max-w-2xl' : 'sm:max-w-lg'}>
          {active && (
            <>
              {modal === 'about' ? (
                <div className="flex items-start gap-4 border-b border-border p-6 pb-6 sm:p-8 sm:pb-6">
                  <LogoMark className="h-12 w-auto shrink-0" />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-heading text-xl font-bold leading-none">
                      {active.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-xs text-muted-foreground">
                      Assess smarter. Teach better.
                    </DialogDescription>
                    <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {APP_VERSION}
                    </span>
                  </div>
                </div>
              ) : (
                <DialogHeader>
                  <DialogTitle>{active.title}</DialogTitle>
                  {active.description && <DialogDescription>{active.description}</DialogDescription>}
                </DialogHeader>
              )}
              <ScrollArea className={modal === 'about' ? 'max-h-[70vh]' : 'max-h-[80vh] pr-3'}>
                <div
                  className={
                    modal === 'about'
                      ? 'space-y-4 p-6 text-sm text-muted-foreground leading-relaxed sm:p-8'
                      : 'space-y-3 text-sm text-muted-foreground leading-relaxed'
                  }
                >
                  {active.body}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  )
}
