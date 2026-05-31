import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { StudentActions } from '@/components/teacher/student-actions'
import { CreateStudentDrawer } from '@/components/teacher/create-student-drawer'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('created_by', user.id)
    .eq('role', 'student')
    .order('full_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {students?.length ?? 0} student{students?.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <CreateStudentDrawer defaultOpen={params.new === 'true'} />
      </div>

      {students?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-1">No students yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create student accounts to get started</p>
            <CreateStudentDrawer label="Add Student" />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {students?.map(student => (
          <Card key={student.id}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-muted-foreground">
                  {student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{student.full_name}</p>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Added {new Date(student.created_at).toLocaleDateString()}
              </p>
              <StudentActions studentId={student.id} studentName={student.full_name} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
