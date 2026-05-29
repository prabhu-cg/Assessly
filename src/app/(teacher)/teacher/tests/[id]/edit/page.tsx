import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TestForm } from '@/components/teacher/test-form'
import type { Test } from '@/types/database'

interface EditTestPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTestPage({ params }: EditTestPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .single()

  if (!test) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Test</h1>
        <p className="text-muted-foreground text-sm mt-1">{test.title}</p>
      </div>
      <TestForm test={test as Test} />
    </div>
  )
}
