'use server'

import { createClient } from '@/lib/supabase/server'

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
    plan,
    plan_updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error('[upgradePlanAction] upsert failed:', error)
    return { ok: false, error: 'שדרוג התוכנית נכשל. אנא נסה שוב.' }
  }

  return { ok: true }
}
