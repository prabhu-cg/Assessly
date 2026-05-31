'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

const messages: Record<string, string> = {
  unavailable: 'This test is not currently available. Ask your teacher to publish it.',
}

export function NoticeToast() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const notice = params.get('notice')

  useEffect(() => {
    if (notice && messages[notice]) {
      toast.warning(messages[notice], { id: `notice-${notice}` })
      // Clear the query param so refreshing doesn't re-fire the toast
      router.replace(pathname)
    }
  }, [notice])

  return null
}
