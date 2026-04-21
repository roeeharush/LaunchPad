'use client'

import { useTransition, useState, useRef } from 'react'
import { Github, Linkedin, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { analyzeProfileAction } from '../actions'
import type { ProfileAnalysisRecord } from '@/types/profile'

interface ProfileInputFormProps {
  onResult: (record: ProfileAnalysisRecord) => void
}

export function ProfileInputForm({ onResult }: ProfileInputFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [linkedinText, setLinkedinText] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await analyzeProfileAction(formData)
      if (result.ok) {
        onResult(result.record)
        formRef.current?.reset()
        setGithubUsername('')
        setLinkedinText('')
      } else {
        setError(result.error)
      }
    })
  }

  const canSubmit =
    githubUsername.trim().length > 0 && linkedinText.trim().length >= 30 && !isPending

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* GitHub Username */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor="githubUsername">
          <Github className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
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
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors',
              'border-border hover:border-border/70'
            )}
          />
        </div>
      </div>

      {/* LinkedIn Text */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor="linkedinText">
          <Linkedin className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          טקסט LinkedIn
        </label>
        <p className="text-xs text-muted-foreground">
          העתק והדבק את קטע ה-About ו/או ה-Experience מפרופיל ה-LinkedIn שלך
        </p>
        <textarea
          id="linkedinText"
          name="linkedinText"
          value={linkedinText}
          onChange={(e) => setLinkedinText(e.target.value)}
          placeholder="אני מפתח תוכנה בשנה השלישית להנדסה... (מינימום 30 תווים)"
          rows={6}
          disabled={isPending}
          className={cn(
            'w-full rounded-xl border bg-transparent px-4 py-3 text-sm resize-none',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 transition-colors',
            'border-border hover:border-border/70'
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
        disabled={!canSubmit}
        className={cn(
          buttonVariants({ size: 'default' }),
          'w-full gap-2 font-semibold transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        style={canSubmit ? { background: 'oklch(0.58 0.21 291)', color: 'oklch(0.98 0 0)' } : {}}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            מנתח פרופיל...
          </>
        ) : (
          'נתח את הפרופיל שלי'
        )}
      </button>
    </form>
  )
}
