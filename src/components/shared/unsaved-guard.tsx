'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Loader2, TriangleAlert } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/** Asks what to do with unsaved changes: keep editing, save them, or discard them and close. */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  description,
  saving = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  onDiscard: () => void
  description: string
  saving?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft">
              <TriangleAlert className="size-4 text-warning" />
            </div>
            <div className="space-y-1 pt-1">
              <DialogTitle>Unsaved changes</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Keep editing
          </Button>
          <Button variant="destructive" onClick={onDiscard} disabled={saving}>
            Discard and close
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Guards a drawer that holds a form. The form reports whether it has unsaved changes through `setDirty`;
 * every way of closing the drawer (backdrop, X, Cancel) goes through `requestClose`, which asks first when dirty.
 * "Save" submits the form (by its id), so validation and the save itself behave exactly as the Save button does.
 */
export function useUnsavedGuard({
  formId,
  close,
  active,
  description,
}: {
  formId: string
  close: () => void
  active: boolean
  description: string
}): { setDirty: (dirty: boolean) => void; requestClose: () => void; dialog: ReactNode } {
  const [dirty, setDirty] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const requestClose = useCallback(() => {
    if (dirty) setConfirmOpen(true)
    else close()
  }, [dirty, close])

  // Warn before the tab is closed or reloaded with unsaved changes.
  useEffect(() => {
    if (!active || !dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active, dirty])

  const dialog = (
    <UnsavedChangesDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      description={description}
      onSave={() => {
        setConfirmOpen(false)
        ;(document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit()
      }}
      onDiscard={() => {
        setConfirmOpen(false)
        setDirty(false)
        close()
      }}
    />
  )

  return { setDirty, requestClose, dialog }
}
