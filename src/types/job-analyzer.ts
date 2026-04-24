export interface CriticalSkill {
  skill: string
  whyImportant: string
  howToHighlight: string
}

export interface AnalyzerInterviewQuestion {
  question: string
  answer: string
  tip: string
}

export interface JobAnalysisResult {
  resumeMatchSummary: string
  coverLetterHe: string
  coverLetterEn: string
  criticalSkills: CriticalSkill[]
  interviewQuestions: AnalyzerInterviewQuestion[]
}
