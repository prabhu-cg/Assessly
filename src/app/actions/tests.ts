'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { testSchema, joinTestSchema } from '@/lib/validators/schemas'
import { v4 as uuidv4 } from 'uuid'

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

  // Pre-generate the ID so we never need to SELECT back from tests
  // (avoids triggering the RLS policy recursion on the post-insert read)
  const testId = uuidv4()
  const { error } = await supabase
    .from('tests')
    .insert({ id: testId, ...parsed.data, teacher_id: user.id })

  if (error) return { error: error.message }

  revalidatePath('/teacher/tests')
  redirect(`/teacher/tests/${testId}/questions`)
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
  return { success: true }
}

export async function assignStudentsToTest(testId: string, studentIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: test } = await supabase
    .from('tests')
    .select('id')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (!test) return { error: 'Test not found' }

  const rows = studentIds.map(student_id => ({ test_id: testId, student_id }))
  const { error } = await supabase
    .from('test_access')
    .upsert(rows, { ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}`)
  return { success: true }
}

export async function removeStudentFromTest(testId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: test } = await supabase
    .from('tests')
    .select('id')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (!test) return { error: 'Test not found' }

  const { error } = await supabase
    .from('test_access')
    .delete()
    .eq('test_id', testId)
    .eq('student_id', studentId)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}`)
  return { success: true }
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

  // Use admin client to look up the test by invite code — the student SELECT policy
  // only allows viewing tests they already have access to, so a regular client would
  // return nothing for a first-time join and produce a false "invalid code" error.
  const admin = createAdminClient()
  const { data: test, error: testError } = await admin
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
    .upsert({ test_id: test.id, student_id: user.id }, { ignoreDuplicates: true })

  if (error) return { error: error.message }

  revalidatePath('/student/dashboard')
  redirect(`/student/tests/${test.id}/instructions`)
}
