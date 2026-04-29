'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

interface LoadingOverlayProps {
  isVisible: boolean
  messages: string[]
  tip: string
}

export const CV_LOADING_MESSAGES = [
  'מנתח את מבנה קורות החיים...',
  'בודק מילות מפתח ל-ATS...',
  'מזהה פערים ביחס למשרה...',
  'מייצר המלצות אישיות...',
]
export const CV_LOADING_TIP =
  'קורות חיים עם מספרים ספציפיים (כמו "שיפרתי מהירות ב-30%") מקבלים 40% יותר ראיונות'

export const JOB_LOADING_MESSAGES = [
  'מחפש משרות מתאימות לפרופיל שלך...',
  'מנתח התאמה לכישורים שלך...',
  'בודק דרישות השוק הנוכחי...',
  'מכין הצעות מותאמות אישית...',
]
export const JOB_LOADING_TIP =
  '87% ממגייסים בודקים פרופיל LinkedIn לפני ראיון — ודא שהפרופיל שלך מעודכן'

export const INTERVIEW_LOADING_MESSAGES = [
  'מכין שאלות ראיון מותאמות לתפקיד...',
  'מנתח את דרישות המשרה...',
  'בונה תרחישי STAR...',
  'מסכם טיפים לראיון...',
]
export const INTERVIEW_LOADING_TIP = 'תרגול עצמי בקול רם לפני ראיון משפר ביטחון ב-60% לפי מחקרים'

export function LoadingOverlay({ isVisible, messages, tip }: LoadingOverlayProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => {
      clearInterval(interval)
      setIndex(0)
      setVisible(true)
    }
  }, [isVisible, messages.length])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 md:left-64 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0.08 0.02 264 / 88%)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="max-w-sm w-full mx-4 rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: 'var(--card)',
          border: '1px solid oklch(0.585 0.212 264.4 / 25%)',
          boxShadow: '0 8px 48px oklch(0.585 0.212 264.4 / 20%)',
        }}
      >
        {/* Animated sparkles icon */}
        <div className="flex justify-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: 'oklch(0.585 0.212 264.4 / 15%)' }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
          </div>
        </div>

        {/* Rotating message */}
        <p
          className="text-sm font-semibold text-center transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {messages[index]}
        </p>

        {/* Indeterminate shimmer progress bar */}
        <div
          className="relative h-1.5 rounded-full overflow-hidden"
          style={{ background: 'oklch(1 0 0 / 8%)' }}
        >
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              background: 'oklch(0.585 0.212 264.4)',
              animation: 'shimmer 1.8s ease-in-out infinite',
              width: '40%',
            }}
          />
        </div>

        {/* Tip card */}
        <div
          className="rounded-xl px-3 py-2.5"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 8%)',
            border: '1px solid oklch(0.585 0.212 264.4 / 20%)',
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.71 0.19 291)' }}>
            💡 ידעת?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { left: -50%; }
          100% { left: 110%; }
        }
      `}</style>
    </div>
  )
}
