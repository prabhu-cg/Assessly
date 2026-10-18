import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { CreateTestDrawer } from '@/components/teacher/create-test-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { TestsBrowser } from '@/components/teacher/tests-browser'

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
    .select(`id, title, description, status, duration_minutes, invite_code, pass_mark, instructions, starts_at, ends_at, created_at, updated_at, questions(count)`)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Manage your tests and assessments"
        actions={<CreateTestDrawer defaultOpen={params.new === 'true'} />}
      />

      {tests?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">No tests yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first test to get started</p>
            <CreateTestDrawer label="Create Test" />
          </CardContent>
        </Card>
      )}

      {(tests?.length ?? 0) > 0 && <TestsBrowser tests={tests as unknown as Parameters<typeof TestsBrowser>[0]['tests']} />}
    </div>
  )
}
