'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/shared/portal'

/**
 * Right-hand drawer mounted through Portal (so a lifting card can never trap it).
 * The parent owns `open`; closing slides out for 300ms before unmounting.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  width = 'max-w-[640px]',
  side = 'right',
  ariaLabel,
  bodyClassName = 'p-6',
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  width?: string
  /** Which edge the sheet slides from. Menus open from the left; forms and details from the right. */
  side?: 'left' | 'right'
  /** Accessible name when `title` is not plain text. */
  ariaLabel?: string
  bodyClassName?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  if (open && !mounted) setMounted(true)
  const visible = open && entered
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    const t = setTimeout(() => { setEntered(false); setMounted(false) }, 300)
    return () => clearTimeout(t)
  }, [open])

  // Escape closes; Tab stays inside the sheet; the page behind does not scroll; focus returns to what opened it.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusId = requestAnimationFrame(() => {
      const first = panel.current?.querySelector<HTMLElement>('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      ;(first ?? panel.current)?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !panel.current) return
      const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(focusId)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [open, onClose])

  if (!mounted) return null

  return (
    <Portal>
      <div
        className={cn('fixed inset-0 z-[60] bg-black/40 transition-opacity duration-[180ms]', visible ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
        className={cn(
          'fixed top-0 z-[61] flex h-full w-full flex-col border-border outline-none',
          'transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-[1ms]',
          side === 'right'
            ? 'right-0 rounded-l-card border-l bg-background shadow-drawer'
            : 'left-0 rounded-r-card border-r bg-surface shadow-drawer-left',
          width,
          visible ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="line-clamp-4 text-2xl leading-tight">{title}</h2>
            {description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-ink-strong focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={cn('flex-1 overflow-y-auto', bodyClassName)}>{children}</div>
        {footer && <div className="shrink-0 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </Portal>
  )
}
