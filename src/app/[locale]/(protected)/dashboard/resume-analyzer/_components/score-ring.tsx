interface ScoreRingProps {
  score: number
  size?: number
}

export function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const strokeWidth = 10
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference

  const color =
    score >= 75
      ? 'oklch(0.60 0.17 162)' // emerald
      : score >= 50
        ? 'oklch(0.75 0.16 60)' // amber
        : 'oklch(0.62 0.22 27)' // red

  const label = score >= 75 ? 'התאמה גבוהה' : score >= 50 ? 'התאמה בינונית' : 'התאמה נמוכה'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>
        {/* Center text — un-rotate relative to SVG */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>
            {score}%
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">התאמה</span>
        </div>
      </div>
      <span
        className="text-sm font-medium px-3 py-1 rounded-full"
        style={{ background: `${color.replace(')', ' / 15%)')}`, color }}
      >
        {label}
      </span>
    </div>
  )
}
