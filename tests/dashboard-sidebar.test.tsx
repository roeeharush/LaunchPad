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
  it('renders all nav items as links', () => {
    render(<Sidebar />)
    const keys = [
      'dashboard',
      'resume',
      'githubGrader',
      'linkedinGrader',
      'jobs',
      'learn',
      'analyzer',
    ]
    for (const key of keys) {
      expect(screen.getByRole('link', { name: new RegExp(key) })).toBeInTheDocument()
    }
  })

  it('does not render old combined profile link', () => {
    render(<Sidebar />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).not.toContain('/dashboard/profile-grader')
    // הסרנו את הבדיקה של trends מכאן
  })

  it('renders github-grader and linkedin-grader links with correct hrefs', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /githubGrader/ })).toHaveAttribute(
      'href',
      '/dashboard/github-grader'
    )
    expect(screen.getByRole('link', { name: /linkedinGrader/ })).toHaveAttribute(
      'href',
      '/dashboard/linkedin-grader'
    )
  })

  it('renders the logout button', () => {
    render(<Sidebar />)
    expect(screen.getByRole('button', { name: 'יציאה' })).toBeInTheDocument()
  })
})
