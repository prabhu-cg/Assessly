import { createAdminClient } from '@/lib/supabase/admin'

export const QUESTION_IMAGE_BUCKET = 'question-images'
const MARKER = `/storage/v1/object/public/${QUESTION_IMAGE_BUCKET}/`

/** The storage path of one of our bucket's public URLs, or null if the URL isn't ours. */
export function questionImagePath(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin) return null
    if (!u.pathname.startsWith(MARKER)) return null
    return decodeURIComponent(u.pathname.slice(MARKER.length))
  } catch {
    return null
  }
}

/** Delete the files behind these image URLs. Best effort: a failed cleanup must never fail the user's action. */
export async function removeQuestionImages(urls: (string | null | undefined)[]) {
  const paths = [...new Set(urls.map(questionImagePath).filter((p): p is string => !!p))]
  if (!paths.length) return
  await createAdminClient().storage.from(QUESTION_IMAGE_BUCKET).remove(paths).catch(() => {})
}

/** Delete every image uploaded for a test (used when the whole test is deleted). */
export async function removeTestImageFolder(testId: string) {
  const bucket = createAdminClient().storage.from(QUESTION_IMAGE_BUCKET)
  const { data } = await bucket.list(testId, { limit: 1000 }).catch(() => ({ data: null }))
  if (!data?.length) return
  await bucket.remove(data.map(f => `${testId}/${f.name}`)).catch(() => {})
}
