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
  NotebookPen,
} from 'lucide-react'

export const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/tests', label: 'Tests', icon: FileText },
  { href: '/teacher/assignments', label: 'Assignments', icon: NotebookPen },
  { href: '/teacher/students', label: 'Students', icon: Users },
  { href: '/teacher/submissions', label: 'Submissions', icon: ClipboardList },
]

const studentLinks = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/assignments', label: 'Assignments', icon: NotebookPen },
  { href: '/student/join', label: 'Join Test', icon: LogIn },
]

interface SidebarProps {
  role: 'teacher' | 'student'
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const links = role === 'teacher' ? teacherLinks : studentLinks

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-background min-h-[calc(100vh-3.5rem)]">
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
