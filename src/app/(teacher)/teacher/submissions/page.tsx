import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ClipboardList } from 'lucide-react'

interface SubmissionsPageProps {
  searchParams: Promise<{ test?: string; status?: string }>
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
    .select(`id, status, submitted_at, obtained_marks, total_marks, focus_violations,
      student:profiles(full_name, email),
      test:tests(id, title, teacher_id)`)
    .order('submitted_at', { ascending: false })

  if (params.test) query = query.eq('test_id', params.test)
  if (params.status) query = query.eq('status', params.status)

  const { data: submissions } = await query
  const mySubmissions = submissions?.filter((s: any) => s.test?.teacher_id === user.id) ?? []

  const statusVariant: Record<string, 'success' | 'secondary' | 'outline'> = {
    in_progress: 'outline',
    submitted: 'secondary',
    evaluated: 'success',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mySubmissions.length} submission{mySubmissions.length !== 1 ? 's' : ''}
        </p>
      </div>

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

      {mySubmissions.length === 0 && (
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
      )}

      <div className="space-y-3">
        {mySubmissions.map((sub: any) => (
          <Card key={sub.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{sub.student?.full_name ?? 'Unknown'}</p>
                <p className="text-sm text-muted-foreground truncate">{sub.test?.title ?? 'Unknown test'}</p>
                {sub.submitted_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {new Date(sub.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                {sub.focus_violations > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {sub.focus_violations}
                  </Badge>
                )}
                {sub.status === 'evaluated' && sub.obtained_marks !== null && (
                  <span className="text-sm font-semibold">{sub.obtained_marks}/{sub.total_marks}</span>
                )}
                <Badge variant={statusVariant[sub.status]}>{sub.status}</Badge>
                {sub.status !== 'in_progress' && (
                  <Button variant="outline" size="sm" render={<Link href={`/teacher/tests/${sub.test?.id}/submissions/${sub.id}`} />}>
                    {sub.status === 'submitted' ? 'Evaluate' : 'View'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
