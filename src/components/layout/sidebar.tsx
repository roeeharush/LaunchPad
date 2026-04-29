'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  GitBranch,
  Link2,
  Briefcase,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Wand2,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NavKey =
  | 'dashboard'
  | 'resume'
  | 'githubGrader'
  | 'linkedinGrader'
  | 'trends'
  | 'jobs'
  | 'learn'
  | 'analyzer'
  | 'billing'

const navItems: { href: string; icon: typeof LayoutDashboard; key: NavKey; color: string }[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    key: 'dashboard',
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    href: '/dashboard/resume-analyzer',
    icon: FileText,
    key: 'resume',
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    href: '/dashboard/github-grader',
    icon: GitBranch,
    key: 'githubGrader',
    color: 'oklch(0.58 0.21 291)',
  },
  {
    href: '/dashboard/linkedin-grader',
    icon: Link2,
    key: 'linkedinGrader',
    color: 'oklch(0.58 0.21 291)',
  },

  { href: '/dashboard/job-search', icon: Briefcase, key: 'jobs', color: 'oklch(0.75 0.16 60)' },
  { href: '/dashboard/knowledge-hub', icon: BookOpen, key: 'learn', color: 'oklch(0.65 0.15 211)' },
  { href: '/dashboard/job-analyzer', icon: Wand2, key: 'analyzer', color: 'oklch(0.58 0.21 291)' },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside
      className="w-64 min-h-screen flex flex-col border-l"
      style={{
        background: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: 'oklch(0.585 0.212 264.4)' }}
        >
          L
        </div>
        <span className="font-bold text-base tracking-tight">לאנצ׳פד</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, key, color }) => {
          const isActive =
            href === '/dashboard' ? pathname.endsWith('/dashboard') : pathname.includes(href)
          return (
            <Link
              key={key}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-150',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              style={
                isActive
                  ? {
                      background: `${color.replace(')', ' / 15%)')}`,
                      boxShadow: `inset 0 0 0 1px ${color.replace(')', ' / 25%)')}`,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--sidebar-accent)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = ''
                }
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150"
                style={
                  isActive
                    ? { background: `${color.replace(')', ' / 20%)')}`, color }
                    : { background: 'oklch(1 0 0 / 5%)' }
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{t(key)}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-4 pt-2 border-t space-y-0.5"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        {/* Billing / plan indicator */}
        <Link
          href="/dashboard/billing"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full',
            'transition-all duration-150',
            pathname.includes('/billing')
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={
            pathname.includes('/billing')
              ? {
                  background: 'oklch(0.585 0.212 264.4 / 15%)',
                  boxShadow: 'inset 0 0 0 1px oklch(0.585 0.212 264.4 / 25%)',
                }
              : undefined
          }
          onMouseEnter={(e) => {
            if (!pathname.includes('/billing'))
              e.currentTarget.style.background = 'var(--sidebar-accent)'
          }}
          onMouseLeave={(e) => {
            if (!pathname.includes('/billing')) e.currentTarget.style.background = ''
          }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'oklch(0.585 0.212 264.4 / 15%)',
              color: 'oklch(0.585 0.212 264.4)',
            }}
          >
            <CreditCard className="h-4 w-4" />
          </span>
          <span className="flex-1">{t('billing')}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: 'oklch(0.585 0.212 264.4 / 20%)',
              color: 'oklch(0.585 0.212 264.4)',
            }}
          >
            חינם
          </span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full',
            'text-muted-foreground transition-all duration-150',
            'hover:text-destructive hover:bg-destructive/10'
          )}
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
            <LogOut className="h-4 w-4" />
          </span>
          יציאה
        </button>
      </div>
    </aside>
  )
}
