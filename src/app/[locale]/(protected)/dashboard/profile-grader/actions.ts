'use server'

import { fetchGitHubProfile } from '@/lib/github/fetch-profile'
import { analyzeProfile } from '@/lib/ai/analyze-profile'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type ProfileAnalyzeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeProfileAction(formData: FormData): Promise<ProfileAnalyzeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const githubUsername = ((formData.get('githubUsername') as string | null) ?? '').trim()
  const linkedinText = ((formData.get('linkedinText') as string | null) ?? '').trim()

  if (!githubUsername) return { ok: false, error: 'יש להזין שם משתמש GitHub' }
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)) {
    return { ok: false, error: 'שם משתמש GitHub אינו תקין' }
  }
  if (linkedinText.length < 30) {
    return { ok: false, error: 'יש להדביק לפחות 30 תווים מפרופיל ה-LinkedIn שלך' }
  }

  let githubData
  try {
    githubData = await fetchGitHubProfile(githubUsername)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה בגישה ל-GitHub' }
  }

  let analysis
  try {
    analysis = await analyzeProfile(githubData, linkedinText)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ githubUsername, linkedinText })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'combined',
      input_text: inputSnapshot,
      result_json: analysis,
    })
    .select()
    .single()

  if (dbError || !record) {
    return {
      ok: true,
      record: {
        id: crypto.randomUUID(),
        user_id: user.id,
        type: 'combined',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
