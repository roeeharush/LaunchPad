'use client'

import { useEffect, useTransition, useState, useCallback } from 'react'
import { TrendingUp, Bookmark, RefreshCw } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateIndustryTrendsAction } from '../actions'
import type { TechPulse, TechTrend } from '@/types/knowledge'

interface TechPulsePanelProps {
  onBookmark: (title: string, content: string, source: 'trend' | 'interview') => void
}

const TAG_COLORS: Record<string, string> = {
  'AI/ML': 'oklch(0.58 0.21 291)',
  Web: 'oklch(0.585 0.212 264.4)',
  Systems: 'oklch(0.60 0.17 162)',
  DevOps: 'oklch(0.75 0.16 60)',
  Security: 'oklch(0.62 0.22 27)',
  Mobile: 'oklch(0.65 0.15 211)',
  Data: 'oklch(0.65 0.18 140)',
}

function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? 'oklch(0.585 0.212 264.4)'
}

function TrendCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 animate-pulse"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-16 rounded-full" style={{ background: 'oklch(1 0 0 / 10%)' }} />
          <div className="h-4 w-3/4 rounded" style={{ background: 'oklch(1 0 0 / 8%)' }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded" style={{ background: 'oklch(1 0 0 / 7%)' }} />
        <div className="h-3 w-5/6 rounded" style={{ background: 'oklch(1 0 0 / 7%)' }} />
        <div className="h-3 w-4/6 rounded" style={{ background: 'oklch(1 0 0 / 7%)' }} />
      </div>
      <div className="pt-1 border-t space-y-1.5" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <div className="h-3 w-2/3 rounded" style={{ background: 'oklch(1 0 0 / 6%)' }} />
        <div className="h-3 w-1/2 rounded" style={{ background: 'oklch(1 0 0 / 6%)' }} />
      </div>
    </div>
  )
}

function TrendCard({
  trend,
  onBookmark,
}: {
  trend: TechTrend
  onBookmark: (title: string, content: string) => void
}) {
  const color = tagColor(trend.tag)
  const bookmarkContent = `${trend.summary}\n\nלמה עכשיו: ${trend.whyNow}\n\nהשפעה: ${trend.impact}`

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 20%)') }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: color.replace(')', ' / 15%)'), color }}
            >
              {trend.tag}
            </span>
          </div>
          <h3 className="font-bold text-base leading-tight">{trend.title}</h3>
        </div>
        <button
          onClick={() => onBookmark(trend.title, bookmarkContent)}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0 px-2 text-muted-foreground hover:text-foreground'
          )}
          title="שמור סימניה"
          aria-label="שמור סימניה"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{trend.summary}</p>

      <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <p className="text-xs">
          <span className="font-semibold" style={{ color }}>
            למה עכשיו:{' '}
          </span>
          <span className="text-muted-foreground">{trend.whyNow}</span>
        </p>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: 'oklch(0.60 0.17 162)' }}>
            השפעה:{' '}
          </span>
          <span className="text-muted-foreground">{trend.impact}</span>
        </p>
      </div>
    </div>
  )
}

export function TechPulsePanel({ onBookmark }: TechPulsePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState<TechPulse | null>(null)

  const loadTrends = useCallback(() => {
    setError(null)
    startTransition(async () => {
      const result = await generateIndustryTrendsAction()
      if (result.ok) {
        setPulse(result.pulse)
      } else {
        setError(result.error)
      }
    })
  }, [startTransition])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTrends()
  }, [loadTrends])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: 'oklch(0.65 0.15 211)' }} />
          <h2 className="font-bold text-lg">מגמות ענף</h2>
          <span className="text-xs text-muted-foreground">AI · תוכנה · טכנולוגיה</span>
        </div>
        <button
          onClick={loadTrends}
          disabled={isPending}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40'
          )}
          title="רענן טרנדים"
        >
          <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
          <span className="text-xs">רענן</span>
        </button>
      </div>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrendCardSkeleton key={i} />
          ))}
        </div>
      )}

      {pulse && !isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pulse.trends.map((trend, i) => (
            <TrendCard
              key={i}
              trend={trend}
              onBookmark={(title, content) => onBookmark(title, content, 'trend')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
