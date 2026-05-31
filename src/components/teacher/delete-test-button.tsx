'use client'

import { useState, useTransition } from 'react'
import { deleteTest } from '@/app/actions/tests'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

export function DeleteTestButton({ testId, testTitle }: { testId: string; testTitle: string }) {
  const [open, setOpen] = useState(false)
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

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
