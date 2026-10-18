import type { ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/shared/breadcrumbs'

/** Title, description and the page's primary actions. Actions sit top right (below the text on phones). */
export function PageHeader({
  title,
  badges,
  description,
  actions,
  breadcrumbs,
}: {
  title: string
  badges?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** The parent chain down to this page. Leave off on top-level pages. */
  breadcrumbs?: BreadcrumbItem[]
}) {
  return (
    <div>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-3" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badges}
          </div>
          {description && <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
