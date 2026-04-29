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
