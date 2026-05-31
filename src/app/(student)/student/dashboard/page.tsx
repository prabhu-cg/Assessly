import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, BookOpen, CheckCircle2, LogIn, ArrowRight } from 'lucide-react'
import { Suspense } from 'react'
import { NoticeToast } from '@/components/shared/notice-toast'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accessRows } = await supabase
    .from('test_access')
    .select('test_id, granted_at, test:tests(id, title, description, duration_minutes, status, starts_at, ends_at)')
    .eq('student_id', user.id)

  const tests = accessRows?.map(row => (row.test as any)).filter(Boolean) ?? []

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, test_id, status, submitted_at, obtained_marks, total_marks')
    .eq('student_id', user.id)

  const submissionMap = Object.fromEntries(submissions?.map(s => [s.test_id, s]) ?? [])

  const availableTests = tests.filter(t => {
    const sub = submissionMap[t.id]
    return t.status === 'published' && (!sub || sub.status === 'in_progress')
  })

  const completedTests = tests.filter(t => {
    const sub = submissionMap[t.id]
    return sub && (sub.status === 'submitted' || sub.status === 'evaluated')
  })

  return (
    <div className="space-y-8">
      <Suspense><NoticeToast /></Suspense>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome back! Here are your tests.</p>
        </div>
        <Button render={<Link href="/student/join" />}>
          <LogIn className="h-4 w-4 mr-2" />
          Join Test
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div><p className="text-xl font-bold">{availableTests.length}</p><p className="text-xs text-muted-foreground">Available</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div><p className="text-xl font-bold">{completedTests.length}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-1 col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <div><p className="text-xl font-bold">{tests.length}</p><p className="text-xs text-muted-foreground">Total Tests</p></div>
          </CardContent>
        </Card>
      </div>

      {availableTests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Available Tests</h2>
          <div className="grid gap-3">
            {availableTests.map((test: any) => {
              const sub = submissionMap[test.id]
              return (
                <Card key={test.id}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{test.title}</p>
                      {test.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{test.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{test.duration_minutes} min
                        </span>
                        {sub?.status === 'in_progress' && (
                          <Badge variant="outline" className="text-xs">In Progress</Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" render={<Link href={`/student/tests/${test.id}/instructions`} />}>
                      {sub?.status === 'in_progress' ? 'Continue' : 'Start'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {completedTests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Completed Tests</h2>
          <div className="grid gap-3">
            {completedTests.map((test: any) => {
              const sub = submissionMap[test.id]
              return (
                <Card key={test.id}>
                  <CardContent className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{test.title}</p>
                      {sub?.submitted_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                      {sub?.status === 'evaluated' && sub.obtained_marks !== null && (
                        <p className="text-sm font-semibold mt-1 text-green-700">
                          Score: {sub.obtained_marks} / {sub.total_marks}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={sub?.status === 'evaluated' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                      >
                        {sub?.status === 'evaluated' ? 'Evaluated' : 'Submitted'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/student/tests/${test.id}/results?submission=${sub?.id}`} />}
                      >
                        {sub?.status === 'evaluated' ? 'View Results' : 'View'}
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {tests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-1">No tests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use an invite code from your teacher to join a test
            </p>
            <Button render={<Link href="/student/join" />}>
              <LogIn className="h-4 w-4 mr-2" />
              Join Test
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
