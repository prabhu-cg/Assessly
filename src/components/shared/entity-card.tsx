import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Cards sit side by side and wrap as the viewport widens. */
export function EntityGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>{children}</ul>
}

/** One icon + value pair in a card's metadata row. */
export function EntityMeta({ icon: Icon, children, className }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {children}
    </span>
  )
}

/**
 * Badges and a more-actions slot on top, then title, description, a metadata row and a footer pinned to the bottom so cards in
 * a row line up. With `href` the whole card is one click target (the title link is stretched over it); the `menu` sits above that.
 */
export function EntityCard({
  href,
  title,
  subtitle,
  onTitleClick,
  leading,
  badges,
  description,
  children,
  meta,
  footer,
  menu,
  index = 0,
}: {
  href?: string
  title: string
  subtitle?: ReactNode
  /** Makes the title a button (for cards with no destination page, e.g. open a drawer). */
  onTitleClick?: () => void
  leading?: ReactNode
  badges?: ReactNode
  description?: string | null
  /** Free-form body between the description and the metadata row. */
  children?: ReactNode
  meta?: ReactNode
  footer?: ReactNode
  menu?: ReactNode
  /** Position in the grid; staggers the entrance (capped). */
  index?: number
}) {
  return (
    <li style={{ '--i': index } as React.CSSProperties} className="rise-in group relative flex flex-col rounded-card border bg-surface-raised p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-raised has-focus-visible:ring-3 has-focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-3">
        {leading}
        <div className="min-w-0 flex-1">
          {badges && <div className="mb-2 flex flex-wrap items-center gap-2">{badges}</div>}
          <h3 className="text-base font-semibold leading-snug">
            {href ? (
              <Link href={href} className="line-clamp-2 outline-none after:absolute after:inset-0 after:content-['']">
                {title}
              </Link>
            ) : onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className="line-clamp-2 rounded-sm text-left underline-offset-4 outline-none hover:text-primary-text hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {title}
              </button>
            ) : (
              <span className="line-clamp-2">{title}</span>
            )}
          </h3>
          {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {menu && <div className="relative z-10 -mr-2 -mt-1.5 shrink-0">{menu}</div>}
      </div>

      {description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      {children}
      {meta && <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">{meta}</div>}
      {footer && (
        <div className="mt-auto pt-4">
          <div className="border-t pt-3 text-xs text-muted-foreground">{footer}</div>
        </div>
      )}
    </li>
  )
}
