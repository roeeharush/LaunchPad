'use client'

import { useTransition, useState } from 'react'
import { GraduationCap, Bookmark, Loader2, ChevronDown } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateInterviewPrepAction } from '../actions'
import type { InterviewPrepResult, InterviewQA } from '@/types/knowledge'

interface InterviewPrepPanelProps {
  onBookmark: (title: string, content: string, source: 'trend' | 'interview') => void
}

const CATEGORIES = [
  {
    id: 'frontend',
    label: 'פרונט-אנד',
    color: 'oklch(0.585 0.212 264.4)',
    topics: ['React Hooks', 'TypeScript Generics', 'CSS & DOM', 'Web Performance'],
  },
  {
    id: 'backend',
    label: 'בק-אנד',
    color: 'oklch(0.60 0.17 162)',
    topics: ['Node.js Event Loop', 'REST vs GraphQL', 'SQL Joins', 'Database Design'],
  },
  {
    id: 'system-design',
    label: 'System Design',
    color: 'oklch(0.58 0.21 291)',
    topics: ['System Design Basics', 'Microservices', 'Caching Strategies', 'Load Balancing'],
  },
  {
    id: 'algorithms',
    label: 'אלגוריתמים',
    color: 'oklch(0.75 0.16 60)',
    topics: ['Data Structures', 'Sorting Algorithms', 'Dynamic Programming', 'Graph Algorithms'],
  },
  {
    id: 'devops',
    label: 'DevOps',
    color: 'oklch(0.65 0.18 140)',
    topics: ['Docker Basics', 'Git Workflow', 'CI/CD Pipelines', 'Cloud Basics'],
  },
  {
    id: 'behavioral',
    label: 'Behavioral',
    color: 'oklch(0.62 0.22 27)',
    topics: ['STAR Method', 'Leadership Stories', 'Conflict Resolution', 'Teamwork'],
  },
]

const DIFFICULTY_CONFIG = {
  easy: { label: 'קל', color: 'oklch(0.60 0.17 162)' },
  medium: { label: 'בינוני', color: 'oklch(0.75 0.16 60)' },
  hard: { label: 'קשה', color: 'oklch(0.62 0.22 27)' },
}

function QACard({
  qa,
  index,
  onBookmark,
}: {
  qa: InterviewQA
  index: number
  onBookmark: (title: string, content: string) => void
}) {
  const [open, setOpen] = useState(false)
  const diff = DIFFICULTY_CONFIG[qa.difficulty]
  const bookmarkContent = `שאלה: ${qa.question}\n\nתשובה: ${qa.answer}`

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-start gap-3 text-right hover:bg-white/[0.03] transition-colors"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 15%)',
            color: 'oklch(0.585 0.212 264.4)',
          }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: diff.color.replace(')', ' / 15%)'), color: diff.color }}
            >
              {diff.label}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{qa.question}</p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-4 pt-2 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{qa.answer}</p>
          <button
            onClick={() => onBookmark(`Q: ${qa.question.slice(0, 60)}`, bookmarkContent)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1.5 text-muted-foreground hover:text-foreground px-2'
            )}
          >
            <Bookmark className="w-3.5 h-3.5" />
            שמור סימניה
          </button>
        </div>
      )}
    </div>
  )
}

export function InterviewPrepPanel({ onBookmark }: InterviewPrepPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [prepResult, setPrepResult] = useState<InterviewPrepResult | null>(null)
  const [topic, setTopic] = useState('')
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]!.id)

  // activeCategory is always set to a valid category id, so find will never return undefined

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory)!

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await generateInterviewPrepAction(formData)
      if (result.ok) {
        setPrepResult(result.result)
      } else {
        setError(result.error)
      }
    })
  }

  function handleQuickTopic(t: string) {
    setTopic(t)
  }

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id)
                setTopic('')
              }}
              className="text-sm px-4 py-2 rounded-xl border font-medium transition-all duration-150"
              style={
                isActive
                  ? {
                      background: cat.color.replace(')', ' / 15%)'),
                      borderColor: cat.color.replace(')', ' / 40%)'),
                      color: cat.color,
                    }
                  : { borderColor: 'oklch(1 0 0 / 12%)', color: 'oklch(0.7 0 0)' }
              }
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic chips for active category */}
        <div className="flex flex-wrap gap-2">
          {currentCategory.topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleQuickTopic(t)}
              disabled={isPending}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                topic === t
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/70'
              )}
              style={
                topic === t
                  ? {
                      background: currentCategory.color.replace(')', ' / 15%)'),
                      borderColor: currentCategory.color.replace(')', ' / 40%)'),
                      color: currentCategory.color,
                    }
                  : {}
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Free-text input + submit */}
        <div className="flex gap-3">
          <input
            name="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="הזן נושא — לדוג׳: React Hooks, SQL Joins, System Design"
            disabled={isPending}
            className={cn(
              'flex-1 rounded-xl border bg-transparent px-4 py-2.5 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors border-border'
            )}
          />
          <button
            type="submit"
            disabled={!topic.trim() || isPending}
            className={cn(
              buttonVariants({ size: 'default' }),
              'gap-2 font-semibold shrink-0',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            style={
              topic.trim() && !isPending
                ? { background: currentCategory.color, color: 'oklch(0.98 0 0)' }
                : {}
            }
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            {isPending ? 'מייצר...' : 'צור שאלות'}
          </button>
        </div>
      </form>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {prepResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: currentCategory.color }} />
            <p className="text-sm font-semibold">
              {prepResult.questions.length} שאלות ראיון על{' '}
              <span style={{ color: currentCategory.color }}>{prepResult.topic}</span>
            </p>
          </div>
          <div className="space-y-2">
            {prepResult.questions.map((qa, i) => (
              <QACard
                key={i}
                qa={qa}
                index={i}
                onBookmark={(title, content) => onBookmark(title, content, 'interview')}
              />
            ))}
          </div>
        </div>
      )}

      {!prepResult && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: currentCategory.color.replace(')', ' / 10%)') }}
          >
            <GraduationCap className="w-7 h-7" style={{ color: currentCategory.color }} />
          </div>
          <p className="font-semibold">בחר נושא או הזן נושא חופשי</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ייצר 5 שאלות ראיון עם תשובות מפורטות, מותאמות לרמות קושי שונות
          </p>
        </div>
      )}
    </div>
  )
}
