import { describe, it, expect } from 'vitest'
import { parseLinkedInAnalysis } from '@/lib/ai/analyze-linkedin'

const validLI = {
  professionalScore: {
    score: 71,
    strengths: ['ניסיון מפורט', 'מילות מפתח טכניות'],
    improvements: ['הוסף הישגים מדידים', 'חזק את ה-About section'],
  },
  topTips: ['הוסף אחוז שיפור לכל תפקיד', 'הוסף 5 Skills נוספים'],
}

describe('parseLinkedInAnalysis', () => {
  it('parses a valid response', () => {
    const result = parseLinkedInAnalysis(JSON.stringify(validLI))
    expect(result.professionalScore.score).toBe(71)
    expect(result.professionalScore.strengths).toHaveLength(2)
    expect(result.topTips).toHaveLength(2)
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validLI) + '\n```'
    const result = parseLinkedInAnalysis(raw)
    expect(result.professionalScore.score).toBe(71)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseLinkedInAnalysis('not json')).toThrow()
  })

  it('throws when professionalScore is missing', () => {
    const bad = { topTips: [] }
    expect(() => parseLinkedInAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when topTips is missing', () => {
    const bad = { professionalScore: { score: 70, strengths: [], improvements: [] } }
    expect(() => parseLinkedInAnalysis(JSON.stringify(bad))).toThrow()
  })
})
