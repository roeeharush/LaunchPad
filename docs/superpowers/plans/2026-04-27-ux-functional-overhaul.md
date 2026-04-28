# LaunchPad UX & Functional Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six coordinated improvements: split Profile Grader into two focused routes, add Job Search onboarding, redesign Knowledge Hub as a learning center, verify Job Analyzer Hebrew output, fix broken navigation hrefs, and add RTL consistency tweaks.

**Architecture:** Each change is isolated to its own route or component. Foundation tasks (types, translations, nav) run first; feature tasks are independent after that. No schema migrations are required — `profile_analyses.type` already supports `'github' | 'linkedin'`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase, `@anthropic-ai/sdk`, `next-intl`, Tailwind CSS v4, Vitest + Testing Library.

---

## File Map

| Status | File                                                                                            | Change                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Modify | `src/types/profile.ts`                                                                          | Add `GitHubAnalysis`, `LinkedInAnalysis`; widen `result_json` union                                                               |
| Modify | `messages/he.json`                                                                              | Add `nav.githubGrader`, `nav.linkedinGrader`, `githubGrader.*`, `linkedinGrader.*`, `jobs.step*`, `knowledge.pulseDesc/Tooltip/*` |
| Modify | `src/components/layout/sidebar.tsx`                                                             | Fix `/trends` href; replace `profile` item with two grader items                                                                  |
| Modify | `src/app/[locale]/(protected)/dashboard/page.tsx`                                               | Fix all six module hrefs                                                                                                          |
| Create | `src/lib/ai/analyze-github.ts`                                                                  | GitHub-only AI scorer                                                                                                             |
| Create | `src/lib/ai/analyze-linkedin.ts`                                                                | LinkedIn-only AI scorer                                                                                                           |
| Create | `src/components/graders/score-card.tsx`                                                         | Shared ScoreCard (moved from profile-grader)                                                                                      |
| Create | `src/app/[locale]/(protected)/dashboard/github-grader/page.tsx`                                 | Server page                                                                                                                       |
| Create | `src/app/[locale]/(protected)/dashboard/github-grader/actions.ts`                               | Server action                                                                                                                     |
| Create | `src/app/[locale]/(protected)/dashboard/github-grader/_components/github-grader-client.tsx`     | Client component                                                                                                                  |
| Create | `src/app/[locale]/(protected)/dashboard/linkedin-grader/page.tsx`                               | Server page                                                                                                                       |
| Create | `src/app/[locale]/(protected)/dashboard/linkedin-grader/actions.ts`                             | Server action                                                                                                                     |
| Create | `src/app/[locale]/(protected)/dashboard/linkedin-grader/_components/linkedin-grader-client.tsx` | Client component                                                                                                                  |
| Delete | `src/app/[locale]/(protected)/dashboard/profile-grader/`                                        | Entire directory                                                                                                                  |
| Modify | `src/app/[locale]/(protected)/dashboard/job-search/page.tsx`                                    | Add resume check query                                                                                                            |
| Modify | `src/app/[locale]/(protected)/dashboard/job-search/_components/job-search-client.tsx`           | Add onboarding state                                                                                                              |
| Modify | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx`     | Redesign nav to 3-card grid                                                                                                       |
| Modify | `src/app/[locale]/(protected)/dashboard/job-analyzer/_components/cover-letter-panel.tsx`        | Add info badge                                                                                                                    |
| Create | `tests/lib/analyze-github.test.ts`                                                              | Parser unit tests                                                                                                                 |
| Create | `tests/lib/analyze-linkedin.test.ts`                                                            | Parser unit tests                                                                                                                 |
| Modify | `tests/types/profile.test.ts`                                                                   | Add `GitHubAnalysis` / `LinkedInAnalysis` assertions                                                                              |
| Modify | `tests/dashboard-sidebar.test.tsx`                                                              | Update nav key assertions                                                                                                         |
| Modify | `tests/i18n.test.ts`                                                                            | Add new translation key assertions                                                                                                |

---

## Task 1: Extend TypeScript Types and he.json Translations

**Files:**

- Modify: `src/types/profile.ts`
- Modify: `messages/he.json`
- Modify: `tests/types/profile.test.ts`
- Modify: `tests/i18n.test.ts`

- [ ] **Step 1: Write the failing type tests**

Open `tests/types/profile.test.ts` and add at the bottom (after existing tests):

```ts
import type { GitHubAnalysis, LinkedInAnalysis } from '@/types/profile'

// add inside the existing describe block:
it('GitHubAnalysis has techScore and topTips', () => {
  const a: GitHubAnalysis = {
    techScore: { score: 80, strengths: ['good repos'], improvements: ['add READMEs'] },
    topTips: ['pin 3 projects'],
  }
  expect(a.techScore.score).toBe(80)
  expect(a.topTips).toHaveLength(1)
})

it('LinkedInAnalysis has professionalScore and topTips', () => {
  const a: LinkedInAnalysis = {
    professionalScore: {
      score: 70,
      strengths: ['clear experience'],
      improvements: ['add keywords'],
    },
    topTips: ['update headline'],
  }
  expect(a.professionalScore.score).toBe(70)
  expect(a.topTips).toHaveLength(1)
})

it('ProfileAnalysisRecord.result_json accepts GitHubAnalysis', () => {
  const gh: GitHubAnalysis = {
    techScore: { score: 75, strengths: [], improvements: [] },
    topTips: [],
  }
  const record: ProfileAnalysisRecord = {
    id: 'x',
    user_id: 'u',
    type: 'github',
    input_text: '{}',
    result_json: gh,
    created_at: new Date().toISOString(),
  }
  expect(record.type).toBe('github')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "c:/Projects/Claude/Projects/SelfSoftware/launchpad"
npx vitest run tests/types/profile.test.ts
```

Expected: FAIL — `GitHubAnalysis` not found.

- [ ] **Step 3: Add new interfaces to `src/types/profile.ts`**

Replace the existing file content with:

```ts
export interface GitHubRepo {
  name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
}

export interface GitHubProfileData {
  login: string
  name: string | null
  bio: string | null
  public_repos: number
  followers: number
  topLanguages: Record<string, number>
  topRepos: GitHubRepo[]
}

export interface ProfileSubScore {
  score: number
  strengths: string[]
  improvements: string[]
}

export interface GitHubAnalysis {
  techScore: ProfileSubScore
  topTips: string[]
}

export interface LinkedInAnalysis {
  professionalScore: ProfileSubScore
  topTips: string[]
}

export interface ProfileAnalysis {
  techScore: ProfileSubScore
  professionalScore: ProfileSubScore
  overallBrandScore: number
  topTips: string[]
}

export interface ProfileAnalysisRecord {
  id: string
  user_id: string
  type: 'linkedin' | 'github' | 'combined'
  input_text: string | null
  result_json: ProfileAnalysis | GitHubAnalysis | LinkedInAnalysis | null
  created_at: string
}
```

- [ ] **Step 4: Run type tests — must pass**

```bash
npx vitest run tests/types/profile.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Add all new translation keys to `messages/he.json`**

Open `messages/he.json`. After the `"nav"` object (add `githubGrader` and `linkedinGrader` keys inside it), and add top-level `"githubGrader"` and `"linkedinGrader"` objects. Also extend `"jobs"` and `"knowledge"`.

**In `"nav"` object** — add after `"analyzer"`:

```json
"githubGrader": "GitHub Grader",
"linkedinGrader": "LinkedIn Grader"
```

**New top-level `"githubGrader"` object** — add after `"profile"` object:

```json
"githubGrader": {
  "title": "GitHub Grader",
  "subtitle": "ניתוח ריפוזיטוריז, שפות וחוזק טכני",
  "breadcrumb": "ניתוח GitHub",
  "analyze": "נתח GitHub",
  "analyzing": "מנתח...",
  "scoreLabel": "Tech Score",
  "history": "ניתוחים קודמים",
  "empty": "ממתין לניתוח",
  "emptyHint": "הזן שם משתמש GitHub לקבלת ניתוח טכני מעמיק"
},
"linkedinGrader": {
  "title": "LinkedIn Grader",
  "subtitle": "ניתוח פרופיל מקצועי ואופטימיזציה למגייסים",
  "breadcrumb": "ניתוח LinkedIn",
  "analyze": "נתח LinkedIn",
  "analyzing": "מנתח...",
  "scoreLabel": "Professional Score",
  "history": "ניתוחים קודמים",
  "empty": "ממתין לניתוח",
  "emptyHint": "הדבק טקסט מפרופיל ה-LinkedIn שלך לקבלת ניתוח מקצועי"
}
```

**In `"jobs"` object** — add after `"statusRejected"`:

```json
"step1Title": "העלה קורות חיים",
"step1Desc": "ה-AI צריך לנתח את הפרופיל שלך לפני שיוכל למצוא משרות מתאימות",
"step1Done": "קורות חיים מנותחים",
"step2Title": "מצא משרות מתאימות",
"step2Desc": "ה-AI יציע 10 משרות רלוונטיות בהייטק הישראלי",
"noResume": "קורות חיים לא נמצאו",
"noResumeDesc": "כדי שנוכל למצוא משרות מתאימות, נצטרך לנתח את קורות החיים שלך תחילה",
"uploadNow": "העלה קורות חיים עכשיו"
```

**In `"knowledge"` object** — add after `"interviewSource"`:

```json
"pulseDesc": "טרנדים מותאמים לשפות ה-GitHub שלך",
"pulseTooltip": "מנתח את שפות ה-GitHub שלך ומייצר 5 טרנדים יומיים רלוונטיים",
"interviewDesc": "שאלות ותשובות לכל נושא טכני",
"interviewTooltip": "הזן נושא (React, SQL, System Design...) וקבל 5 שאלות ראיון עם תשובות מפורטות",
"bookmarksDesc": "תכנים ששמרת לחזרה עתידית",
"bookmarksTooltip": "שמור טרנדים ושאלות מהכלים האחרים — ניתן לעיין בהם בכל עת"
```

- [ ] **Step 6: Write failing i18n tests for the new keys**

Add to `tests/i18n.test.ts`:

```ts
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
```

- [ ] **Step 7: Run i18n tests — must pass**

```bash
npx vitest run tests/i18n.test.ts
```

Expected: All PASS (the keys are now in he.json).

- [ ] **Step 8: Run all tests to check no regressions**

```bash
npx vitest run
```

Expected: All 62+ tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/types/profile.ts messages/he.json tests/types/profile.test.ts tests/i18n.test.ts
git commit -m "feat: add GitHubAnalysis/LinkedInAnalysis types and grader translations"
```

---

## Task 2: Fix Sidebar — Trends Href + Profile → Grader Items

**Files:**

- Modify: `src/components/layout/sidebar.tsx`
- Modify: `tests/dashboard-sidebar.test.tsx`

- [ ] **Step 1: Write the updated sidebar test**

Replace the content of `tests/dashboard-sidebar.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  usePathname: () => '/he/dashboard',
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

import { Sidebar } from '@/components/layout/sidebar'

describe('Sidebar', () => {
  it('renders all nav items as links', () => {
    render(<Sidebar />)
    const keys = [
      'dashboard',
      'resume',
      'githubGrader',
      'linkedinGrader',
      'trends',
      'jobs',
      'learn',
      'analyzer',
    ]
    for (const key of keys) {
      expect(screen.getByRole('link', { name: new RegExp(key) })).toBeInTheDocument()
    }
  })

  it('does not render old combined profile link', () => {
    render(<Sidebar />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).not.toContain('/dashboard/profile-grader')
    expect(hrefs).not.toContain('/trends')
  })

  it('renders github-grader and linkedin-grader links with correct hrefs', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /githubGrader/ })).toHaveAttribute(
      'href',
      '/dashboard/github-grader'
    )
    expect(screen.getByRole('link', { name: /linkedinGrader/ })).toHaveAttribute(
      'href',
      '/dashboard/linkedin-grader'
    )
  })

  it('trends link points to knowledge-hub', () => {
    render(<Sidebar />)
    expect(screen.getByRole('link', { name: /trends/ })).toHaveAttribute(
      'href',
      '/dashboard/knowledge-hub'
    )
  })

  it('renders the logout button', () => {
    render(<Sidebar />)
    expect(screen.getByRole('button', { name: 'יציאה' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failures**

```bash
npx vitest run tests/dashboard-sidebar.test.tsx
```

Expected: FAIL — `githubGrader` link not found, old hrefs still present.

- [ ] **Step 3: Rewrite `src/components/layout/sidebar.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Github,
  Linkedin,
  TrendingUp,
  Briefcase,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type NavKey =
  | 'dashboard'
  | 'resume'
  | 'githubGrader'
  | 'linkedinGrader'
  | 'trends'
  | 'jobs'
  | 'learn'
  | 'analyzer'

const navItems: { href: string; icon: typeof LayoutDashboard; key: NavKey; color: string }[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    key: 'dashboard',
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    href: '/dashboard/resume-analyzer',
    icon: FileText,
    key: 'resume',
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    href: '/dashboard/github-grader',
    icon: Github,
    key: 'githubGrader',
    color: 'oklch(0.58 0.21 291)',
  },
  {
    href: '/dashboard/linkedin-grader',
    icon: Linkedin,
    key: 'linkedinGrader',
    color: 'oklch(0.58 0.21 291)',
  },
  {
    href: '/dashboard/knowledge-hub',
    icon: TrendingUp,
    key: 'trends',
    color: 'oklch(0.60 0.17 162)',
  },
  { href: '/dashboard/job-search', icon: Briefcase, key: 'jobs', color: 'oklch(0.75 0.16 60)' },
  { href: '/dashboard/knowledge-hub', icon: BookOpen, key: 'learn', color: 'oklch(0.65 0.15 211)' },
  { href: '/dashboard/job-analyzer', icon: Wand2, key: 'analyzer', color: 'oklch(0.58 0.21 291)' },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <aside
      className="w-64 min-h-screen flex flex-col border-l"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
    >
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: 'oklch(0.585 0.212 264.4)' }}
        >
          L
        </div>
        <span className="font-bold text-base tracking-tight">לאנצ׳פד</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, key, color }) => {
          const isActive =
            href === '/dashboard' ? pathname.endsWith('/dashboard') : pathname.includes(href)
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-150',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              style={
                isActive
                  ? {
                      background: `${color.replace(')', ' / 15%)')}`,
                      boxShadow: `inset 0 0 0 1px ${color.replace(')', ' / 25%)')}`,
                    }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--sidebar-accent)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = ''
              }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150"
                style={
                  isActive
                    ? { background: `${color.replace(')', ' / 20%)')}`, color }
                    : { background: 'oklch(1 0 0 / 5%)' }
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{t(key)}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 pt-2 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full',
            'text-muted-foreground transition-all duration-150',
            'hover:text-destructive hover:bg-destructive/10'
          )}
        >
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
            <LogOut className="h-4 w-4" />
          </span>
          יציאה
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run sidebar tests — must pass**

```bash
npx vitest run tests/dashboard-sidebar.test.tsx
```

Expected: All PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx tests/dashboard-sidebar.test.tsx
git commit -m "fix: replace profile nav item with github/linkedin graders; fix /trends href"
```

---

## Task 3: Fix Dashboard Card Hrefs

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Replace the entire dashboard page**

```tsx
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  FileText,
  Github,
  Linkedin,
  TrendingUp,
  Briefcase,
  Wand2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const modules = [
  {
    href: '/dashboard/resume-analyzer',
    icon: FileText,
    titleKey: 'resume',
    color: 'oklch(0.585 0.212 264.4)',
    bg: 'oklch(0.585 0.212 264.4 / 12%)',
    border: 'oklch(0.585 0.212 264.4 / 25%)',
    glow: 'oklch(0.585 0.212 264.4 / 30%)',
  },
  {
    href: '/dashboard/github-grader',
    icon: Github,
    titleKey: 'githubGrader',
    color: 'oklch(0.58 0.21 291)',
    bg: 'oklch(0.58 0.21 291 / 12%)',
    border: 'oklch(0.58 0.21 291 / 25%)',
    glow: 'oklch(0.58 0.21 291 / 30%)',
  },
  {
    href: '/dashboard/linkedin-grader',
    icon: Linkedin,
    titleKey: 'linkedinGrader',
    color: 'oklch(0.58 0.21 291)',
    bg: 'oklch(0.58 0.21 291 / 12%)',
    border: 'oklch(0.58 0.21 291 / 25%)',
    glow: 'oklch(0.58 0.21 291 / 30%)',
  },
  {
    href: '/dashboard/knowledge-hub',
    icon: TrendingUp,
    titleKey: 'trends',
    color: 'oklch(0.60 0.17 162)',
    bg: 'oklch(0.60 0.17 162 / 12%)',
    border: 'oklch(0.60 0.17 162 / 25%)',
    glow: 'oklch(0.60 0.17 162 / 30%)',
  },
  {
    href: '/dashboard/job-search',
    icon: Briefcase,
    titleKey: 'jobs',
    color: 'oklch(0.75 0.16 60)',
    bg: 'oklch(0.75 0.16 60 / 12%)',
    border: 'oklch(0.75 0.16 60 / 25%)',
    glow: 'oklch(0.75 0.16 60 / 30%)',
  },
  {
    href: '/dashboard/job-analyzer',
    icon: Wand2,
    titleKey: 'analyzer',
    color: 'oklch(0.58 0.21 291)',
    bg: 'oklch(0.58 0.21 291 / 12%)',
    border: 'oklch(0.58 0.21 291 / 25%)',
    glow: 'oklch(0.58 0.21 291 / 30%)',
  },
] as const

export default function DashboardPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
          <span>מוכן להמריא?</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight gradient-text-bright">
          {t('dashboard.welcome')}
        </h1>
        <p className="text-muted-foreground mt-2 text-base">בחר כלי להתחיל לבנות את הקריירה שלך</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modules.map(({ href, icon: Icon, titleKey, color, bg, border, glow }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'module-card group relative rounded-2xl p-6 flex flex-col gap-5 border',
              'card-hover no-underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            style={
              {
                background: 'var(--card)',
                borderColor: border,
                '--card-glow': glow,
                '--card-border': border,
              } as React.CSSProperties
            }
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ background: bg }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>

            <div className="flex-1">
              <h2
                className="font-semibold text-lg leading-tight mb-1.5"
                style={{ color: 'oklch(0.93 0.008 252)' }}
              >
                {t(`nav.${titleKey}`)}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('dashboard.noAnalysis')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-1.5 px-0 font-medium transition-all duration-150 group-hover:gap-2.5'
                )}
                style={{ color }}
              >
                {t('dashboard.startNow')}
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              </span>
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: bg, color }}
              >
                חדש
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-muted-foreground text-xs text-center mt-12">
        כל הנתונים שלך מוגנים ומאובטחים ✦ LaunchPad
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/page.tsx"
git commit -m "fix: correct all dashboard card hrefs; add github/linkedin grader and job-analyzer cards"
```

---

## Task 4: Create `analyze-github.ts` with Tests

**Files:**

- Create: `src/lib/ai/analyze-github.ts`
- Create: `tests/lib/analyze-github.test.ts`

- [ ] **Step 1: Write the failing parser test**

Create `tests/lib/analyze-github.test.ts`:

````ts
import { describe, it, expect } from 'vitest'
import { parseGitHubAnalysis } from '@/lib/ai/analyze-github'

const validGH = {
  techScore: {
    score: 82,
    strengths: ['23 ריפוזיטוריז ציבוריים', 'TypeScript ו-React'],
    improvements: ['הוסף READMEs', 'פרסם דוגמאות חיות'],
  },
  topTips: ['נעץ 3 פרויקטים מובילים', 'הוסף ביו ב-GitHub'],
}

describe('parseGitHubAnalysis', () => {
  it('parses a valid response', () => {
    const result = parseGitHubAnalysis(JSON.stringify(validGH))
    expect(result.techScore.score).toBe(82)
    expect(result.techScore.strengths).toHaveLength(2)
    expect(result.topTips).toHaveLength(2)
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validGH) + '\n```'
    const result = parseGitHubAnalysis(raw)
    expect(result.techScore.score).toBe(82)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseGitHubAnalysis('not json')).toThrow()
  })

  it('throws when techScore is missing', () => {
    const bad = { topTips: [] }
    expect(() => parseGitHubAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when topTips is missing', () => {
    const bad = { techScore: { score: 70, strengths: [], improvements: [] } }
    expect(() => parseGitHubAnalysis(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run tests/lib/analyze-github.test.ts
```

Expected: FAIL — `parseGitHubAnalysis` not found.

- [ ] **Step 3: Create `src/lib/ai/analyze-github.ts`**

````ts
import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData, GitHubAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseGitHubAnalysis(raw: string): GitHubAnalysis {
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('תשובת ה-AI אינה JSON תקני')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('techScore' in parsed) ||
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as GitHubAnalysis
}

export async function analyzeGitHub(githubData: GitHubProfileData): Promise<GitHubAnalysis> {
  const githubSummary = JSON.stringify(
    {
      username: githubData.login,
      name: githubData.name,
      bio: githubData.bio,
      publicRepos: githubData.public_repos,
      followers: githubData.followers,
      topLanguages: githubData.topLanguages,
      topRepos: githubData.topRepos.slice(0, 5).map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
      })),
    },
    null,
    2
  )

  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את פרופיל ה-GitHub של המועמד.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "techScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל הטכני>,
    "strengths": [<2-3 נקודות חוזק טכניות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור הפרופיל הטכני, בעברית>]
  },
  "topTips": [<3-5 פעולות עדיפות לשיפור הפרופיל, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד (techScore):
- מגוון שפות ופרויקטים: עד 30 נק׳
- כוכבים ופורקים: עד 25 נק׳
- מספר ריפוזיטוריז ציבוריים: עד 20 נק׳
- ביוגרפיה ושם מלא: עד 15 נק׳
- עדכניות (פרויקטים ב-12 חודשים האחרונים): עד 10 נק׳

נתוני GitHub:
---
${githubSummary}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseGitHubAnalysis(content.text)
}
````

- [ ] **Step 4: Run tests — must pass**

```bash
npx vitest run tests/lib/analyze-github.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/analyze-github.ts tests/lib/analyze-github.test.ts
git commit -m "feat: add analyzeGitHub AI function with parser tests"
```

---

## Task 5: Create `analyze-linkedin.ts` with Tests

**Files:**

- Create: `src/lib/ai/analyze-linkedin.ts`
- Create: `tests/lib/analyze-linkedin.test.ts`

- [ ] **Step 1: Write the failing parser test**

Create `tests/lib/analyze-linkedin.test.ts`:

````ts
import { describe, it, expect } from 'vitest'
import { parseLinkedInAnalysis } from '@/lib/ai/analyze-linkedin'

const validLI = {
  professionalScore: {
    score: 71,
    strengths: ['ניסיון מפורט', 'מילות מפתח טכניות'],
    improvements: ['הוסף הישגים מדידים', 'חזק את ה-About section'],
  },
  topTips: ['הוסף אחוז שיפור לכל תפקיד', 'הוסף 5 Skills נוספים'],
}

describe('parseLinkedInAnalysis', () => {
  it('parses a valid response', () => {
    const result = parseLinkedInAnalysis(JSON.stringify(validLI))
    expect(result.professionalScore.score).toBe(71)
    expect(result.professionalScore.strengths).toHaveLength(2)
    expect(result.topTips).toHaveLength(2)
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify(validLI) + '\n```'
    const result = parseLinkedInAnalysis(raw)
    expect(result.professionalScore.score).toBe(71)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseLinkedInAnalysis('not json')).toThrow()
  })

  it('throws when professionalScore is missing', () => {
    const bad = { topTips: [] }
    expect(() => parseLinkedInAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when topTips is missing', () => {
    const bad = { professionalScore: { score: 70, strengths: [], improvements: [] } }
    expect(() => parseLinkedInAnalysis(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run tests/lib/analyze-linkedin.test.ts
```

Expected: FAIL — `parseLinkedInAnalysis` not found.

- [ ] **Step 3: Create `src/lib/ai/analyze-linkedin.ts`**

````ts
import Anthropic from '@anthropic-ai/sdk'
import type { LinkedInAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseLinkedInAnalysis(raw: string): LinkedInAnalysis {
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('תשובת ה-AI אינה JSON תקני')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('professionalScore' in parsed) ||
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as LinkedInAnalysis
}

export async function analyzeLinkedIn(linkedinText: string): Promise<LinkedInAnalysis> {
  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את פרופיל ה-LinkedIn של המועמד.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "professionalScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל המקצועי>,
    "strengths": [<2-3 נקודות חוזק מקצועיות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור פרופיל ה-LinkedIn, בעברית>]
  },
  "topTips": [<3-5 פעולות עדיפות לשיפור הפרופיל, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד (professionalScore):
- פירוט ניסיון עבודה: עד 35 נק׳
- כישורים טכניים (keywords): עד 30 נק׳
- About section מושכת: עד 20 נק׳
- הישגים מדידים: עד 15 נק׳

טקסט LinkedIn (About / Experience שהמועמד הדביק):
---
${linkedinText.slice(0, 3000)}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseLinkedInAnalysis(content.text)
}
````

- [ ] **Step 4: Run tests — must pass**

```bash
npx vitest run tests/lib/analyze-linkedin.test.ts
```

Expected: All PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/analyze-linkedin.ts tests/lib/analyze-linkedin.test.ts
git commit -m "feat: add analyzeLinkedIn AI function with parser tests"
```

---

## Task 6: Extract ScoreCard to Shared Component

The existing `ScoreCard` lives inside `profile-grader/_components/`. Both new graders need it. Move it to `src/components/graders/` before deleting the old route.

**Files:**

- Create: `src/components/graders/score-card.tsx`

- [ ] **Step 1: Create `src/components/graders/score-card.tsx`**

```tsx
interface ScoreCardProps {
  title: string
  score: number
  strengths: string[]
  improvements: string[]
  color: string
}

export function ScoreCard({ title, score, strengths, improvements, color }: ScoreCardProps) {
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(score, 100) / 100) * circumference
  const bg = color.replace(')', ' / 12%)')

  return (
    <div
      className="rounded-2xl p-6 border flex flex-col gap-5"
      style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 25%)') }}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="oklch(1 0 0 / 8%)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold" style={{ color }}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight mb-1">{title}</h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: bg, color }}
          >
            {score >= 75 ? 'מצוין' : score >= 50 ? 'בינוני' : 'זקוק לשיפור'}
          </span>
        </div>
      </div>

      {strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            נקודות חוזק
          </p>
          <ul className="space-y-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs font-bold" style={{ color }}>
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            לשיפור
          </p>
          <ul className="space-y-1.5">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">→</span>
                <span className="text-muted-foreground">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run all tests (no regressions)**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/graders/score-card.tsx
git commit -m "refactor: extract ScoreCard to shared graders component"
```

---

## Task 7: Build GitHub Grader Route

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/github-grader/actions.ts`
- Create: `src/app/[locale]/(protected)/dashboard/github-grader/_components/github-grader-client.tsx`
- Create: `src/app/[locale]/(protected)/dashboard/github-grader/page.tsx`

- [ ] **Step 1: Create `actions.ts`**

```ts
'use server'

import { fetchGitHubProfile } from '@/lib/github/fetch-profile'
import { analyzeGitHub } from '@/lib/ai/analyze-github'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type GitHubGradeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeGitHubAction(formData: FormData): Promise<GitHubGradeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const githubUsername = ((formData.get('githubUsername') as string | null) ?? '').trim()
  if (!githubUsername) return { ok: false, error: 'יש להזין שם משתמש GitHub' }
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)) {
    return { ok: false, error: 'שם משתמש GitHub אינו תקין' }
  }

  let githubData
  try {
    githubData = await fetchGitHubProfile(githubUsername)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה בגישה ל-GitHub' }
  }

  let analysis
  try {
    analysis = await analyzeGitHub(githubData)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ githubUsername })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'github',
      input_text: inputSnapshot,
      result_json: analysis,
    })
    .select()
    .single()

  if (dbError || !record) {
    return {
      ok: true,
      record: {
        id: crypto.randomUUID(),
        user_id: user.id,
        type: 'github',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
```

- [ ] **Step 2: Create `_components/github-grader-client.tsx`**

```tsx
'use client'

import { useState, useTransition, useRef } from 'react'
import { Github, Loader2, History as HistoryIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { ScoreCard } from '@/components/graders/score-card'
import { cn } from '@/lib/utils'
import { analyzeGitHubAction } from '../actions'
import type { ProfileAnalysisRecord, GitHubAnalysis } from '@/types/profile'

const ACCENT = 'oklch(0.58 0.21 291)'

interface GitHubGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

function usernameFromRecord(record: ProfileAnalysisRecord): string {
  try {
    const parsed = JSON.parse(record.input_text ?? '{}') as { githubUsername?: string }
    return parsed.githubUsername ?? '—'
  } catch {
    return '—'
  }
}

function scoreColor(score: number): string {
  return score >= 75
    ? 'oklch(0.60 0.17 162)'
    : score >= 50
      ? 'oklch(0.75 0.16 60)'
      : 'oklch(0.62 0.22 27)'
}

export function GitHubGraderClient({ initialRecords }: GitHubGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(initialRecords[0] ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await analyzeGitHubAction(formData)
      if (res.ok) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== res.record.id)
          return [res.record, ...filtered]
        })
        setSelected(res.record)
        formRef.current?.reset()
        setGithubUsername('')
      } else {
        setError(res.error)
      }
    })
  }

  const analysis = selected?.result_json as GitHubAnalysis | null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Right panel: input + history */}
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                className="flex items-center gap-2 text-sm font-medium"
                htmlFor="githubUsername"
              >
                <Github className="w-4 h-4" style={{ color: ACCENT }} />
                שם משתמש GitHub
              </label>
              <div className="relative">
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none"
                  aria-hidden
                >
                  @
                </span>
                <input
                  id="githubUsername"
                  name="githubUsername"
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username"
                  dir="ltr"
                  autoComplete="off"
                  disabled={isPending}
                  className={cn(
                    'w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm pr-8',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    'disabled:opacity-50 transition-colors border-border hover:border-border/70'
                  )}
                />
              </div>
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-2.5"
                style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={githubUsername.trim().length === 0 || isPending}
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full gap-2 font-semibold transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              style={
                githubUsername.trim().length > 0 && !isPending
                  ? { background: ACCENT, color: 'oklch(0.98 0 0)' }
                  : {}
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  נתח GitHub
                </>
              )}
            </button>
          </form>
        </div>

        {records.length > 0 && (
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">ניתוחים קודמים</h2>
            </div>
            <div className="space-y-2">
              {records.map((r) => {
                const gh = r.result_json as GitHubAnalysis | null
                const score = gh?.techScore.score ?? null
                const color = score !== null ? scoreColor(score) : 'oklch(0.55 0 0)'
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      selected?.id === r.id
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="text-right">
                      <p className="text-xs font-medium" dir="ltr">
                        @{usernameFromRecord(r)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </p>
                    </div>
                    {score !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color, background: color.replace(')', ' / 15%)') }}
                      >
                        {score}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Left panel: results */}
      <div className="lg:col-span-3">
        {analysis?.techScore ? (
          <div className="space-y-5">
            <ScoreCard
              title="Tech Score — GitHub"
              score={analysis.techScore.score}
              strengths={analysis.techScore.strengths}
              improvements={analysis.techScore.improvements}
              color={ACCENT}
            />
            {analysis.topTips.length > 0 && (
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: ACCENT.replace(')', ' / 8%)'),
                  borderColor: ACCENT.replace(')', ' / 20%)'),
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-4"
                  style={{ color: ACCENT }}
                >
                  פעולות עדיפות להגדיל את הסיכוי להתגלות
                </p>
                <ol className="space-y-3">
                  {analysis.topTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: ACCENT.replace(')', ' / 20%)'), color: ACCENT }}
                      >
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: ACCENT.replace(')', ' / 10%)') }}
            >
              <Github className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הזן שם משתמש GitHub לקבלת ניתוח טכני מעמיק
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `page.tsx`**

```tsx
import { Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { GitHubGraderClient } from './_components/github-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function GitHubGraderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialRecords: ProfileAnalysisRecord[] = []
  if (user) {
    const { data } = await supabase
      .from('profile_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'github')
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Github className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          <span>ניתוח GitHub</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          GitHub Grader
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          ניתוח ריפוזיטוריז, שפות וחוזק טכני — מופעל ע&quot;י AI
        </p>
      </div>
      <GitHubGraderClient initialRecords={initialRecords} />
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/github-grader/"
git commit -m "feat: add GitHub Grader route with dedicated AI analysis"
```

---

## Task 8: Build LinkedIn Grader Route

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/linkedin-grader/actions.ts`
- Create: `src/app/[locale]/(protected)/dashboard/linkedin-grader/_components/linkedin-grader-client.tsx`
- Create: `src/app/[locale]/(protected)/dashboard/linkedin-grader/page.tsx`

- [ ] **Step 1: Create `actions.ts`**

```ts
'use server'

import { analyzeLinkedIn } from '@/lib/ai/analyze-linkedin'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type LinkedInGradeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeLinkedInAction(formData: FormData): Promise<LinkedInGradeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const linkedinText = ((formData.get('linkedinText') as string | null) ?? '').trim()
  if (linkedinText.length < 30) {
    return { ok: false, error: 'יש להדביק לפחות 30 תווים מפרופיל ה-LinkedIn שלך' }
  }

  let analysis
  try {
    analysis = await analyzeLinkedIn(linkedinText)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ linkedinText: linkedinText.slice(0, 100) })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'linkedin',
      input_text: inputSnapshot,
      result_json: analysis,
    })
    .select()
    .single()

  if (dbError || !record) {
    return {
      ok: true,
      record: {
        id: crypto.randomUUID(),
        user_id: user.id,
        type: 'linkedin',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
```

- [ ] **Step 2: Create `_components/linkedin-grader-client.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Linkedin, Loader2, History as HistoryIcon, Link as LinkIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { ScoreCard } from '@/components/graders/score-card'
import { cn } from '@/lib/utils'
import { analyzeLinkedInAction } from '../actions'
import type { ProfileAnalysisRecord, LinkedInAnalysis } from '@/types/profile'

const ACCENT = 'oklch(0.65 0.15 211)'

interface LinkedInGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

function previewFromRecord(record: ProfileAnalysisRecord): string {
  try {
    const parsed = JSON.parse(record.input_text ?? '{}') as { linkedinText?: string }
    return parsed.linkedinText?.slice(0, 30) ?? '—'
  } catch {
    return '—'
  }
}

function scoreColor(score: number): string {
  return score >= 75
    ? 'oklch(0.60 0.17 162)'
    : score >= 50
      ? 'oklch(0.75 0.16 60)'
      : 'oklch(0.62 0.22 27)'
}

export function LinkedInGraderClient({ initialRecords }: LinkedInGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(initialRecords[0] ?? null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [linkedinText, setLinkedinText] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await analyzeLinkedInAction(formData)
      if (res.ok) {
        setRecords((prev) => {
          const filtered = prev.filter((r) => r.id !== res.record.id)
          return [res.record, ...filtered]
        })
        setSelected(res.record)
        setLinkedinText('')
      } else {
        setError(res.error)
      }
    })
  }

  const analysis = selected?.result_json as LinkedInAnalysis | null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Right panel: input + history */}
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium" htmlFor="linkedinText">
                <LinkIcon className="w-4 h-4" style={{ color: ACCENT }} />
                טקסט LinkedIn
              </label>
              <p className="text-xs text-muted-foreground">
                העתק והדבק את קטע ה-About ו/או ה-Experience מפרופיל ה-LinkedIn שלך
              </p>
              <textarea
                id="linkedinText"
                name="linkedinText"
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="אני מפתח תוכנה בשנה השלישית להנדסה... (מינימום 30 תווים)"
                rows={7}
                disabled={isPending}
                className={cn(
                  'w-full rounded-xl border bg-transparent px-4 py-3 text-sm resize-none',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  'disabled:opacity-50 transition-colors border-border hover:border-border/70'
                )}
              />
              <p
                className="text-xs text-left"
                style={{
                  color: linkedinText.length < 30 ? 'oklch(0.62 0.22 27)' : 'oklch(0.60 0.17 162)',
                }}
              >
                {linkedinText.length} / 30 תווים מינימום
              </p>
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-2.5"
                style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={linkedinText.trim().length < 30 || isPending}
              className={cn(
                buttonVariants({ size: 'default' }),
                'w-full gap-2 font-semibold transition-all duration-150',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
              style={
                linkedinText.trim().length >= 30 && !isPending
                  ? { background: ACCENT, color: 'oklch(0.98 0 0)' }
                  : {}
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Linkedin className="w-4 h-4" />
                  נתח LinkedIn
                </>
              )}
            </button>
          </form>
        </div>

        {records.length > 0 && (
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">ניתוחים קודמים</h2>
            </div>
            <div className="space-y-2">
              {records.map((r) => {
                const li = r.result_json as LinkedInAnalysis | null
                const score = li?.professionalScore.score ?? null
                const color = score !== null ? scoreColor(score) : 'oklch(0.55 0 0)'
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      selected?.id === r.id
                        ? 'bg-primary/15 border border-primary/30'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="text-right">
                      <p className="text-xs font-medium truncate max-w-[130px]">
                        {previewFromRecord(r)}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </p>
                    </div>
                    {score !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color, background: color.replace(')', ' / 15%)') }}
                      >
                        {score}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Left panel: results */}
      <div className="lg:col-span-3">
        {analysis?.professionalScore ? (
          <div className="space-y-5">
            <ScoreCard
              title="Professional Score — LinkedIn"
              score={analysis.professionalScore.score}
              strengths={analysis.professionalScore.strengths}
              improvements={analysis.professionalScore.improvements}
              color={ACCENT}
            />
            {analysis.topTips.length > 0 && (
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: ACCENT.replace(')', ' / 8%)'),
                  borderColor: ACCENT.replace(')', ' / 20%)'),
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-4"
                  style={{ color: ACCENT }}
                >
                  פעולות עדיפות להגדיל את הסיכוי להתגלות
                </p>
                <ol className="space-y-3">
                  {analysis.topTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: ACCENT.replace(')', ' / 20%)'), color: ACCENT }}
                      >
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: ACCENT.replace(')', ' / 10%)') }}
            >
              <Linkedin className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הדבק טקסט מפרופיל ה-LinkedIn שלך לקבלת ניתוח מקצועי
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `page.tsx`**

```tsx
import { Linkedin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LinkedInGraderClient } from './_components/linkedin-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function LinkedInGraderPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialRecords: ProfileAnalysisRecord[] = []
  if (user) {
    const { data } = await supabase
      .from('profile_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'linkedin')
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Linkedin className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
          <span>ניתוח LinkedIn</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          LinkedIn Grader
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          ניתוח פרופיל מקצועי ואופטימיזציה למגייסים — מופעל ע&quot;י AI
        </p>
      </div>
      <LinkedInGraderClient initialRecords={initialRecords} />
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/linkedin-grader/"
git commit -m "feat: add LinkedIn Grader route with dedicated AI analysis"
```

---

## Task 9: Remove Old Profile Grader

**Files:**

- Delete: `src/app/[locale]/(protected)/dashboard/profile-grader/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf "src/app/[locale]/(protected)/dashboard/profile-grader"
```

- [ ] **Step 2: Run all tests to confirm nothing breaks**

```bash
npx vitest run
```

Expected: All PASS (no test file imports from profile-grader).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove combined profile-grader route (replaced by github-grader + linkedin-grader)"
```

---

## Task 10: Job Search Onboarding

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/job-search/page.tsx`
- Modify: `src/app/[locale]/(protected)/dashboard/job-search/_components/job-search-client.tsx`

- [ ] **Step 1: Update `job-search/page.tsx` to check for an analyzed resume**

```tsx
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JobSearchClient } from './_components/job-search-client'
import type { JobApplication } from '@/types/jobs'
import type { ResumeRecord } from '@/types/resume'

export default async function JobSearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialApplications: JobApplication[] = []
  let resumeInfo: { hasResume: boolean; score: number | null; skills: string[] } = {
    hasResume: false,
    score: null,
    skills: [],
  }

  if (user) {
    const [applicationsRes, resumesRes] = await Promise.all([
      supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('resumes')
        .select('id, score, analysis_json')
        .eq('user_id', user.id)
        .not('analysis_json', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    initialApplications = (applicationsRes.data ?? []) as JobApplication[]

    const latestResume = (resumesRes.data ?? [])[0] as
      | Pick<ResumeRecord, 'score' | 'analysis_json'>
      | undefined
    if (latestResume) {
      resumeInfo = {
        hasResume: true,
        score: latestResume.score,
        skills: latestResume.analysis_json?.strengths ?? [],
      }
    }
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Briefcase className="w-4 h-4" style={{ color: 'oklch(0.75 0.16 60)' }} />
          <span>חיפוש עבודה</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          מרכז חיפוש העבודה
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          משרות מותאמות לפרופיל שלך · סינון חכם · מעקב בקשות — הכל מופעל ע&quot;י AI
        </p>
      </div>

      <JobSearchClient initialApplications={initialApplications} resumeInfo={resumeInfo} />
    </div>
  )
}
```

- [ ] **Step 2: Update `job-search-client.tsx`** to accept `resumeInfo` and show the onboarding state:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ClipboardList, CheckCircle2, Circle, Upload } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JobDiscoveryPanel } from './job-discovery-panel'
import { ApplicationTracker } from './application-tracker'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'

interface ResumeInfo {
  hasResume: boolean
  score: number | null
  skills: string[]
}

interface JobSearchClientProps {
  initialApplications: JobApplication[]
  resumeInfo: ResumeInfo
}

const YELLOW = 'oklch(0.75 0.16 60)'
const GREEN = 'oklch(0.60 0.17 162)'

function StepRow({
  num,
  title,
  desc,
  state,
}: {
  num: number | '✓'
  title: string
  desc: string
  state: 'done' | 'current' | 'locked'
}) {
  const colors = {
    done: GREEN,
    current: YELLOW,
    locked: 'oklch(0.45 0 0)',
  }
  const color = colors[state]

  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3.5 border"
      style={{
        background: color.replace(')', ' / 6%)'),
        borderColor: color.replace(')', ' / 25%)'),
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: color.replace(')', ' / 20%)'), color }}
      >
        {num}
      </span>
      <div>
        <p
          className="text-sm font-bold"
          style={{ color: state === 'locked' ? 'oklch(0.55 0 0)' : undefined }}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

export function JobSearchClient({ initialApplications, resumeInfo }: JobSearchClientProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)

  function handleApplicationSaved(application: JobApplication) {
    setApplications((prev) => [application, ...prev])
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
  }

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const step1Desc = resumeInfo.hasResume
    ? `ציון: ${resumeInfo.score ?? '—'}/100${resumeInfo.skills.length > 0 ? ` · ${resumeInfo.skills.slice(0, 3).join(', ')}` : ''}`
    : 'ה-AI צריך לנתח את הפרופיל שלך לפני שיוכל למצוא משרות מתאימות'

  if (!resumeInfo.hasResume) {
    return (
      <div className="space-y-6 max-w-lg">
        <div className="space-y-3">
          <StepRow num={1} title="העלה קורות חיים" desc={step1Desc} state="current" />
          <StepRow
            num={2}
            title="מצא משרות מתאימות"
            desc="ה-AI יציע 10 משרות רלוונטיות בהייטק הישראלי"
            state="locked"
          />
        </div>

        <div
          className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center text-center gap-4"
          style={{
            borderColor: YELLOW.replace(')', ' / 40%)'),
            background: YELLOW.replace(')', ' / 5%)'),
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: YELLOW.replace(')', ' / 15%)') }}
          >
            <Upload className="w-7 h-7" style={{ color: YELLOW }} />
          </div>
          <div>
            <p className="font-bold text-base mb-1">קורות חיים לא נמצאו</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              כדי שנוכל למצוא משרות מתאימות, נצטרך לנתח את קורות החיים שלך תחילה
            </p>
          </div>
          <Link
            href="/dashboard/resume-analyzer"
            className={cn(buttonVariants({ size: 'default' }), 'gap-2 font-semibold mt-1')}
            style={{ background: YELLOW, color: 'oklch(0.15 0.02 60)' }}
          >
            <Upload className="w-4 h-4" />
            העלה קורות חיים עכשיו
          </Link>
        </div>
      </div>
    )
  }

  const TAB_CONFIG = [
    { value: 'discover', label: 'גילוי משרות', icon: Briefcase, color: YELLOW },
    {
      value: 'tracker',
      label: `טראקר${applications.length > 0 ? ` (${applications.length})` : ''}`,
      icon: ClipboardList,
      color: 'oklch(0.585 0.212 264.4)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Step banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <StepRow num="✓" title="קורות חיים מנותחים" desc={step1Desc} state="done" />
        <StepRow
          num={2}
          title="מצא משרות מתאימות"
          desc="לחץ על הכפתור כדי למצוא משרות"
          state="current"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 h-auto p-1 gap-1 bg-card border border-border/50 rounded-2xl w-full sm:w-auto">
          {TAB_CONFIG.map(({ value, label, icon: Icon, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                'data-active:text-foreground text-muted-foreground'
              )}
              style={
                activeTab === value
                  ? { background: color.replace(')', ' / 15%)'), color }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="discover">
          <JobDiscoveryPanel onApplicationSaved={handleApplicationSaved} />
        </TabsContent>

        <TabsContent value="tracker">
          <ApplicationTracker
            applications={applications}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/job-search/"
git commit -m "feat: add job search onboarding state with resume prerequisite check"
```

---

## Task 11: Knowledge Hub Learning-Center Redesign

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx`

- [ ] **Step 1: Replace `knowledge-hub-client.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Zap, GraduationCap, Bookmark } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { saveBookmarkAction } from '../actions'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { BookmarksPanel } from './bookmarks-panel'
import type { KnowledgeBookmark } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  initialBookmarks: KnowledgeBookmark[]
}

const MODULE_CONFIG = [
  {
    value: 'pulse',
    label: 'Daily Tech Pulse',
    desc: 'טרנדים מותאמים לשפות ה-GitHub שלך',
    tooltip: 'מנתח את שפות ה-GitHub שלך ומייצר 5 טרנדים יומיים רלוונטיים',
    icon: Zap,
    color: 'oklch(0.65 0.15 211)',
  },
  {
    value: 'interview',
    label: 'הכנה לראיונות',
    desc: 'שאלות ותשובות לכל נושא טכני',
    tooltip: 'הזן נושא (React, SQL, System Design...) וקבל 5 שאלות ראיון עם תשובות מפורטות',
    icon: GraduationCap,
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    value: 'bookmarks',
    label: 'הסימניות שלי',
    desc: 'תכנים ששמרת לחזרה עתידית',
    tooltip: 'שמור טרנדים ושאלות מהכלים האחרים — ניתן לעיין בהם בכל עת',
    icon: Bookmark,
    color: 'oklch(0.75 0.16 60)',
  },
] as const

export function KnowledgeHubClient({ initialBookmarks }: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState<string>('pulse')
  const [bookmarks, setBookmarks] = useState<KnowledgeBookmark[]>(initialBookmarks)
  const [, startTransition] = useTransition()

  function handleBookmark(title: string, content: string, source: 'trend' | 'interview') {
    const formData = new FormData()
    formData.set('title', title)
    formData.set('content', content)
    formData.set('source', source)
    startTransition(async () => {
      const result = await saveBookmarkAction(formData)
      if (result.ok) {
        setBookmarks((prev) => [result.bookmark, ...prev])
      }
    })
  }

  function handleDeleteBookmark(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      {/* 3-card module selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {MODULE_CONFIG.map(({ value, label, desc, tooltip, icon: Icon, color }) => {
          const isActive = activeTab === value
          const bg = color.replace(')', ' / 12%)')
          const border = color.replace(')', ' / 30%)')

          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              title={tooltip}
              className={cn(
                'flex flex-col items-start gap-3 rounded-2xl p-5 border w-full text-right',
                'transition-all duration-200 cursor-pointer',
                isActive ? '' : 'hover:bg-white/5'
              )}
              style={
                isActive
                  ? { background: bg, borderColor: border }
                  : { background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
                style={{
                  background: isActive ? bg : 'oklch(1 0 0 / 5%)',
                  color: isActive ? color : 'oklch(0.60 0 0)',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 text-right w-full">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold">{label}</h3>
                  {value === 'bookmarks' && bookmarks.length > 0 && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color.replace(')', ' / 15%)'), color }}
                    >
                      {bookmarks.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>

              <span
                className="text-xs px-2 py-0.5 rounded-full self-end"
                style={{ background: 'oklch(1 0 0 / 6%)', color: 'oklch(0.55 0 0)' }}
              >
                ? כיצד זה עובד
              </span>
            </button>
          )
        })}
      </div>

      {/* Section content */}
      <TabsContent value="pulse">
        <TechPulsePanel onBookmark={handleBookmark} />
      </TabsContent>
      <TabsContent value="interview">
        <InterviewPrepPanel onBookmark={handleBookmark} />
      </TabsContent>
      <TabsContent value="bookmarks">
        <BookmarksPanel bookmarks={bookmarks} onDelete={handleDeleteBookmark} />
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx"
git commit -m "feat: redesign knowledge hub with 3-card learning-center navigation"
```

---

## Task 12: Job Analyzer — Hebrew Info Badge on Cover Letter

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/job-analyzer/_components/cover-letter-panel.tsx`

- [ ] **Step 1: Add Hebrew info badge below the toolbar in `cover-letter-panel.tsx`**

In the existing file, find the closing `</div>` of the toolbar div (after the Copy button). Insert the info badge immediately after it:

Replace this section:

```tsx
      {/* Letter body */}
      <div
```

With:

```tsx
      {/* Hebrew default badge */}
      <p className="text-xs text-muted-foreground">
        ברירת מחדל: עברית | האנגלית זמינה דרך הכפתור למעלה
      </p>

      {/* Letter body */}
      <div
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/job-analyzer/_components/cover-letter-panel.tsx"
git commit -m "feat: add Hebrew-default info badge to job analyzer cover letter panel"
```

---

## Final Verification

- [ ] **Run the full test suite one last time**

```bash
npx vitest run
```

Expected: All tests PASS with no failures.

- [ ] **Verify file structure**

```bash
ls "src/app/[locale]/(protected)/dashboard/"
```

Expected directories: `github-grader/`, `linkedin-grader/`, `job-search/`, `knowledge-hub/`, `job-analyzer/`, `resume-analyzer/` — and **no** `profile-grader/`.

- [ ] **Verify shared component exists**

```bash
ls src/components/graders/
```

Expected: `score-card.tsx`
