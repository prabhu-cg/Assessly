'use client'

import { cn } from '@/lib/utils'

/** Accessible on/off switch. Label it with `aria-label` or wrap it in a <label>. */
export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
} & Omit<React.ComponentProps<'button'>, 'onClick' | 'role'>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50',
        checked ? 'bg-primary' : 'bg-border-strong',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
