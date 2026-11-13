/** A question's picture, shown above or below its text. Plain <img>: the files come from our storage bucket. */
export function QuestionImage({ src, alt = 'Question illustration', className = '' }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`mt-3 max-h-80 w-auto max-w-full rounded-xl border border-border bg-card object-contain ${className}`}
    />
  )
}
