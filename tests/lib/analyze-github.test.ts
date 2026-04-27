import { describe, it, expect } from 'vitest'
import { parseGitHubAnalysis } from '@/lib/ai/analyze-github'

const validGH = {
  techScore: {
    score: 82,
    strengths: ['23 ריפוזיטוריז ציבוריים', 'TypeScript ו-React'],
    improvements: ['הוסף READMEs', 'פרסם דוגמאות חיות'],
  },
  topTips: ['נעץ 3 פרויקטים מובילים', 'הוסף ביו ב-GitHub'],
}

describe('parseGitHubAnalysis', () => {
  it('parses a valid response', () => {
    const result = parseGitHubAnalysis(JSON.stringify(validGH))
    expect(result.techScore.score).toBe(82)
    expect(result.techScore.strengths).toHaveLength(2)
    expect(result.topTips).toHaveLength(2)
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validGH) + '\n```'
    const result = parseGitHubAnalysis(raw)
    expect(result.techScore.score).toBe(82)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseGitHubAnalysis('not json')).toThrow()
  })

  it('throws when techScore is missing', () => {
    const bad = { topTips: [] }
    expect(() => parseGitHubAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when topTips is missing', () => {
    const bad = { techScore: { score: 70, strengths: [], improvements: [] } }
    expect(() => parseGitHubAnalysis(JSON.stringify(bad))).toThrow()
  })
})
