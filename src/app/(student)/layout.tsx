import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar, MobileNav } from '@/components/shared/sidebar'
import type { Profile } from '@/types/database'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/teacher/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile as Profile} />
      <div className="flex flex-1">
        <Sidebar role="student" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav role="student" />
    </div>
  )
}
