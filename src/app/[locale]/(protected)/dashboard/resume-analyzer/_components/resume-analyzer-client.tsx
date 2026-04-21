'use client'

import { useState } from 'react'
import { History as HistoryIcon, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { UploadForm } from './upload-form'
import { AnalysisResults } from './analysis-results'
import type { ResumeRecord } from '@/types/resume'

interface ResumeAnalyzerClientProps {
  initialRecords: ResumeRecord[]
}

export function ResumeAnalyzerClient({ initialRecords }: ResumeAnalyzerClientProps) {
  const [records, setRecords] = useState<ResumeRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ResumeRecord | null>(initialRecords[0] ?? null)

  function handleResult(record: ResumeRecord) {
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id)
      return [record, ...filtered]
    })
    setSelected(record)
  }

  const scoreColor = (score: number | null) =>
    score === null
      ? 'oklch(0.55 0 0)'
      : score >= 75
        ? 'oklch(0.60 0.17 162)'
        : score >= 50
          ? 'oklch(0.75 0.16 60)'
          : 'oklch(0.62 0.22 27)'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Right panel: upload + history (RTL = visual right) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upload card */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <UploadForm onResult={handleResult} />
        </div>

        {/* History */}
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
              {records.map((r) => (
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
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: he })}
                    </span>
                  </div>
                  {r.score !== null && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: scoreColor(r.score),
                        background: `${scoreColor(r.score).replace(')', ' / 15%)')}`,
                      }}
                    >
                      {r.score}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Left panel: results */}
      <div className="lg:col-span-3">
        {selected?.analysis_json ? (
          <AnalysisResults analysis={selected.analysis_json} />
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.585 0.212 264.4 / 10%)' }}
            >
              <FileText className="w-8 h-8" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                העלה קורות חיים והדבק תיאור משרה כדי לקבל ניתוח מותאם אישית
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
