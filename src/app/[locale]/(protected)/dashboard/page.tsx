import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FileText, User, TrendingUp, Briefcase, BookOpen, ArrowLeft, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const modules = [
  {
    href: '/resume',
    icon: FileText,
    titleKey: 'resume',
    descKey: 'noAnalysis',
    color: 'oklch(0.585 0.212 264.4)',
    bg: 'oklch(0.585 0.212 264.4 / 12%)',
    border: 'oklch(0.585 0.212 264.4 / 25%)',
    glow: 'oklch(0.585 0.212 264.4 / 20%)',
  },
  {
    href: '/profile',
    icon: User,
    titleKey: 'profile',
    descKey: 'noAnalysis',
    color: 'oklch(0.58 0.21 291)',
    bg: 'oklch(0.58 0.21 291 / 12%)',
    border: 'oklch(0.58 0.21 291 / 25%)',
    glow: 'oklch(0.58 0.21 291 / 20%)',
  },
  {
    href: '/trends',
    icon: TrendingUp,
    titleKey: 'trends',
    descKey: 'noAnalysis',
    color: 'oklch(0.60 0.17 162)',
    bg: 'oklch(0.60 0.17 162 / 12%)',
    border: 'oklch(0.60 0.17 162 / 25%)',
    glow: 'oklch(0.60 0.17 162 / 20%)',
  },
  {
    href: '/jobs',
    icon: Briefcase,
    titleKey: 'jobs',
    descKey: 'noAnalysis',
    color: 'oklch(0.75 0.16 60)',
    bg: 'oklch(0.75 0.16 60 / 12%)',
    border: 'oklch(0.75 0.16 60 / 25%)',
    glow: 'oklch(0.75 0.16 60 / 20%)',
  },
  {
    href: '/learn',
    icon: BookOpen,
    titleKey: 'learn',
    descKey: 'noAnalysis',
    color: 'oklch(0.65 0.15 211)',
    bg: 'oklch(0.65 0.15 211 / 12%)',
    border: 'oklch(0.65 0.15 211 / 25%)',
    glow: 'oklch(0.65 0.15 211 / 20%)',
  },
] as const

export default function DashboardPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-ambient">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
          <span>מוכן להמריא?</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text-bright">
          {t('dashboard.welcome')}
        </h1>
        <p className="text-muted-foreground mt-2 text-base">בחר כלי להתחיל לבנות את הקריירה שלך</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modules.map(({ href, icon: Icon, titleKey, color, bg, border, glow }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'group relative rounded-2xl p-6 flex flex-col gap-5 border',
              'card-hover cursor-pointer no-underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            style={{
              background: 'var(--card)',
              borderColor: border,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 32px ${glow}, 0 0 0 1px ${border}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = ''
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ background: bg }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>

            {/* Text */}
            <div className="flex-1">
              <h2
                className="font-semibold text-lg leading-tight mb-1.5"
                style={{ color: 'oklch(0.93 0.008 252)' }}
              >
                {t(`nav.${titleKey}`)}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('dashboard.noAnalysis')}
              </p>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1.5 px-0 font-medium transition-all duration-150',
                  'group-hover:gap-2.5'
                )}
                style={{ color }}
              >
                {t('dashboard.startNow')}
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              </span>

              {/* Status badge */}
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  background: bg,
                  color,
                }}
              >
                חדש
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom hint */}
      <p className="text-muted-foreground text-xs text-center mt-12">
        כל הנתונים שלך מוגנים ומאובטחים ✦ LaunchPad
      </p>
    </div>
  )
}
