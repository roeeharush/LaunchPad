import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JobSearchClient } from './_components/job-search-client'
import type { JobApplication } from '@/types/jobs'
import type { ResumeRecord } from '@/types/resume'

export default async function JobSearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialApplications: JobApplication[] = []
  let resumeInfo: { hasResume: boolean; score: number | null; skills: string[] } = {
    hasResume: false,
    score: null,
    skills: [],
  }

  if (user) {
    const [applicationsRes, resumesRes] = await Promise.all([
      supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('resumes')
        .select('id, score, analysis_json')
        .eq('user_id', user.id)
        .not('analysis_json', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    initialApplications = (applicationsRes.data ?? []) as JobApplication[]

    const latestResume = (resumesRes.data ?? [])[0] as
      | Pick<ResumeRecord, 'score' | 'analysis_json'>
      | undefined
    if (latestResume) {
      resumeInfo = {
        hasResume: true,
        score: latestResume.score,
        skills: latestResume.analysis_json?.strengths ?? [],
      }
    }
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Briefcase className="w-4 h-4" style={{ color: 'oklch(0.75 0.16 60)' }} />
          <span>חיפוש עבודה</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          מרכז חיפוש העבודה
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          משרות מותאמות לפרופיל שלך · סינון חכם · מעקב בקשות — הכל מופעל ע&quot;י AI
        </p>
      </div>

      <JobSearchClient initialApplications={initialApplications} resumeInfo={resumeInfo} />
    </div>
  )
}
