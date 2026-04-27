import { Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LinkedInGraderClient } from './_components/linkedin-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function LinkedInGraderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialRecords: ProfileAnalysisRecord[] = []
  if (user) {
    const { data } = await supabase
      .from('profile_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'linkedin')
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Link2 className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
          <span>ניתוח LinkedIn</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          LinkedIn Grader
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          ניתוח פרופיל מקצועי ואופטימיזציה למגייסים — מופעל ע&quot;י AI
        </p>
      </div>
      <LinkedInGraderClient initialRecords={initialRecords} />
    </div>
  )
}
