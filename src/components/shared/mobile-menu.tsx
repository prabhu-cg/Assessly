'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Drawer } from '@/components/shared/drawer'
import { LogoMark } from '@/components/shared/logo'

export type MenuLink = { href: string; label: string; icon: LucideIcon }

/**
 * The phone navigation: a hamburger pill in the top bar that opens the app's links in a left-hand sheet
 * (desk ground, same drawer treatment as every other sheet). It closes when a link is chosen, on Escape or scrim,
 * and by itself when the window grows past `above`, where the permanent navigation takes over.
 */
export function MobileMenu({
  links,
  label,
  above,
  className,
}: {
  links: MenuLink[]
  /** Accessible name of the navigation, e.g. "Teacher". */
  label: string
  /** Width in px at which the regular navigation appears and this menu is no longer needed. */
  above: number
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const id = useId()

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${above}px)`)
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [above])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="dialog"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-ink-strong outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]',
          className,
        )}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        width="max-w-[18rem]"
        ariaLabel={`${label} menu`}
        bodyClassName="px-3 py-4"
        title={
          <span id={id} className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-auto" />
            Assessly
          </span>
        }
      >
        <nav aria-label={label} className="flex flex-col gap-1">
          {links.map(({ href, label: text, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-3 rounded-full px-4 text-base outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                  active
                    ? 'bg-primary-soft font-semibold text-primary-text'
                    : 'font-medium text-muted-foreground hover:bg-secondary hover:text-ink-strong',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {text}
              </Link>
            )
          })}
        </nav>
      </Drawer>
    </>
  )
}
