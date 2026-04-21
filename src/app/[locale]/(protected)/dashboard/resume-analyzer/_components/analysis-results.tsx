import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'
import { ScoreRing } from './score-ring'
import type { ResumeMatchAnalysis } from '@/types/resume'

interface AnalysisResultsProps {
  analysis: ResumeMatchAnalysis
}

function ResultSection({
  title,
  items,
  icon: Icon,
  color,
  bg,
  border,
}: {
  title: string
  items: string[]
  icon: typeof CheckCircle2
  color: string
  bg: string
  border: string
}) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: bg, borderColor: border }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        <h3 className="font-semibold text-sm" style={{ color }}>
          {title}
        </h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
              style={{ background: `${color.replace(')', ' / 15%)')}`, color }}
            >
              {i + 1}
            </span>
            <span className="text-foreground/90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  return (
    <div className="space-y-5 animate-slide-up">
      {/* Score */}
      <div
        className="rounded-2xl p-6 border flex flex-col items-center gap-2"
        style={{
          background: 'var(--card)',
          borderColor: 'oklch(1 0 0 / 9%)',
        }}
      >
        <ScoreRing score={analysis.matchPercentage} size={160} />
        <p className="text-muted-foreground text-sm mt-2 text-center max-w-xs">
          רמת ההתאמה של קורות החיים שלך למשרה זו
        </p>
      </div>

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <ResultSection
          title="נקודות חוזק"
          items={analysis.strengths}
          icon={CheckCircle2}
          color="oklch(0.60 0.17 162)"
          bg="oklch(0.60 0.17 162 / 8%)"
          border="oklch(0.60 0.17 162 / 20%)"
        />
      )}

      {/* Gaps */}
      {analysis.gaps.length > 0 && (
        <ResultSection
          title="פערים וכישורים חסרים"
          items={analysis.gaps}
          icon={AlertTriangle}
          color="oklch(0.75 0.16 60)"
          bg="oklch(0.75 0.16 60 / 8%)"
          border="oklch(0.75 0.16 60 / 20%)"
        />
      )}

      {/* Tips */}
      {analysis.tips.length > 0 && (
        <ResultSection
          title="טיפים לשיפור קורות החיים"
          items={analysis.tips}
          icon={Lightbulb}
          color="oklch(0.585 0.212 264.4)"
          bg="oklch(0.585 0.212 264.4 / 8%)"
          border="oklch(0.585 0.212 264.4 / 20%)"
        />
      )}
    </div>
  )
}
