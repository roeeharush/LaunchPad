export interface TechTrend {
  title: string
  summary: string
  whyNow: string
  relevance: string
  tag: string
}

export interface TechPulse {
  username: string
  topLanguages: string[]
  trends: TechTrend[]
}

export interface InterviewQA {
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface InterviewPrepResult {
  topic: string
  questions: InterviewQA[]
}

export interface KnowledgeBookmark {
  id: string
  user_id: string
  title: string
  content: string
  source: 'trend' | 'interview'
  created_at: string
}
