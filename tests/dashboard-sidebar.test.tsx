import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/he/dashboard',
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

import { Sidebar } from '@/components/layout/sidebar'

describe('Sidebar', () => {
  it('renders all 6 nav items as links', () => {
    render(<Sidebar />)
    const keys = ['dashboard', 'resume', 'profile', 'trends', 'jobs', 'learn']
    for (const key of keys) {
      expect(screen.getByRole('link', { name: new RegExp(key) })).toBeInTheDocument()
    }
  })

  it('renders the logout button', () => {
    render(<Sidebar />)
    expect(screen.getByRole('button', { name: 'יציאה' })).toBeInTheDocument()
  })
})
