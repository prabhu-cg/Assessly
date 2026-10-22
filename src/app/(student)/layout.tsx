import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentTopbar } from '@/components/shared/student-topbar'
import { Footer } from '@/components/shared/footer'
import type { Profile } from '@/types/database'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || profile.role !== 'student') redirect('/teacher/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <StudentTopbar fullName={(profile as Profile).full_name} />
      <main className="app-page flex-1 px-4 sm:px-5 lg:px-6 py-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}
