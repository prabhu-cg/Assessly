'use client'

import { useState, useTransition } from 'react'
import { deleteTest } from '@/app/actions/tests'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface DeleteTestButtonProps {
  testId: string
  testTitle: string
  /** Controlled mode: the parent owns open state (e.g. a card menu) and no trigger button is rendered. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteTestButton({ testId, testTitle, open: controlledOpen, onOpenChange }: DeleteTestButtonProps) {
  const controlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next)
    onOpenChange?.(next)
  }
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteTest(testId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <>
      {!controlled && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete test"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${testTitle}"?`}
        description="This will permanently remove all questions and submissions associated with this test."
        confirmLabel="Delete Test"
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  )
}
