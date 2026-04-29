'use client'

import { useState } from 'react'
import { Check, X, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { CheckoutModal } from './checkout-modal'
import type { Plan } from '@/types/profile'

const INDIGO = 'oklch(0.585 0.212 264.4)'
const VIOLET = 'oklch(0.58 0.21 291)'
const AMBER = 'oklch(0.75 0.16 60)'
const TEAL = 'oklch(0.60 0.17 162)'

const FREE_FEATURES: { label: string; included: boolean | string }[] = [
  { label: 'ניתוח קורות חיים', included: '3/חודש' },
  { label: 'אופטימיזציית LinkedIn', included: false },
  { label: 'ניתוח GitHub', included: false },
  { label: 'התאמת משרות עם AI', included: false },
]

const PRO_FEATURES: string[] = [
  'ניתוחי קורות חיים ללא הגבלה',
  'אופטימיזציית LinkedIn',
  'ניתוח GitHub',
  'התאמת משרות עם AI',
  'טרנדים בזמן אמת',
  'תמיכה מועדפת',
  'ראיונות מדומים',
]

const ELITE_FEATURES: string[] = [
  'הכל בתוכנית Pro',
  'ניתוחים ללא הגבלה',
  'סקירת קורות חיים אישית (1-on-1)',
  'גישה מוקדמת לתכונות חדשות',
]

function CurrentBadge() {
  return (
    <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white flex items-center gap-1">
      תוכנית נוכחית ✓
    </div>
  )
}

function PopularBadge() {
  return (
    <div
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: INDIGO.replace(')', ' / 20%)'), color: INDIGO }}
    >
      הכי פופולרי
    </div>
  )
}

interface BillingCardsProps {
  currentPlan: Plan
}

export function BillingCards({ currentPlan }: BillingCardsProps) {
  const [upgradeTarget, setUpgradeTarget] = useState<'pro' | 'elite' | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {/* Free */}
        <div
          className={cn('rounded-2xl p-6 border flex flex-col', currentPlan === 'free' && 'ring-2')}
          style={{
            background: 'var(--card)',
            borderColor: INDIGO.replace(')', ' / 20%)'),
            ...(currentPlan === 'free'
              ? ({ '--tw-ring-color': INDIGO } as React.CSSProperties)
              : {}),
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">חינם</h2>
            {currentPlan === 'free' ? <CurrentBadge /> : null}
          </div>
          <p className="text-2xl font-extrabold mb-1">₪0</p>
          <p className="text-xs text-muted-foreground mb-5">לתמיד</p>
          <ul className="space-y-2.5 flex-1">
            {FREE_FEATURES.map(({ label, included }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                {included !== false ? (
                  <Check className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                ) : (
                  <X className="w-4 h-4 shrink-0 opacity-25" />
                )}
                <span className={included === false ? 'opacity-40' : ''}>
                  {label}
                  {typeof included === 'string' && ` (${included})`}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            {currentPlan === 'free' ? (
              <div
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'w-full justify-center opacity-50 cursor-default pointer-events-none'
                )}
              >
                התוכנית שלך
              </div>
            ) : (
              <div
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'w-full justify-center opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                שדרוג בלבד
              </div>
            )}
          </div>
        </div>

        {/* Pro */}
        <div
          className={cn(
            'rounded-2xl p-6 border flex flex-col relative',
            currentPlan === 'pro' && 'ring-2'
          )}
          style={{
            background: INDIGO.replace(')', ' / 8%)'),
            borderColor: INDIGO.replace(')', ' / 40%)'),
            ...(currentPlan === 'pro'
              ? ({ '--tw-ring-color': INDIGO } as React.CSSProperties)
              : {}),
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg flex items-center gap-1.5">
              Pro <Zap className="w-4 h-4" style={{ color: VIOLET }} />
            </h2>
            {currentPlan === 'pro' ? <CurrentBadge /> : <PopularBadge />}
          </div>
          <p className="text-2xl font-extrabold mb-1">₪49</p>
          <p className="text-xs text-muted-foreground mb-5">לחודש</p>
          <ul className="space-y-2.5 flex-1">
            {PRO_FEATURES.map((label) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 shrink-0" style={{ color: INDIGO }} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            {currentPlan === 'pro' ? (
              <div
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'w-full justify-center opacity-50 cursor-default pointer-events-none text-white'
                )}
                style={{ background: INDIGO }}
              >
                התוכנית שלך
              </div>
            ) : currentPlan === 'elite' ? (
              <div
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'default' }),
                  'w-full justify-center opacity-40 cursor-not-allowed pointer-events-none'
                )}
              >
                שדרוג בלבד
              </div>
            ) : (
              <button
                onClick={() => setUpgradeTarget('pro')}
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'w-full gap-2 justify-center font-semibold text-white'
                )}
                style={{ background: INDIGO }}
              >
                <Zap className="w-4 h-4" />
                שדרג ל-Pro
              </button>
            )}
          </div>
        </div>

        {/* Elite */}
        <div
          className={cn(
            'rounded-2xl p-6 border flex flex-col',
            currentPlan === 'elite' && 'ring-2'
          )}
          style={{
            background: AMBER.replace(')', ' / 6%)'),
            borderColor: AMBER.replace(')', ' / 35%)'),
            ...(currentPlan === 'elite' ? { '--tw-ring-color': AMBER } : {}),
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg flex items-center gap-1.5">
              Elite <Crown className="w-4 h-4" style={{ color: AMBER }} />
            </h2>
            {currentPlan === 'elite' ? <CurrentBadge /> : null}
          </div>
          <p className="text-2xl font-extrabold mb-1">₪99</p>
          <p className="text-xs text-muted-foreground mb-5">לחודש</p>
          <ul className="space-y-2.5 flex-1">
            {ELITE_FEATURES.map((label) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 shrink-0" style={{ color: AMBER }} />
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            {currentPlan === 'elite' ? (
              <div
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'w-full justify-center opacity-50 cursor-default pointer-events-none text-white'
                )}
                style={{ background: AMBER, color: 'oklch(0.15 0.02 60)' }}
              >
                התוכנית שלך
              </div>
            ) : (
              <button
                onClick={() => setUpgradeTarget('elite')}
                className={cn(
                  buttonVariants({ size: 'default' }),
                  'w-full gap-2 justify-center font-semibold'
                )}
                style={{ background: AMBER, color: 'oklch(0.15 0.02 60)' }}
              >
                <Crown className="w-4 h-4" />
                שדרג ל-Elite
              </button>
            )}
          </div>
        </div>
      </div>

      {upgradeTarget && (
        <CheckoutModal plan={upgradeTarget} onClose={() => setUpgradeTarget(null)} />
      )}
    </>
  )
}
