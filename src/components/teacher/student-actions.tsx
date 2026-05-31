'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateStudentSchema, type UpdateStudentInput } from '@/lib/validators/schemas'
import { updateStudent, deleteStudent } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface StudentActionsProps {
  studentId: string
  studentName: string
}

export function StudentActions({ studentId, studentName }: StudentActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditing, startEdit] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: { full_name: studentName },
  })

  const onEdit = (data: UpdateStudentInput) => {
    const formData = new FormData()
    formData.append('full_name', data.full_name)
    setEditError(null)
    startEdit(async () => {
      const result = await updateStudent(studentId, formData)
      if (result?.error) {
        setEditError(result.error)
      } else {
        setEditOpen(false)
        toast.success('Student updated')
      }
    })
  }

  const onDelete = () => {
    startDelete(async () => {
      const result = await deleteStudent(studentId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setDeleteOpen(false)
        toast.success('Student removed')
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEdit)} className="space-y-4">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" {...register('full_name')} />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isEditing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Remove "${studentName}"?`}
        description="This will permanently delete the student account and all their submissions."
        confirmLabel="Remove Student"
        onConfirm={onDelete}
        isPending={isDeleting}
      />
    </>
  )
}
