'use client'

import { useState, useTransition } from 'react'
import { Wand2, Loader2, FileText, Star, MessageSquare } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { analyzeJobListingAction } from '../actions'
import { CoverLetterPanel } from './cover-letter-panel'
import { SkillsPanel } from './skills-panel'
import { InterviewPanel } from './interview-panel'
import type { JobAnalysisResult } from '@/types/job-analyzer'

const ACCENT = 'oklch(0.58 0.21 291)'

const TAB_CONFIG = [
  { value: 'cover', label: 'מכתב פנייה', icon: FileText, color: ACCENT },
  { value: 'skills', label: '5 כישורים קריטיים', icon: Star, color: 'oklch(0.75 0.16 60)' },
  { value: 'interview', label: 'שאלות ראיון', icon: MessageSquare, color: 'oklch(0.60 0.17 162)' },
]

export function JobAnalyzerClient() {
  const [isPending, startTransition] = useTransition()
  const [jobText, setJobText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobAnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState('cover')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData()
    formData.set('job_listing', jobText)
    startTransition(async () => {
      const res = await analyzeJobListingAction(formData)
      if (res.ok) {
        setResult(res.result)
        setActiveTab('cover')
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="job_listing"
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          placeholder="הדבק כאן את תיאור המשרה המלא..."
          rows={10}
          disabled={isPending}
          dir="auto"
          className={cn(
            'w-full rounded-2xl border bg-transparent px-5 py-4 text-sm leading-relaxed resize-none',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2',
            'disabled:opacity-50 transition-colors border-border'
          )}
          style={{ '--tw-ring-color': ACCENT.replace(')', ' / 40%)') } as React.CSSProperties}
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={jobText.trim().length < 50 || isPending}
            className={cn(
              buttonVariants({ size: 'default' }),
              'gap-2 font-semibold',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            style={
              jobText.trim().length >= 50 && !isPending
                ? { background: ACCENT, color: 'oklch(0.98 0 0)' }
                : {}
            }
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isPending ? 'מנתח...' : 'נתח משרה'}
          </button>

          {jobText.trim().length > 0 && jobText.trim().length < 50 && (
            <p className="text-xs text-muted-foreground">
              נדרשים לפחות 50 תווים ({jobText.trim().length}/50)
            </p>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {/* Result: match summary + tabs */}
      {result && (
        <div className="space-y-6">
          {/* Match summary */}
          <div
            className="rounded-2xl border px-5 py-4 flex items-start gap-3"
            style={{
              background: ACCENT.replace(')', ' / 8%)'),
              borderColor: ACCENT.replace(')', ' / 20%)'),
            }}
          >
            <Wand2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <p className="text-sm leading-relaxed">{result.resumeMatchSummary}</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 h-auto p-1 gap-1 bg-card border border-border/50 rounded-2xl w-full sm:w-auto">
              {TAB_CONFIG.map(({ value, label, icon: Icon, color }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    'data-active:text-foreground text-muted-foreground'
                  )}
                  style={
                    activeTab === value
                      ? { background: color.replace(')', ' / 15%)'), color }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="cover">
              <CoverLetterPanel
                coverLetterHe={result.coverLetterHe}
                coverLetterEn={result.coverLetterEn}
              />
            </TabsContent>

            <TabsContent value="skills">
              <SkillsPanel criticalSkills={result.criticalSkills} />
            </TabsContent>

            <TabsContent value="interview">
              <InterviewPanel interviewQuestions={result.interviewQuestions} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty state */}
      {!result && !isPending && !error && (
        <div
          className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: ACCENT.replace(')', ' / 10%)') }}
          >
            <Wand2 className="w-8 h-8" style={{ color: ACCENT }} />
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-lg">המאמן האישי שלך לחיפוש עבודה</p>
            <p className="text-muted-foreground text-sm max-w-sm">
              הדבק מודעת עבודה וקבל מכתב פנייה מותאם, 5 כישורים קריטיים ו-3 שאלות ראיון עם תשובות
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
