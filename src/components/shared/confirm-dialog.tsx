'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, TriangleAlert } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  isPending?: boolean
  /** `primary` is for confirming a positive action (hand in, publish) rather than a deletion. */
  tone?: 'destructive' | 'primary'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  isPending = false,
  tone = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={tone === 'primary' ? 'h-9 w-9 rounded-full bg-primary-soft flex items-center justify-center shrink-0 mt-0.5' : 'h-9 w-9 rounded-full bg-destructive-soft flex items-center justify-center shrink-0 mt-0.5'}>
              <TriangleAlert className={tone === 'primary' ? 'h-4 w-4 text-primary-text' : 'h-4 w-4 text-destructive'} />
            </div>
            <div className="space-y-1 pt-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant={tone === 'primary' ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
