import { describe, it, expect } from 'vitest'
import { parseTechPulse } from '@/lib/ai/generate-trends'

const validPulse = {
  username: 'roeeharush',
  topLanguages: ['TypeScript', 'Python'],
  trends: [
    {
      title: 'AI-Augmented Development',
      summary: 'AI coding tools are transforming workflows.',
      whyNow: 'GitHub Copilot usage doubled this year.',
      relevance: 'TypeScript developers benefit most from AI completions.',
      tag: 'AI/ML',
    },
  ],
}

describe('parseTechPulse', () => {
  it('parses valid JSON response', () => {
    const result = parseTechPulse(JSON.stringify(validPulse))
    expect(result.username).toBe('roeeharush')
    expect(result.topLanguages).toHaveLength(2)
    expect(result.trends).toHaveLength(1)
    expect(result.trends[0]!.tag).toBe('AI/ML')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validPulse) + '\n```'
    const result = parseTechPulse(raw)
    expect(result.trends).toHaveLength(1)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseTechPulse('not json')).toThrow()
  })

  it('throws when trends array is missing', () => {
    const bad = { username: 'x', topLanguages: [] }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })

  it('throws when username is missing', () => {
    const bad = { topLanguages: ['TypeScript'], trends: [] }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })
})
