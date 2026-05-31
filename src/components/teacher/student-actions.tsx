'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateStudentSchema, type UpdateStudentInput } from '@/lib/validators/schemas'
import { updateStudent, deleteStudent, getStudentAccessLink } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Pencil, Trash2, Loader2, Link2, Copy, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StudentActionsProps {
  studentId: string
  studentName: string
  addedDate: string
}

export function StudentActions({ studentId, studentName, addedDate }: StudentActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkMounted, setLinkMounted] = useState(false)
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false)
  const [studentLink, setStudentLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditing, startEdit] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [isLoadingLink, startLoadLink] = useTransition()

  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    if (linkMounted) {
      const id = requestAnimationFrame(() => setLinkDrawerOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [linkMounted])

  const openLinkDrawer = () => {
    setStudentLink(null)
    setCopied(false)
    setLinkMounted(true)
    // Fetch link while drawer opens
    startLoadLink(async () => {
      const result = await getStudentAccessLink(studentId)
      if (result?.error) toast.error(result.error)
      else if (result?.accessToken) {
        setStudentLink(`${window.location.origin}/s/${result.accessToken}`)
      }
    })
  }

  const closeLinkDrawer = () => {
    setLinkDrawerOpen(false)
    setTimeout(() => setLinkMounted(false), 300)
  }

  const handleCopy = async () => {
    if (!studentLink) return
    await navigator.clipboard.writeText(studentLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const nameParts = studentName.trim().split(/\s+/)
  const defaultFirstName = nameParts.slice(0, -1).join(' ') || nameParts[0]
  const defaultLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
    defaultValues: { first_name: defaultFirstName, last_name: defaultLastName },
  })

  const onEdit = (data: UpdateStudentInput) => {
    const formData = new FormData()
    formData.append('first_name', data.first_name)
    formData.append('last_name', data.last_name)
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
      <div className="flex items-center gap-2 shrink-0">
        {/* Student Link — labeled secondary button */}
        <Button
          variant="outline"
          size="sm"
          onClick={openLinkDrawer}
          disabled={isLoadingLink}
          className="gap-1.5"
        >
          {isLoadingLink
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Link2 className="h-3.5 w-3.5" />}
          Student Link
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
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

      {/* ── Student Link Drawer ── */}
      {linkMounted && (
        <>
          <div
            className={cn(
              'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
              linkDrawerOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={closeLinkDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 h-full w-full max-w-[440px] bg-background z-[61]',
              'flex flex-col border-l border-border shadow-2xl',
              'transition-transform duration-300 ease-in-out',
              linkDrawerOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold">Student Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Login link and account info</p>
              </div>
              <button
                type="button"
                onClick={closeLinkDrawer}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Student info */}
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary">{initials}</span>
                </div>
                <div>
                  <p className="text-lg font-bold">{studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    Added {new Date(addedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Link section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Personal Login Link</p>
                </div>

                {studentLink ? (
                  <>
                    <div className="rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs break-all text-muted-foreground leading-relaxed">
                      {studentLink}
                    </div>
                    <Button className="w-full gap-2" onClick={handleCopy}>
                      {copied
                        ? <><Check className="h-4 w-4" />Copied!</>
                        : <><Copy className="h-4 w-4" />Copy Link</>}
                    </Button>
                  </>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Sharing tips */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800 font-medium mb-1">Share this link via:</p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>Email to the student's parent</li>
                  <li>Paste into a QR code generator (e.g. qr-code-generator.com)</li>
                  <li>Print and hand to the student directly</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Edit Dialog ── */}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
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

      {/* ── Delete Confirm ── */}
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
