import { describe, it, expect } from 'vitest'
import type {
  TechTrend,
  TechPulse,
  InterviewQA,
  InterviewPrepResult,
  KnowledgeBookmark,
  KnowledgeArticle,
} from '@/types/knowledge'

describe('knowledge types', () => {
  it('TechTrend has required fields', () => {
    const trend: TechTrend = {
      title: 'Rust for Systems',
      summary: 'Rust continues to grow.',
      whyNow: 'Companies adopt it for performance.',
      impact: 'Systems engineers who learn Rust gain significant hiring advantage.',
      tag: 'Systems',
    }
    expect(trend.title).toBe('Rust for Systems')
    expect(trend.tag).toBe('Systems')
  })

  it('TechPulse has generatedAt and trends array', () => {
    const pulse: TechPulse = {
      generatedAt: new Date().toISOString(),
      trends: [],
    }
    expect(pulse.generatedAt).toBeTruthy()
    expect(pulse.trends).toHaveLength(0)
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

  it('KnowledgeArticle has all required fields', () => {
    const article: KnowledgeArticle = {
      id: 'hr-interview-tips',
      category: 'ראיונות',
      title: 'איך לעבור ראיון HR בהצלחה',
      readTime: '4',
      excerpt: 'ראיון HR הוא השלב הראשון.',
      content: 'פסקה ראשונה.\n\nפסקה שנייה.',
    }
    expect(article.id).toBe('hr-interview-tips')
    expect(article.readTime).toBe('4')
  })
})
