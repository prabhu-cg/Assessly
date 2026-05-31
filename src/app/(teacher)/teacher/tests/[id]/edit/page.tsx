import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Test</CardTitle>
          <CardDescription>{test.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <TestForm test={test as Test} />
        </CardContent>
      </Card>
    </div>
  )
}
