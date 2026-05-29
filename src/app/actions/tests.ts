'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { testSchema, joinTestSchema } from '@/lib/validators/schemas'

export async function createTest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = testSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    duration_minutes: formData.get('duration_minutes'),
    instructions: formData.get('instructions') || undefined,
    pass_mark: formData.get('pass_mark') || undefined,
    starts_at: formData.get('starts_at') || undefined,
    ends_at: formData.get('ends_at') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('tests')
    .insert({ ...parsed.data, teacher_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/teacher/tests')
  redirect(`/teacher/tests/${data.id}/questions`)
}

export async function updateTest(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = testSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    duration_minutes: formData.get('duration_minutes'),
    instructions: formData.get('instructions') || undefined,
    pass_mark: formData.get('pass_mark') || undefined,
    starts_at: formData.get('starts_at') || undefined,
    ends_at: formData.get('ends_at') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('tests')
    .update(parsed.data)
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${id}`)
  revalidatePath('/teacher/tests')
  return { success: true }
}

export async function updateTestStatus(id: string, status: 'draft' | 'published' | 'archived') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tests')
    .update({ status })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${id}`)
  revalidatePath('/teacher/tests')
  return { success: true }
}

export async function deleteTest(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/teacher/tests')
  redirect('/teacher/tests')
}

export async function joinTest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = joinTestSchema.safeParse({
    invite_code: formData.get('invite_code'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, status')
    .eq('invite_code', parsed.data.invite_code.toUpperCase())
    .single()

  if (testError || !test) {
    return { error: 'Invalid invite code. Please check and try again.' }
  }

  if (test.status !== 'published') {
    return { error: 'This test is not currently available.' }
  }

  const { error } = await supabase
    .from('test_access')
    .upsert({ test_id: test.id, student_id: user.id })

  if (error) return { error: error.message }

  revalidatePath('/student/dashboard')
  redirect(`/student/tests/${test.id}/instructions`)
}
