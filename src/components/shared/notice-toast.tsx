'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

const notices: Record<string, { message: string; type: 'error' | 'warning' | 'info' }> = {
  unavailable: { message: 'This test is not currently available. Ask your teacher to publish it.', type: 'warning' },
  'invalid-link': { message: 'This student link is invalid or has expired.', type: 'error' },
  'link-error': { message: 'Could not sign in with this link. Please try again.', type: 'error' },
}

export function NoticeToast() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const notice = params.get('notice')

  useEffect(() => {
    const entry = notice ? notices[notice] : null
    if (entry) {
      toast[entry.type](entry.message, { id: `notice-${notice}` })
      // Clear the query param so refreshing doesn't re-fire the toast
      router.replace(pathname)
    }
  }, [notice])

  return null
}
