import { describe, it, expect } from 'vitest'

describe('Vitest environment', () => {
  it('is wired up correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('supports async tests', async () => {
    const result = await Promise.resolve('שלום עולם')
    expect(result).toBe('שלום עולם')
  })
})
