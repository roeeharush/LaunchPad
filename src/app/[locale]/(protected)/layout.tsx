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
