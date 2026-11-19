import { createAdminClient } from '@/lib/supabase/admin'

export const ASSIGNMENT_BUCKET = 'assignment-files'
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_RESOURCE_FILES = 5
export const MAX_SUBMISSION_FILES = 5

/** Allowed uploads, by content type. Documents, spreadsheets, slides, text, images and zips. */
export const FILE_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'application/zip': 'zip',
}

export const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.zip'
export const FILE_LIMIT_HINT = 'PDF, Word, Excel, PowerPoint, text, image or zip, up to 10 MB each'

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

let bucketReady = false
/** Create the private bucket the first time it is needed. */
export async function ensureAssignmentBucket() {
  if (bucketReady) return null
  const { error } = await createAdminClient().storage.createBucket(ASSIGNMENT_BUCKET, {
    public: false,
    fileSizeLimit: MAX_FILE_BYTES,
  })
  if (error && !/already exists/i.test(error.message)) return error.message
  bucketReady = true
  return null
}

/** Attach a one-hour download link to each file row. */
export async function withSignedUrls<T extends { path: string; name: string }>(files: T[] | null | undefined): Promise<(T & { url?: string; downloadUrl?: string })[]> {
  const rows = files ?? []
  if (!rows.length) return []
  const admin = createAdminClient().storage.from(ASSIGNMENT_BUCKET)
  const { data } = await admin.createSignedUrls(rows.map(f => f.path), 3600)
  return rows.map((f, i) => {
    const url = data?.[i]?.signedUrl ?? undefined
    // The same signed link with ?download= makes the browser save the file under its real name instead of showing it.
    return { ...f, url, downloadUrl: url ? `${url}&download=${encodeURIComponent(f.name)}` : undefined }
  })
}

/** Delete stored files. Best effort: cleanup must never fail the user's action. */
export async function removeAssignmentFiles(paths: (string | null | undefined)[]) {
  const list = paths.filter((p): p is string => !!p)
  if (!list.length) return
  await createAdminClient().storage.from(ASSIGNMENT_BUCKET).remove(list).catch(() => {})
}

/** Delete everything stored for an assignment (resources and every student's files). */
export async function removeAssignmentFolder(assignmentId: string) {
  const bucket = createAdminClient().storage.from(ASSIGNMENT_BUCKET)
  async function walk(prefix: string): Promise<string[]> {
    const { data } = await bucket.list(prefix, { limit: 1000 }).catch(() => ({ data: null }))
    const out: string[] = []
    for (const item of data ?? []) {
      const full = `${prefix}/${item.name}`
      if (item.id) out.push(full)
      else out.push(...(await walk(full)))
    }
    return out
  }
  const paths = await walk(assignmentId)
  if (paths.length) await bucket.remove(paths).catch(() => {})
}
