'use client'

import { Target } from 'lucide-react'
import type { CriticalSkill } from '@/types/job-analyzer'

interface SkillsPanelProps {
  criticalSkills: CriticalSkill[]
}

const SKILL_COLORS = [
  'oklch(0.58 0.21 291)', // purple
  'oklch(0.585 0.212 264)', // blue
  'oklch(0.60 0.17 162)', // green
  'oklch(0.75 0.16 60)', // amber
  'oklch(0.65 0.15 211)', // sky
]

export function SkillsPanel({ criticalSkills }: SkillsPanelProps) {
  return (
    <div className="space-y-3">
      {criticalSkills.map((skill, i) => {
        const color = SKILL_COLORS[i % SKILL_COLORS.length] ?? SKILL_COLORS[0]!
        return (
          <div
            key={i}
            className="rounded-2xl border p-5 flex gap-4"
            style={{
              background: 'var(--card)',
              borderColor: color.replace(')', ' / 20%)'),
            }}
          >
            {/* Rank badge */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
              style={{ background: color.replace(')', ' / 15%)'), color }}
            >
              {i + 1}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {/* Skill name */}
              <h3 className="font-bold text-base" style={{ color }}>
                {skill.skill}
              </h3>

              {/* Why important */}
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  למה זה חשוב
                </p>
                <p className="text-sm leading-relaxed">{skill.whyImportant}</p>
              </div>

              {/* How to highlight */}
              <div
                className="rounded-xl px-3 py-2 flex items-start gap-2"
                style={{ background: color.replace(')', ' / 8%)') }}
              >
                <Target className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} />
                <p className="text-xs leading-relaxed" style={{ color }}>
                  {skill.howToHighlight}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
