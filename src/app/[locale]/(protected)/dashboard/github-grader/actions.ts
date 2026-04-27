'use server'

import { fetchGitHubProfile } from '@/lib/github/fetch-profile'
import { analyzeGitHub } from '@/lib/ai/analyze-github'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type GitHubGradeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeGitHubAction(formData: FormData): Promise<GitHubGradeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const githubUsername = ((formData.get('githubUsername') as string | null) ?? '').trim()
  if (!githubUsername) return { ok: false, error: 'יש להזין שם משתמש GitHub' }
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)) {
    return { ok: false, error: 'שם משתמש GitHub אינו תקין' }
  }

  let githubData
  try {
    githubData = await fetchGitHubProfile(githubUsername)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה בגישה ל-GitHub' }
  }

  let analysis
  try {
    analysis = await analyzeGitHub(githubData)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ githubUsername })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'github',
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
        type: 'github',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
