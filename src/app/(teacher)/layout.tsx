import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar, AppTopbar } from '@/components/shared/app-sidebar'
import { PageTransition } from '@/components/shared/page-transition'
import { MobileNav } from '@/components/shared/sidebar'
import type { Profile } from '@/types/database'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || profile.role !== 'teacher') redirect('/student/dashboard')

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AppTopbar profile={profile as Profile} />
        <main className="flex-1 app-page px-4 sm:px-5 lg:px-6 py-6 pb-24 md:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <MobileNav role="teacher" />
    </div>
  )
}
