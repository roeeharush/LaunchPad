// @vitest-environment jsdom
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders a div with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('applies additional className props', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />)
    expect(container.firstChild).toHaveClass('h-4', 'w-full', 'animate-pulse')
  })
})
