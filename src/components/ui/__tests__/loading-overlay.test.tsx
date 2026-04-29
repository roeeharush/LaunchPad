// @vitest-environment jsdom
import { render, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LoadingOverlay } from '../loading-overlay'

describe('LoadingOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <LoadingOverlay isVisible={false} messages={['מנתח...', 'בודק...']} tip="טיפ מועיל" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders overlay when isVisible is true', () => {
    const { getByText } = render(
      <LoadingOverlay isVisible={true} messages={['מנתח...', 'בודק...']} tip="טיפ מועיל" />
    )
    expect(getByText('מנתח...')).toBeInTheDocument()
    expect(getByText('טיפ מועיל')).toBeInTheDocument()
  })

  it('rotates to the next message after 3 seconds', () => {
    const { getByText } = render(
      <LoadingOverlay isVisible={true} messages={['הודעה ראשונה', 'הודעה שנייה']} tip="טיפ" />
    )
    expect(getByText('הודעה ראשונה')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(3300)
    })
    expect(getByText('הודעה שנייה')).toBeInTheDocument()
  })
})
