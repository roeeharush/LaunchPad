interface ScoreCardProps {
  title: string
  score: number
  strengths: string[]
  improvements: string[]
  color: string
}

export function ScoreCard({ title, score, strengths, improvements, color }: ScoreCardProps) {
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference
  const bg = color.replace(')', ' / 12%)')

  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-5"
      style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 25%)') }}
    >
      <div className="flex items-center gap-4">
        {/* Mini arc */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="oklch(1 0 0 / 8%)"
              strokeWidth={strokeWidth}
            />
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold" style={{ color }}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight mb-1">{title}</h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: bg, color }}
          >
            {score >= 75 ? 'מצוין' : score >= 50 ? 'בינוני' : 'זקוק לשיפור'}
          </span>
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            נקודות חוזק
          </p>
          <ul className="space-y-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs font-bold" style={{ color }}>
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            לשיפור
          </p>
          <ul className="space-y-1.5">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">→</span>
                <span className="text-muted-foreground">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
