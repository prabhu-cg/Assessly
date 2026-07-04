'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

type FooterModal = 'about' | 'terms' | 'privacy' | null

const MODAL_CONTENT: Record<
  Exclude<FooterModal, null>,
  { title: string; description: string; body: React.ReactNode }
> = {
  about: {
    title: 'About Assessly',
    description: 'A modern examination platform for teachers and students.',
    body: (
      <>
        <p>
          Assessly helps teachers build tests, share them with a simple invite code,
          and grade student work without spreadsheets or paper. Multiple-choice
          questions are graded the moment a student submits, and short and long
          answers get a purpose-built review screen.
        </p>
        <p>
          Students don&apos;t need to create an account up front — a teacher creates
          it, and an invite code is all it takes to join a test.
        </p>
        <p>
          Assessly is under active development. Questions or feedback? Reach out to
          your administrator or the team that set up your instance.
        </p>
      </>
    ),
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
    <footer className="shrink-0 border-t border-border/50 py-2 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Assessly. All rights reserved.</span>
        <span className="text-border">·</span>
        <button onClick={() => setModal('about')} className="hover:text-foreground hover:underline underline-offset-2">
          About
        </button>
        <span className="text-border">·</span>
        <button onClick={() => setModal('terms')} className="hover:text-foreground hover:underline underline-offset-2">
          Terms
        </button>
        <span className="text-border">·</span>
        <button onClick={() => setModal('privacy')} className="hover:text-foreground hover:underline underline-offset-2">
          Privacy
        </button>
        <span className="text-border">·</span>
        <span className="font-mono">v0.1.0</span>
      </div>

      <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="sm:max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription>{active.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh] pr-3">
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
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
