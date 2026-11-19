import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listStudentAssignments } from '@/lib/student-assignments'
import { StudentAssignments } from '@/components/student/student-assignments'
import { SetupNotice } from '@/components/shared/setup-notice'

export default async function StudentAssignmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { items, missingTables } = await listStudentAssignments(user.id)
  if (missingTables) return <SetupNotice />

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StudentAssignments items={items} initialTab={tab === 'done' ? 'done' : 'todo'} />
    </div>
  )
}
