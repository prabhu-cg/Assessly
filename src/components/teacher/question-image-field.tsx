'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

/**
 * Picture picker for a question: click to choose, drag a file in, or paste a screenshot.
 * Pasting is handled by the parent form (so it works wherever focus is); this component only shows the state.
 */
export function QuestionImageField({
  value,
  uploading,
  onFile,
  onRemove,
}: {
  value: string | null
  uploading: boolean
  onFile: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />

      {value ? (
        <div className="relative w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Question illustration" className="max-h-56 w-auto max-w-full rounded-xl border border-border bg-card object-contain" />
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70">
              <Loader2 className="size-5 animate-spin text-primary-text" />
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Remove image"
            className="absolute -right-2 -top-2 bg-background"
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files?.[0]
            if (f) onFile(f)
          }}
          disabled={uploading}
          className={cn(
            'flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border-strong bg-card px-4 py-5 text-center outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50',
            dragging && 'border-primary bg-primary-soft',
          )}
        >
          {uploading ? <Loader2 className="size-5 animate-spin text-primary-text" /> : <ImagePlus className="size-5 text-primary-text" />}
          <span className="text-sm font-semibold text-ink-strong">{uploading ? 'Uploading…' : 'Add an image'}</span>
          <span className="text-xs text-muted-foreground">Choose a file, drag one in, or paste a screenshot (⌘V / Ctrl+V)</span>
        </button>
      )}
      <ul className="space-y-0.5 text-xs text-muted-foreground">
        <li>You can paste a screenshot straight from your clipboard anywhere in this form.</li>
        <li>PNG, JPG, WebP or GIF, up to 5 MB. Large PNG and JPG images are resized automatically; GIFs are not.</li>
        <li>{value ? 'One image per question. Remove this one to add a different image.' : 'One image per question.'}</li>
      </ul>
    </div>
  )
}
