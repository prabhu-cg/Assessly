import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Users, ClipboardList, Plus } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: testCount },
    { count: studentCount },
    { count: submissionCount },
    { data: recentTests },
  ] = await Promise.all([
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('created_by', user.id).eq('role', 'student'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('tests').select('id, title, status, created_at').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total Tests', value: testCount ?? 0, icon: FileText, href: '/teacher/tests', color: 'text-blue-600' },
    { label: 'Students', value: studentCount ?? 0, icon: Users, href: '/teacher/students', color: 'text-green-600' },
    { label: 'Submissions', value: submissionCount ?? 0, icon: ClipboardList, href: '/teacher/submissions', color: 'text-purple-600' },
  ]

  const statusColor: Record<string, string> = {
    draft: 'secondary',
    published: 'default',
    archived: 'outline',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your tests and students</p>
        </div>
        <Button render={<Link href="/teacher/tests/new" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-2 rounded-lg bg-muted ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Tests</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/teacher/tests" />}>
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTests?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tests yet.{' '}
                <Link href="/teacher/tests/new" className="text-primary hover:underline">
                  Create your first test
                </Link>
              </p>
            )}
            {recentTests?.map(test => (
              <div key={test.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/teacher/tests/${test.id}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {test.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(test.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusColor[test.status] as 'default' | 'secondary' | 'outline'}>
                  {test.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" render={<Link href="/teacher/tests/new" />}>
              <Plus className="h-4 w-4 mr-2" /> Create New Test
            </Button>
            <Button variant="outline" className="w-full justify-start" render={<Link href="/teacher/students/new" />}>
              <Users className="h-4 w-4 mr-2" /> Add Student
            </Button>
            <Button variant="outline" className="w-full justify-start" render={<Link href="/teacher/submissions" />}>
              <ClipboardList className="h-4 w-4 mr-2" /> View Submissions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
