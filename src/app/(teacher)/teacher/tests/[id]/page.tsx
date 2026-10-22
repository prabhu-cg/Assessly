import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { Clock, Hash, Users, BookOpen, ClipboardList, CalendarClock, Trophy } from 'lucide-react'
import { LocalDateTime } from '@/components/teacher/local-date-time'
import { EditTestDrawer } from '@/components/teacher/edit-test-drawer'
import { TestStudents, type EnrolledStudent, type BlockedStudent } from '@/components/teacher/test-students'

interface TestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (!test) notFound()

  const [
    { data: questions },
    { count: submissionCount },
    { data: testAccess },
    { data: submissions },
    { data: allStudents },
  ] = await Promise.all([
    supabase.from('questions').select('id, type, marks').eq('test_id', id).order('order_index'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('test_id', id),
    supabase.from('test_access').select('student_id, profiles!test_access_student_id_fkey(id, full_name)').eq('test_id', id),
    supabase.from('submissions').select('student_id, id, status, obtained_marks, total_marks, created_at').eq('test_id', id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('created_by', user.id).eq('role', 'student').order('full_name'),
  ])

  const totalMarks = questions?.reduce((sum, q) => sum + q.marks, 0) ?? 0

  // Group submissions by student, newest first (query is ordered by created_at desc)
  const submissionsByStudent = (submissions ?? []).reduce(
    (acc, s) => {
      acc[s.student_id] = acc[s.student_id] ?? []
      acc[s.student_id].push(s)
      return acc
    },
    {} as Record<string, NonNullable<typeof submissions>>
  )

  const enrolledStudents: EnrolledStudent[] = (testAccess ?? []).map(ta => {
    const raw = ta.profiles as unknown
    const profile = Array.isArray(raw)
      ? (raw[0] as { id: string; full_name: string } | undefined) ?? null
      : (raw as { id: string; full_name: string } | null)
    const studentId = profile?.id ?? ta.student_id
    const subs = submissionsByStudent[studentId] ?? []
    return {
      id: studentId,
      full_name: profile?.full_name ?? 'Unknown',
      submission: subs[0] ?? null,
      attemptCount: subs.length,
    }
  })

  const enrolledIds = new Set(enrolledStudents.map(s => s.id))

  // Students with an active (non-evaluated) submission who aren't currently enrolled
  // e.g. removed from test_access while a submission was still in progress
  const activeSubmissionIds = new Set(
    (submissions ?? [])
      .filter(s => (s.status === 'in_progress' || s.status === 'submitted') && !enrolledIds.has(s.student_id))
      .map(s => s.student_id)
  )

  const studentById = Object.fromEntries((allStudents ?? []).map(s => [s.id, s]))

  const blockedStudents: BlockedStudent[] = [...activeSubmissionIds]
    .flatMap(sid => {
      const student = studentById[sid]
      if (!student) return []
      const latestSub = submissionsByStudent[sid]?.[0]
      return [{
        id: student.id,
        full_name: student.full_name,
        reason: latestSub?.status === 'in_progress' ? 'Currently in progress' : 'Awaiting evaluation',
      }]
    })

  const availableStudents = (allStudents ?? []).filter(
    s => !enrolledIds.has(s.id) && !activeSubmissionIds.has(s.id)
  )

  // Scores are judged on each student's latest attempt so retakes don't skew the numbers.
  const latestSubs = Object.values(submissionsByStudent).map(subs => subs[0])
  const evaluated = latestSubs.filter(s => s.status === 'evaluated' && s.total_marks > 0)
  const averagePct = evaluated.length
    ? Math.round(evaluated.reduce((sum, s) => sum + (s.obtained_marks / s.total_marks) * 100, 0) / evaluated.length)
    : null
  const passRate = evaluated.length && test.pass_mark != null
    ? Math.round((evaluated.filter(s => s.obtained_marks >= test.pass_mark).length / evaluated.length) * 100)
    : null
  const statusCounts = {
    inProgress: latestSubs.filter(s => s.status === 'in_progress').length,
    submitted: latestSubs.filter(s => s.status === 'submitted').length,
    evaluated: latestSubs.filter(s => s.status === 'evaluated').length,
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Breadcrumbs items={[{ label: 'Tests', href: '/teacher/tests' }, { label: test.title }]} />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{test.title}</h1>
              <Badge variant={test.status === 'published' ? 'success' : test.status === 'archived' ? 'outline' : 'muted'}>
                {test.status}
              </Badge>
              {test.status === 'published' && (
                <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded tracking-widest">
                  {test.invite_code}
                </span>
              )}
            </div>
            {test.description && <p className="text-muted-foreground text-sm">{test.description}</p>}
          </div>
          <div className="flex gap-2">
            <EditTestDrawer test={test as any} />
            <Button size="sm" render={<Link href={`/teacher/tests/${id}/questions`} />}>
              <BookOpen className="h-4 w-4 mr-2" />Questions
            </Button>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_34rem]">
        <div className="order-2 lg:order-1">
          <TestStudents
            testId={id}
            testStatus={test.status}
            enrolled={enrolledStudents}
            available={availableStudents}
            blocked={blockedStudents}
          />
        </div>
        <aside className="space-y-4 order-1 lg:order-2" aria-label="Test overview">
          <h2 className="text-sm font-semibold">Test overview</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Clock, value: test.duration_minutes, label: 'minutes' },
              { icon: Hash, value: questions?.length ?? 0, label: 'questions' },
              { icon: ClipboardList, value: totalMarks, label: 'total marks' },
              { icon: Users, value: submissionCount ?? 0, label: 'submissions' },
            ].map(({ icon: Icon, value, label }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />Availability
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Opens</dt>
                    <dd>{test.starts_at ? <LocalDateTime iso={test.starts_at} /> : <span className="text-muted-foreground">Anytime</span>}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Closes</dt>
                    <dd>{test.ends_at ? <LocalDateTime iso={test.ends_at} /> : <span className="text-muted-foreground">No end date</span>}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-muted-foreground" />Scoring
                </div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Pass mark</dt>
                    <dd>{test.pass_mark != null ? `${test.pass_mark} / ${totalMarks}` : <span className="text-muted-foreground">Not set</span>}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Average score</dt>
                    <dd className="tabular-nums">{averagePct != null ? `${averagePct}%` : <span className="text-muted-foreground">No results yet</span>}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Pass rate</dt>
                    <dd className="tabular-nums">{passRate != null ? `${passRate}%` : <span className="text-muted-foreground">—</span>}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />Submissions
                </div>
                {statusCounts.submitted > 0 && (
                  <Link href={`/teacher/submissions?test=${id}&status=submitted`} className="text-xs font-semibold text-primary-text hover:underline">
                    Review {statusCounts.submitted}
                  </Link>
                )}
              </div>
              <dl className="space-y-1.5 text-sm tabular-nums">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">In progress</dt><dd>{statusCounts.inProgress}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Awaiting evaluation</dt><dd>{statusCounts.submitted}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Evaluated</dt><dd>{statusCounts.evaluated}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {test.instructions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{test.instructions}</p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
