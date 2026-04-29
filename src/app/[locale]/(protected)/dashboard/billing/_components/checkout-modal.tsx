'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { upgradePlanAction } from '../actions'

interface CheckoutModalProps {
  plan: 'pro' | 'elite'
  onClose: () => void
}

const PLAN_CONFIG: Record<
  'pro' | 'elite',
  { label: string; price: string; color: string; benefits: string[] }
> = {
  pro: {
    label: 'Pro ⚡',
    price: '₪49/חודש',
    color: 'oklch(0.585 0.212 264.4)',
    benefits: ['ניתוחי קורות חיים ללא הגבלה', 'התאמת משרות AI', 'ראיונות מדומים', 'תמיכה מועדפת'],
  },
  elite: {
    label: 'Elite 👑',
    price: '₪99/חודש',
    color: 'oklch(0.75 0.16 60)',
    benefits: [
      'הכל בתוכנית Pro',
      'ניתוחים ללא הגבלה',
      'סקירת קורות חיים אישית (1-on-1)',
      'גישה מוקדמת לתכונות חדשות',
    ],
  },
}

export function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const router = useRouter()
  const [stage, setStage] = useState<'confirm' | 'loading' | 'success'>('confirm')
  const config = PLAN_CONFIG[plan]

  useEffect(() => {
    if (stage !== 'success') return
    const timer = setTimeout(() => {
      onClose()
      router.refresh()
    }, 1500)
    return () => clearTimeout(timer)
  }, [stage, onClose, router])

  async function handleConfirm() {
    setStage('loading')
    const result = await upgradePlanAction(plan)
    if (result.ok) {
      setStage('success')
    } else {
      setStage('confirm')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0 0 0 / 60%)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== 'loading') onClose()
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--card)',
          border: `1px solid ${config.color.replace(')', ' / 30%)')}`,
          boxShadow: `0 8px 48px ${config.color.replace(')', ' / 20%)')}`,
        }}
      >
        {/* Close button (confirm stage only) */}
        {stage === 'confirm' && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {stage === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.60 0.17 162 / 15%)' }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: 'oklch(0.60 0.17 162)' }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">שודרגת בהצלחה!</p>
              <p className="text-sm text-muted-foreground mt-1">ברוך הבא לתוכנית {config.label}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center pt-2">
              <p className="text-2xl font-bold" style={{ color: config.color }}>
                {config.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{config.price} · ביטול בכל עת</p>
            </div>

            {/* Benefits */}
            <div
              className="rounded-xl p-4"
              style={{ background: config.color.replace(')', ' / 8%)') }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: config.color }}>
                מה תקבל:
              </p>
              <ul className="space-y-2">
                {config.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm">
                    <span style={{ color: config.color }}>✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={stage === 'loading'}
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full gap-2 justify-center font-semibold text-white',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
              style={{ background: config.color }}
            >
              {stage === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעבד...
                </>
              ) : (
                'אשר שדרוג'
              )}
            </button>

            <button
              onClick={onClose}
              disabled={stage === 'loading'}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ביטול
            </button>
          </>
        )}
      </div>
    </div>
  )
}
