import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { upgradePlanAction } from '../actions'
import { createClient } from '@/lib/supabase/server'

const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

function makeMockClient(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
      }),
    },
    from: mockFrom,
  }
}

describe('upgradePlanAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns ok:false when user is not authenticated', async () => {
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockClient(null))
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeDefined()
    }
  })

  it('returns ok:true and upserts the plan when authenticated', async () => {
    mockUpsert.mockResolvedValue({ error: null })
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockClient('user-123')
    )
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-123', plan: 'pro' })
    )
  })

  it('returns ok:false when the upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'db error' } })
    ;(createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMockClient('user-123')
    )
    const result = await upgradePlanAction('pro')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeDefined()
    }
  })
})
