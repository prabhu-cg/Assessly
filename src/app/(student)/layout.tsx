import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from '@/components/shared/top-nav'
import type { Profile } from '@/types/database'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!profile || profile.role !== 'student') redirect('/teacher/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <TopNav profile={profile as Profile} />
      <main className="flex-1 px-6 py-8 max-w-screen-xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
