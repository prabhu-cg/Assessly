'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Paperclip, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createResourceUpload, registerResourceFile, deleteResourceFile } from '@/app/actions/assignments'
import { ASSIGNMENT_BUCKET, FILE_ACCEPT, FILE_LIMIT_HINT, MAX_RESOURCE_FILES } from '@/lib/assignment-files'
import { FileList } from '@/components/shared/assignment-ui'
import { cn } from '@/lib/utils'
import type { AssignmentFile } from '@/types/database'

/** Files students get with the brief. The browser uploads straight to storage; only the ticket passes through the server. */
export function AssignmentMaterials({ assignmentId, files }: { assignmentId: string; files: AssignmentFile[] }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const full = files.length >= MAX_RESOURCE_FILES

  async function upload(list: FileList | File[]) {
    const picked = Array.from(list)
    if (!picked.length) return
    setUploading(true)
    try {
      let room = MAX_RESOURCE_FILES - files.length
      for (const file of picked) {
        if (room <= 0) { toast.error(`You can attach up to ${MAX_RESOURCE_FILES} files.`); break }
        const ticket = await createResourceUpload(assignmentId, file.name, file.type, file.size)
        if ('error' in ticket && ticket.error) { toast.error(`${file.name}: ${ticket.error}`); continue }
        const { path, token } = ticket as { path: string; token: string }
        const { error } = await createClient().storage.from(ASSIGNMENT_BUCKET).uploadToSignedUrl(path, token, file, { contentType: file.type })
        if (error) { toast.error(`${file.name}: ${error.message}`); continue }
        const saved = await registerResourceFile(assignmentId, { path, name: file.name, size: file.size, contentType: file.type })
        if (saved?.error) { toast.error(saved.error); continue }
        room--
      }
      router.refresh()
    } finally {
      setUploading(false)
      if (input.current) input.current.value = ''
    }
  }

  async function remove(id: string) {
    setRemoving(id)
    const r = await deleteResourceFile(assignmentId, id)
    setRemoving(null)
    if (r?.error) toast.error(r.error)
    else router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Worksheets, readings or templates students download with the brief.</p>
      <FileList files={files} onRemove={remove} removingId={removing} />

      {!full && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); void upload(e.dataTransfer.files) }}
          className={cn(
            'rounded-xl border border-dashed border-border-strong bg-card px-4 py-6 text-center transition-colors',
            dragging && 'border-primary bg-primary-soft',
          )}
        >
          <input ref={input} type="file" multiple accept={FILE_ACCEPT} className="sr-only" aria-label="Choose files to attach" onChange={e => e.target.files && void upload(e.target.files)} />
          {uploading ? (
            <p className="flex items-center justify-center gap-2 text-sm font-semibold"><Loader2 className="size-4 animate-spin" /> Uploading…</p>
          ) : (
            <>
              <UploadCloud className="mx-auto mb-2 size-5 text-primary-text" />
              <p className="text-sm">
                Drag files here or{' '}
                <button type="button" onClick={() => input.current?.click()} className="font-semibold text-primary-text underline-offset-4 hover:underline">choose files</button>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{FILE_LIMIT_HINT}. Up to {MAX_RESOURCE_FILES} files.</p>
            </>
          )}
        </div>
      )}
      {full && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Paperclip className="size-3.5" /> Limit of {MAX_RESOURCE_FILES} files reached. Remove one to add another.</p>}
    </div>
  )
}
