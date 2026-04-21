import { describe, it, expect } from 'vitest'
import { parseAnalysisResponse } from '@/lib/ai/analyze-resume'

describe('parseAnalysisResponse', () => {
  it('parses a valid JSON response', () => {
    const raw = JSON.stringify({
      matchPercentage: 82,
      strengths: ['ניסיון ב-React'],
      gaps: ['חסר TypeScript'],
      tips: ['הוסף TypeScript'],
    })
    const result = parseAnalysisResponse(raw)
    expect(result.matchPercentage).toBe(82)
    expect(result.strengths).toHaveLength(1)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n{"matchPercentage":70,"strengths":[],"gaps":[],"tips":[]}\n```'
    const result = parseAnalysisResponse(raw)
    expect(result.matchPercentage).toBe(70)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseAnalysisResponse('not json')).toThrow()
  })

  it('throws when required fields are missing', () => {
    expect(() => parseAnalysisResponse(JSON.stringify({ matchPercentage: 50 }))).toThrow()
  })
})
