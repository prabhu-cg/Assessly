import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Hash, Share2, FileText } from 'lucide-react'
import { DeleteTestButton } from '@/components/teacher/delete-test-button'
import { CreateTestDrawer } from '@/components/teacher/create-test-drawer'

export default async function TeacherTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tests } = await supabase
    .from('tests')
    .select(`id, title, description, status, duration_minutes, invite_code, created_at, updated_at, questions(count)`)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  const statusVariant: Record<string, 'success' | 'secondary' | 'outline'> = {
    draft: 'secondary',
    published: 'success',
    archived: 'outline',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your tests and assessments</p>
        </div>
        <CreateTestDrawer defaultOpen={params.new === 'true'} />
      </div>

      {tests?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">No tests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first test to get started</p>
            <CreateTestDrawer label="Create Test" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tests?.map(test => {
          const qCount = (test.questions as any)?.[0]?.count ?? 0
          return (
            <Card key={test.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        href={`/teacher/tests/${test.id}`}
                        className="font-semibold hover:underline truncate"
                      >
                        {test.title}
                      </Link>
                      <Badge variant={statusVariant[test.status]}>{test.status}</Badge>
                    </div>
                    {test.description && (
                      <p className="text-sm text-muted-foreground truncate mb-3">{test.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{test.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />{qCount} question{qCount !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        Code: <code className="font-mono font-semibold">{test.invite_code}</code>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" render={<Link href={`/teacher/tests/${test.id}/questions`} />}>
                      Questions
                    </Button>
                    <Button variant="outline" size="sm" render={<Link href={`/teacher/tests/${test.id}/edit`} />}>
                      Edit
                    </Button>
                    <DeleteTestButton testId={test.id} testTitle={test.title} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
