export interface TechTrend {
  title: string
  summary: string
  whyNow: string
  impact: string
  tag: string
}

export interface TechPulse {
  generatedAt: string
  trends: TechTrend[]
}

export interface InterviewQA {
  question: string
  translationHe?: string
  answer: string
  contextHe?: string
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

export interface KnowledgeArticle {
  id: string
  category: string
  title: string
  readTime: string
  excerpt: string
  content: string
}
