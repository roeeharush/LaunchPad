import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderParagraph } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page'

const color = 'oklch(0.585 0.212 264.4)'

describe('renderParagraph', () => {
  it('renders a plain paragraph with muted text', () => {
    const el = renderParagraph('פסקה רגילה של טקסט.', color, 0)
    render(el)
    expect(screen.getByText('פסקה רגילה של טקסט.')).toBeInTheDocument()
  })

  it('renders a dash paragraph with bullet prefix', () => {
    const el = renderParagraph('- פריט ברשימה', color, 1)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט ברשימה')
  })

  it('renders a numbered paragraph (digit+dot) with accent border', () => {
    const el = renderParagraph('1. פריט ממוספר', color, 2)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט ממוספר')
  })

  it('renders a (digit) paragraph with accent border', () => {
    const el = renderParagraph('(1) פריט בסוגריים', color, 3)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט בסוגריים')
  })
})
