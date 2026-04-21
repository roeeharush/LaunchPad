import { describe, it, expect } from 'vitest'
import type { ResumeMatchAnalysis, ResumeRecord } from '@/types/resume'

describe('ResumeMatchAnalysis type', () => {
  it('accepts a valid analysis object', () => {
    const analysis: ResumeMatchAnalysis = {
      matchPercentage: 78,
      strengths: ['ניסיון ב-React', 'פרויקטים אישיים'],
      gaps: ['חסר ניסיון ב-TypeScript'],
      tips: ['הוסף TypeScript לפרויקטים הקיימים'],
    }
    expect(analysis.matchPercentage).toBe(78)
    expect(analysis.strengths).toHaveLength(2)
  })

  it('accepts a ResumeRecord with null analysis', () => {
    const record: ResumeRecord = {
      id: 'abc',
      user_id: 'u1',
      file_url: null,
      extracted_text: 'some text',
      analysis_json: null,
      score: null,
      created_at: new Date().toISOString(),
    }
    expect(record.analysis_json).toBeNull()
  })
})
