import { GitBranch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GitHubGraderClient } from './_components/github-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function GitHubGraderPage() {
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
      .eq('type', 'github')
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <GitBranch className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          <span>ניתוח GitHub</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          GitHub Grader
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          ניתוח ריפוזיטוריז, שפות וחוזק טכני — מופעל ע&quot;י AI
        </p>
      </div>
      <GitHubGraderClient initialRecords={initialRecords} />
    </div>
  )
}
