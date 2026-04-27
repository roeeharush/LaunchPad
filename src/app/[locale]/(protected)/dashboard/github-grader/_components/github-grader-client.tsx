'use client'

import { useState, useTransition, useRef } from 'react'
import { GitBranch, Loader2, History as HistoryIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { ScoreCard } from '@/components/graders/score-card'
import { cn } from '@/lib/utils'
import { analyzeGitHubAction } from '../actions'
import type { ProfileAnalysisRecord, GitHubAnalysis } from '@/types/profile'

const ACCENT = 'oklch(0.58 0.21 291)'

interface GitHubGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

function usernameFromRecord(record: ProfileAnalysisRecord): string {
  try {
    const parsed = JSON.parse(record.input_text ?? '{}') as { githubUsername?: string }
    return parsed.githubUsername ?? '—'
  } catch {
    return '—'
  }
}

function scoreColor(score: number): string {
  return score >= 75
    ? 'oklch(0.60 0.17 162)'
    : score >= 50
      ? 'oklch(0.75 0.16 60)'
      : 'oklch(0.62 0.22 27)'
}

export function GitHubGraderClient({ initialRecords }: GitHubGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(initialRecords[0] ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await analyzeGitHubAction(formData)
      if (res.ok) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== res.record.id)
          return [res.record, ...filtered]
        })
        setSelected(res.record)
        formRef.current?.reset()
        setGithubUsername('')
      } else {
        setError(res.error)
      }
    })
  }

  const analysis = selected?.result_json as GitHubAnalysis | null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium"
                htmlFor="githubUsername"
              >
                <GitBranch className="w-4 h-4" style={{ color: ACCENT }} />
                שם משתמש GitHub
              </label>
              <div className="relative">
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none"
                  aria-hidden
                >
                  @
                </span>
                <input
                  id="githubUsername"
                  name="githubUsername"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username"
                  dir="ltr"
                  autoComplete="off"
                  disabled={isPending}
                  className={cn(
                    'w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm pr-8',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:opacity-50 transition-colors border-border hover:border-border/70'
                  )}
                />
              </div>
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-2.5"
                style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={githubUsername.trim().length === 0 || isPending}
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full gap-2 font-semibold transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              style={
                githubUsername.trim().length > 0 && !isPending
                  ? { background: ACCENT, color: 'oklch(0.98 0 0)' }
                  : {}
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <GitBranch className="w-4 h-4" />
                  נתח GitHub
                </>
              )}
            </button>
          </form>
        </div>

        {records.length > 0 && (
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">ניתוחים קודמים</h2>
            </div>
            <div className="space-y-2">
              {records.map((r) => {
                const gh = r.result_json as GitHubAnalysis | null
                const score = gh?.techScore.score ?? null
                const color = score !== null ? scoreColor(score) : 'oklch(0.55 0 0)'
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      selected?.id === r.id
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="text-right">
                      <p className="text-xs font-medium" dir="ltr">
                        @{usernameFromRecord(r)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </p>
                    </div>
                    {score !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color, background: color.replace(')', ' / 15%)') }}
                      >
                        {score}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-3">
        {analysis?.techScore ? (
          <div className="space-y-5">
            <ScoreCard
              title="Tech Score — GitHub"
              score={analysis.techScore.score}
              strengths={analysis.techScore.strengths}
              improvements={analysis.techScore.improvements}
              color={ACCENT}
            />
            {analysis.topTips.length > 0 && (
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: ACCENT.replace(')', ' / 8%)'),
                  borderColor: ACCENT.replace(')', ' / 20%)'),
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-4"
                  style={{ color: ACCENT }}
                >
                  פעולות עדיפות להגדיל את הסיכוי להתגלות
                </p>
                <ol className="space-y-3">
                  {analysis.topTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: ACCENT.replace(')', ' / 20%)'), color: ACCENT }}
                      >
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: ACCENT.replace(')', ' / 10%)') }}
            >
              <GitBranch className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הזן שם משתמש GitHub לקבלת ניתוח טכני מעמיק
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
