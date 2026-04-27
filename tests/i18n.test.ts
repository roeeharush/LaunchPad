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

  it('has githubGrader translations', () => {
    expect(messages.githubGrader.title).toBe('GitHub Grader')
    expect(messages.githubGrader.analyze).toBe('נתח GitHub')
  })

  it('has linkedinGrader translations', () => {
    expect(messages.linkedinGrader.title).toBe('LinkedIn Grader')
    expect(messages.linkedinGrader.analyze).toBe('נתח LinkedIn')
  })

  it('has grader nav translations', () => {
    expect(messages.nav.githubGrader).toBe('GitHub Grader')
    expect(messages.nav.linkedinGrader).toBe('LinkedIn Grader')
  })

  it('has job onboarding translations', () => {
    expect(messages.jobs.step1Title).toBe('העלה קורות חיים')
    expect(messages.jobs.uploadNow).toBe('העלה קורות חיים עכשיו')
  })

  it('has knowledge hub tooltip translations', () => {
    expect(messages.knowledge.pulseDesc).toBe('טרנדים מותאמים לשפות ה-GitHub שלך')
    expect(messages.knowledge.bookmarksTooltip).toContain('ניתן לעיין בהם')
  })
})
