'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, User, TrendingUp, Briefcase, BookOpen, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NavKey = 'dashboard' | 'resume' | 'profile' | 'trends' | 'jobs' | 'learn'

const navItems: { href: string; icon: typeof LayoutDashboard; key: NavKey }[] = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/resume', icon: FileText, key: 'resume' },
  { href: '/profile', icon: User, key: 'profile' },
  { href: '/trends', icon: TrendingUp, key: 'trends' },
  { href: '/jobs', icon: Briefcase, key: 'jobs' },
  { href: '/learn', icon: BookOpen, key: 'learn' },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-l flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">לאנצ׳פד</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, key }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.includes(href)
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(key)}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          יציאה
        </button>
      </div>
    </aside>
  )
}
