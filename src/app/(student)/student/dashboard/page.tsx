import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, BookOpen, LogIn, ChevronRight, Star } from 'lucide-react'
import { Suspense } from 'react'
import { NoticeToast } from '@/components/shared/notice-toast'

interface StudentDashboardProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentDashboard({ searchParams }: StudentDashboardProps) {
  const { tab = 'tests' } = await searchParams
  const showCompleted = tab === 'done'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: accessRows } = await supabase
    .from('test_access')
    .select('test_id, test:tests(id, title, description, duration_minutes, status, starts_at, ends_at)')
    .eq('student_id', user.id)

  const tests = accessRows?.map(row => (row.test as any)).filter(Boolean) ?? []

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, test_id, status, submitted_at, obtained_marks, total_marks')
    .eq('student_id', user.id)

  const subMap = Object.fromEntries(submissions?.map(s => [s.test_id, s]) ?? [])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const availableTests = tests.filter(t => {
    const sub = subMap[t.id]
    return t.status === 'published' && (!sub || sub.status === 'in_progress')
  })

  const completedTests = tests.filter(t => {
    const sub = subMap[t.id]
    return sub && (sub.status === 'submitted' || sub.status === 'evaluated')
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Suspense><NoticeToast /></Suspense>

      {/* Greeting */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hello, {firstName}! 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Ready for your tests today?</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href="/student/join" />} className="shrink-0">
          <LogIn className="h-4 w-4 mr-2" />
          Join Test
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Link
          href="/student/dashboard?tab=tests"
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors',
            !showCompleted
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/70',
          )}
        >
          <BookOpen className="h-4 w-4" />
          My Tests
          {availableTests.length > 0 && (
            <span className={cn(
              'ml-0.5 h-5 min-w-5 rounded-full text-xs flex items-center justify-center px-1',
              !showCompleted ? 'bg-white/25 text-white' : 'bg-primary/15 text-primary',
            )}>
              {availableTests.length}
            </span>
          )}
        </Link>
        <Link
          href="/student/dashboard?tab=done"
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors',
            showCompleted
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/70',
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Completed
          {completedTests.length > 0 && (
            <span className={cn(
              'ml-0.5 h-5 min-w-5 rounded-full text-xs flex items-center justify-center px-1',
              showCompleted ? 'bg-white/25 text-white' : 'bg-primary/15 text-primary',
            )}>
              {completedTests.length}
            </span>
          )}
        </Link>
      </div>

      {/* Tab content */}
      {!showCompleted ? (
        <div className="space-y-3">
          {availableTests.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-background p-10 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2">No tests right now!</h3>
              <p className="text-sm text-muted-foreground">
                Your teacher will add a test for you soon. Check back later!
              </p>
            </div>
          ) : (
            availableTests.map((test: any) => {
              const sub = subMap[test.id]
              const isInProgress = sub?.status === 'in_progress'
              return (
                <div
                  key={test.id}
                  className={cn(
                    'rounded-2xl border-2 bg-background p-5 transition-shadow hover:shadow-md',
                    isInProgress ? 'border-amber-300' : 'border-border',
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={cn(
                      'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0',
                      isInProgress ? 'bg-amber-100' : 'bg-orange-100',
                    )}>
                      <BookOpen className={cn('h-7 w-7', isInProgress ? 'text-amber-600' : 'text-primary')} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold leading-tight">{test.title}</h3>
                      {test.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{test.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {test.duration_minutes} minutes
                        </span>
                        {isInProgress && (
                          <span className="text-amber-600 font-semibold text-xs">● In Progress</span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className={cn(
                        'shrink-0 text-base font-bold px-6 gap-2 rounded-xl',
                        isInProgress && 'bg-amber-500 hover:bg-amber-600',
                      )}
                      render={<Link href={`/student/tests/${test.id}/instructions`} />}
                    >
                      {isInProgress ? 'Continue' : 'Start!'}
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {completedTests.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-background p-10 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No completed tests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Go to <strong>My Tests</strong> to get started!
              </p>
              <Button variant="outline" render={<Link href="/student/dashboard?tab=tests" />}>
                Go to My Tests
              </Button>
            </div>
          ) : (
            completedTests.map((test: any) => {
              const sub = subMap[test.id]
              const isEvaluated = sub?.status === 'evaluated'
              const pct = sub?.total_marks > 0 ? Math.round((sub.obtained_marks / sub.total_marks) * 100) : null

              return (
                <div key={test.id} className="rounded-2xl border-2 border-green-200 bg-green-50/30 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold leading-tight">{test.title}</h3>
                      {sub?.submitted_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Submitted {new Date(sub.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                      {isEvaluated && sub?.obtained_marks !== null ? (
                        <p className="text-sm font-bold text-green-700 mt-1 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {sub.obtained_marks} out of {sub.total_marks}
                          {pct !== null && <span className="font-normal text-muted-foreground ml-1">({pct}%)</span>}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 font-medium mt-1">⏳ Waiting for your teacher to mark it</p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-xl gap-1"
                      render={<Link href={`/student/tests/${test.id}/results?submission=${sub?.id}`} />}
                    >
                      {isEvaluated ? 'See Results' : 'View'}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
