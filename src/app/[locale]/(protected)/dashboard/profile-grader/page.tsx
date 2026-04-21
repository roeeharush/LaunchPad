import { User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProfileGraderClient } from './_components/profile-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function ProfileGraderPage() {
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
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <User className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          <span>ניתוח נוכחות מקצועית</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          דירוג פרופיל מקצועי
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          GitHub + LinkedIn → Online Brand Score מותאם אישית ע&quot;י AI
        </p>
      </div>

      <ProfileGraderClient initialRecords={initialRecords} />
    </div>
  )
}
