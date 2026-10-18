'use client'

import { usePathname } from 'next/navigation'

/** Re-mounts on route change so each page fades in once (opacity only: a transform here would trap fixed drawers). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="fade-in">
      {children}
    </div>
  )
}
