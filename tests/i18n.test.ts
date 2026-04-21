import { describe, it, expect } from 'vitest'
import messages from '../messages/he.json'

describe('Hebrew messages', () => {
  it('has nav translations', () => {
    expect(messages.nav.dashboard).toBe('לוח בקרה')
    expect(messages.nav.resume).toBe('ניתוח קורות חיים')
  })

  it('has landing translations', () => {
    expect(messages.landing.headline).toBe('מפסיק לנחש, מתחיל לבלוט')
    expect(messages.landing.cta).toBe('התחל בחינם')
  })

  it('has resume dimensions', () => {
    expect(messages.resume.dimensions.structure).toBe('מבנה וקריאות')
  })
})
