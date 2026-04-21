import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test'
})

describe('supabase clients', () => {
  it('browser createClient is a function and returns a client', async () => {
    const mod = await import('@/lib/supabase/client')
    expect(typeof mod.createClient).toBe('function')
    const client = mod.createClient()
    expect(client).toBeTruthy()
  })

  it('server createClient is an async function', async () => {
    const mod = await import('@/lib/supabase/server')
    expect(typeof mod.createClient).toBe('function')
    // An async function's constructor name is 'AsyncFunction'
    expect(mod.createClient.constructor.name).toBe('AsyncFunction')
  })
})
