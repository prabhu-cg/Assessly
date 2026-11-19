'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TestForm } from '@/components/teacher/test-form'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnsavedGuard } from '@/components/shared/unsaved-guard'

interface CreateTestDrawerProps {
  label?: string
  defaultOpen?: boolean
}

export function CreateTestDrawer({ label = 'New Test', defaultOpen = false }: CreateTestDrawerProps) {
  const [mounted, setMounted] = useState(defaultOpen)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (mounted) {
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [mounted])

  function openDrawer() { setMounted(true) }

  function closeDrawer() {
    setOpen(false)
    setTimeout(() => setMounted(false), 300)
  }

  const { setDirty, requestClose, dialog } = useUnsavedGuard({
    formId: 'test-form',
    close: closeDrawer,
    active: mounted,
    description: 'This test has not been saved yet. If you close now, everything you entered will be lost.',
  })

  return (
    <>
      <Button onClick={openDrawer}>
        <Plus className="h-4 w-4 mr-2" />
        {label}
      </Button>

      {mounted && (
        <>
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-[180ms]',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={requestClose}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[640px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-drawer rounded-l-card',
              'transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-2xl leading-tight">Create New Test</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in the details. You can add questions after saving.
                </p>
              </div>
              <button
                type="button"
                onClick={requestClose}
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-ink-strong transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TestForm onCancel={requestClose} onDirtyChange={setDirty} />
            </div>
          </div>
        </>
      )}
      {dialog}
    </>
  )
}
