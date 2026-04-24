import { describe, it, expect } from 'vitest'
import { parseJobSuggestions } from '@/lib/ai/generate-job-suggestions'

const validRaw = {
  basedOn: 'React, TypeScript, Node.js',
  jobs: [
    {
      title: 'Frontend Developer',
      company: 'Wix',
      location: 'Tel Aviv',
      isRemote: false,
      isJuniorFriendly: true,
      techStack: ['React', 'TypeScript'],
      description: 'Build UI components for a leading platform.',
      matchReason: 'Your React and TypeScript projects are a strong match.',
      salaryRange: '18,000–25,000 ₪',
    },
    {
      title: 'Full Stack Developer',
      company: 'Monday.com',
      location: 'Remote',
      isRemote: true,
      isJuniorFriendly: false,
      techStack: ['Node.js', 'React'],
      description: 'Work on the core product.',
      matchReason: 'Your full-stack experience fits well.',
      salaryRange: '25,000–35,000 ₪',
    },
  ],
}

describe('parseJobSuggestions', () => {
  it('parses valid JSON and adds sequential ids', () => {
    const result = parseJobSuggestions(JSON.stringify(validRaw))
    expect(result.basedOn).toBe('React, TypeScript, Node.js')
    expect(result.jobs).toHaveLength(2)
    expect(result.jobs[0]!.id).toBe('j0')
    expect(result.jobs[1]!.id).toBe('j1')
    expect(result.jobs[0]!.isJuniorFriendly).toBe(true)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validRaw) + '\n```'
    const result = parseJobSuggestions(raw)
    expect(result.jobs).toHaveLength(2)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseJobSuggestions('not json')).toThrow()
  })

  it('throws when jobs array is missing', () => {
    const bad = { basedOn: 'React' }
    expect(() => parseJobSuggestions(JSON.stringify(bad))).toThrow()
  })

  it('throws when basedOn is missing', () => {
    const bad = { jobs: [] }
    expect(() => parseJobSuggestions(JSON.stringify(bad))).toThrow()
  })
})
