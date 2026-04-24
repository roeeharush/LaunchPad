import { describe, it, expect } from 'vitest'
import { parseJobAnalysis } from '@/lib/ai/analyze-job-listing'

const validResult = {
  resumeMatchSummary: 'הפרופיל מתאים מאוד למשרה.',
  coverLetterHe: 'שלום, אני מעוניין במשרה...',
  coverLetterEn: 'Dear Hiring Manager, I am interested in...',
  criticalSkills: [
    { skill: 'React', whyImportant: 'Core framework', howToHighlight: 'Show projects' },
    { skill: 'TypeScript', whyImportant: 'Required', howToHighlight: 'Mention strict mode' },
    { skill: 'Node.js', whyImportant: 'Backend needed', howToHighlight: 'Show REST APIs' },
    { skill: 'SQL', whyImportant: 'Data queries', howToHighlight: 'Describe schema design' },
    { skill: 'Git', whyImportant: 'Workflow', howToHighlight: 'Mention PRs and branching' },
  ],
  interviewQuestions: [
    { question: 'What is a closure?', answer: 'A closure...', tip: 'Give a code example' },
    { question: 'Explain REST', answer: 'REST is...', tip: 'Mention statelessness' },
    { question: 'How do you debug?', answer: 'I use...', tip: 'Mention real tools' },
  ],
}

describe('parseJobAnalysis', () => {
  it('parses a valid JSON response', () => {
    const result = parseJobAnalysis(JSON.stringify(validResult))
    expect(result.resumeMatchSummary).toBe('הפרופיל מתאים מאוד למשרה.')
    expect(result.coverLetterHe).toContain('אני מעוניין')
    expect(result.coverLetterEn).toContain('Dear Hiring Manager')
    expect(result.criticalSkills).toHaveLength(5)
    expect(result.interviewQuestions).toHaveLength(3)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validResult) + '\n```'
    const result = parseJobAnalysis(raw)
    expect(result.criticalSkills[0].skill).toBe('React')
  })

  it('throws on invalid JSON', () => {
    expect(() => parseJobAnalysis('not json')).toThrow('תשובת ה-AI אינה JSON תקני')
  })

  it('throws when coverLetterHe is missing', () => {
    const bad = { ...validResult, coverLetterHe: undefined }
    expect(() => parseJobAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when coverLetterEn is missing', () => {
    const bad = { ...validResult, coverLetterEn: undefined }
    expect(() => parseJobAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when criticalSkills is missing', () => {
    const bad = { ...validResult, criticalSkills: undefined }
    expect(() => parseJobAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when interviewQuestions is missing', () => {
    const bad = { ...validResult, interviewQuestions: undefined }
    expect(() => parseJobAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when resumeMatchSummary is missing', () => {
    const bad = { ...validResult, resumeMatchSummary: undefined }
    expect(() => parseJobAnalysis(JSON.stringify(bad))).toThrow()
  })
})
