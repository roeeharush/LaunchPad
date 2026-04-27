// @vitest-environment jsdom
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { JobCardSkeleton, TrendCardSkeleton } from './skeleton-card'

describe('JobCardSkeleton', () => {
  it('renders a card shell with multiple skeleton elements', () => {
    const { container } = render(<JobCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(5)
  })
})

describe('TrendCardSkeleton', () => {
  it('renders a card shell with multiple skeleton elements', () => {
    const { container } = render(<TrendCardSkeleton />)
    expect(container.firstChild).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4)
  })
})
