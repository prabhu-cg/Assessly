'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TestForm } from '@/components/teacher/test-form'
import { Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Test } from '@/types/database'

interface EditTestDrawerProps {
  test: Test
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
}

export function EditTestDrawer({ test, variant = 'outline', size = 'sm' }: EditTestDrawerProps) {
  const [mounted, setMounted] = useState(false)
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
      <Button variant={variant} size={size} onClick={openDrawer}>
        <Pencil className="h-4 w-4 mr-1.5" />
        Edit
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
                <h2 className="text-base font-semibold">Edit Test</h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">{test.title}</p>
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
              <TestForm test={test} onCancel={closeDrawer} onSuccess={closeDrawer} />
            </div>
          </div>
        </>
      )}
    </>
  )
}
