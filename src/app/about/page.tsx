import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection, InfoFacts } from '@/components/shared/info-page'

export const metadata: Metadata = { title: 'About', description: 'What Assessly is, how it is built, and what comes next.' }

export default function AboutPage() {
  return (
    <InfoPage title="About Assessly" lead="Assess smarter. Teach better.">
      <InfoSection title="What it is">
        <p>
          Assessly is an online platform for tests and assignments. A teacher builds the work, gives it to students,
          reviews what comes back, and shares each result when they are ready. A student opens their work, does it, and
          sees their marks and comments once the teacher shares them.
        </p>
        <p>
          Tests are timed and taken in a fullscreen view, with multiple-choice questions marked the moment they are
          handed in. Assignments are set by a brief, optional files and questions, and a due date. Students can type
          their work, attach files, or both, and late work is flagged rather than refused.
        </p>
        <p>
          There is no self-signup. Teachers create their students&apos; accounts and share access as an invite code or a
          personal link, so a class can be working within minutes and nobody has to remember another password.
        </p>
      </InfoSection>

      <InfoSection title="How it is built">
        <InfoFacts
          rows={[
            ['Framework', 'Next.js 16 (App Router) and React 19, written in TypeScript'],
            ['Styling', 'Tailwind CSS 4 with shadcn/ui components on Base UI'],
            ['Icons and type', 'Lucide icons, with Newsreader for headlines and DM Sans for text'],
            ['Forms and validation', 'React Hook Form and Zod'],
            ['Data and sign-in', 'Supabase: Postgres with row-level security, and Supabase Auth'],
            ['Files', 'Supabase Storage: private for assignment files, public for question images'],
            ['Hosting', 'Vercel'],
          ]}
        />
        <p>
          Every teacher only ever sees their own tests, assignments and students. Students reach their own work through
          the server, which checks they were given it and holds back marks, comments and answer keys until the teacher
          shares the result.
        </p>
      </InfoSection>

      <InfoSection title="What is live, and what is next">
        <p>
          Live today: tests with three question types and optional images, assignments with briefs, files, questions
          and a due date, automatic marking of multiple choice, a review screen for written work, comments, sending
          work back for a revision, sharing results one student at a time, student accounts with a year label, and light
          and dark themes on every page and device.
        </p>
        <p>
          On the list next: an email to a student when a result is shared, copying an existing test or assignment,
          average and pass-rate figures for each test, and optional payment tracking for tutors who charge per student.
        </p>
      </InfoSection>

      <InfoSection title="Who it is for">
        <p>
          Assessly is made for teachers and tutors who want to set work and mark it without the busywork, and for the
          students who do it. If you are a student, ask your teacher for your link. If you are a teacher,{' '}
          <Link href="/login">sign in</Link> to get started. You can read how we handle data in the{' '}
          <Link href="/privacy">Privacy Policy</Link> and the <Link href="/terms">Terms of Use</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
