import { describe, it, expect } from 'vitest'
import type {
  JobSuggestion,
  JobSuggestionsResult,
  ApplicationStatus,
  JobApplication,
} from '@/types/jobs'

describe('jobs types', () => {
  it('JobSuggestion has all required fields', () => {
    const job: JobSuggestion = {
      id: 'j0',
      title: 'Frontend Developer',
      company: 'Wix',
      location: 'Tel Aviv',
      isRemote: false,
      isJuniorFriendly: true,
      techStack: ['React', 'TypeScript'],
      description: 'Build UI components.',
      matchReason: 'Your React projects align.',
      salaryRange: '18,000–25,000 ₪',
    }
    expect(job.title).toBe('Frontend Developer')
    expect(job.isJuniorFriendly).toBe(true)
    expect(job.techStack).toHaveLength(2)
  })

  it('JobSuggestionsResult has jobs array and basedOn string', () => {
    const result: JobSuggestionsResult = {
      jobs: [],
      basedOn: 'React, TypeScript',
    }
    expect(result.basedOn).toBe('React, TypeScript')
  })

  it('ApplicationStatus is a valid union literal', () => {
    const statuses: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']
    expect(statuses).toHaveLength(4)
  })

  it('JobApplication has all DB fields', () => {
    const app: JobApplication = {
      id: 'uuid',
      user_id: 'uid',
      job_title: 'Backend Dev',
      company: 'Monday.com',
      location: 'Remote',
      is_remote: true,
      tech_stack: ['Node.js', 'PostgreSQL'],
      status: 'applied',
      notes: null,
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    expect(app.status).toBe('applied')
    expect(app.is_remote).toBe(true)
  })
})
