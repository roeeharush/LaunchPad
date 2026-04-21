import { describe, it, expect } from 'vitest'
import { parseProfileAnalysis } from '@/lib/ai/analyze-profile'

const validAnalysis = {
  techScore: { score: 78, strengths: ['פרויקטים מגוונים'], improvements: ['הוסף READMEs'] },
  professionalScore: { score: 65, strengths: ['ניסיון מפורט'], improvements: ['הוסף keywords'] },
  overallBrandScore: 72,
  topTips: ['צור README ל-3 פרויקטים מובילים'],
}

describe('parseProfileAnalysis', () => {
  it('parses a valid JSON response', () => {
    const result = parseProfileAnalysis(JSON.stringify(validAnalysis))
    expect(result.techScore.score).toBe(78)
    expect(result.professionalScore.score).toBe(65)
    expect(result.overallBrandScore).toBe(72)
    expect(result.topTips).toHaveLength(1)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validAnalysis) + '\n```'
    const result = parseProfileAnalysis(raw)
    expect(result.overallBrandScore).toBe(72)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseProfileAnalysis('not json')).toThrow()
  })

  it('throws when techScore is missing', () => {
    const bad = { professionalScore: {}, overallBrandScore: 70, topTips: [] }
    expect(() => parseProfileAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when overallBrandScore is missing', () => {
    const bad = {
      techScore: { score: 70, strengths: [], improvements: [] },
      professionalScore: { score: 60, strengths: [], improvements: [] },
      topTips: [],
    }
    expect(() => parseProfileAnalysis(JSON.stringify(bad))).toThrow()
  })
})
