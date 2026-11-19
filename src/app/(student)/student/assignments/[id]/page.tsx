import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loadStudentAssignment } from '@/lib/student-assignments'
import { AssignmentWork } from '@/components/student/assignment-work'

export default async function StudentAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await loadStudentAssignment(user.id, id)
  if (!data) notFound()

  return <AssignmentWork data={data} />
}
