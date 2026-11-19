'use client'

import { useTransition } from 'react'
import { Archive, Loader2, Rocket, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateAssignmentStatus } from '@/app/actions/assignments'
import { Button } from '@/components/ui/button'
import type { AssignmentStatus } from '@/types/database'

export function AssignmentStatusActions({ id, status }: { id: string; status: AssignmentStatus }) {
  const [pending, start] = useTransition()
  const set = (next: AssignmentStatus, done: string) =>
    start(async () => {
      const r = await updateAssignmentStatus(id, next)
      if (r?.error) toast.error(r.error)
      else toast.success(done)
    })

  return (
    <>
      {status === 'published' ? (
        <>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => set('draft', 'Unpublished. Students no longer see it.')}>
            {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Undo2 className="mr-1.5 size-4" />} Unpublish
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => set('archived', 'Archived')}>
            <Archive className="mr-1.5 size-4" /> Archive
          </Button>
        </>
      ) : (
        <Button size="sm" disabled={pending} onClick={() => set('published', 'Published. Assigned students can see it now.')}>
          {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Rocket className="mr-1.5 size-4" />}
          {status === 'archived' ? 'Publish again' : 'Publish'}
        </Button>
      )}
    </>
  )
}
