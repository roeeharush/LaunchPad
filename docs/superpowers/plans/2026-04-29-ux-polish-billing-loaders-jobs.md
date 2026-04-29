# UX Polish — Billing Flow, Engaging Loaders, Job Apply Links

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional mock 3-tier billing flow with a `profiles` table and checkout modal, add engaging full-page loading overlays for CV analysis / job search / job analyzer, and add "Apply Now" buttons on job cards that open a Google search.

**Architecture:** Nine independent-but-ordered tasks: DB migration + Plan type → server action → LoadingOverlay component → CheckoutModal → billing page overhaul → sidebar/layout dynamic plan badge → three LoadingOverlay integrations. All UI follows existing Base UI + Tailwind v4 + OKLch dark-theme RTL patterns. The `profiles` table stores the user's plan; `upgradePlanAction` upserts it; the checkout modal calls the action and `router.refresh()` on success so the server layout re-fetches the plan and updates the sidebar badge.

**Tech Stack:** Next.js 16 App Router, Supabase SSR (`@supabase/ssr`), next-intl 4.x (`getTranslations` in async server components, `useTranslations` in client components), Tailwind v4, Lucide React, Vitest 4 + @testing-library/react, ESLint 9.

---

## File Map

| Action | Path                                                                                      | Purpose                                                 |
| ------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Create | `supabase/migrations/004_profiles.sql`                                                    | profiles table + RLS + auto-insert trigger              |
| Create | `src/types/profile.ts`                                                                    | `Plan` type                                             |
| Create | `src/app/[locale]/(protected)/dashboard/billing/actions.ts`                               | `upgradePlanAction` server action                       |
| Create | `src/app/[locale]/(protected)/dashboard/billing/__tests__/actions.test.ts`                | unit tests for server action                            |
| Create | `src/components/ui/loading-overlay.tsx`                                                   | animated full-content-area loading overlay              |
| Create | `src/app/[locale]/(protected)/dashboard/billing/_components/checkout-modal.tsx`           | mock checkout modal (Confirm → Loading → Success)       |
| Create | `src/app/[locale]/(protected)/dashboard/billing/_components/billing-cards.tsx`            | client wrapper handling modal state + 3 plan cards      |
| Modify | `src/app/[locale]/(protected)/dashboard/billing/page.tsx`                                 | async server component: fetch plan, render BillingCards |
| Modify | `src/app/[locale]/(protected)/layout.tsx`                                                 | async: fetch plan from profiles, pass to MobileLayout   |
| Modify | `src/components/layout/mobile-layout.tsx`                                                 | accept `plan` prop, pass to Sidebar                     |
| Modify | `src/components/layout/sidebar.tsx`                                                       | accept `plan?: Plan`, render dynamic badge              |
| Modify | `src/app/[locale]/(protected)/dashboard/resume-analyzer/_components/upload-form.tsx`      | wrap `isPending` with LoadingOverlay                    |
| Modify | `src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx`   | LoadingOverlay + Apply Now button on JobCard            |
| Modify | `src/app/[locale]/(protected)/dashboard/job-analyzer/_components/job-analyzer-client.tsx` | wrap `isPending` with LoadingOverlay                    |

---

## Task 1: DB Migration & Plan Type

**Files:**

- Create: `supabase/migrations/004_profiles.sql`
- Create: `src/types/profile.ts`

> **Note:** `003_job_applications.sql` already exists — use `004_profiles.sql`, not `003`.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/004_profiles.sql`:

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  plan_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: Create the Plan type**

Create `src/types/profile.ts`:

```typescript
export type Plan = 'free' | 'pro' | 'elite'
```

- [ ] **Step 3: Apply the migration**

For Supabase hosted (production), run in the Supabase Dashboard → SQL Editor, pasting the SQL from `004_profiles.sql` and executing it. For local dev:

```bash
npx supabase migration up
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_profiles.sql src/types/profile.ts
git commit -m "feat: add profiles table with plan column and Plan type"
```

---

## Task 2: upgradePlanAction Server Action + Test

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/billing/actions.ts`
- Create: `src/app/[locale]/(protected)/dashboard/billing/__tests__/actions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/app/[locale]/(protected)/dashboard/billing/__tests__/actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { upgradePlanAction } from '../actions'
import { createClient } from '@/lib/supabase/server'

const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

function makeMockClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: mockFrom,
  }
}

describe('upgradePlanAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok:false when user is not authenticated', async () => {
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockClient(null))
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns ok:true and upserts the plan when authenticated', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockClient('user-123')
    )
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-123', plan: 'pro' })
    )
  })

  it('returns ok:false when the upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'db error' } })
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockClient('user-123')
    )
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run "src/app/\[locale\]/\(protected\)/dashboard/billing/__tests__/actions.test.ts"
```

Expected: FAIL — `upgradePlanAction` is not defined yet.

- [ ] **Step 3: Create the server action**

Create `src/app/[locale]/(protected)/dashboard/billing/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/types/profile'

export async function upgradePlanAction(
  plan: 'pro' | 'elite'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'לא מחובר' }
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    plan: plan as Plan,
    plan_updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[upgradePlanAction] upsert failed:', error)
    return { ok: false, error: 'שדרוג התוכנית נכשל. אנא נסה שוב.' }
  }

  return { ok: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run "src/app/\[locale\]/\(protected\)/dashboard/billing/__tests__/actions.test.ts"
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/billing/actions.ts" \
        "src/app/[locale]/(protected)/dashboard/billing/__tests__/actions.test.ts"
git commit -m "feat: add upgradePlanAction server action with unit tests"
```

---

## Task 3: LoadingOverlay Component

**Files:**

- Create: `src/components/ui/loading-overlay.tsx`

The overlay covers the main content area (not the sidebar). It achieves this by using `fixed` positioning but adding `md:left-64` (the sidebar width) on desktop. On mobile, the sidebar is hidden so `inset-0` covers the full viewport, which is correct.

- [ ] **Step 1: Write the component test**

Create `src/components/ui/__tests__/loading-overlay.test.tsx`:

```typescript
// @vitest-environment jsdom
import { render, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoadingOverlay } from '../loading-overlay'

describe('LoadingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <LoadingOverlay
        isVisible={false}
        messages={['מנתח...', 'בודק...']}
        tip="טיפ מועיל"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders overlay when isVisible is true', () => {
    const { getByText } = render(
      <LoadingOverlay
        isVisible={true}
        messages={['מנתח...', 'בודק...']}
        tip="טיפ מועיל"
      />
    )
    expect(getByText('מנתח...')).toBeInTheDocument()
    expect(getByText('טיפ מועיל')).toBeInTheDocument()
  })

  it('rotates to the next message after 3 seconds', () => {
    const { getByText } = render(
      <LoadingOverlay
        isVisible={true}
        messages={['הודעה ראשונה', 'הודעה שנייה']}
        tip="טיפ"
      />
    )
    expect(getByText('הודעה ראשונה')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(getByText('הודעה שנייה')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run "src/components/ui/__tests__/loading-overlay.test.tsx"
```

Expected: FAIL — `LoadingOverlay` is not defined yet.

- [ ] **Step 3: Create the component**

Create `src/components/ui/loading-overlay.tsx`:

```typescript
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
export const INTERVIEW_LOADING_TIP =
  'תרגול עצמי בקול רם לפני ראיון משפר ביטחון ב-60% לפי מחקרים'

export function LoadingOverlay({ isVisible, messages, tip }: LoadingOverlayProps) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isVisible) return
    setIndex(0)
    setVisible(true)
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run "src/components/ui/__tests__/loading-overlay.test.tsx"
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/loading-overlay.tsx \
        src/components/ui/__tests__/loading-overlay.test.tsx
git commit -m "feat: add LoadingOverlay component with rotating messages and tip"
```

---

## Task 4: CheckoutModal Component

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/billing/_components/checkout-modal.tsx`

- [ ] **Step 1: Create the component**

Create `src/app/[locale]/(protected)/dashboard/billing/_components/checkout-modal.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { upgradePlanAction } from '../actions'
import type { Plan } from '@/types/profile'

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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to checkout-modal.tsx.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/billing/_components/checkout-modal.tsx"
git commit -m "feat: add CheckoutModal with Confirm/Loading/Success states"
```

---

## Task 5: Billing Page Overhaul — 3 Tiers, Dynamic Plan, Checkout

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/billing/_components/billing-cards.tsx`
- Modify: `src/app/[locale]/(protected)/dashboard/billing/page.tsx`

This task splits the billing page into a server part (data fetching) and a client part (interactivity). The server page fetches the current plan and renders `<BillingCards currentPlan={...} />`. `BillingCards` is a client component that manages which modal is open.

- [ ] **Step 1: Create BillingCards client component**

Create `src/app/[locale]/(protected)/dashboard/billing/_components/billing-cards.tsx`:

```typescript
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
          className={cn(
            'rounded-2xl p-6 border flex flex-col',
            currentPlan === 'free' && 'ring-2'
          )}
          style={{
            background: 'var(--card)',
            borderColor: INDIGO.replace(')', ' / 20%)'),
            ...(currentPlan === 'free' ? { '--tw-ring-color': INDIGO } as React.CSSProperties : {}),
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
            ...(currentPlan === 'pro' ? { '--tw-ring-color': INDIGO } as React.CSSProperties : {}),
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
            ...(currentPlan === 'elite'
              ? { '--tw-ring-color': AMBER }
              : {}),
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
```

- [ ] **Step 2: Rewrite billing/page.tsx**

Replace the entire content of `src/app/[locale]/(protected)/dashboard/billing/page.tsx`:

```typescript
import { CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BillingCards } from './_components/billing-cards'
import type { Plan } from '@/types/profile'

const INDIGO = 'oklch(0.585 0.212 264.4)'

export default async function BillingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const currentPlan = (profile?.plan ?? 'free') as Plan

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <CreditCard className="w-4 h-4" style={{ color: INDIGO }} />
          <span>תוכנית ותשלומים</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          בחר תוכנית
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          שדרג כדי לגשת לכל הכלים ולהאיץ את חיפוש העבודה שלך
        </p>
      </div>

      <BillingCards currentPlan={currentPlan} />
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in billing files.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/billing/page.tsx" \
        "src/app/[locale]/(protected)/dashboard/billing/_components/billing-cards.tsx"
git commit -m "feat: overhaul billing page — 3 tiers (Free/Pro/Elite), dynamic current plan, checkout modal"
```

---

## Task 6: Dynamic Sidebar Plan Badge

Pass the user's plan from the server protected layout → MobileLayout (client) → Sidebar (client), replacing the hardcoded "חינם" badge with a dynamic one.

**Files:**

- Modify: `src/app/[locale]/(protected)/layout.tsx`
- Modify: `src/components/layout/mobile-layout.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Make protected layout async and fetch plan**

Replace the entire content of `src/app/[locale]/(protected)/layout.tsx`:

```typescript
import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { MobileLayout } from '@/components/layout/mobile-layout'
import type { Plan } from '@/types/profile'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let plan: Plan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = (profile?.plan ?? 'free') as Plan
  }

  return (
    <>
      <NextTopLoader color="#6366f1" height={2} showSpinner={false} shadow={false} />
      <Toaster position="top-left" dir="rtl" theme="dark" />
      <MobileLayout plan={plan}>{children}</MobileLayout>
    </>
  )
}
```

- [ ] **Step 2: Add plan prop to MobileLayout**

Replace the entire content of `src/components/layout/mobile-layout.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types/profile'

export function MobileLayout({
  children,
  plan,
}: {
  children: React.ReactNode
  plan?: Plan
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ambient">
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:block">
        <Sidebar plan={plan} onNavigate={() => {}} />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — slides in from the right (RTL) */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <Sidebar plan={plan} onNavigate={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
        {/* Mobile header bar */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="font-bold text-base">לאנצ׳פד</span>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="פתח תפריט"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Update Sidebar to render dynamic badge**

In `src/components/layout/sidebar.tsx`, make two changes:

**a)** Update `SidebarProps` (line 62–64) to add the `plan` prop:

```typescript
import type { Plan } from '@/types/profile'

interface SidebarProps {
  onNavigate?: () => void
  plan?: Plan
}

export function Sidebar({ onNavigate, plan = 'free' }: SidebarProps) {
```

**b)** Replace the hardcoded badge span (lines 195–201) in the billing footer link. Find this block:

```typescript
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: 'oklch(0.585 0.212 264.4 / 20%)',
              color: 'oklch(0.585 0.212 264.4)',
            }}
          >
            חינם
          </span>
```

Replace with:

```typescript
          <PlanBadge plan={plan} />
```

**c)** Add the `PlanBadge` component above the `navItems` array (after the imports):

```typescript
function PlanBadge({ plan }: { plan: Plan }) {
  const config = {
    free:  { label: 'חינם',     bg: 'oklch(0.585 0.212 264.4 / 20%)', color: 'oklch(0.585 0.212 264.4)' },
    pro:   { label: 'Pro ⚡',   bg: 'oklch(0.58 0.21 291 / 20%)',     color: 'oklch(0.58 0.21 291)' },
    elite: { label: 'Elite 👑', bg: 'oklch(0.75 0.16 60 / 20%)',      color: 'oklch(0.75 0.16 60)' },
  }[plan]
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
```

Also add the `Plan` import at the top with the other imports:

```typescript
import type { Plan } from '@/types/profile'
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test
```

Expected: all tests pass (sidebar tests should still pass since `plan` defaults to `'free'`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(protected)/layout.tsx" \
        src/components/layout/mobile-layout.tsx \
        src/components/layout/sidebar.tsx
git commit -m "feat: thread plan prop from server layout through MobileLayout to Sidebar for dynamic badge"
```

---

## Task 7: LoadingOverlay in CV Analysis (upload-form.tsx)

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/resume-analyzer/_components/upload-form.tsx`

The `isPending` state lives in `upload-form.tsx`. Wrap the form with a relative container and show the LoadingOverlay when `isPending` is true.

- [ ] **Step 1: Add LoadingOverlay to upload-form.tsx**

In `src/app/[locale]/(protected)/dashboard/resume-analyzer/_components/upload-form.tsx`:

**a)** Add import at the top (after existing imports):

```typescript
import {
  LoadingOverlay,
  CV_LOADING_MESSAGES,
  CV_LOADING_TIP,
} from '@/components/ui/loading-overlay'
```

**b)** Wrap the existing `<form>` return with a relative container and add the overlay. Replace:

```typescript
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
```

With:

```typescript
  return (
    <>
      <LoadingOverlay isVisible={isPending} messages={CV_LOADING_MESSAGES} tip={CV_LOADING_TIP} />
      <form onSubmit={handleSubmit} className="space-y-4">
```

And close the fragment at the end of the return — replace the final `</form>` closing with:

```typescript
      </form>
    </>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/resume-analyzer/_components/upload-form.tsx"
git commit -m "feat: integrate LoadingOverlay into CV analysis upload form"
```

---

## Task 8: LoadingOverlay + Apply Now in Job Search

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx`

Two changes: (1) show LoadingOverlay when `isPending` during `generateJobSuggestionsAction`, (2) add "הגש מועמדות עכשיו" button to each `JobCard`.

- [ ] **Step 1: Add imports**

In `job-discovery-panel.tsx`, add to the import block at the top:

```typescript
import { ExternalLink } from 'lucide-react'
import {
  LoadingOverlay,
  JOB_LOADING_MESSAGES,
  JOB_LOADING_TIP,
} from '@/components/ui/loading-overlay'
```

(Keep existing imports. `ExternalLink` goes on the same line as the other Lucide icons.)

- [ ] **Step 2: Add Apply Now button to JobCard**

In the `JobCard` function, after the match reason div (the last `</div>` before the closing `</div>` of the card), add the Apply Now button. The `applyUrl` is computed from the job's title and company.

Replace the entire `JobCard` function with:

```typescript
function JobCard({
  job,
  onSave,
  isSaved,
}: {
  job: JobSuggestion
  onSave: (job: JobSuggestion) => void
  isSaved: boolean
}) {
  const applyUrl = `https://www.google.com/search?q=${encodeURIComponent(`${job.title} ${job.company} משרה`)}`
  const YELLOW = 'oklch(0.75 0.16 60)'

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 group"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <button
          onClick={() => onSave(job)}
          disabled={isSaved}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0 px-2 gap-1 text-xs',
            isSaved ? 'cursor-default' : 'text-muted-foreground hover:text-foreground'
          )}
          title={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
          aria-label={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
        >
          {isSaved ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: 'oklch(0.60 0.17 162)' }} />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'oklch(1 0 0 / 8%)', color: 'oklch(0.75 0.05 252)' }}
        >
          📍 {job.location}
        </span>
        {job.isRemote && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'oklch(0.65 0.15 211 / 15%)', color: 'oklch(0.65 0.15 211)' }}
          >
            Remote
          </span>
        )}
        {job.isJuniorFriendly && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'oklch(0.60 0.17 162 / 15%)', color: 'oklch(0.60 0.17 162)' }}
          >
            Junior ✓
          </span>
        )}
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1">
        {job.techStack.map((tech) => (
          <span
            key={tech}
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              borderColor: 'oklch(0.75 0.16 60 / 25%)',
              color: 'oklch(0.75 0.16 60)',
              background: 'oklch(0.75 0.16 60 / 8%)',
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{job.description}</p>

      {/* Match reason */}
      <div className="pt-2 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: 'oklch(0.75 0.16 60)' }}>
            ✦ התאמה:{' '}
          </span>
          <span className="text-muted-foreground">{job.matchReason}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{job.salaryRange}</p>
      </div>

      {/* Apply Now */}
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ size: 'sm' }), 'w-full gap-2 justify-center font-semibold mt-1')}
        style={{ background: YELLOW, color: 'oklch(0.15 0.02 60)' }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
        הגש מועמדות עכשיו
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Add LoadingOverlay to JobDiscoveryPanel**

In the `JobDiscoveryPanel` return, wrap the current `<div className="space-y-6">` with a fragment and add the overlay at the top. Replace:

```typescript
  return (
    <div className="space-y-6">
```

With:

```typescript
  return (
    <>
      <LoadingOverlay isVisible={isPending} messages={JOB_LOADING_MESSAGES} tip={JOB_LOADING_TIP} />
      <div className="space-y-6">
```

And close the fragment at the end of the return — replace the final `</div>` with:

```typescript
      </div>
    </>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx"
git commit -m "feat: add LoadingOverlay to job search and Apply Now button on job cards"
```

---

## Task 9: LoadingOverlay in Job Analyzer

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/job-analyzer/_components/job-analyzer-client.tsx`

The `isPending` state lives in `job-analyzer-client.tsx`. This component handles the full job analysis (cover letter + skills + interview questions). Add the LoadingOverlay when the AI generation is running.

- [ ] **Step 1: Add import**

In `job-analyzer-client.tsx`, add to the import block:

```typescript
import {
  LoadingOverlay,
  INTERVIEW_LOADING_MESSAGES,
  INTERVIEW_LOADING_TIP,
} from '@/components/ui/loading-overlay'
```

- [ ] **Step 2: Add LoadingOverlay to the return**

In the `JobAnalyzerClient` return, wrap the outer `<div className="space-y-8">` with a fragment and add the overlay. Replace:

```typescript
  return (
    <div className="space-y-8">
```

With:

```typescript
  return (
    <>
      <LoadingOverlay
        isVisible={isPending}
        messages={INTERVIEW_LOADING_MESSAGES}
        tip={INTERVIEW_LOADING_TIP}
      />
      <div className="space-y-8">
```

And close the fragment — replace the final `</div>` with:

```typescript
      </div>
    </>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/job-analyzer/_components/job-analyzer-client.tsx"
git commit -m "feat: integrate LoadingOverlay into job analyzer client"
```

---

## Task 10: Lint, Tests, Final Verification

- [ ] **Step 1: Run ESLint**

```bash
npm run lint
```

Expected: no errors. If there are "no-unused-vars" or type errors, fix them before proceeding.

- [ ] **Step 2: Run full test suite**

```bash
npm run test
```

Expected: all tests pass. The new tests are:

- `src/app/[locale]/(protected)/dashboard/billing/__tests__/actions.test.ts` — 3 tests
- `src/components/ui/__tests__/loading-overlay.test.tsx` — 3 tests

- [ ] **Step 3: Manual smoke test — billing upgrade flow**

1. Navigate to `/he/dashboard/billing`
2. Confirm 3 cards render: חינם / Pro / Elite
3. Click "שדרג ל-Pro" → confirm modal opens showing Pro plan benefits + price
4. Click "אשר שדרוג" → button shows spinner → success checkmark appears → modal closes after ~1.5s
5. Confirm sidebar badge now shows "Pro ⚡" in violet
6. Navigate back to billing → Pro card shows "תוכנית נוכחית ✓", Elite shows upgrade button, Free shows disabled

- [ ] **Step 4: Manual smoke test — loading overlay**

1. Navigate to `/he/dashboard/resume-analyzer`
2. Upload a PDF and fill in the job description, click "נתח קורות חיים"
3. Confirm full-page overlay appears over content area (sidebar stays visible on desktop)
4. Confirm messages rotate every 3 seconds with fade
5. Confirm "💡 ידעת?" tip is visible at the bottom

6. Navigate to `/he/dashboard/job-search`
7. Ensure you have a resume uploaded, click "מצא משרות מתאימות"
8. Confirm overlay appears with job search messages
9. After results load, confirm each job card has "הגש מועמדות עכשיו" button
10. Click Apply Now on a job → confirm Google search opens in new tab

11. Navigate to `/he/dashboard/job-analyzer`
12. Paste a job listing (50+ chars), click "נתח משרה"
13. Confirm overlay appears with interview prep messages

- [ ] **Step 5: Commit any lint fixes**

If lint required any fixes:

```bash
git add -p
git commit -m "chore: fix lint issues after UX Polish implementation"
```

---

## Verification Summary

| Feature                  | Verify                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| DB migration             | Supabase → Table Editor → `profiles` table exists with `plan` column                                              |
| upgradePlanAction        | Unit test passes; upgrading via billing page updates the DB row                                                   |
| CheckoutModal            | Confirm → Loading → Success states all render; auto-close after 1.5s calls router.refresh()                       |
| Billing page             | 3 columns; active plan shows "תוכנית נוכחית ✓"; lower tiers show disabled button                                  |
| Sidebar badge            | Updates to "Pro ⚡" (violet) / "Elite 👑" (amber) after upgrade; refreshes via router.refresh() → server re-fetch |
| CV LoadingOverlay        | Appears on analysis submit; disappears when results arrive; sidebar stays visible                                 |
| Job LoadingOverlay       | Appears on job search; disappears when cards load                                                                 |
| Interview LoadingOverlay | Appears on job analyzer submit; disappears when tabs appear                                                       |
| Apply Now                | Each job card has yellow "הגש מועמדות עכשיו" link that opens Google search in new tab                             |
