import { Sparkles } from 'lucide-react'
import { ScoreCard } from './score-card'
import type { ProfileAnalysis } from '@/types/profile'

interface ProfileResultsProps {
  analysis: ProfileAnalysis
}

const TECH_COLOR = 'oklch(0.58 0.21 291)' // violet — GitHub
const PRO_COLOR = 'oklch(0.65 0.15 211)' // sky — LinkedIn

export function ProfileResults({ analysis }: ProfileResultsProps) {
  const { techScore, professionalScore, overallBrandScore, topTips } = analysis

  const overallColor =
    overallBrandScore >= 75
      ? 'oklch(0.60 0.17 162)'
      : overallBrandScore >= 50
        ? 'oklch(0.75 0.16 60)'
        : 'oklch(0.62 0.22 27)'

  return (
    <div className="space-y-5">
      {/* Overall brand score banner */}
      <div
        className="rounded-2xl p-6 border flex items-center justify-between"
        style={{
          background: `${overallColor.replace(')', ' / 10%)')}`,
          borderColor: overallColor.replace(')', ' / 30%)'),
        }}
      >
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Online Brand Score
          </p>
          <p className="text-4xl font-extrabold" style={{ color: overallColor }}>
            {overallBrandScore}
            <span className="text-lg font-medium text-muted-foreground">/100</span>
          </p>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: overallColor.replace(')', ' / 15%)') }}
        >
          <Sparkles className="w-8 h-8" style={{ color: overallColor }} />
        </div>
      </div>

      {/* Two score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreCard
          title="Tech Score — GitHub"
          score={techScore.score}
          strengths={techScore.strengths}
          improvements={techScore.improvements}
          color={TECH_COLOR}
        />
        <ScoreCard
          title="Professional Score — LinkedIn"
          score={professionalScore.score}
          strengths={professionalScore.strengths}
          improvements={professionalScore.improvements}
          color={PRO_COLOR}
        />
      </div>

      {/* Top tips */}
      {topTips.length > 0 && (
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 8%)',
            borderColor: 'oklch(0.585 0.212 264.4 / 20%)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'oklch(0.585 0.212 264.4)' }}
          >
            פעולות עדיפות להגדיל את הסיכוי להתגלות
          </p>
          <ol className="space-y-3">
            {topTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: 'oklch(0.585 0.212 264.4 / 20%)',
                    color: 'oklch(0.585 0.212 264.4)',
                  }}
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
  )
}
