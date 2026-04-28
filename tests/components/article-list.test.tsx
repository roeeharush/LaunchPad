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

import { ArticleList } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list'
import type { KnowledgeArticle } from '@/types/knowledge'

const mockArticles: KnowledgeArticle[] = [
  {
    id: 'hr-interview-tips',
    category: 'ראיונות',
    title: 'איך לעבור ראיון HR',
    readTime: '4',
    excerpt: 'תקציר.',
    content: 'תוכן.',
  },
  {
    id: 'github-tips',
    category: 'GitHub',
    title: 'טיפים ל-GitHub',
    readTime: '5',
    excerpt: 'תקציר GitHub.',
    content: 'תוכן GitHub.',
  },
]

describe('ArticleList', () => {
  it('renders the section title', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים מקצועיים" />)
    expect(screen.getByText('מאמרים מקצועיים')).toBeInTheDocument()
  })

  it('renders all article titles', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים" />)
    expect(screen.getByText('איך לעבור ראיון HR')).toBeInTheDocument()
    expect(screen.getByText('טיפים ל-GitHub')).toBeInTheDocument()
  })

  it('renders the article count badge', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים" />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders empty state gracefully with zero articles', () => {
    render(<ArticleList articles={[]} sectionTitle="מאמרים" />)
    expect(screen.getByText('מאמרים')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
