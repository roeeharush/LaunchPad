'use server'

import { analyzeLinkedIn } from '@/lib/ai/analyze-linkedin'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type LinkedInGradeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeLinkedInAction(formData: FormData): Promise<LinkedInGradeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const linkedinText = ((formData.get('linkedinText') as string | null) ?? '').trim()
  if (linkedinText.length < 30) {
    return { ok: false, error: 'יש להדביק לפחות 30 תווים מפרופיל ה-LinkedIn שלך' }
  }

  let analysis
  try {
    analysis = await analyzeLinkedIn(linkedinText)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ linkedinText: linkedinText.slice(0, 100) })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'linkedin',
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
        type: 'linkedin',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
