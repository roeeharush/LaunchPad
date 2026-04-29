import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))
vi.mock('@/lib/parsers/extract-text', () => ({
  extractTextFromBuffer: vi
    .fn()
    .mockResolvedValue(
      'Resume text that is long enough to pass validation and exceed fifty characters minimum'
    ),
}))
vi.mock('@/lib/ai/analyze-resume', () => ({
  analyzeResume: vi.fn().mockResolvedValue({
    matchPercentage: 75,
    strengths: ['TypeScript'],
    gaps: [],
    tips: [],
  }),
}))

import { analyzeResumeAction } from '../actions'
import { createClient } from '@/lib/supabase/server'

function makeFormData() {
  const formData = new FormData()
  const file = new File(['%PDF-1.4 dummy content for testing'], 'cv.pdf', {
    type: 'application/pdf',
  })
  formData.append('file', file)
  formData.append(
    'jobDescription',
    'מפתח Full Stack בחברת סטארטאפ ישראלית עם 2 שנות ניסיון ב-TypeScript ו-React'
  )
  return formData
}

describe('analyzeResumeAction', () => {
  it('returns ok:false when DB insert fails', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'null value in column "file_url" of relation "resumes"' },
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: mockFrom,
    })

    const result = await analyzeResumeAction(makeFormData())

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/נכשלה/)
    }
  })

  it('returns ok:true with record when DB insert succeeds', async () => {
    const fakeRecord = {
      id: 'record-1',
      user_id: 'user-1',
      file_url: null,
      extracted_text: 'text',
      analysis_json: { matchPercentage: 75, strengths: ['TypeScript'], gaps: [], tips: [] },
      score: 75,
      created_at: new Date().toISOString(),
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: fakeRecord, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
      from: mockFrom,
    })

    const result = await analyzeResumeAction(makeFormData())

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.record.id).toBe('record-1')
    }
  })
})
