'use client'

/** A short date in the viewer's timezone (the server would render it in UTC). */
export function LocalDate({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
    </time>
  )
}
