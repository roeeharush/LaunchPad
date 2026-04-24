import { describe, it, expect } from 'vitest'
import messages from '../messages/he.json'

describe('Hebrew messages', () => {
  it('has nav translations', () => {
    expect(messages.nav.dashboard).toBe('לוח בקרה')
    expect(messages.nav.resume).toBe('ניתוח קורות חיים')
  })

  it('has landing translations', () => {
    expect(messages.landing.hero.headline).toBe('העבודה הראשונה שלך בהייטק מתחילה כאן.')
    expect(messages.landing.nav.signup).toBe('התחל חינם')
  })

  it('has resume dimensions', () => {
    expect(messages.resume.dimensions.structure).toBe('מבנה וקריאות')
  })
})
