import { describe, it, expect } from 'vitest'
import type {
  TechTrend,
  TechPulse,
  InterviewQA,
  InterviewPrepResult,
  KnowledgeBookmark,
} from '@/types/knowledge'

describe('knowledge types', () => {
  it('TechTrend has required fields', () => {
    const trend: TechTrend = {
      title: 'Rust for Systems',
      summary: 'Rust continues to grow.',
      whyNow: 'Companies adopt it for performance.',
      relevance: 'You already code in C++.',
      tag: 'Systems',
    }
    expect(trend.title).toBe('Rust for Systems')
    expect(trend.tag).toBe('Systems')
  })

  it('TechPulse has username, topLanguages, and trends array', () => {
    const pulse: TechPulse = {
      username: 'roeeharush',
      topLanguages: ['TypeScript', 'Python'],
      trends: [],
    }
    expect(pulse.username).toBe('roeeharush')
    expect(pulse.topLanguages).toHaveLength(2)
  })

  it('InterviewQA has question, answer, difficulty', () => {
    const qa: InterviewQA = {
      question: 'What is a closure?',
      answer: 'A closure is a function that captures its lexical scope.',
      difficulty: 'medium',
    }
    expect(qa.difficulty).toBe('medium')
  })

  it('InterviewPrepResult has topic and questions array', () => {
    const result: InterviewPrepResult = {
      topic: 'React Hooks',
      questions: [],
    }
    expect(result.topic).toBe('React Hooks')
  })

  it('KnowledgeBookmark has all DB fields', () => {
    const bookmark: KnowledgeBookmark = {
      id: 'uuid',
      user_id: 'uid',
      title: 'Trend title',
      content: 'Content body',
      source: 'trend',
      created_at: new Date().toISOString(),
    }
    expect(bookmark.source).toBe('trend')
  })
})
