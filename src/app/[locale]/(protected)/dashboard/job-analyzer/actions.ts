'use server'

import { createClient } from '@/lib/supabase/server'
import { analyzeJobListing } from '@/lib/ai/analyze-job-listing'
import type { JobAnalysisResult } from '@/types/job-analyzer'
import type { ResumeRecord } from '@/types/resume'

export type AnalysisActionResult =
  | { ok: true; result: JobAnalysisResult }
  | { ok: false; error: string }

export async function analyzeJobListingAction(formData: FormData): Promise<AnalysisActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const jobText = ((formData.get('job_listing') as string | null) ?? '').trim()
  if (!jobText) return { ok: false, error: 'יש להזין את תיאור המשרה' }
  if (jobText.length < 50)
    return { ok: false, error: 'תיאור המשרה קצר מדי — הדבק את מודעת העבודה המלאה' }

  // Fetch latest analyzed resume
  const { data: resumes } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .not('analysis_json', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestResume = (resumes ?? [])[0] as ResumeRecord | undefined
  if (!latestResume?.analysis_json) {
    return {
      ok: false,
      error: 'טרם נותחו קורות חיים. העלה ונתח קורות חיים תחילה.',
    }
  }

  const resumeProfile = {
    text: latestResume.extracted_text ?? '',
    strengths: latestResume.analysis_json.strengths ?? [],
    score: latestResume.score ?? 50,
  }

  try {
    const result = await analyzeJobListing(jobText, resumeProfile)
    return { ok: true, result }
  } catch {
    return { ok: false, error: 'שגיאה בניתוח המשרה. נסה שוב.' }
  }
}
