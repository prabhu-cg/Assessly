import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ClipboardList } from 'lucide-react'

interface SubmissionsPageProps {
  searchParams: Promise<{ test?: string; status?: string }>
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const statusVariant: Record<string, 'success' | 'secondary' | 'outline'> = {
  in_progress: 'outline',
  submitted: 'secondary',
  evaluated: 'success',
}

const statusLabel: Record<string, string> = {
  in_progress: 'In Progress',
  submitted: 'Submitted',
  evaluated: 'Evaluated',
}

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tests } = await supabase
    .from('tests').select('id, title').eq('teacher_id', user.id).order('title')

  let query = supabase
    .from('submissions')
    .select(`id, status, submitted_at, obtained_marks, total_marks, focus_violations, student_id, test_id,
      student:profiles(full_name),
      test:tests(id, title, teacher_id)`)
    .order('created_at', { ascending: false })

  if (params.test) query = query.eq('test_id', params.test)
  if (params.status) query = query.eq('status', params.status)

  const { data: submissions } = await query
  const mySubmissions = (submissions ?? []).filter((s: any) => s.test?.teacher_id === user.id)

  // Count all attempts per (student, test) before deduplication
  const attemptCounts: Record<string, number> = {}
  for (const sub of mySubmissions) {
    const key = `${sub.student_id}:${sub.test_id}`
    attemptCounts[key] = (attemptCounts[key] ?? 0) + 1
  }

  // Keep only the latest submission per (student, test) — query is ordered by created_at desc
  const seen = new Set<string>()
  const latestSubmissions = mySubmissions
    .filter((sub: any) => {
      const key = `${sub.student_id}:${sub.test_id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((sub: any) => ({
      ...sub,
      attemptCount: attemptCounts[`${sub.student_id}:${sub.test_id}`] ?? 1,
    }))

  // Group by test, preserving insertion order (newest-activity-first from query)
  const groupMap = new Map<string, { testId: string; testTitle: string; rows: typeof latestSubmissions }>()
  for (const sub of latestSubmissions) {
    const testId = sub.test?.id ?? sub.test_id
    const testTitle = sub.test?.title ?? 'Unknown test'
    if (!groupMap.has(testId)) groupMap.set(testId, { testId, testTitle, rows: [] })
    groupMap.get(testId)!.rows.push(sub)
  }
  const groups = [...groupMap.values()]

  const subtitle = params.test
    ? `${latestSubmissions.length} student${latestSubmissions.length !== 1 ? 's' : ''}`
    : groups.length > 0
      ? `${latestSubmissions.length} student${latestSubmissions.length !== 1 ? 's' : ''} across ${groups.length} test${groups.length !== 1 ? 's' : ''}`
      : 'No submissions yet'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description={subtitle}
        breadcrumbs={params.test ? [{ label: 'Submissions', href: '/teacher/submissions' }, { label: tests?.find(t => t.id === params.test)?.title ?? 'Test' }] : undefined}
      />

      <form className="flex gap-3 flex-wrap">
        <Select name="test" defaultValue={params.test ?? ''}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All tests" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All tests</SelectItem>
            {tests?.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={params.status ?? ''}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="evaluated">Evaluated</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
      </form>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No submissions found</h3>
            <p className="text-sm text-muted-foreground">
              {params.test || params.status
                ? 'No submissions match your current filter.'
                : 'Submissions will appear here once students complete your tests.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.testId}>
              <p className="text-sm font-semibold mb-2">{group.testTitle}</p>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {group.rows.map((sub: any) => (
                    <div key={sub.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {initials(sub.student?.full_name ?? '?')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{sub.student?.full_name ?? 'Unknown'}</p>
                          {sub.submitted_at && (
                            <p className="text-xs text-muted-foreground">
                              Submitted {new Date(sub.submitted_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {sub.attemptCount > 1 && (
                          <span className="text-xs text-muted-foreground font-medium tabular-nums">
                            {sub.attemptCount} attempts
                          </span>
                        )}
                        {sub.focus_violations > 0 && (
                          <Badge variant="outline" className="text-warning border-warning/40 gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {sub.focus_violations}
                          </Badge>
                        )}
                        {sub.status === 'evaluated' && sub.obtained_marks !== null && (
                          <span className="text-sm font-semibold tabular-nums">
                            {sub.obtained_marks}/{sub.total_marks}
                          </span>
                        )}
                        <Badge variant={statusVariant[sub.status]}>
                          {statusLabel[sub.status] ?? sub.status}
                        </Badge>
                        {sub.status !== 'in_progress' && (
                          <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={`/teacher/tests/${sub.test?.id}/submissions/${sub.id}`} />}
                          >
                            {sub.status === 'submitted' ? 'Evaluate' : 'View'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
