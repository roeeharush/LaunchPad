import { describe, it, expect } from 'vitest'
import { computeTopLanguages } from '@/lib/github/fetch-profile'
import type { GitHubRepo } from '@/types/profile'

const makeRepo = (language: string | null): GitHubRepo => ({
  name: 'repo',
  description: null,
  stargazers_count: 0,
  forks_count: 0,
  language,
  updated_at: '2024-01-01T00:00:00Z',
})

describe('computeTopLanguages', () => {
  it('counts languages across repos', () => {
    const repos = [makeRepo('TypeScript'), makeRepo('TypeScript'), makeRepo('Python')]
    const result = computeTopLanguages(repos)
    expect(result['TypeScript']).toBe(2)
    expect(result['Python']).toBe(1)
  })

  it('ignores repos with null language', () => {
    const repos = [makeRepo(null), makeRepo('Go')]
    const result = computeTopLanguages(repos)
    expect(Object.keys(result)).toHaveLength(1)
    expect(result['Go']).toBe(1)
  })

  it('returns empty object for empty array', () => {
    expect(computeTopLanguages([])).toEqual({})
  })
})
