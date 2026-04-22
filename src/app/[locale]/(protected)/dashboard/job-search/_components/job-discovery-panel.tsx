'use client'

import { useState, useTransition, useMemo } from 'react'
import { Briefcase, Wifi, Sparkles, Loader2, Plus, CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateJobSuggestionsAction, saveApplicationAction } from '../actions'
import type { JobSuggestion, JobSuggestionsResult, JobApplication } from '@/types/jobs'

interface JobDiscoveryPanelProps {
  onApplicationSaved: (application: JobApplication) => void
}

function JobCard({
  job,
  onSave,
  isSaved,
}: {
  job: JobSuggestion
  onSave: (job: JobSuggestion) => void
  isSaved: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 group"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <button
          onClick={() => onSave(job)}
          disabled={isSaved}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0 px-2 gap-1 text-xs',
            isSaved
              ? 'text-emerald-400 cursor-default'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
          aria-label={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
        >
          {isSaved ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: 'oklch(0.60 0.17 162)' }} />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'oklch(1 0 0 / 8%)', color: 'oklch(0.75 0.05 252)' }}
        >
          📍 {job.location}
        </span>
        {job.isRemote && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'oklch(0.65 0.15 211 / 15%)', color: 'oklch(0.65 0.15 211)' }}
          >
            Remote
          </span>
        )}
        {job.isJuniorFriendly && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'oklch(0.60 0.17 162 / 15%)', color: 'oklch(0.60 0.17 162)' }}
          >
            Junior ✓
          </span>
        )}
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1">
        {job.techStack.map((tech) => (
          <span
            key={tech}
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              borderColor: 'oklch(0.75 0.16 60 / 25%)',
              color: 'oklch(0.75 0.16 60)',
              background: 'oklch(0.75 0.16 60 / 8%)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{job.description}</p>

      {/* Match reason */}
      <div className="pt-2 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: 'oklch(0.75 0.16 60)' }}>
            ✦ התאמה:{' '}
          </span>
          <span className="text-muted-foreground">{job.matchReason}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{job.salaryRange}</p>
      </div>
    </div>
  )
}

export function JobDiscoveryPanel({ onApplicationSaved }: JobDiscoveryPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobSuggestionsResult | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [filterRemote, setFilterRemote] = useState(false)
  const [filterJunior, setFilterJunior] = useState(false)
  const [filterTechs, setFilterTechs] = useState<Set<string>>(new Set())

  const allTechs = useMemo(() => {
    if (!result) return []
    const techs = new Set<string>()
    result.jobs.forEach((j) => j.techStack.forEach((t) => techs.add(t)))
    return Array.from(techs).sort()
  }, [result])

  const filteredJobs = useMemo(() => {
    if (!result) return []
    return result.jobs.filter((j) => {
      if (filterRemote && !j.isRemote) return false
      if (filterJunior && !j.isJuniorFriendly) return false
      if (filterTechs.size > 0 && !j.techStack.some((t) => filterTechs.has(t))) return false
      return true
    })
  }, [result, filterRemote, filterJunior, filterTechs])

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await generateJobSuggestionsAction()
      if (res.ok) {
        setResult(res.result)
        setFilterRemote(false)
        setFilterJunior(false)
        setFilterTechs(new Set())
        setSavedIds(new Set())
      } else {
        setError(res.error)
      }
    })
  }

  function toggleTech(tech: string) {
    setFilterTechs((prev) => {
      const next = new Set(prev)
      if (next.has(tech)) next.delete(tech)
      else next.add(tech)
      return next
    })
  }

  function handleSave(job: JobSuggestion) {
    if (savedIds.has(job.id)) return
    const formData = new FormData()
    formData.set('job_title', job.title)
    formData.set('company', job.company)
    formData.set('location', job.location)
    formData.set('is_remote', String(job.isRemote))
    formData.set('tech_stack', JSON.stringify(job.techStack))
    startSaveTransition(async () => {
      const res = await saveApplicationAction(formData)
      if (res.ok) {
        setSavedIds((prev) => new Set([...prev, job.id]))
        onApplicationSaved(res.application)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Generate button */}
      <div className="flex items-start gap-4">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className={cn(
            buttonVariants({ size: 'default' }),
            'gap-2 font-semibold shrink-0',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          style={
            !isPending ? { background: 'oklch(0.75 0.16 60)', color: 'oklch(0.15 0.02 60)' } : {}
          }
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isPending ? 'מחפש משרות...' : 'מצא משרות מתאימות'}
        </button>
        {result && (
          <p className="text-xs text-muted-foreground pt-2.5">
            בהתאם ל: <span className="font-medium">{result.basedOn}</span>
          </p>
        )}
      </div>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {/* Filters */}
      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">סינון:</span>
            <button
              onClick={() => setFilterRemote((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium',
                filterRemote
                  ? 'border-sky-400/50 text-sky-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
              style={filterRemote ? { background: 'oklch(0.65 0.15 211 / 15%)' } : {}}
            >
              <Wifi className="w-3 h-3" />
              Remote בלבד
            </button>
            <button
              onClick={() => setFilterJunior((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium',
                filterJunior
                  ? 'border-emerald-400/50 text-emerald-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
              style={filterJunior ? { background: 'oklch(0.60 0.17 162 / 15%)' } : {}}
            >
              Junior בלבד
            </button>
          </div>

          {allTechs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTechs.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-all duration-150',
                    filterTechs.has(tech)
                      ? 'border-amber-400/50 font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                  style={
                    filterTechs.has(tech)
                      ? { background: 'oklch(0.75 0.16 60 / 15%)', color: 'oklch(0.75 0.16 60)' }
                      : {}
                  }
                >
                  {tech}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredJobs.length} מתוך {result.jobs.length} משרות
          </p>
        </div>
      )}

      {/* Job cards grid */}
      {filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={handleSave}
              isSaved={savedIds.has(job.id) || isSaving}
            />
          ))}
        </div>
      )}

      {result && filteredJobs.length === 0 && (
        <div
          className="rounded-2xl p-8 border text-center"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <p className="font-semibold mb-1">אין משרות מתאימות לסינון הנוכחי</p>
          <p className="text-muted-foreground text-sm">נסה להסיר אחד מהמסננים</p>
        </div>
      )}

      {!result && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.75 0.16 60 / 10%)' }}
          >
            <Briefcase className="w-7 h-7" style={{ color: 'oklch(0.75 0.16 60)' }} />
          </div>
          <p className="font-semibold">גלה משרות מותאמות לפרופיל שלך</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ינתח את קורות החיים שהעלית ויציע 10 משרות רלוונטיות בתעשיית ההייטק הישראלית
          </p>
        </div>
      )}
    </div>
  )
}
