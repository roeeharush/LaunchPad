import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ResumeAnalyzerClient } from './_components/resume-analyzer-client'
import type { ResumeRecord } from '@/types/resume'

export default async function ResumeAnalyzerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialRecords: ResumeRecord[] = []
  if (user) {
    const { data } = await supabase
      .from('resumes')
      .select('id, user_id, file_url, score, created_at, analysis_json')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    initialRecords = (data ?? []) as ResumeRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
          <span>מופעל ע״י Claude AI</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text-bright">
          ניתוח קורות חיים
        </h1>
        <p className="text-muted-foreground mt-2">
          העלה קורות חיים, הדבק תיאור משרה — קבל ניתוח מותאם אישית תוך שניות
        </p>
      </div>

      <ResumeAnalyzerClient initialRecords={initialRecords} />
    </div>
  )
}
