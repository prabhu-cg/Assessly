'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { questionSchema } from '@/lib/validators/schemas'
import { createAdminClient } from '@/lib/supabase/admin'
import { QUESTION_IMAGE_BUCKET, questionImagePath, removeQuestionImages } from '@/lib/question-images'
import { v4 as uuidv4 } from 'uuid'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

/** Only accept image URLs that point at our own bucket, so a question can never embed an arbitrary remote image. */
function isOwnImageUrl(url: string) {
  return questionImagePath(url) !== null
}

let bucketReady = false

/**
 * Step 1 of an upload: check the teacher owns the test, then hand back a one-time signed upload URL.
 * The browser sends the file straight to storage, so it never passes through a server action (which has a 1 MB body limit).
 */
export async function createQuestionImageUpload(testId: string, contentType: string, size: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const ext = IMAGE_TYPES[contentType]
  if (!ext) return { error: 'Use a PNG, JPG, WebP or GIF image.' }
  if (!(size > 0) || size > MAX_IMAGE_BYTES) return { error: 'Image must be 5 MB or smaller.' }

  const { data: test } = await supabase.from('tests').select('id').eq('id', testId).eq('teacher_id', user.id).maybeSingle()
  if (!test) return { error: 'Test not found' }

  const admin = createAdminClient()
  if (!bucketReady) {
    const { error } = await admin.storage.createBucket(QUESTION_IMAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_IMAGE_BYTES,
      allowedMimeTypes: Object.keys(IMAGE_TYPES),
    })
    if (error && !/already exists/i.test(error.message)) return { error: error.message }
    bucketReady = true
  }

  const path = `${testId}/${uuidv4()}.${ext}`
  const { data, error } = await admin.storage.from(QUESTION_IMAGE_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Could not start the upload' }

  const { data: pub } = admin.storage.from(QUESTION_IMAGE_BUCKET).getPublicUrl(path)
  return { path, token: data.token, publicUrl: pub.publicUrl }
}

export async function createQuestion(testId: string, data: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Ownership is enforced by the questions RLS policy — no need to SELECT from tests
  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (parsed.data.image_url && !isOwnImageUrl(parsed.data.image_url)) return { error: 'Invalid image' }

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
    // Only sent when set, so adding questions keeps working until the image_url migration has been applied.
    ...(parsed.data.image_url ? { image_url: parsed.data.image_url } : {}),
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

  if (parsed.data.image_url && !isOwnImageUrl(parsed.data.image_url)) return { error: 'Invalid image' }

  // Remember the current image so the old file can be deleted if it is replaced or removed
  const { data: before } = await supabase.from('questions').select('image_url').eq('id', questionId).maybeSingle()

  const { error } = await supabase
    .from('questions')
    .update({
      type: parsed.data.type,
      content: parsed.data.content,
      marks: parsed.data.marks,
      options: parsed.data.type === 'mcq' ? parsed.data.options : null,
      correct_option_id: parsed.data.type === 'mcq' ? parsed.data.correct_option_id : null,
      // undefined = image untouched; null = removed
      ...(parsed.data.image_url !== undefined ? { image_url: parsed.data.image_url } : {}),
    })
    .eq('id', questionId)

  if (error) return { error: error.message }

  if (parsed.data.image_url !== undefined && before?.image_url && before.image_url !== parsed.data.image_url) {
    await removeQuestionImages([before.image_url])
  }

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

export async function deleteQuestion(questionId: string, testId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: before } = await supabase.from('questions').select('image_url').eq('id', questionId).maybeSingle()

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) return { error: error.message }

  await removeQuestionImages([before?.image_url])

  revalidatePath(`/teacher/tests/${testId}/questions`)
  return { success: true }
}

/**
 * Delete an image that was uploaded in the form but never saved on a question (removed, replaced or cancelled).
 * Refuses if a question still uses it, and only works on a test the teacher owns.
 */
export async function discardQuestionImage(testId: string, url: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const path = questionImagePath(url)
  if (!path || !path.startsWith(`${testId}/`)) return { error: 'Invalid image' }

  const { data: test } = await supabase.from('tests').select('id').eq('id', testId).eq('teacher_id', user.id).maybeSingle()
  if (!test) return { error: 'Test not found' }

  const { data: inUse } = await supabase.from('questions').select('id').eq('image_url', url).limit(1)
  if (inUse?.length) return { success: true }

  await removeQuestionImages([url])
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
