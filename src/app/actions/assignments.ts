'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import type { ActionResult } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { assignmentSchema, questionSchema } from '@/lib/validators/schemas'
import { QUESTION_IMAGE_BUCKET, questionImagePath, removeQuestionImages, removeTestImageFolder } from '@/lib/question-images'
import {
  ASSIGNMENT_BUCKET, FILE_TYPES, MAX_FILE_BYTES, MAX_RESOURCE_FILES,
  ensureAssignmentBucket, removeAssignmentFiles, removeAssignmentFolder,
} from '@/lib/assignment-files'

type Fail = { error: string }

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }

/** Only accept image URLs from our own bucket and this assignment's folder, so a question can never embed a remote image. */
function isOwnImage(url: string, assignmentId: string) {
  return !!questionImagePath(url)?.startsWith(`${assignmentId}/`)
}

async function teacherContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

/** Confirms the signed-in user owns this assignment. */
async function owned(assignmentId: string) {
  const { supabase, user } = await teacherContext()
  if (!user) return { fail: { error: 'Not authenticated' } as Fail, supabase: null, user: null, assignment: null }
  const { data } = await supabase
    .from('assignments')
    .select('id, status, response_marks')
    .eq('id', assignmentId)
    .eq('teacher_id', user.id)
    .maybeSingle()
  if (!data) return { fail: { error: 'Assignment not found' } as Fail, supabase: null, user: null, assignment: null }
  return { fail: null, supabase, user, assignment: data }
}

function parseAssignment(formData: FormData) {
  return assignmentSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    instructions: formData.get('instructions') || undefined,
    due_at: formData.get('due_at') || undefined,
    response_marks: formData.get('response_marks') || 0,
    pass_mark: formData.get('pass_mark') || undefined,
  })
}

// ── Assignment CRUD ────────────────────────────────────────────────────────

export async function createAssignment(formData: FormData) {
  const { supabase, user } = await teacherContext()
  if (!user) return { error: 'Not authenticated' }

  const parsed = parseAssignment(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const id = uuidv4()
  const { error } = await supabase
    .from('assignments')
    .insert({ id, ...parsed.data, due_at: parsed.data.due_at ?? null, teacher_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/teacher/assignments')
  redirect(`/teacher/assignments/${id}`)
}

export async function updateAssignment(id: string, formData: FormData): Promise<ActionResult> {
  const ctx = await owned(id)
  if (ctx.fail) return ctx.fail

  const parsed = parseAssignment(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await ctx.supabase
    .from('assignments')
    .update({
      ...parsed.data,
      // Emptied optional fields must clear the saved value, not be skipped as undefined.
      description: parsed.data.description ?? null,
      instructions: parsed.data.instructions ?? null,
      due_at: parsed.data.due_at ?? null,
      pass_mark: parsed.data.pass_mark ?? null,
    })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${id}`)
  revalidatePath('/teacher/assignments')
  return { success: true }
}

export async function updateAssignmentStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<ActionResult> {
  const ctx = await owned(id)
  if (ctx.fail) return ctx.fail

  if (status === 'published') {
    const { count } = await ctx.supabase
      .from('assignment_questions')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', id)
    if (!count && ctx.assignment.response_marks === 0) {
      return { error: 'Add a question or give the written response some marks before publishing.' }
    }
  }

  const { error } = await ctx.supabase.from('assignments').update({ status }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${id}`)
  revalidatePath('/teacher/assignments')
  return { success: true }
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  const ctx = await owned(id)
  if (ctx.fail) return ctx.fail

  const { error } = await ctx.supabase.from('assignments').delete().eq('id', id)
  if (error) return { error: error.message }

  await removeAssignmentFolder(id)
  await removeTestImageFolder(id)
  revalidatePath('/teacher/assignments')
  return { success: true }
}

// ── Students ───────────────────────────────────────────────────────────────

export async function assignStudentsToAssignment(id: string, studentIds: string[]): Promise<ActionResult> {
  const ctx = await owned(id)
  if (ctx.fail) return ctx.fail
  if (!studentIds.length) return { error: 'Pick at least one student' }

  const rows = studentIds.map(student_id => ({ assignment_id: id, student_id }))
  const { error } = await ctx.supabase
    .from('assignment_assignees')
    .upsert(rows, { ignoreDuplicates: true })
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${id}`)
  return { success: true }
}

export async function removeStudentFromAssignment(id: string, studentId: string): Promise<ActionResult> {
  const ctx = await owned(id)
  if (ctx.fail) return ctx.fail

  const { data: sub } = await ctx.supabase
    .from('assignment_submissions')
    .select('id, status')
    .eq('assignment_id', id)
    .eq('student_id', studentId)
    .maybeSingle()
  if (sub && sub.status !== 'in_progress') {
    return { error: 'This student has already handed work in. Their submission would be lost.' }
  }

  if (sub) {
    const { data: files } = await ctx.supabase.from('assignment_submission_files').select('path').eq('submission_id', sub.id)
    await ctx.supabase.from('assignment_submissions').delete().eq('id', sub.id)
    await removeAssignmentFiles((files ?? []).map(f => f.path))
  }

  const { error } = await ctx.supabase
    .from('assignment_assignees')
    .delete()
    .eq('assignment_id', id)
    .eq('student_id', studentId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${id}`)
  return { success: true }
}

// ── Questions ──────────────────────────────────────────────────────────────

export async function createAssignmentQuestion(assignmentId: string, data: unknown): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  if (parsed.data.image_url && !isOwnImage(parsed.data.image_url, assignmentId)) return { error: 'Invalid image' }

  const { count } = await ctx.supabase
    .from('assignment_questions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)

  const { error } = await ctx.supabase.from('assignment_questions').insert({
    assignment_id: assignmentId,
    type: parsed.data.type,
    content: parsed.data.content,
    marks: parsed.data.marks,
    options: parsed.data.type === 'mcq' ? parsed.data.options : null,
    correct_option_id: parsed.data.type === 'mcq' ? parsed.data.correct_option_id : null,
    // Only sent when set, so questions keep saving until the image migration has been applied.
    ...(parsed.data.image_url ? { image_url: parsed.data.image_url } : {}),
    order_index: count ?? 0,
  })
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

export async function updateAssignmentQuestion(questionId: string, assignmentId: string, data: unknown): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const parsed = questionSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  if (parsed.data.image_url && !isOwnImage(parsed.data.image_url, assignmentId)) return { error: 'Invalid image' }

  // Remember the current image so the old file can be deleted if it is replaced or removed.
  const { data: before } = await ctx.supabase.from('assignment_questions').select('*').eq('id', questionId).maybeSingle()

  const { error } = await ctx.supabase
    .from('assignment_questions')
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
    .eq('assignment_id', assignmentId)
  if (error) return { error: error.message }

  const oldImage = (before as { image_url?: string | null } | null)?.image_url
  if (parsed.data.image_url !== undefined && oldImage && oldImage !== parsed.data.image_url) await removeQuestionImages([oldImage])

  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

export async function deleteAssignmentQuestion(questionId: string, assignmentId: string): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const { data: before } = await ctx.supabase.from('assignment_questions').select('*').eq('id', questionId).maybeSingle()

  const { error } = await ctx.supabase
    .from('assignment_questions')
    .delete()
    .eq('id', questionId)
    .eq('assignment_id', assignmentId)
  if (error) return { error: error.message }

  await removeQuestionImages([(before as { image_url?: string | null } | null)?.image_url])

  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

export async function moveAssignmentQuestion(assignmentId: string, orderedIds: string[]): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  await Promise.all(
    orderedIds.map((qid, index) =>
      ctx.supabase.from('assignment_questions').update({ order_index: index }).eq('id', qid).eq('assignment_id', assignmentId),
    ),
  )
  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

// ── Question images ────────────────────────────────────────────────────────

/** Step 1 of an image upload: check ownership, hand back a one-time signed upload URL. The browser sends the file straight to storage. */
export async function createAssignmentQuestionImageUpload(assignmentId: string, contentType: string, size: number) {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const ext = IMAGE_TYPES[contentType]
  if (!ext) return { error: 'Use a PNG, JPG, WebP or GIF image.' }
  if (!(size > 0) || size > MAX_IMAGE_BYTES) return { error: 'Image must be 5 MB or smaller.' }

  const admin = createAdminClient()
  const { error: bucketError } = await admin.storage.createBucket(QUESTION_IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: Object.keys(IMAGE_TYPES),
  })
  if (bucketError && !/already exists/i.test(bucketError.message)) return { error: bucketError.message }

  const path = `${assignmentId}/${uuidv4()}.${ext}`
  const { data, error } = await admin.storage.from(QUESTION_IMAGE_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Could not start the upload' }
  const { data: pub } = admin.storage.from(QUESTION_IMAGE_BUCKET).getPublicUrl(path)
  return { path, token: data.token, publicUrl: pub.publicUrl }
}

/** Delete an image uploaded in the form but never saved on a question (removed, replaced or cancelled). Refuses if a question still uses it. */
export async function discardAssignmentQuestionImage(assignmentId: string, url: string): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail
  if (!isOwnImage(url, assignmentId)) return { error: 'Invalid image' }

  const { data: inUse } = await ctx.supabase.from('assignment_questions').select('id').eq('image_url', url).limit(1)
  if (inUse?.length) return { success: true }

  await removeQuestionImages([url])
  return { success: true }
}

// ── Attached resources (teacher to students) ───────────────────────────────

/** Step 1: check ownership and limits, hand back a one-time signed upload URL. The browser uploads straight to storage. */
export async function createResourceUpload(assignmentId: string, name: string, contentType: string, size: number) {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const ext = FILE_TYPES[contentType]
  if (!ext) return { error: 'That file type is not allowed. Use a PDF, Word, Excel, PowerPoint, text, image or zip file.' }
  if (!(size > 0) || size > MAX_FILE_BYTES) return { error: 'Each file must be 10 MB or smaller.' }

  const { count } = await ctx.supabase
    .from('assignment_files')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
  if ((count ?? 0) >= MAX_RESOURCE_FILES) return { error: `You can attach up to ${MAX_RESOURCE_FILES} files.` }

  const bucketError = await ensureAssignmentBucket()
  if (bucketError) return { error: bucketError }

  const path = `${assignmentId}/resources/${uuidv4()}.${ext}`
  const { data, error } = await createAdminClient().storage.from(ASSIGNMENT_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Could not start the upload' }
  return { path, token: data.token, name }
}

/** Step 2: the file is in storage, record it on the assignment. */
export async function registerResourceFile(
  assignmentId: string,
  file: { path: string; name: string; size: number; contentType: string },
): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail
  if (!file.path.startsWith(`${assignmentId}/resources/`)) return { error: 'Invalid file' }

  const { error } = await ctx.supabase.from('assignment_files').insert({
    assignment_id: assignmentId,
    name: file.name.slice(0, 200),
    path: file.path,
    size_bytes: file.size,
    content_type: file.contentType,
  })
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

export async function deleteResourceFile(assignmentId: string, fileId: string): Promise<ActionResult> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const { data: file } = await ctx.supabase
    .from('assignment_files').select('path').eq('id', fileId).eq('assignment_id', assignmentId).maybeSingle()
  if (!file) return { error: 'File not found' }

  const { error } = await ctx.supabase.from('assignment_files').delete().eq('id', fileId)
  if (error) return { error: error.message }

  await removeAssignmentFiles([file.path])
  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

// ── Review, marks, comments, sharing ───────────────────────────────────────

async function ownedSubmission(submissionId: string) {
  const { supabase, user } = await teacherContext()
  if (!user) return { fail: { error: 'Not authenticated' } as Fail, supabase: null, submission: null, assignment: null }
  const { data } = await supabase
    .from('assignment_submissions')
    .select('id, assignment_id, status, released_at, assignment:assignments!inner(id, teacher_id, response_marks)')
    .eq('id', submissionId)
    .maybeSingle()
  const assignment = Array.isArray(data?.assignment) ? data?.assignment[0] : data?.assignment
  if (!data || !assignment || assignment.teacher_id !== user.id) return { fail: { error: 'Submission not found' } as Fail, supabase: null, submission: null, assignment: null }
  return { fail: null, supabase, submission: data, assignment }
}

type ReviewInput = {
  response_marks_obtained: number | null
  overall_feedback: string
  answers: { id: string; marks_obtained: number | null; teacher_comment: string }[]
}

/** Save marks and comments without changing the submission's status. */
export async function saveReview(submissionId: string, input: ReviewInput): Promise<ActionResult> {
  const ctx = await ownedSubmission(submissionId)
  if (ctx.fail) return ctx.fail
  if (ctx.submission.status === 'in_progress') return { error: 'The student has not handed this in yet.' }

  const max = ctx.assignment.response_marks
  const resp = input.response_marks_obtained
  if (resp !== null && (!Number.isFinite(resp) || resp < 0 || resp > max)) {
    return { error: `Response marks must be between 0 and ${max}.` }
  }

  // Each answer's marks are clamped to its question's maximum.
  const { data: questions } = await ctx.supabase
    .from('assignment_questions').select('id, marks').eq('assignment_id', ctx.submission.assignment_id)
  const { data: answers } = await ctx.supabase
    .from('assignment_answers').select('id, question_id').eq('submission_id', submissionId)
  const maxByAnswer = new Map((answers ?? []).map(a => [a.id, questions?.find(q => q.id === a.question_id)?.marks ?? 0]))

  for (const a of input.answers) {
    const limit = maxByAnswer.get(a.id)
    if (limit === undefined) return { error: 'Unknown answer' }
    if (a.marks_obtained !== null && (a.marks_obtained < 0 || a.marks_obtained > limit)) {
      return { error: `Marks must be between 0 and ${limit}.` }
    }
  }

  for (const a of input.answers) {
    const { error } = await ctx.supabase
      .from('assignment_answers')
      .update({ marks_obtained: a.marks_obtained, teacher_comment: a.teacher_comment.trim() || null })
      .eq('id', a.id)
      .eq('submission_id', submissionId)
    if (error) return { error: error.message }
  }

  const { error } = await ctx.supabase
    .from('assignment_submissions')
    .update({
      response_marks_obtained: resp,
      overall_feedback: input.overall_feedback.trim().slice(0, 2000) || null,
    })
    .eq('id', submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${ctx.submission.assignment_id}`)
  return { success: true }
}

/** Total up the marks, mark the submission evaluated, and optionally share it with the student right away. */
export async function finishReview(submissionId: string, input: ReviewInput, release: boolean): Promise<ActionResult> {
  const saved = await saveReview(submissionId, input)
  if ('error' in saved) return saved
  const ctx = await ownedSubmission(submissionId)
  if (ctx.fail) return ctx.fail

  const [{ data: questions }, { data: answers }, { data: sub }] = await Promise.all([
    ctx.supabase.from('assignment_questions').select('id, marks').eq('assignment_id', ctx.submission.assignment_id),
    ctx.supabase.from('assignment_answers').select('marks_obtained').eq('submission_id', submissionId),
    ctx.supabase.from('assignment_submissions').select('response_marks_obtained').eq('id', submissionId).single(),
  ])

  const total = ctx.assignment.response_marks + (questions ?? []).reduce((n, q) => n + q.marks, 0)
  const obtained = (sub?.response_marks_obtained ?? 0) + (answers ?? []).reduce((n, a) => n + (a.marks_obtained ?? 0), 0)
  const now = new Date().toISOString()

  const { error } = await ctx.supabase
    .from('assignment_submissions')
    .update({
      status: 'evaluated',
      total_marks: total,
      obtained_marks: obtained,
      evaluated_at: now,
      released_at: release ? now : ctx.submission.released_at,
    })
    .eq('id', submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${ctx.submission.assignment_id}`)
  revalidatePath('/teacher/dashboard')
  return { success: true }
}

/** Send the work back to the student with a note so they can revise and hand in again. */
export async function returnSubmission(submissionId: string, note: string): Promise<ActionResult> {
  const ctx = await ownedSubmission(submissionId)
  if (ctx.fail) return ctx.fail
  if (ctx.submission.status === 'in_progress') return { error: 'The student has not handed this in yet.' }
  if (!note.trim()) return { error: 'Say what the student should change.' }

  const { error } = await ctx.supabase
    .from('assignment_submissions')
    .update({
      status: 'returned',
      overall_feedback: note.trim().slice(0, 2000),
      returned_at: new Date().toISOString(),
      released_at: null,
      evaluated_at: null,
      obtained_marks: null,
    })
    .eq('id', submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${ctx.submission.assignment_id}`)
  revalidatePath('/teacher/dashboard')
  return { success: true }
}

export async function setResultShared(submissionId: string, shared: boolean): Promise<ActionResult> {
  const ctx = await ownedSubmission(submissionId)
  if (ctx.fail) return ctx.fail
  if (ctx.submission.status !== 'evaluated') return { error: 'Mark the work as evaluated before sharing the result.' }

  const { error } = await ctx.supabase
    .from('assignment_submissions')
    .update({ released_at: shared ? new Date().toISOString() : null })
    .eq('id', submissionId)
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${ctx.submission.assignment_id}`)
  return { success: true }
}

/** Share every evaluated result that is still private. */
export async function shareAllResults(assignmentId: string): Promise<ActionResult<{ count: number }>> {
  const ctx = await owned(assignmentId)
  if (ctx.fail) return ctx.fail

  const { data, error } = await ctx.supabase
    .from('assignment_submissions')
    .update({ released_at: new Date().toISOString() })
    .eq('assignment_id', assignmentId)
    .eq('status', 'evaluated')
    .is('released_at', null)
    .select('id')
  if (error) return { error: error.message }

  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true, count: data?.length ?? 0 }
}
