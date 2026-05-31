import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Hash, Users, Share2, BookOpen, ClipboardList } from 'lucide-react'
import { EditTestDrawer } from '@/components/teacher/edit-test-drawer'

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

  const [{ data: questions }, { count: submissionCount }] = await Promise.all([
    supabase.from('questions').select('id, type, marks').eq('test_id', id).order('order_index'),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('test_id', id),
  ])

  const totalMarks = questions?.reduce((sum, q) => sum + q.marks, 0) ?? 0
  const typeCounts = questions?.reduce(
    (acc, q) => ({ ...acc, [q.type]: (acc[q.type] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{test.title}</h1>
            <Badge variant={test.status === 'published' ? 'success' : test.status === 'archived' ? 'outline' : 'secondary'}>
              {test.status}
            </Badge>
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

      {test.status === 'published' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Invite Code</p>
              <p className="text-xs text-muted-foreground">Share with students to access this test</p>
            </div>
            <code className="text-2xl font-bold font-mono tracking-widest text-primary">{test.invite_code}</code>
          </CardContent>
        </Card>
      )}

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

      {typeCounts && Object.keys(typeCounts).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Question Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {typeCounts.mcq && <div className="text-sm"><span className="font-semibold">{typeCounts.mcq}</span><span className="text-muted-foreground ml-1">MCQ</span></div>}
            {typeCounts.short_answer && <div className="text-sm"><span className="font-semibold">{typeCounts.short_answer}</span><span className="text-muted-foreground ml-1">Short answer</span></div>}
            {typeCounts.long_answer && <div className="text-sm"><span className="font-semibold">{typeCounts.long_answer}</span><span className="text-muted-foreground ml-1">Essay</span></div>}
          </CardContent>
        </Card>
      )}

      {(submissionCount ?? 0) > 0 && (
        <Button variant="outline" render={<Link href={`/teacher/submissions?test=${id}`} />}>
          <ClipboardList className="h-4 w-4 mr-2" />
          View Submissions ({submissionCount})
        </Button>
      )}
    </div>
  )
}
