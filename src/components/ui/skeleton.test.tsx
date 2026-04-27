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

  it('includes data-slot="skeleton"', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('data-slot', 'skeleton')
  })

  it('forwards arbitrary HTML props to the div', () => {
    const { container } = render(<Skeleton aria-label="loading" id="sk-1" />)
    expect(container.firstChild).toHaveAttribute('aria-label', 'loading')
    expect(container.firstChild).toHaveAttribute('id', 'sk-1')
  })
})
