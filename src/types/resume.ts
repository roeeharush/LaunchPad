export interface ResumeMatchAnalysis {
  matchPercentage: number
  strengths: string[]
  gaps: string[]
  tips: string[]
}

export interface ResumeRecord {
  id: string
  user_id: string
  file_url: string | null
  extracted_text: string | null
  analysis_json: ResumeMatchAnalysis | null
  score: number | null
  created_at: string
}
