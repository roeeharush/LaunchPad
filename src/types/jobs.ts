export interface JobSuggestion {
  id: string
  title: string
  company: string
  location: string
  isRemote: boolean
  isJuniorFriendly: boolean
  techStack: string[]
  description: string
  matchReason: string
  salaryRange: string
}

export interface JobSuggestionsResult {
  jobs: JobSuggestion[]
  basedOn: string
}

export type ApplicationStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface JobApplication {
  id: string
  user_id: string
  job_title: string
  company: string
  location: string | null
  is_remote: boolean
  tech_stack: string[]
  status: ApplicationStatus
  notes: string | null
  applied_at: string
  created_at: string
}
