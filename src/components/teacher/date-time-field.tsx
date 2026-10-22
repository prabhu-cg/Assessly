'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DateTimeFieldProps {
  id: string
  /** `YYYY-MM-DDTHH:mm`, or empty. */
  value: string
  onChange: (value: string) => void
  /** Time stored when a date is set but the time is left empty. */
  fallbackTime: string
  /** What an empty time means, shown as a hint. */
  emptyTimeHint: string
}

/** Date + time inputs with a separate clear for the time, so a date can stay set without one. */
export function DateTimeField({ id, value, onChange, fallbackTime, emptyTimeHint }: DateTimeFieldProps) {
  const [date, setDate] = useState(value.split('T')[0] ?? '')
  const [time, setTime] = useState(value.split('T')[1] ?? '')

  const emit = (nextDate: string, nextTime: string) => {
    setDate(nextDate)
    setTime(nextTime)
    onChange(nextDate ? `${nextDate}T${nextTime || fallbackTime}` : '')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <Input id={id} type="date" value={date} className="min-w-[8.75rem] flex-1 px-2" onChange={e => emit(e.target.value, e.target.value ? time : '')} aria-label="Date" />
        <div className="relative w-[8.5rem] shrink-0">
          <Input
            type="time"
            value={time}
            onChange={e => emit(date, e.target.value)}
            disabled={!date}
            aria-label="Time"
            className="px-2"
          />
          {time && (
            <button
              type="button"
              onClick={() => emit(date, '')}
              aria-label="Clear time"
              className="absolute right-8 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {date && !time && <p className="text-xs text-muted-foreground">No time set — {emptyTimeHint}.</p>}
    </div>
  )
}
