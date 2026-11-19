'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TestForm } from '@/components/teacher/test-form'
import { Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/shared/portal'
import { useUnsavedGuard } from '@/components/shared/unsaved-guard'
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
  const { setDirty, requestClose, dialog } = useUnsavedGuard({
    formId: 'test-form',
    close: closeDrawer,
    active: mounted,
    description: 'Your changes to this test have not been saved. If you close now, they will be lost.',
  })

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
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-[180ms]',
              visible ? 'opacity-100' : 'opacity-0',
            )}
            onClick={requestClose}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[640px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-drawer rounded-l-card',
              'transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
              visible ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-2xl leading-tight">Edit Test</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">{test.title}</p>
              </div>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close"
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-ink-strong transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TestForm test={test} onCancel={requestClose} onSuccess={closeDrawer} onDirtyChange={setDirty} />
            </div>
          </div>
        </Portal>
      )}
      {dialog}
    </>
  )
}
