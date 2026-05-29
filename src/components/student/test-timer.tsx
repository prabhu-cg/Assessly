'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TestTimerProps {
  endsAt: Date
  onTimeUp: () => void
}

export function TestTimer({ endsAt, onTimeUp }: TestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp()
      return
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endsAt, onTimeUp])

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  const isWarning = secondsLeft <= 300  // 5 minutes
  const isCritical = secondsLeft <= 60  // 1 minute

  const formatted = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      className={cn(
        'font-mono text-sm font-semibold px-3 py-1 rounded-md tabular-nums',
        isCritical
          ? 'bg-destructive/15 text-destructive animate-pulse'
          : isWarning
          ? 'bg-orange-100 text-orange-700'
          : 'bg-muted text-foreground'
      )}
    >
      {formatted}
    </div>
  )
}
