'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TestForm } from '@/components/teacher/test-form'
import { Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/shared/portal'
import type { Test } from '@/types/database'

interface EditTestDrawerProps {
  test: Test
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  /** Controlled mode: the parent owns open state (e.g. a card menu) and no trigger button is rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditTestDrawer({ test, variant = 'outline', size = 'sm', open: controlledOpen, onOpenChange }: EditTestDrawerProps) {
  const controlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const want = controlled ? controlledOpen : internalOpen

  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  if (want && !mounted) setMounted(true)
  const visible = want && entered

  useEffect(() => {
    if (want) {
      const id = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(id)
    }
    const t = setTimeout(() => { setEntered(false); setMounted(false) }, 300)
    return () => clearTimeout(t)
  }, [want])

  function setOpen(next: boolean) {
    if (!controlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const closeDrawer = () => setOpen(false)

  return (
    <>
      {!controlled && (
        <Button variant={variant} size={size} onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4 mr-1.5" />
          Edit
        </Button>
      )}

      {mounted && (
        <Portal>
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              visible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[640px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              visible ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Edit Test</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">{test.title}</p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TestForm test={test} onCancel={closeDrawer} onSuccess={closeDrawer} />
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
