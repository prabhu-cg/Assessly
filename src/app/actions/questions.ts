'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { questionSchema } from '@/lib/validators/schemas'
import { v4 as uuidv4 } from 'uuid'

export async function createQuestion(testId: string, data: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify teacher owns the test
  const { data: test } = await supabase
    .from('tests')
    .select('id')
    .eq('id', testId)
    .eq('teacher_id', user.id)
    .single()

  if (!test) return { error: 'Test not found' }

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Get next order index
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId)

  const { error } = await supabase.from('questions').insert({
    test_id: testId,
    type: parsed.data.type,
    content: parsed.data.content,
    marks: parsed.data.marks,
    options: parsed.data.type === 'mcq' ? parsed.data.options : null,
    correct_option_id: parsed.data.type === 'mcq' ? parsed.data.correct_option_id : null,
    order_index: count ?? 0,
  })

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function updateQuestion(questionId: string, testId: string, data: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('questions')
    .update({
      type: parsed.data.type,
      content: parsed.data.content,
      marks: parsed.data.marks,
      options: parsed.data.type === 'mcq' ? parsed.data.options : null,
      correct_option_id: parsed.data.type === 'mcq' ? parsed.data.correct_option_id : null,
    })
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function deleteQuestion(questionId: string, testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: error.message }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function reorderQuestions(testId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates = orderedIds.map((id, index) =>
    supabase.from('questions').update({ order_index: index }).eq('id', id)
  )

  await Promise.all(updates)

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export { uuidv4 as generateId }
