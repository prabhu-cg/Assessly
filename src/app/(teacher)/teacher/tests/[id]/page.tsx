import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/shared/breadcrumbs'
import { Clock, Hash, Users, BookOpen, ClipboardList } from 'lucide-react'
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      <TestStudents
        testId={id}
        testStatus={test.status}
        enrolled={enrolledStudents}
        available={availableStudents}
        blocked={blockedStudents}
      />
    </div>
  )
}
