import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Hash, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { StartTestButton } from '@/components/student/start-test-button'

interface InstructionsPageProps {
  params: Promise<{ id: string }>
}

export default async function InstructionsPage({ params }: InstructionsPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client for all data fetching — the student is authenticated above,
  // and RLS evaluation on test_access/tests can silently block valid queries.
  const admin = createAdminClient()

  const { data: access } = await admin
    .from('test_access')
    .select('test_id')
    .eq('test_id', id)
    .eq('student_id', user.id)
    .single()

  if (!access) redirect('/student/dashboard')

  const { data: test } = await admin.from('tests').select('*').eq('id', id).single()

  if (!test || test.status !== 'published') redirect('/student/dashboard?notice=unavailable')

  const { data: teacher } = await admin
    .from('profiles').select('full_name').eq('id', test.teacher_id).single()

  const { count: questionCount } = await supabase
    .from('questions').select('*', { count: 'exact', head: true }).eq('test_id', id)

  const { data: existingSub } = await supabase
    .from('submissions').select('id, status').eq('test_id', id).eq('student_id', user.id).single()

  const alreadySubmitted =
    existingSub?.status === 'submitted' || existingSub?.status === 'evaluated'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{test.title}</h1>
        {teacher?.full_name && (
          <p className="text-muted-foreground text-sm mt-1">by {teacher.full_name}</p>
        )}
      </div>

      {alreadySubmitted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">You have already submitted this test.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-xl font-bold">{test.duration_minutes}</p><p className="text-xs text-muted-foreground">minutes</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <div><p className="text-xl font-bold">{questionCount ?? 0}</p><p className="text-xs text-muted-foreground">questions</p></div>
          </CardContent>
        </Card>
      </div>

      {test.instructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{test.instructions}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Before You Begin</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Once you start, the timer will begin and cannot be paused.',
              'Your answers are saved automatically as you go.',
              'The test will auto-submit when time runs out.',
              'You can navigate between questions and review before submitting.',
            ].map(rule => (
              <li key={rule} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-4 w-4" />
            Exam Integrity Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-red-700/80">
            {[
              'The test opens in fullscreen — do not exit fullscreen during the exam.',
              'Do not switch tabs, windows, or applications while the test is active.',
              'Right-clicking and browser shortcut keys are disabled.',
              'Each violation (tab switch, fullscreen exit) is recorded and visible to your teacher.',
              'After 3 violations your test will be automatically submitted.',
              'Opening the test on another device will invalidate your current session.',
            ].map(rule => (
              <li key={rule} className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {!alreadySubmitted && (
        <StartTestButton
          href={`/student/tests/${id}/take`}
          isResume={existingSub?.status === 'in_progress'}
        />
      )}
    </div>
  )
}
