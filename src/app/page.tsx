import Link from 'next/link'
import {
  FileText,
  Link2,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  PenLine,
  Share2,
  GraduationCap,
  Users,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LogoMark } from '@/components/shared/logo'
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
    icon: PenLine,
    title: 'Create a test',
    description: 'Add questions, set correct answers, and organize everything from your teacher dashboard.',
  },
  {
    num: '2',
    icon: Share2,
    title: 'Share the invite code',
    description: 'Hand students an 8-character code — that\'s all they need to find and open the test.',
  },
  {
    num: '3',
    icon: GraduationCap,
    title: 'Students take it',
    description: 'Students join with the code, work through the test, and submit when they\'re done.',
  },
  {
    num: '4',
    icon: CheckCircle2,
    title: 'Review & grade',
    description: 'MCQs are graded instantly. Grade written answers yourself, then release results.',
  },
]

const PREVIEW_STATS = [
  { label: 'Total Tests', value: 12, icon: FileText, bg: 'bg-orange-50', iconColor: 'text-primary' },
  { label: 'Students', value: 84, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { label: 'Pending Review', value: 6, icon: ClipboardList, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
]

const PREVIEW_TESTS = [
  { title: 'Algebra Midterm', meta: '45 min · Oct 12, 2026', status: 'published' },
  { title: 'Cell Biology Quiz', meta: '20 min · Oct 9, 2026', status: 'published' },
  { title: 'Poetry Analysis Essay', meta: '60 min · Oct 5, 2026', status: 'draft' },
]

const PREVIEW_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500 border border-gray-200',
  published: 'bg-green-100 text-green-700',
}

const PREVIEW_ACTIONS = [
  { icon: Plus, label: 'Create New Test', desc: 'Draft a test with questions' },
  { icon: Users, label: 'Add Student', desc: 'Create a student account' },
  { icon: ClipboardList, label: 'Review Submissions', desc: 'Grade pending work' },
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
      <header className="border-b border-border/60">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-auto" />
            <span className="text-lg font-bold tracking-tight">Assessly</span>
          </div>
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
          className="relative overflow-hidden px-6 py-20 sm:py-28 text-center"
          style={{ backgroundColor: '#FFF9EB' }}
        >
          <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none select-none">
            <LogoMark className="h-[28rem] w-auto opacity-[0.06] -translate-y-1/3" />
          </div>

          <div className="relative max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Create, share, and grade exams —{' '}
              <span style={{ color: '#ee661d' }}>without the busywork.</span>
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
          <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#ee661d' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Product preview ── */}
        <section className="px-6 py-20">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight">A peek at your dashboard</h2>
              <p className="mt-3 text-muted-foreground">
                Illustrative preview with sample data — this is what a teacher sees after signing in.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-6 shadow-sm">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 mb-4 px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
              </div>

              <div className="rounded-xl bg-background p-4 sm:p-6 space-y-6 pointer-events-none select-none">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Good day, Priya 👋</h3>
                    <p className="text-muted-foreground text-sm mt-1">Here&apos;s what&apos;s happening with your tests.</p>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Test
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {PREVIEW_STATS.map(({ label, value, icon: Icon, bg, iconColor }) => (
                    <Card key={label}>
                      <CardContent className="flex items-center gap-4 p-5">
                        <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-bold">{value}</p>
                          <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <CardTitle className="text-base font-semibold">Recent Tests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border">
                        {PREVIEW_TESTS.map(test => (
                          <div key={test.title} className="flex items-center gap-4 p-3">
                            <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{test.title}</p>
                              <p className="text-xs text-muted-foreground">{test.meta}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PREVIEW_STATUS_STYLES[test.status]}`}>
                              {test.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border">
                        {PREVIEW_ACTIONS.map(({ icon: Icon, label, desc }) => (
                          <div key={label} className="flex items-center gap-3 p-3">
                            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-6 py-20">
          <div className="max-w-screen-xl mx-auto">
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
                    style={{ backgroundColor: '#fff0e6' }}
                  >
                    <feature.icon className="h-5.5 w-5.5" style={{ color: '#ee661d' }} />
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
        <section className="px-6 py-20" style={{ backgroundColor: '#FFF9EB' }}>
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted-foreground">
                From a blank test to a graded submission in four steps.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(step => (
                <div key={step.num} className="rounded-2xl border border-border bg-white p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: '#ee661d' }}
                    >
                      {step.num}
                    </span>
                    <step.icon className="h-5 w-5 text-muted-foreground" />
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
        <section className="px-6 py-20" style={{ backgroundColor: '#FFF9EB' }}>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight">Frequently asked questions</h2>
              <p className="mt-3 text-muted-foreground">
                Everything else you might be wondering about.
              </p>
            </div>
            <FaqAccordion items={FAQS} />
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Ready to run your next test?</h2>
            <p className="mt-3 text-muted-foreground">
              Sign in to your teacher dashboard, or ask your teacher for an invite code.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" render={<Link href="/login" />}>
                Teacher sign in
                <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/student-login" />}>
                I'm a student
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
