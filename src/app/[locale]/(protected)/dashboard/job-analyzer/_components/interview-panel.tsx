'use client'

import { useState } from 'react'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyzerInterviewQuestion } from '@/types/job-analyzer'

interface InterviewPanelProps {
  interviewQuestions: AnalyzerInterviewQuestion[]
}

const QUESTION_COLOR = 'oklch(0.58 0.21 291)'

function QuestionCard({ qa, index }: { qa: AnalyzerInterviewQuestion; index: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'var(--card)',
        borderColor: open ? QUESTION_COLOR.replace(')', ' / 30%)') : 'oklch(1 0 0 / 9%)',
      }}
    >
      {/* Question header (always visible) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-5 text-right hover:bg-white/[0.02] transition-colors duration-150"
      >
        {/* Question number */}
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{
            background: QUESTION_COLOR.replace(')', ' / 15%)'),
            color: QUESTION_COLOR,
          }}
        >
          {index + 1}
        </span>

        <span className="flex-1 text-sm font-semibold leading-snug text-right">{qa.question}</span>

        <ChevronDown
          className={cn(
            'w-4 h-4 shrink-0 mt-0.5 transition-transform duration-200 text-muted-foreground',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Answer + tip (expanded) */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
          <p className="text-sm leading-relaxed pt-4 text-muted-foreground">{qa.answer}</p>

          <div
            className="rounded-xl px-3 py-2.5 flex items-start gap-2"
            style={{ background: 'oklch(0.75 0.16 60 / 10%)' }}
          >
            <Lightbulb
              className="w-3.5 h-3.5 shrink-0 mt-0.5"
              style={{ color: 'oklch(0.75 0.16 60)' }}
            />
            <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.75 0.16 60)' }}>
              {qa.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export function InterviewPanel({ interviewQuestions }: InterviewPanelProps) {
  return (
    <div className="space-y-3">
      {interviewQuestions.map((qa, i) => (
        <QuestionCard key={i} qa={qa} index={i} />
      ))}
    </div>
  )
}
