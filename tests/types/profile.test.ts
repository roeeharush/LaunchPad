import { describe, it, expect } from 'vitest'
import type {
  GitHubRepo,
  GitHubProfileData,
  ProfileSubScore,
  ProfileAnalysis,
  ProfileAnalysisRecord,
} from '@/types/profile'

describe('profile types', () => {
  it('ProfileSubScore has required fields', () => {
    const sub: ProfileSubScore = { score: 80, strengths: ['a'], improvements: ['b'] }
    expect(sub.score).toBe(80)
    expect(sub.strengths).toHaveLength(1)
    expect(sub.improvements).toHaveLength(1)
  })

  it('ProfileAnalysis has techScore, professionalScore, overallBrandScore, topTips', () => {
    const analysis: ProfileAnalysis = {
      techScore: { score: 75, strengths: [], improvements: [] },
      professionalScore: { score: 65, strengths: [], improvements: [] },
      overallBrandScore: 70,
      topTips: ['tip 1'],
    }
    expect(analysis.overallBrandScore).toBe(70)
    expect(analysis.topTips).toHaveLength(1)
  })

  it('ProfileAnalysisRecord has all DB fields', () => {
    const record: ProfileAnalysisRecord = {
      id: 'uuid',
      user_id: 'uid',
      type: 'combined',
      input_text: '{}',
      result_json: null,
      created_at: new Date().toISOString(),
    }
    expect(record.type).toBe('combined')
  })

  it('GitHubRepo has required fields', () => {
    const repo: GitHubRepo = {
      name: 'my-project',
      description: null,
      stargazers_count: 5,
      forks_count: 1,
      language: 'TypeScript',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(repo.language).toBe('TypeScript')
  })

  it('GitHubProfileData has all required fields', () => {
    const profile: GitHubProfileData = {
      login: 'john-doe',
      name: 'John Doe',
      bio: 'CS student',
      public_repos: 10,
      followers: 5,
      topLanguages: { TypeScript: 50, JavaScript: 30 },
      topRepos: [],
    }
    expect(profile.login).toBe('john-doe')
    expect(profile.topLanguages).toHaveProperty('TypeScript')
  })
})
