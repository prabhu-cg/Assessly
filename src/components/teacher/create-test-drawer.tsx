'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TestForm } from '@/components/teacher/test-form'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              open ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[560px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              open ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Create New Test</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in the details. You can add questions after saving.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TestForm onCancel={closeDrawer} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
