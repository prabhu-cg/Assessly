'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  BookOpen,
  LogIn,
} from 'lucide-react'

const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/tests', label: 'Tests', icon: FileText },
  { href: '/teacher/students', label: 'Students', icon: Users },
  { href: '/teacher/submissions', label: 'Submissions', icon: ClipboardList },
]

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/join', label: 'Join Test', icon: LogIn },
]

interface SidebarProps {
  role: 'teacher' | 'student'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = role === 'teacher' ? teacherLinks : studentLinks

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)]">
      <nav className="flex flex-col gap-1 p-3 pt-4">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function MobileNav({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = role === 'teacher' ? teacherLinks : studentLinks

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
