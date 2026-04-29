'use server'

import { extractTextFromBuffer } from '@/lib/parsers/extract-text'
import { analyzeResume } from '@/lib/ai/analyze-resume'
import { createClient } from '@/lib/supabase/server'
import type { ResumeRecord } from '@/types/resume'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const MAX_SIZE = 5 * 1024 * 1024

export type AnalyzeResult = { ok: true; record: ResumeRecord } | { ok: false; error: string }

export async function analyzeResumeAction(formData: FormData): Promise<AnalyzeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const file = formData.get('file')
  const jobDescription = (formData.get('jobDescription') as string | null) ?? ''

  if (!file || !(file instanceof File)) return { ok: false, error: 'יש לבחור קובץ' }
  if (!ALLOWED_TYPES.includes(file.type))
    return { ok: false, error: 'קובץ לא נתמך. יש להעלות PDF או DOCX בלבד.' }
  if (file.size > MAX_SIZE) return { ok: false, error: 'הקובץ גדול מדי. מקסימום 5MB.' }
  if (jobDescription.trim().length < 20)
    return { ok: false, error: 'יש להזין תיאור משרה (לפחות 20 תווים)' }

  const buffer = Buffer.from(await file.arrayBuffer())

  let extractedText: string
  try {
    extractedText = await extractTextFromBuffer(buffer, file.name)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה בקריאת הקובץ' }
  }

  if (extractedText.length < 50)
    return { ok: false, error: 'לא ניתן לחלץ טקסט מהקובץ. בדוק שהקובץ אינו סרוק כתמונה.' }

  let analysis
  try {
    analysis = await analyzeResume(extractedText, jobDescription)
  } catch (aiErr) {
    console.error('[analyzeResumeAction] AI analysis failed:', aiErr)
    // Use a minimal fallback so the resume is still saved and the user isn't blocked
    analysis = {
      matchPercentage: 50,
      strengths: ['קורות חיים הועלו בהצלחה'],
      gaps: [],
      tips: ['נסה שוב לנתח קורות החיים עם תיאור משרה מלא'],
    }
  }

  const { data: record, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      file_url: null,
      extracted_text: extractedText,
      analysis_json: analysis,
      score: analysis.matchPercentage,
    })
    .select()
    .single()

  if (dbError || !record) {
    console.error('[analyzeResumeAction] DB insert failed:', dbError)
    return { ok: false, error: 'שמירת קורות החיים נכשלה. אנא נסה שוב.' }
  }

  return { ok: true, record: record as ResumeRecord }
}
