import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import { NoticeToast } from '@/components/shared/notice-toast'
import { StudentTests, type StudentTest } from '@/components/student/student-tests'

interface StudentDashboardProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentDashboard({ searchParams }: StudentDashboardProps) {
  const { tab = 'tests' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user.id).single()

  const { data: accessRows } = await supabase
    .from('test_access')
    .select('test_id, test:tests(id, title, description, duration_minutes, status)')
    .eq('student_id', user.id)

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, test_id, status, submitted_at, obtained_marks, total_marks')
    .eq('student_id', user.id)

  const subMap = new Map((submissions ?? []).map(s => [s.test_id, s]))

  const items: StudentTest[] = []
  for (const row of accessRows ?? []) {
    const t = Array.isArray(row.test) ? row.test[0] : row.test
    if (!t) continue
    const sub = subMap.get(t.id)
    if (sub && (sub.status === 'submitted' || sub.status === 'evaluated')) {
      items.push({
        id: t.id, title: t.title, description: t.description, minutes: t.duration_minutes,
        state: sub.status === 'evaluated' ? 'marked' : 'waiting',
        submissionId: sub.id, submittedAt: sub.submitted_at,
        obtained: sub.obtained_marks, total: sub.total_marks,
      })
    } else if (t.status === 'published') {
      items.push({
        id: t.id, title: t.title, description: t.description, minutes: t.duration_minutes,
        state: sub?.status === 'in_progress' ? 'in_progress' : 'ready',
        submissionId: sub?.id ?? null, submittedAt: null, obtained: null, total: null,
      })
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Suspense><NoticeToast /></Suspense>
      <StudentTests firstName={firstName} items={items} initialTab={tab === 'done' ? 'done' : 'todo'} />
    </div>
  )
}
