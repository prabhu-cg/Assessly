import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Users, ClipboardList, Plus, ArrowRight, BookOpen } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const [
    { count: testCount },
    { count: studentCount },
    { count: pendingCount },
    { data: recentTests },
  ] = await Promise.all([
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('created_by', user.id).eq('role', 'student'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('tests').select('id, title, status, created_at, duration_minutes').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(4),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const stats = [
    { label: 'Total Tests', value: testCount ?? 0, icon: FileText, href: '/teacher/tests', bg: 'bg-orange-50', iconColor: 'text-primary' },
    { label: 'Students', value: studentCount ?? 0, icon: Users, href: '/teacher/students', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Pending Review', value: pendingCount ?? 0, icon: ClipboardList, href: '/teacher/submissions', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
  ]

  const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-500 border border-gray-200',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-400',
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good day, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your tests.</p>
        </div>
        <Button render={<Link href="/teacher/tests?new=true" />} className="gap-2">
          <Plus className="h-4 w-4" />
          New Test
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href, bg, iconColor }) => (
          <Link key={label} href={href} className="group">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tests — wider */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">Recent Tests</CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/teacher/tests" />} className="text-primary hover:text-primary gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {!recentTests?.length && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium">No tests yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first test to get started</p>
                <Button size="sm" render={<Link href="/teacher/tests?new=true" />}>Create Test</Button>
              </div>
            )}
            {recentTests?.map(test => (
              <Link
                key={test.id}
                href={`/teacher/tests/${test.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{test.title}</p>
                  <p className="text-xs text-muted-foreground">{test.duration_minutes} min · {new Date(test.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[test.status]}`}>
                  {test.status}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: '/teacher/tests?new=true', icon: Plus, label: 'Create New Test', desc: 'Draft a test with questions' },
              { href: '/teacher/students?new=true', icon: Users, label: 'Add Student', desc: 'Create a student account' },
              { href: '/teacher/submissions', icon: ClipboardList, label: 'Review Submissions', desc: 'Grade pending work' },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
