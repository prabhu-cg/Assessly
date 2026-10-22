'use client'

/** Formats an ISO timestamp in the viewer's timezone (the server would render it in UTC). */
export function LocalDateTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </time>
  )
}
