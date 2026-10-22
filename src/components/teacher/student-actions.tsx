'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateStudentSchema, type UpdateStudentInput } from '@/lib/validators/schemas'
import { updateStudent, deleteStudent } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { RowMenu } from '@/components/shared/row-menu'
import { Portal } from '@/components/shared/portal'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { YearOptions } from '@/components/teacher/year-options'
import type { StudentTestEntry } from '@/components/teacher/student-types'
import { StudentDetailsDrawer, useDrawerState, drawerClass, backdropClass } from '@/components/teacher/student-details-drawer'
import { Pencil, Trash2, Loader2, X, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface StudentActionsProps {
  studentId: string
  studentName: string
  addedDate: string
  yearLevel: string | null
  tests: StudentTestEntry[]
  detailsOpen: boolean
  onDetailsOpenChange: (open: boolean) => void
}

export function StudentActions({
  studentId, studentName, addedDate, yearLevel, tests, detailsOpen, onDetailsOpenChange,
}: StudentActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const edit = useDrawerState(editOpen)

  const [isDeleting, startDelete] = useTransition()
  const [isSaving, startSave] = useTransition()

  const nameParts = studentName.trim().split(/\s+/)
  const defaultFirstName = nameParts.slice(0, -1).join(' ') || nameParts[0]
  const defaultLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: { first_name: defaultFirstName, last_name: defaultLastName, year_level: yearLevel ?? '' },
  })

  const onSave = (data: UpdateStudentInput) => {
    const formData = new FormData()
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
    formData.append('year_level', data.year_level ?? '')
    startSave(async () => {
      const result = await updateStudent(studentId, formData)
      if (result?.error) toast.error(result.error)
      else {
        setEditOpen(false)
        if (result?.warning) toast.warning(result.warning)
        else toast.success('Student updated')
      }
    })
  }

  const onDelete = () => {
    startDelete(async () => {
      const result = await deleteStudent(studentId)
      if (result?.error) toast.error(result.error)
      else { setDeleteOpen(false); toast.success('Student removed') }
    })
  }

  const closeButton = (onClick: () => void) => (
    <button type="button" onClick={onClick} aria-label="Close" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
      <X className="h-4 w-4" />
    </button>
  )

  return (
    <>
      <RowMenu label={`More actions for ${studentName}`}>
        <DropdownMenuItem onClick={() => onDetailsOpenChange(true)}>
          <Eye className="size-4" /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </RowMenu>

      <StudentDetailsDrawer
        studentId={studentId}
        studentName={studentName}
        addedDate={addedDate}
        yearLevel={yearLevel}
        tests={tests}
        open={detailsOpen}
        onOpenChange={onDetailsOpenChange}
      />

      {/* ── Edit drawer ── */}
      {edit.mounted && (
        <Portal>
          <div className={backdropClass(edit.visible)} onClick={() => setEditOpen(false)} />
          <div className={drawerClass(edit.visible)} role="dialog" aria-label={`Edit ${studentName}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Edit student</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{studentName}</p>
              </div>
              {closeButton(() => setEditOpen(false))}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit_first_name">First name</Label>
                    <Input id="edit_first_name" {...register('first_name')} />
                    {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_last_name">Last name</Label>
                    <Input id="edit_last_name" {...register('last_name')} />
                    {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_year_level">Year <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Input id="edit_year_level" list="year-options" autoComplete="off" {...register('year_level')} placeholder="e.g. Year 4" />
                  <YearOptions />
                  {errors.year_level && <p className="text-sm text-destructive">{errors.year_level.message}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

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
