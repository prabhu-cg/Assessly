'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, BookOpen } from 'lucide-react'
import { RowMenu } from '@/components/shared/row-menu'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { EditTestDrawer } from '@/components/teacher/edit-test-drawer'
import { DeleteTestButton } from '@/components/teacher/delete-test-button'
import type { Test } from '@/types/database'

export function TestCardMenu({ test }: { test: Test }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <RowMenu label={`More actions for ${test.title}`}>
        <DropdownMenuItem onClick={() => router.push(`/teacher/tests/${test.id}/questions`)}>
          <BookOpen className="size-4" /> Questions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </RowMenu>
      <EditTestDrawer test={test} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTestButton testId={test.id} testTitle={test.title} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}
