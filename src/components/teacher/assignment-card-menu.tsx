'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { RowMenu } from '@/components/shared/row-menu'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { AssignmentDrawer } from '@/components/teacher/assignment-drawer'
import { deleteAssignment } from '@/app/actions/assignments'
import type { Assignment } from '@/types/database'

export function AssignmentCardMenu({ assignment }: { assignment: Assignment }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, start] = useTransition()

  return (
    <>
      <RowMenu label={`More actions for ${assignment.title}`}>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </RowMenu>
      <AssignmentDrawer assignment={assignment} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${assignment.title}"?`}
        description="This permanently removes the assignment, its questions, files, and every student's submission and marks."
        confirmLabel="Delete assignment"
        isPending={pending}
        onConfirm={() =>
          start(async () => {
            const r = await deleteAssignment(assignment.id)
            if (r?.error) toast.error(r.error)
            else setDeleteOpen(false)
          })
        }
      />
    </>
  )
}
