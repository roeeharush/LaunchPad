import { describe, it, expect } from 'vitest'
import { parseInterviewPrep } from '@/lib/ai/generate-interview-prep'

const validResult = {
  topic: 'React Hooks',
  questions: [
    {
      question: 'What is the difference between useState and useRef?',
      answer: 'useState triggers re-renders; useRef does not.',
      difficulty: 'medium',
    },
    {
      question: 'When would you use useCallback?',
      answer: 'To memoize a callback function passed to a child component.',
      difficulty: 'hard',
    },
  ],
}

describe('parseInterviewPrep', () => {
  it('parses valid JSON response', () => {
    const result = parseInterviewPrep(JSON.stringify(validResult))
    expect(result.topic).toBe('React Hooks')
    expect(result.questions).toHaveLength(2)
    expect(result.questions[0].difficulty).toBe('medium')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validResult) + '\n```'
    const result = parseInterviewPrep(raw)
    expect(result.questions).toHaveLength(2)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseInterviewPrep('not json')).toThrow()
  })

  it('throws when topic is missing', () => {
    const bad = { questions: [] }
    expect(() => parseInterviewPrep(JSON.stringify(bad))).toThrow()
  })

  it('throws when questions array is missing', () => {
    const bad = { topic: 'React Hooks' }
    expect(() => parseInterviewPrep(JSON.stringify(bad))).toThrow()
  })
})
