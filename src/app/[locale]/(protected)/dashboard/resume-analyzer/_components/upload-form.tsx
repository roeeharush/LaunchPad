'use client'

import { useState, useRef, useTransition, type DragEvent } from 'react'
import { Upload, FileText, Loader2, Briefcase, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { analyzeResumeAction, type AnalyzeResult } from '../actions'
import type { ResumeRecord } from '@/types/resume'

interface UploadFormProps {
  onResult: (record: ResumeRecord) => void
  /** Pre-fills and hides the job description field — used when calling from outside the resume analyzer (e.g. Job Search modal) */
  hiddenJobDescription?: string
}

export function UploadForm({ onResult, hiddenJobDescription }: UploadFormProps) {
  const [isPending, startTransition] = useTransition()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState(hiddenJobDescription ?? '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setError(null)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  function clearFile(e: React.MouseEvent) {
    e.stopPropagation()
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file || isPending) return

    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('jobDescription', jobDescription)

    startTransition(async () => {
      const result: AnalyzeResult = await analyzeResumeAction(formData)
      if (result.ok) {
        onResult(result.record)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
          file
            ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default'
            : dragging
              ? 'border-primary bg-primary/8 cursor-copy scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-primary/4 cursor-pointer'
        )}
        style={
          dragging
            ? {
                boxShadow:
                  '0 0 0 1px oklch(0.585 0.212 264.4 / 30%), 0 0 24px oklch(0.585 0.212 264.4 / 15%)',
              }
            : undefined
        }
        role={file ? undefined : 'button'}
        aria-label={file ? undefined : 'העלה קורות חיים'}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'oklch(0.60 0.17 162 / 15%)' }}
              >
                <FileText className="w-5 h-5" style={{ color: 'oklch(0.60 0.17 162)' }} />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium truncate max-w-[180px]">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(0.585 0.212 264.4 / 12%)' }}
            >
              <Upload className="w-6 h-6" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
            </div>
            <div>
              <p className="font-medium text-sm">גרור ושחרר קורות חיים כאן</p>
              <p className="text-xs text-muted-foreground mt-1">PDF או DOCX · עד 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Job Description — hidden when a default is injected by the caller */}
      {!hiddenJobDescription && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
            תיאור המשרה
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="הדבק כאן את תיאור המשרה המלא — דרישות, כישורים, תפקידים..."
            rows={6}
            className={cn(
              'w-full rounded-xl px-4 py-3 text-sm resize-none',
              'bg-card border border-border',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'transition-all duration-150'
            )}
            dir="rtl"
          />
          <p className="text-xs text-muted-foreground text-start">
            {jobDescription.length} תווים{jobDescription.length < 20 ? ' (מינימום 20)' : ''}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: 'oklch(0.62 0.22 27 / 12%)',
            color: 'oklch(0.75 0.18 27)',
            border: '1px solid oklch(0.62 0.22 27 / 25%)',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full gap-2 font-semibold"
        disabled={
          !file || (!hiddenJobDescription && jobDescription.trim().length < 20) || isPending
        }
        style={
          !isPending
            ? {
                background: 'oklch(0.585 0.212 264.4)',
                boxShadow: '0 4px 24px oklch(0.585 0.212 264.4 / 30%)',
              }
            : undefined
        }
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            מנתח את קורות החיים...
          </>
        ) : (
          'נתח קורות חיים'
        )}
      </Button>
    </form>
  )
}
