'use server'

import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import type { ActionResult } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  ASSIGNMENT_BUCKET, FILE_TYPES, MAX_FILE_BYTES, MAX_SUBMISSION_FILES,
  ensureAssignmentBucket, removeAssignmentFiles,
} from '@/lib/assignment-files'

/**
 * Students have no direct database access to assignment tables. Every call here proves the student is assigned
 * to a published assignment, then uses the service role and only ever touches that student's own rows.
 */
async function studentContext(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, admin: null, user: null, assignment: null }

  const admin = createAdminClient()
  const [{ data: profile }, { data: assignee }, { data: assignment }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', user.id).single(),
    admin.from('assignment_assignees').select('student_id').eq('assignment_id', assignmentId).eq('student_id', user.id).maybeSingle(),
    admin.from('assignments').select('id, status, due_at, response_marks').eq('id', assignmentId).maybeSingle(),
  ])
  if (profile?.role !== 'student' || !assignee || !assignment || assignment.status !== 'published') {
    return { error: 'This assignment is not available.' as const, admin: null, user: null, assignment: null }
  }
  return { error: null, admin, user, assignment }
}

type Ctx = Extract<Awaited<ReturnType<typeof studentContext>>, { error: null }>

/** The student's submission, created on first use. Refuses once the work is handed in or marked. */
async function editableSubmission(ctx: Ctx, assignmentId: string) {
  const { data: existing } = await ctx.admin
    .from('assignment_submissions')
    .select('id, status')
    .eq('assignment_id', assignmentId)
    .eq('student_id', ctx.user.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'submitted' || existing.status === 'evaluated') {
      return { error: 'You have already handed this in.' as const, id: null, status: null }
    }
    return { error: null, id: existing.id as string, status: existing.status as string }
  }

  const { data, error } = await ctx.admin
    .from('assignment_submissions')
    .insert({ assignment_id: assignmentId, student_id: ctx.user.id })
    .select('id')
    .single()
  if (error || !data) return { error: (error?.message ?? 'Could not start the assignment') as string, id: null, status: null }
  return { error: null, id: data.id as string, status: 'in_progress' }
}

export type DraftInput = {
  response_text: string
  answers: { question_id: string; answer_text?: string; selected_option_id?: string }[]
}

async function writeDraft(ctx: Ctx, submissionId: string, assignmentId: string, input: DraftInput) {
  const { data: questions } = await ctx.admin
    .from('assignment_questions').select('id, type, options').eq('assignment_id', assignmentId)
  const valid = new Map((questions ?? []).map(q => [q.id, q]))

  const rows = input.answers
    .filter(a => valid.has(a.question_id))
    .map(a => {
      const q = valid.get(a.question_id)!
      const optionOk = q.type === 'mcq' && (q.options as { id: string }[] | null)?.some(o => o.id === a.selected_option_id)
      return {
        submission_id: submissionId,
        question_id: a.question_id,
        answer_text: q.type === 'mcq' ? null : (a.answer_text ?? '').slice(0, 20000) || null,
        selected_option_id: optionOk ? a.selected_option_id! : null,
        last_saved_at: new Date().toISOString(),
      }
    })

  if (rows.length) {
    const { error } = await ctx.admin.from('assignment_answers').upsert(rows, { onConflict: 'submission_id,question_id' })
    if (error) return error.message
  }

  const { error } = await ctx.admin
    .from('assignment_submissions')
    .update({ response_text: input.response_text.slice(0, 50000) || null })
    .eq('id', submissionId)
  return error?.message ?? null
}

export async function saveAssignmentDraft(assignmentId: string, input: DraftInput): Promise<ActionResult> {
  const ctx = await studentContext(assignmentId)
  if (ctx.error) return { error: ctx.error }
  const sub = await editableSubmission(ctx, assignmentId)
  if (sub.error) return { error: sub.error }

  const err = await writeDraft(ctx, sub.id!, assignmentId, input)
  if (err) return { error: err }
  return { success: true }
}

export async function submitAssignment(assignmentId: string, input: DraftInput): Promise<ActionResult> {
  const ctx = await studentContext(assignmentId)
  if (ctx.error) return { error: ctx.error }
  const sub = await editableSubmission(ctx, assignmentId)
  if (sub.error) return { error: sub.error }

  const err = await writeDraft(ctx, sub.id!, assignmentId, input)
  if (err) return { error: err }

  const [{ count: fileCount }, { data: questions }] = await Promise.all([
    ctx.admin.from('assignment_submission_files').select('id', { count: 'exact', head: true }).eq('submission_id', sub.id),
    ctx.admin.from('assignment_questions').select('id, type, correct_option_id, marks').eq('assignment_id', assignmentId),
  ])

  const hasWork = input.response_text.trim() || fileCount || input.answers.some(a => a.answer_text?.trim() || a.selected_option_id)
  if (!hasWork) return { error: 'Add some work before handing in: write a response, attach a file or answer a question.' }

  // Every question gets an answer row so the teacher sees the whole set; multiple choice is marked now.
  const { data: saved } = await ctx.admin
    .from('assignment_answers').select('question_id, selected_option_id').eq('submission_id', sub.id)
  const savedBy = new Map((saved ?? []).map(a => [a.question_id, a]))

  const rows = (questions ?? []).map(q => {
    const a = savedBy.get(q.id)
    return {
      submission_id: sub.id,
      question_id: q.id,
      ...(q.type === 'mcq'
        ? { marks_obtained: a?.selected_option_id && a.selected_option_id === q.correct_option_id ? q.marks : 0 }
        : {}),
    }
  })
  if (rows.length) {
    const { error } = await ctx.admin.from('assignment_answers').upsert(rows, { onConflict: 'submission_id,question_id' })
    if (error) return { error: error.message }
  }

  const now = new Date()
  const total = ctx.assignment.response_marks + (questions ?? []).reduce((n, q) => n + q.marks, 0)
  const { error } = await ctx.admin
    .from('assignment_submissions')
    .update({
      status: 'submitted',
      submitted_at: now.toISOString(),
      is_late: !!ctx.assignment.due_at && now > new Date(ctx.assignment.due_at),
      total_marks: total,
      // A resubmission clears the earlier return note, release and marks; the teacher reviews it afresh.
      overall_feedback: null,
      obtained_marks: null,
      evaluated_at: null,
      released_at: null,
    })
    .eq('id', sub.id)
  if (error) return { error: error.message }

  if (sub.status === 'returned') {
    const { data: cur } = await ctx.admin.from('assignment_submissions').select('revision_count').eq('id', sub.id).single()
    await ctx.admin.from('assignment_submissions').update({ revision_count: (cur?.revision_count ?? 0) + 1 }).eq('id', sub.id)
  }

  revalidatePath('/student/assignments')
  revalidatePath(`/student/assignments/${assignmentId}`)
  revalidatePath(`/teacher/assignments/${assignmentId}`)
  return { success: true }
}

// ── The student's own files ────────────────────────────────────────────────

export async function createSubmissionUpload(assignmentId: string, name: string, contentType: string, size: number) {
  const ctx = await studentContext(assignmentId)
  if (ctx.error) return { error: ctx.error }

  const ext = FILE_TYPES[contentType]
  if (!ext) return { error: 'That file type is not allowed. Use a PDF, Word, Excel, PowerPoint, text, image or zip file.' }
  if (!(size > 0) || size > MAX_FILE_BYTES) return { error: 'Each file must be 10 MB or smaller.' }

  const sub = await editableSubmission(ctx, assignmentId)
  if (sub.error) return { error: sub.error }

  const { count } = await ctx.admin
    .from('assignment_submission_files').select('id', { count: 'exact', head: true }).eq('submission_id', sub.id)
  if ((count ?? 0) >= MAX_SUBMISSION_FILES) return { error: `You can attach up to ${MAX_SUBMISSION_FILES} files.` }

  const bucketError = await ensureAssignmentBucket()
  if (bucketError) return { error: bucketError }

  const path = `${assignmentId}/submissions/${ctx.user.id}/${uuidv4()}.${ext}`
  const { data, error } = await ctx.admin.storage.from(ASSIGNMENT_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { error: error?.message ?? 'Could not start the upload' }
  return { path, token: data.token, name }
}

export async function registerSubmissionFile(
  assignmentId: string,
  file: { path: string; name: string; size: number; contentType: string },
): Promise<ActionResult> {
  const ctx = await studentContext(assignmentId)
  if (ctx.error) return { error: ctx.error }
  if (!file.path.startsWith(`${assignmentId}/submissions/${ctx.user.id}/`)) return { error: 'Invalid file' }

  const sub = await editableSubmission(ctx, assignmentId)
  if (sub.error) return { error: sub.error }

  const { error } = await ctx.admin.from('assignment_submission_files').insert({
    submission_id: sub.id,
    name: file.name.slice(0, 200),
    path: file.path,
    size_bytes: file.size,
    content_type: file.contentType,
  })
  if (error) return { error: error.message }

  revalidatePath(`/student/assignments/${assignmentId}`)
  return { success: true }
}

export async function removeSubmissionFile(assignmentId: string, fileId: string): Promise<ActionResult> {
  const ctx = await studentContext(assignmentId)
  if (ctx.error) return { error: ctx.error }
  const sub = await editableSubmission(ctx, assignmentId)
  if (sub.error) return { error: sub.error }

  const { data: file } = await ctx.admin
    .from('assignment_submission_files').select('path').eq('id', fileId).eq('submission_id', sub.id).maybeSingle()
  if (!file) return { error: 'File not found' }

  const { error } = await ctx.admin.from('assignment_submission_files').delete().eq('id', fileId)
  if (error) return { error: error.message }

  await removeAssignmentFiles([file.path])
  revalidatePath(`/student/assignments/${assignmentId}`)
  return { success: true }
}
