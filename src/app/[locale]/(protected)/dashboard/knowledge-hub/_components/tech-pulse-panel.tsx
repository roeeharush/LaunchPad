'use client'

import { useTransition, useState } from 'react'
import { Zap, Bookmark, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateTechPulseAction } from '../actions'
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

function TrendCard({
  trend,
  onBookmark,
}: {
  trend: TechTrend
  onBookmark: (title: string, content: string) => void
}) {
  const color = tagColor(trend.tag)
  const bookmarkContent = `${trend.summary}\n\nלמה עכשיו: ${trend.whyNow}\n\nרלוונטיות: ${trend.relevance}`

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
            רלוונטיות:{' '}
          </span>
          <span className="text-muted-foreground">{trend.relevance}</span>
        </p>
      </div>
    </div>
  )
}

export function TechPulsePanel({ onBookmark }: TechPulsePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState<TechPulse | null>(null)
  const [githubUsername, setGithubUsername] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await generateTechPulseAction(formData)
      if (result.ok) {
        setPulse(result.pulse)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none">
            @
          </span>
          <input
            name="githubUsername"
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="שם משתמש GitHub שלך"
            dir="ltr"
            autoComplete="off"
            disabled={isPending}
            className={cn(
              'w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm pr-8',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors border-border'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!githubUsername.trim() || isPending}
          className={cn(
            buttonVariants({ size: 'default' }),
            'gap-2 font-semibold shrink-0',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          style={
            githubUsername.trim() && !isPending
              ? { background: 'oklch(0.65 0.15 211)', color: 'oklch(0.98 0 0)' }
              : {}
          }
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {isPending ? 'מייצר...' : 'Daily Pulse'}
        </button>
      </form>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {pulse && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
            <p className="text-sm font-semibold">
              Daily Tech Pulse עבור{' '}
              <span dir="ltr" className="font-mono">
                @{pulse.username}
              </span>
            </p>
            <span className="text-xs text-muted-foreground">
              ({pulse.topLanguages.slice(0, 3).join(', ')})
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {pulse.trends.map((trend, i) => (
              <TrendCard
                key={i}
                trend={trend}
                onBookmark={(title, content) => onBookmark(title, content, 'trend')}
              />
            ))}
          </div>
        </div>
      )}

      {!pulse && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.65 0.15 211 / 10%)' }}
          >
            <Zap className="w-7 h-7" style={{ color: 'oklch(0.65 0.15 211)' }} />
          </div>
          <p className="font-semibold">הזן שם משתמש GitHub לקבלת הטרנדים שלך</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ינתח את שפות התכנות שלך ויציג 3 טרנדים רלוונטיים להיום
          </p>
        </div>
      )}
    </div>
  )
}
