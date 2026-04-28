import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { ArticleCard } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card'
import type { KnowledgeArticle } from '@/types/knowledge'

const mockArticle: KnowledgeArticle = {
  id: 'hr-interview-tips',
  category: 'ראיונות',
  title: 'איך לעבור ראיון HR בהצלחה',
  readTime: '4',
  excerpt: 'ראיון HR הוא השלב הראשון.',
  content: 'תוכן המאמר.',
}

describe('ArticleCard', () => {
  it('renders the article title', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('איך לעבור ראיון HR בהצלחה')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('ראיונות')).toBeInTheDocument()
  })

  it('renders the excerpt', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('ראיון HR הוא השלב הראשון.')).toBeInTheDocument()
  })

  it('links to the correct article route', () => {
    render(<ArticleCard article={mockArticle} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/knowledge-hub/hr-interview-tips')
  })

  it('renders read time', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText(/4/)).toBeInTheDocument()
  })
})
