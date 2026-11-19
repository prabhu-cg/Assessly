import Link from 'next/link'
import {
  FileText,
  Link2,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  NotebookPen,
  ImagePlus,
  SunMoon,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoMark, Wordmark } from '@/components/shared/logo'
import { ProductTour } from '@/components/shared/product-tour'
import { Footer } from '@/components/shared/footer'
import { ThemeToggle } from '@/components/shared/theme-toggle'
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
    description: 'See who has attempted, submitted, or still needs to take a test or assignment, with late work flagged.',
  },
  {
    icon: NotebookPen,
    title: 'Assignments',
    description: 'Set homework with a brief, files and optional questions. Track who has handed in, mark it, comment, then share results with each student.',
  },
  {
    icon: ImagePlus,
    title: 'Images in questions',
    description: 'Add a diagram, graph or photo to any question. Choose a file, drag one in, or paste a screenshot straight from your clipboard.',
  },
  {
    icon: SunMoon,
    title: 'Light and dark mode',
    description: 'Switch themes in one click, for teachers and students, on any device. Your choice is remembered.',
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
    question: 'Can I set assignments as well as tests?',
    answer: "Yes. An assignment has a brief, optional files and questions, and a due date. You pick the students, see who has handed in (late work is flagged), mark it, leave comments, and share each result when you are ready. You can also send work back for a revision.",
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
    question: 'Can I add images to questions?',
    answer: "Yes. Every question can carry one image: choose a file, drag it in, or paste a screenshot from your clipboard (⌘V or Ctrl+V). PNG, JPG, WebP and GIF are supported, up to 5 MB each; large PNG and JPG images are resized automatically.",
  },
  {
    question: 'Is there a dark mode?',
    answer: 'Yes. Use the sun and moon button in the top bar to switch between light and dark. It works on every page, for teachers and students.',
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
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-4 sm:px-6">
          <Wordmark />
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/student-login" />}>
              <span className="sm:hidden">Students</span>
              <span className="hidden sm:inline">Student portal</span>
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
          <div className="relative max-w-screen-xl mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-5xl sm:text-7xl leading-none">
                Create, share, and grade exams —{' '}
                <span className="text-primary-text">without the busywork.</span>
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
                  <div className="font-display text-3xl sm:text-4xl text-ink-strong">
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
              <h2 className="text-4xl">A peek inside Assessly</h2>
              <p className="mt-3 text-muted-foreground">
                Illustrative previews with sample data: what a teacher sees after signing in.
              </p>
            </div>

            <ProductTour />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-4xl">What Assessly does</h2>
              <p className="mt-3 text-muted-foreground">
                Everything a classroom needs to run a test, from question to grade.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map(feature => (
                <div key={feature.title}>
                  <div
                    className="h-11 w-11 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--primary-soft)' }}
                  >
                    <feature.icon className="h-5.5 w-5.5 text-primary-text" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-20">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-4xl">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                From a blank test to a graded submission in four steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(step => (
                <div key={step.num} className="rounded-[20px] border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground bg-primary shrink-0"
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
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
                <h2 className="text-4xl">Frequently asked questions</h2>
                <p className="mt-3 text-muted-foreground">
                  Everything else you might be wondering about.
                </p>
              </div>
              <FaqAccordion items={FAQS} />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl text-ink-strong">
                Ready to run your next test?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Sign in to your teacher dashboard, or ask your teacher for an invite code.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" render={<Link href="/login" />}>
                  Teacher sign in
                  <ArrowRight />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
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
