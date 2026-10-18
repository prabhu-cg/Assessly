import Link from 'next/link'
import {
  FileText,
  Link2,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark, Wordmark } from '@/components/shared/logo'
import { MacbookFrame } from '@/components/shared/macbook-frame'
import { Footer } from '@/components/shared/footer'
import { FaqAccordion } from '@/components/shared/faq-accordion'

const STATS = [
  { value: '2', label: 'Roles: teacher & student' },
  { value: 'Auto', label: 'MCQ grading' },
  { value: '8-char', label: 'Invite codes' },
  { value: '0', label: 'Setup required' },
]

const FEATURES = [
  {
    icon: FileText,
    title: 'Build tests in minutes',
    description: 'Mix multiple-choice, short-answer, and long-answer questions into a single test, with 2–6 options per MCQ.',
  },
  {
    icon: Link2,
    title: 'Invite-code access',
    description: "Share an 8-character code with your class. Students join in seconds — no accounts to pre-create, no waitlists.",
  },
  {
    icon: CheckCircle2,
    title: 'Instant MCQ grading',
    description: 'Multiple-choice answers are scored the moment a student submits, so results are ready before you are.',
  },
  {
    icon: ClipboardList,
    title: 'Evaluate written answers',
    description: 'Review short and long-answer responses side by side and assign scores with a purpose-built grading view.',
  },
  {
    icon: BarChart3,
    title: 'Submission tracking',
    description: 'See who has attempted, submitted, or still needs to take a test, grouped clearly across every attempt.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Teachers and students each get a dashboard scoped to exactly what they need — nothing more, nothing less.',
  },
]

const STEPS = [
  {
    num: '1',
    title: 'Create a test',
    description: 'Add questions, set correct answers, and organize everything from your teacher dashboard.',
  },
  {
    num: '2',
    title: 'Share the invite code',
    description: 'Hand students an 8-character code — that\'s all they need to find and open the test.',
  },
  {
    num: '3',
    title: 'Students take it',
    description: 'Students join with the code, work through the test, and submit when they\'re done.',
  },
  {
    num: '4',
    title: 'Review & grade',
    description: 'MCQs are graded instantly. Grade written answers yourself, then release results.',
  },
]

const FAQS = [
  {
    question: 'Do students need to create their own account?',
    answer: "No. Teachers create student accounts and share access as an invite code or a personal link — students don't sign themselves up.",
  },
  {
    question: 'What kinds of questions can I add to a test?',
    answer: 'Multiple-choice (2–6 options), short-answer, and long-answer questions, mixed freely within the same test.',
  },
  {
    question: 'How does grading work?',
    answer: "Multiple-choice answers are graded automatically the moment a student submits. Short and long answers are graded by the teacher in a dedicated review screen.",
  },
  {
    question: 'Is student data kept private?',
    answer: "Yes. Assessly uses row-level security so teachers and students can only access data tied to their own account and tests. We don't sell data or share it with third parties.",
  },
  {
    question: 'Do I need to install anything?',
    answer: 'No — Assessly runs entirely in the browser for both teachers and students, on any device.',
  },
  {
    question: "What if a student can't find their invite code or link?",
    answer: "Ask the teacher — every test's invite code is visible on its test page in their dashboard, so they can share it again anytime.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-4">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/student-login" />}>
              Student portal
            </Button>
            <Button render={<Link href="/login" />}>Teacher sign in</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden py-20 sm:py-28 text-center"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none select-none">
            <LogoMark className="h-[28rem] w-auto opacity-[0.06] -translate-y-1/3" />
          </div>

          <div className="relative max-w-screen-xl mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Create, share, and grade exams —{' '}
                <span style={{ color: 'var(--primary)' }}>without the busywork.</span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
                Assessly is a modern examination platform for teachers and students. Build a test,
                share an invite code, and let auto-grading handle the rest.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" render={<Link href="/login" />}>
                  Teacher sign in
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="outline" render={<Link href="/student-login" />}>
                  I'm a student
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No self-signup needed — teachers create accounts, students join by invite code.
              </p>
            </div>

            {/* Stats */}
            <div className="max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {STATS.map(stat => (
                <div key={stat.label}>
                  <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--primary)' }}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product preview ── */}
        <section className="py-20">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight">A peek at your dashboard</h2>
              <p className="mt-3 text-muted-foreground">
                Illustrative preview with sample data — this is what a teacher sees after signing in.
              </p>
            </div>

            <MacbookFrame src="/mockups/dashboard.png" alt="Assessly teacher dashboard showing recent tests, stats and quick actions" />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight">What Assessly does</h2>
              <p className="mt-3 text-muted-foreground">
                Everything a classroom needs to run a test, from question to grade.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map(feature => (
                <div key={feature.title}>
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--primary-soft)' }}
                  >
                    <feature.icon className="h-5.5 w-5.5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-20" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                From a blank test to a graded submission in four steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(step => (
                <div key={step.num} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-14">
                <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
                <p className="mt-3 text-muted-foreground">
                  Everything else you might be wondering about.
                </p>
              </div>
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="bg-primary py-20">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground">
                Ready to run your next test?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80">
                Sign in to your teacher dashboard, or ask your teacher for an invite code.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" variant="secondary" render={<Link href="/login" />}>
                  Teacher sign in
                  <ArrowRight />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  render={<Link href="/student-login" />}
                >
                  I'm a student
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
