'use server'

import { generateIndustryTrends } from '@/lib/ai/generate-trends'
import { generateInterviewPrep } from '@/lib/ai/generate-interview-prep'
import { createClient } from '@/lib/supabase/server'
import type { TechPulse, InterviewPrepResult, KnowledgeBookmark } from '@/types/knowledge'

export type TechPulseResult = { ok: true; pulse: TechPulse } | { ok: false; error: string }

export type InterviewPrepActionResult =
  | { ok: true; result: InterviewPrepResult }
  | { ok: false; error: string }

export type BookmarkResult =
  | { ok: true; bookmark: KnowledgeBookmark }
  | { ok: false; error: string }

export type DeleteResult = { ok: boolean; error?: string }

export async function generateIndustryTrendsAction(): Promise<TechPulseResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  try {
    const pulse = await generateIndustryTrends()
    return { ok: true, pulse }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת הטרנדים. נסה שוב.' }
  }
}

export async function generateInterviewPrepAction(
  formData: FormData
): Promise<InterviewPrepActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const topic = ((formData.get('topic') as string | null) ?? '').trim()
  if (!topic) return { ok: false, error: 'יש להזין נושא לראיון' }
  if (topic.length < 2) return { ok: false, error: 'נושא הראיון קצר מדי' }
  if (topic.length > 100) return { ok: false, error: 'נושא הראיון ארוך מדי (מקסימום 100 תווים)' }

  try {
    const result = await generateInterviewPrep(topic)
    return { ok: true, result }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת שאלות הראיון. נסה שוב.' }
  }
}

export async function saveBookmarkAction(formData: FormData): Promise<BookmarkResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const title = ((formData.get('title') as string | null) ?? '').trim()
  const content = ((formData.get('content') as string | null) ?? '').trim()
  const source = (formData.get('source') as string | null) ?? ''

  if (!title || !content) return { ok: false, error: 'כותרת ותוכן נדרשים' }
  if (source !== 'trend' && source !== 'interview') {
    return { ok: false, error: 'מקור לא תקין' }
  }

  const { data, error } = await supabase
    .from('knowledge_bookmarks')
    .insert({ user_id: user.id, title, content, source })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: 'שגיאה בשמירת הסימניה. נסה שוב.' }
  }

  return { ok: true, bookmark: data as KnowledgeBookmark }
}

export async function deleteBookmarkAction(formData: FormData): Promise<DeleteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  if (!id) return { ok: false, error: 'מזהה הסימנייה חסר' }

  const { error } = await supabase
    .from('knowledge_bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה במחיקת הסימנייה' }
  return { ok: true }
}
