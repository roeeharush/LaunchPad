'use client'

import { useState } from 'react'
import { History as HistoryIcon, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ProfileInputForm } from './profile-input-form'
import { ProfileResults } from './profile-results'
import type { ProfileAnalysisRecord } from '@/types/profile'

interface ProfileGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

export function ProfileGraderClient({ initialRecords }: ProfileGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(initialRecords[0] ?? null)

  function handleResult(record: ProfileAnalysisRecord) {
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id)
      return [record, ...filtered]
    })
    setSelected(record)
  }

  const brandColor = (record: ProfileAnalysisRecord) => {
    const score = record.result_json?.overallBrandScore ?? null
    if (score === null) return 'oklch(0.55 0 0)'
    return score >= 75
      ? 'oklch(0.60 0.17 162)'
      : score >= 50
        ? 'oklch(0.75 0.16 60)'
        : 'oklch(0.62 0.22 27)'
  }

  const usernameFromRecord = (record: ProfileAnalysisRecord): string => {
    try {
      const parsed = JSON.parse(record.input_text ?? '{}') as { githubUsername?: string }
      return parsed.githubUsername ?? '—'
    } catch {
      return '—'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Right panel: input + history (RTL = visual right) */}
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <ProfileInputForm onResult={handleResult} />
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
                const color = brandColor(r)
                const score = r.result_json?.overallBrandScore ?? null
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
                    <div className="flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
                    </div>
                    {score !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          color,
                          background: color.replace(')', ' / 15%)'),
                        }}
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

      {/* Left panel: results */}
      <div className="lg:col-span-3">
        {selected?.result_json ? (
          <ProfileResults analysis={selected.result_json} />
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.58 0.21 291 / 10%)' }}
            >
              <User className="w-8 h-8" style={{ color: 'oklch(0.58 0.21 291)' }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הזן שם משתמש GitHub והדבק טקסט מ-LinkedIn כדי לקבל את ה-Online Brand Score שלך
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
