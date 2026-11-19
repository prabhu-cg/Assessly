'use client'

import { useState } from 'react'
import { FileText, Download, X, Loader2, ExternalLink, FileQuestion } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Drawer } from '@/components/shared/drawer'
import { formatBytes } from '@/lib/assignment-files'
import type { AssignmentFile } from '@/types/database'

// ── Where a student's work stands, as the teacher reads it ─────────────────

export type WorkState = 'not_started' | 'in_progress' | 'handed_in' | 'returned' | 'marked' | 'shared'

export function workState(sub: { status: string; released_at: string | null } | null | undefined): WorkState {
  if (!sub) return 'not_started'
  if (sub.status === 'in_progress') return 'in_progress'
  if (sub.status === 'submitted') return 'handed_in'
  if (sub.status === 'returned') return 'returned'
  return sub.released_at ? 'shared' : 'marked'
}

export const workStateMeta: Record<WorkState, { label: string; variant: 'muted' | 'outline' | 'default' | 'secondary' | 'success'; className?: string }> = {
  not_started: { label: 'Not started', variant: 'muted' },
  in_progress: { label: 'In progress', variant: 'outline' },
  handed_in: { label: 'Handed in', variant: 'default' },
  returned: { label: 'Returned', variant: 'outline', className: 'border-warning/40 text-warning' },
  marked: { label: 'Marked, not shared', variant: 'secondary' },
  shared: { label: 'Shared', variant: 'success' },
}

export function WorkBadge({ state }: { state: WorkState }) {
  const m = workStateMeta[state]
  return <Badge variant={m.variant} className={m.className}>{m.label}</Badge>
}

export function LateBadge() {
  return <Badge variant="outline" className="border-warning/40 text-warning">Late</Badge>
}

// ── Dates ──────────────────────────────────────────────────────────────────

/** A due date in the viewer's timezone (the server would render UTC). */
export function When({ iso, className }: { iso: string; className?: string }) {
  const d = new Date(iso)
  return (
    <time dateTime={iso} suppressHydrationWarning className={cn('tabular-nums', className)}>
      {d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </time>
  )
}

/** How close a due date is. Colour carries urgency, the words carry it too. */
export function DueIn({ iso }: { iso: string }) {
  const [now] = useState(() => Date.now())
  const ms = new Date(iso).getTime() - now
  const days = Math.ceil(ms / 86400000)
  let text = `Due in ${days} days`
  let tone = 'text-muted-foreground'
  if (ms < 0) { text = 'Overdue'; tone = 'font-semibold text-destructive' }
  else if (days <= 1) { text = 'Due within a day'; tone = 'font-semibold text-warning' }
  return <span suppressHydrationWarning className={tone}>{text}</span>
}

// ── Files ──────────────────────────────────────────────────────────────────

type PreviewKind = 'pdf' | 'image' | 'text' | 'none'

/** What the browser can show in place. Word, Excel, PowerPoint and zip need another app, so they are download-only. */
function previewKind(f: { name: string; content_type: string | null }): PreviewKind {
  const type = (f.content_type ?? '').toLowerCase()
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type) || ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  if (type === 'text/plain' || ext === 'txt') return 'text'
  return 'none'
}

const EXT_LABEL: Record<string, string> = {
  pdf: 'PDF document', png: 'PNG image', jpg: 'JPEG image', jpeg: 'JPEG image', webp: 'WebP image', gif: 'GIF image', txt: 'Text file',
  doc: 'Word document', docx: 'Word document', xls: 'Excel spreadsheet', xlsx: 'Excel spreadsheet',
  ppt: 'PowerPoint presentation', pptx: 'PowerPoint presentation', zip: 'Zip archive',
}

function kindLabel(name: string) {
  return EXT_LABEL[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'File'
}

/** A file opened in a right-hand drawer: shown in place when the browser can, with Open in new tab and Download either way. */
export function FilePreviewDrawer({ file, open, onClose }: { file: AssignmentFile | null; open: boolean; onClose: () => void }) {
  const kind = file ? previewKind(file) : 'none'
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="max-w-3xl"
      title={file?.name ?? 'File'}
      description={file ? `${kindLabel(file.name)} · ${formatBytes(file.size_bytes)}` : undefined}
      bodyClassName="p-0 bg-surface"
      footer={
        file && (
          <div className="flex flex-wrap justify-end gap-2">
            {file.url && (
              <a href={file.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                <ExternalLink className="mr-2 size-4" aria-hidden /> Open in new tab
              </a>
            )}
            {(file.downloadUrl ?? file.url) && (
              <a href={file.downloadUrl ?? file.url} download={file.name} className={buttonVariants()}>
                <Download className="mr-2 size-4" aria-hidden /> Download
              </a>
            )}
          </div>
        )
      }
    >
      {file?.url && kind === 'pdf' && (
        <iframe src={file.url} title={file.name} className="h-full min-h-[60vh] w-full border-0 bg-card" />
      )}
      {file?.url && kind === 'text' && (
        <iframe src={file.url} title={file.name} className="h-full min-h-[60vh] w-full border-0 bg-card" />
      )}
      {file?.url && kind === 'image' && (
        <div className="flex min-h-full items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={file.name} className="max-h-[75vh] w-auto max-w-full rounded-xl border border-border bg-card object-contain" />
        </div>
      )}
      {(!file?.url || kind === 'none') && (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
            <FileQuestion className="size-6 text-primary-text" aria-hidden />
          </span>
          <p className="text-sm font-semibold">{file?.url ? "This kind of file can't be previewed here" : 'The file is not available right now'}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {file?.url
              ? 'Word, Excel, PowerPoint and zip files open in their own app. Download it, or open it in a new tab.'
              : 'Reload the page and try again.'}
          </p>
        </div>
      )}
    </Drawer>
  )
}

/** A list of files. Choosing one opens it in the preview drawer; each row also has a quick download and, when editable, a remove button. */
export function FileList({
  files,
  onRemove,
  removingId,
  empty,
  plain = false,
}: {
  plain?: boolean
  files: AssignmentFile[]
  onRemove?: (id: string) => void
  removingId?: string | null
  empty?: string
}) {
  // The drawer keeps showing its file while it slides out.
  const [shown, setShown] = useState<AssignmentFile | null>(null)
  const [open, setOpen] = useState(false)

  if (!files.length) return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null
  return (
    <>
      <ul className="space-y-2">
        {files.map(f => (
          <li key={f.id} className={cn('flex items-center gap-1 rounded-xl pr-2 transition-colors', plain ? '-mx-3 hover:bg-secondary' : 'border border-border bg-card hover:border-border-strong')}>
            <button
              type="button"
              onClick={() => { setShown(f); setOpen(true) }}
              aria-label={`Preview ${f.name}`}
              className="group/file flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                <FileText className="size-4 text-primary-text" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-primary-text underline decoration-primary-text/35 decoration-1 underline-offset-4 transition-colors group-hover/file:decoration-primary-text" title={f.name}>{f.name}</span>
                <span className="block text-xs tabular-nums text-muted-foreground">
                  {formatBytes(f.size_bytes)} · {previewKind(f) === 'none' ? 'Download to open' : 'Click to preview'}
                </span>
              </span>
            </button>
            {(f.downloadUrl ?? f.url) && (
              <a
                href={f.downloadUrl ?? f.url}
                download={f.name}
                aria-label={`Download ${f.name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-ink-strong focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Download className="size-4" />
              </a>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                disabled={removingId === f.id}
                aria-label={`Remove ${f.name}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-destructive-soft hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                {removingId === f.id ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </button>
            )}
          </li>
        ))}
      </ul>
      <FilePreviewDrawer file={shown} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
