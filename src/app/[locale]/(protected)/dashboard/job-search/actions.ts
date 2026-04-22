'use server'

import { createClient } from '@/lib/supabase/server'
import { generateJobSuggestions } from '@/lib/ai/generate-job-suggestions'
import type { JobSuggestionsResult, JobApplication, ApplicationStatus } from '@/types/jobs'
import type { ResumeRecord } from '@/types/resume'

export type JobSuggestionsActionResult =
  | { ok: true; result: JobSuggestionsResult }
  | { ok: false; error: string }

export type SaveApplicationResult =
  | { ok: true; application: JobApplication }
  | { ok: false; error: string }

export type UpdateStatusResult = { ok: boolean; error?: string }
export type DeleteApplicationResult = { ok: boolean; error?: string }

export async function generateJobSuggestionsAction(): Promise<JobSuggestionsActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  // Fetch the user's latest resume with an analysis
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

  const { strengths, gaps, tips } = latestResume.analysis_json
  const score = latestResume.score ?? 50

  try {
    const result = await generateJobSuggestions({ strengths, gaps, tips, score })
    return { ok: true, result }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת הצעות העבודה. נסה שוב.' }
  }
}

export async function saveApplicationAction(formData: FormData): Promise<SaveApplicationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const job_title = ((formData.get('job_title') as string | null) ?? '').trim()
  const company = ((formData.get('company') as string | null) ?? '').trim()
  const location = ((formData.get('location') as string | null) ?? '').trim() || null
  const is_remote = formData.get('is_remote') === 'true'
  const tech_stack_raw = (formData.get('tech_stack') as string | null) ?? '[]'
  const tech_stack: string[] = JSON.parse(tech_stack_raw)

  if (!job_title || !company) return { ok: false, error: 'כותרת ותפקיד נדרשים' }

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_title,
      company,
      location,
      is_remote,
      tech_stack,
      status: 'applied',
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: 'שגיאה בשמירת הבקשה. נסה שוב.' }
  }

  return { ok: true, application: data as JobApplication }
}

export async function updateApplicationStatusAction(
  formData: FormData
): Promise<UpdateStatusResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  const status = ((formData.get('status') as string | null) ?? '') as ApplicationStatus
  const validStatuses: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']

  if (!id) return { ok: false, error: 'מזהה חסר' }
  if (!validStatuses.includes(status)) return { ok: false, error: 'סטטוס לא תקין' }

  const { error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה בעדכון הסטטוס' }
  return { ok: true }
}

export async function deleteApplicationAction(
  formData: FormData
): Promise<DeleteApplicationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  if (!id) return { ok: false, error: 'מזהה חסר' }

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה במחיקת הבקשה' }
  return { ok: true }
}
