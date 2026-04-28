import { describe, it, expect } from 'vitest'
import { parseTechPulse } from '@/lib/ai/generate-trends'

const validPulse = {
  generatedAt: new Date().toISOString(),
  trends: [
    {
      title: 'AI-Augmented Development',
      summary: 'AI coding tools are transforming workflows.',
      whyNow: 'GitHub Copilot usage doubled this year.',
      impact: 'Developers who adopt AI tools ship 40% faster.',
      tag: 'AI/ML',
    },
  ],
}

describe('parseTechPulse', () => {
  it('parses valid JSON response', () => {
    const result = parseTechPulse(JSON.stringify(validPulse))
    expect(result.generatedAt).toBeTruthy()
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
    const bad = { generatedAt: new Date().toISOString() }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })

  it('throws when generatedAt is missing', () => {
    const bad = { trends: [] }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })
})
