export interface GitHubRepo {
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
}

export interface GitHubProfileData {
  login: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  topLanguages: Record<string, number>
  topRepos: GitHubRepo[]
}

export interface ProfileSubScore {
  score: number
  strengths: string[]
  improvements: string[]
}

export interface ProfileAnalysis {
  techScore: ProfileSubScore
  professionalScore: ProfileSubScore
  overallBrandScore: number
  topTips: string[]
}

export interface ProfileAnalysisRecord {
  id: string
  user_id: string
  type: 'linkedin' | 'github' | 'combined'
  input_text: string | null
  result_json: ProfileAnalysis | null
  created_at: string
}
