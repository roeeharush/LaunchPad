'use client'

import { useState, useTransition } from 'react'
import { Link2, Loader2, History as HistoryIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { ScoreCard } from '@/components/graders/score-card'
import { cn } from '@/lib/utils'
import { analyzeLinkedInAction } from '../actions'
import type { ProfileAnalysisRecord, LinkedInAnalysis } from '@/types/profile'

const ACCENT = 'oklch(0.65 0.15 211)'

const GUIDE_STEPS = [
  'כנסו לפרופיל שלכם ולחצו על כפתור ה-More.',
  'בחרו ב-Save to PDF (זה שומר את כל הניסיון שלכם בקובץ אחד).',
  'העתיקו את הטקסט מהקובץ והדביקו כאן.',
]

interface LinkedInGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

function previewFromRecord(record: ProfileAnalysisRecord): string {
  try {
    const parsed = JSON.parse(record.input_text ?? '{}') as { linkedinText?: string }
    return parsed.linkedinText?.slice(0, 30) ?? '—'
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

export function LinkedInGraderClient({ initialRecords }: LinkedInGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(initialRecords[0] ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [linkedinText, setLinkedinText] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await analyzeLinkedInAction(formData)
      if (res.ok) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== res.record.id)
          return [res.record, ...filtered]
        })
        setSelected(res.record)
        setLinkedinText('')
      } else {
        setError(res.error)
      }
    })
  }

  const analysis = selected?.result_json as LinkedInAnalysis | null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  className="flex items-center gap-2 text-sm font-medium"
                  htmlFor="linkedinText"
                >
                  <Link2 className="w-4 h-4" style={{ color: ACCENT }} />
                  טקסט LinkedIn
                </label>
                <button
                  type="button"
                  onClick={() => setGuideOpen((o) => !o)}
                  className="text-xs font-medium transition-opacity duration-150 opacity-70 hover:opacity-100"
                  style={{ color: ACCENT }}
                >
                  {guideOpen ? '✕ סגור' : 'איך להעתיק את הפרופיל ב-10 שניות? ⚡'}
                </button>
              </div>

              {guideOpen && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{
                    background: ACCENT.replace(')', ' / 8%)'),
                    border: `1px solid ${ACCENT.replace(')', ' / 22%)')}`,
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: ACCENT }}>
                    3 שלבים פשוטים:
                  </p>
                  {GUIDE_STEPS.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{
                          background: ACCENT.replace(')', ' / 22%)'),
                          color: ACCENT,
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: 'oklch(0.82 0.01 252)' }}
                      >
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                העתק והדבק את קטע ה-About ו/או ה-Experience מפרופיל ה-LinkedIn שלך
              </p>
              <textarea
                id="linkedinText"
                name="linkedinText"
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="אני מפתח תוכנה בשנה השלישית להנדסה... (מינימום 30 תווים)"
                rows={7}
                disabled={isPending}
                className={cn(
                  'w-full rounded-xl border bg-transparent px-4 py-3 text-sm resize-none',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  'disabled:opacity-50 transition-colors border-border hover:border-border/70'
                )}
              />
              <p
                className="text-xs text-left"
                style={{
                  color: linkedinText.length < 30 ? 'oklch(0.62 0.22 27)' : 'oklch(0.60 0.17 162)',
                }}
              >
                {linkedinText.length} / 30 תווים מינימום
              </p>
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
              disabled={linkedinText.trim().length < 30 || isPending}
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full gap-2 font-semibold transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              style={
                linkedinText.trim().length >= 30 && !isPending
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
                  <Link2 className="w-4 h-4" />
                  נתח LinkedIn
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
                const li = r.result_json as LinkedInAnalysis | null
                const score = li?.professionalScore.score ?? null
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
                      <p className="text-xs font-medium truncate max-w-[130px]">
                        {previewFromRecord(r)}...
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
        {analysis?.professionalScore ? (
          <div className="space-y-5">
            <ScoreCard
              title="Professional Score — LinkedIn"
              score={analysis.professionalScore.score}
              strengths={analysis.professionalScore.strengths}
              improvements={analysis.professionalScore.improvements}
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
              <Link2 className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הדבק טקסט מפרופיל ה-LinkedIn שלך לקבלת ניתוח מקצועי
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
