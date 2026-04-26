# Profile Grader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Profile Grader at `/he/dashboard/profile-grader` that fetches a GitHub profile via the GitHub REST API, accepts pasted LinkedIn text, and sends both to Claude to produce a Tech Score, Professional Score, and combined Online Brand Score with ranked tips.

**Architecture:** Follows the Resume Analyzer pattern exactly — a Next.js Server Component page pre-loads history from Supabase, a `ProfileGraderClient` Client Component owns state and renders input form + results, and a Server Action calls GitHub API + Claude then saves to the existing `profile_analyses` table. GitHub data is fetched server-side using `GITHUB_TOKEN` env var if set (falls back to unauthenticated, 60 req/hr). Claude returns structured JSON split into `techScore`, `professionalScore`, `overallBrandScore`, and `topTips`.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · `@anthropic-ai/sdk` · GitHub REST API (native `fetch`, no SDK) · Supabase SSR · Tailwind v4 oklch tokens · `next-intl` · Vitest · `date-fns`.

---

## Codebase Context (READ BEFORE STARTING)

- **Design system lives in** `src/app/globals.css` — all colors use `oklch()`. Module colors: indigo `oklch(0.585 0.212 264.4)`, violet `oklch(0.58 0.21 291)`, emerald `oklch(0.60 0.17 162)`, amber `oklch(0.75 0.16 60)`, sky `oklch(0.65 0.15 211)`. Profile module color is violet.
- **Never use JS event handlers in Server Components** — use CSS custom properties via `style` prop instead.
- **Button pattern** — `@base-ui/react/button` has no `asChild`; use `buttonVariants({...})` as `className` on `<Link>`.
- **Supabase** — always `await createClient()` from `@/lib/supabase/server`; `await cookies()` is async in Next 16.
- **AI client** — lazy singleton `getClient()` to avoid module-level Anthropic instantiation (breaks jsdom).
- **All UI strings** must come from `messages/he.json` via `useTranslations()`.
- **Sidebar** currently points to `/profile` — must be updated to `/dashboard/profile-grader`.
- **`profile_analyses` table** CHECK constraint currently `IN ('linkedin', 'github')` — must add `'combined'`.
- **Test pattern** — Vitest, `describe` / `it` / `expect`, run with `npm run test:run`.

## File Structure

```
src/types/profile.ts                                                          (create)
src/lib/github/fetch-profile.ts                                               (create)
src/lib/ai/analyze-profile.ts                                                 (create)
src/app/[locale]/(protected)/dashboard/profile-grader/actions.ts              (create)
src/app/[locale]/(protected)/dashboard/profile-grader/page.tsx                (create)
src/app/[locale]/(protected)/dashboard/profile-grader/_components/
  profile-input-form.tsx                                                       (create)
  score-card.tsx                                                               (create)
  profile-results.tsx                                                          (create)
  profile-grader-client.tsx                                                    (create)
src/components/layout/sidebar.tsx                                              (modify: /profile → /dashboard/profile-grader)
messages/he.json                                                               (modify: add profile section)
supabase/migrations/001_initial_schema.sql                                     (modify: add 'combined' to CHECK)
tests/types/profile.test.ts                                                    (create)
tests/lib/fetch-profile.test.ts                                                (create)
tests/lib/analyze-profile.test.ts                                              (create)
```

---

## Task 1: Types + DB migration update

**Files:**

- Create: `src/types/profile.ts`
- Modify: `supabase/migrations/001_initial_schema.sql`
- Create: `tests/types/profile.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/types/profile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  GitHubRepo,
  GitHubProfileData,
  ProfileSubScore,
  ProfileAnalysis,
  ProfileAnalysisRecord,
} from '@/types/profile'

describe('profile types', () => {
  it('ProfileSubScore has required fields', () => {
    const sub: ProfileSubScore = { score: 80, strengths: ['a'], improvements: ['b'] }
    expect(sub.score).toBe(80)
    expect(sub.strengths).toHaveLength(1)
    expect(sub.improvements).toHaveLength(1)
  })

  it('ProfileAnalysis has techScore, professionalScore, overallBrandScore, topTips', () => {
    const analysis: ProfileAnalysis = {
      techScore: { score: 75, strengths: [], improvements: [] },
      professionalScore: { score: 65, strengths: [], improvements: [] },
      overallBrandScore: 70,
      topTips: ['tip 1'],
    }
    expect(analysis.overallBrandScore).toBe(70)
    expect(analysis.topTips).toHaveLength(1)
  })

  it('ProfileAnalysisRecord has all DB fields', () => {
    const record: ProfileAnalysisRecord = {
      id: 'uuid',
      user_id: 'uid',
      type: 'combined',
      input_text: '{}',
      result_json: null,
      created_at: new Date().toISOString(),
    }
    expect(record.type).toBe('combined')
  })

  it('GitHubRepo has required fields', () => {
    const repo: GitHubRepo = {
      name: 'my-project',
      description: null,
      stargazers_count: 5,
      forks_count: 1,
      language: 'TypeScript',
      updated_at: '2024-01-01T00:00:00Z',
    }
    expect(repo.language).toBe('TypeScript')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/types/profile.test.ts
```

Expected: FAIL — cannot find module `@/types/profile`

- [ ] **Step 3: Create `src/types/profile.ts`**

```typescript
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

export interface ProfileAnalysis {
  techScore: ProfileSubScore
  professionalScore: ProfileSubScore
  overallBrandScore: number
  topTips: string[]
}

export interface ProfileAnalysisRecord {
  id: string
  user_id: string
  type: string
  input_text: string | null
  result_json: ProfileAnalysis | null
  created_at: string
}
```

- [ ] **Step 4: Update `supabase/migrations/001_initial_schema.sql`**

Find and replace this line in the file:

```sql
  type text NOT NULL CHECK (type IN ('linkedin', 'github')),
```

Replace with:

```sql
  type text NOT NULL CHECK (type IN ('linkedin', 'github', 'combined')),
```

**Note for human:** If you have already run this migration in Supabase, execute this SQL in the Supabase SQL editor:

```sql
ALTER TABLE profile_analyses DROP CONSTRAINT IF EXISTS profile_analyses_type_check;
ALTER TABLE profile_analyses ADD CONSTRAINT profile_analyses_type_check
  CHECK (type IN ('linkedin', 'github', 'combined'));
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test:run -- tests/types/profile.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 6: Commit**

```bash
git add src/types/profile.ts tests/types/profile.test.ts supabase/migrations/001_initial_schema.sql
git commit -m "feat: add profile grader types and update db migration"
```

---

## Task 2: GitHub API Fetcher

**Files:**

- Create: `src/lib/github/fetch-profile.ts`
- Create: `tests/lib/fetch-profile.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/fetch-profile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeTopLanguages } from '@/lib/github/fetch-profile'
import type { GitHubRepo } from '@/types/profile'

const makeRepo = (language: string | null): GitHubRepo => ({
  name: 'repo',
  description: null,
  stargazers_count: 0,
  forks_count: 0,
  language,
  updated_at: '2024-01-01T00:00:00Z',
})

describe('computeTopLanguages', () => {
  it('counts languages across repos', () => {
    const repos = [makeRepo('TypeScript'), makeRepo('TypeScript'), makeRepo('Python')]
    const result = computeTopLanguages(repos)
    expect(result['TypeScript']).toBe(2)
    expect(result['Python']).toBe(1)
  })

  it('ignores repos with null language', () => {
    const repos = [makeRepo(null), makeRepo('Go')]
    const result = computeTopLanguages(repos)
    expect(Object.keys(result)).toHaveLength(1)
    expect(result['Go']).toBe(1)
  })

  it('returns empty object for empty array', () => {
    expect(computeTopLanguages([])).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/fetch-profile.test.ts
```

Expected: FAIL — cannot find module `@/lib/github/fetch-profile`

- [ ] **Step 3: Create `src/lib/github/fetch-profile.ts`**

```typescript
import type { GitHubRepo, GitHubProfileData } from '@/types/profile'

export function computeTopLanguages(repos: GitHubRepo[]): Record<string, number> {
  const langs: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.language) {
      langs[repo.language] = (langs[repo.language] ?? 0) + 1
    }
  }
  return langs
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfileData> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=10`,
      { headers }
    ),
  ])

  if (!userRes.ok) {
    if (userRes.status === 404) {
      throw new Error(`משתמש GitHub "${username}" לא נמצא`)
    }
    throw new Error(`שגיאה בגישה ל-GitHub API: ${userRes.status}`)
  }

  const user = (await userRes.json()) as {
    login: string
    name: string | null
    bio: string | null
    public_repos: number
    followers: number
  }

  const rawRepos: Array<{
    name: string
    description: string | null
    stargazers_count: number
    forks_count: number
    language: string | null
    updated_at: string
  }> = reposRes.ok ? ((await reposRes.json()) as typeof rawRepos) : []

  const topRepos: GitHubRepo[] = rawRepos.map((r) => ({
    name: r.name,
    description: r.description,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    language: r.language,
    updated_at: r.updated_at,
  }))

  return {
    login: user.login,
    name: user.name ?? null,
    bio: user.bio ?? null,
    public_repos: user.public_repos,
    followers: user.followers,
    topLanguages: computeTopLanguages(topRepos),
    topRepos,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/lib/fetch-profile.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/github/fetch-profile.ts tests/lib/fetch-profile.test.ts
git commit -m "feat: add GitHub profile fetcher with language aggregation"
```

---

## Task 3: Claude AI Profile Analyzer

**Files:**

- Create: `src/lib/ai/analyze-profile.ts`
- Create: `tests/lib/analyze-profile.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/lib/analyze-profile.test.ts`:

````typescript
import { describe, it, expect } from 'vitest'
import { parseProfileAnalysis } from '@/lib/ai/analyze-profile'

const validAnalysis = {
  techScore: { score: 78, strengths: ['פרויקטים מגוונים'], improvements: ['הוסף READMEs'] },
  professionalScore: { score: 65, strengths: ['ניסיון מפורט'], improvements: ['הוסף keywords'] },
  overallBrandScore: 72,
  topTips: ['צור README ל-3 פרויקטים מובילים'],
}

describe('parseProfileAnalysis', () => {
  it('parses a valid JSON response', () => {
    const result = parseProfileAnalysis(JSON.stringify(validAnalysis))
    expect(result.techScore.score).toBe(78)
    expect(result.professionalScore.score).toBe(65)
    expect(result.overallBrandScore).toBe(72)
    expect(result.topTips).toHaveLength(1)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validAnalysis) + '\n```'
    const result = parseProfileAnalysis(raw)
    expect(result.overallBrandScore).toBe(72)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseProfileAnalysis('not json')).toThrow()
  })

  it('throws when techScore is missing', () => {
    const bad = { professionalScore: {}, overallBrandScore: 70, topTips: [] }
    expect(() => parseProfileAnalysis(JSON.stringify(bad))).toThrow()
  })

  it('throws when overallBrandScore is missing', () => {
    const bad = {
      techScore: { score: 70, strengths: [], improvements: [] },
      professionalScore: { score: 60, strengths: [], improvements: [] },
      topTips: [],
    }
    expect(() => parseProfileAnalysis(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/analyze-profile.test.ts
```

Expected: FAIL — cannot find module `@/lib/ai/analyze-profile`

- [ ] **Step 3: Create `src/lib/ai/analyze-profile.ts`**

````typescript
import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData, ProfileAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseProfileAnalysis(raw: string): ProfileAnalysis {
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
    !('professionalScore' in parsed) ||
    !('overallBrandScore' in parsed) ||
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as ProfileAnalysis
}

export async function analyzeProfile(
  githubData: GitHubProfileData,
  linkedinText: string
): Promise<ProfileAnalysis> {
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

  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את הנוכחות המקצועית של המועמד ב-GitHub וב-LinkedIn.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "techScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל הטכני ב-GitHub>,
    "strengths": [<2-3 נקודות חוזק טכניות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור הפרופיל הטכני, בעברית>]
  },
  "professionalScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל המקצועי ב-LinkedIn>,
    "strengths": [<2-3 נקודות חוזק מקצועיות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור פרופיל ה-LinkedIn, בעברית>]
  },
  "overallBrandScore": <ממוצע משוקלל 0-100 של שני הציונים — GitHub 60%, LinkedIn 40%>,
  "topTips": [<3-5 פעולות עדיפות שיגדילו הכי הרבה את הסיכוי להתגלות ע"י מגייסים, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד GitHub (techScore):
- מגוון שפות ופרויקטים: עד 30 נק׳
- כוכבים ופורקים: עד 25 נק׳
- מספר ריפוזיטוריז ציבוריים: עד 20 נק׳
- ביוגרפיה ושם מלא: עד 15 נק׳
- עדכניות (פרויקטים ב-12 חודשים האחרונים): עד 10 נק׳

קריטריוני ניקוד LinkedIn (professionalScore):
- פירוט ניסיון עבודה: עד 35 נק׳
- כישורים טכניים (keywords): עד 30 נק׳
- About section מושכת: עד 20 נק׳
- הישגים מדידים: עד 15 נק׳

נתוני GitHub:
---
${githubSummary}
---

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

  return parseProfileAnalysis(content.text)
}
````

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test:run -- tests/lib/analyze-profile.test.ts
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/analyze-profile.ts tests/lib/analyze-profile.test.ts
git commit -m "feat: add Claude profile analyzer with structured scoring"
```

---

## Task 4: Server Action

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/actions.ts`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/actions.ts`**

Create the directory first: `src/app/[locale]/(protected)/dashboard/profile-grader/` (including the `_components/` sub-directory for later tasks).

```typescript
'use server'

import { fetchGitHubProfile } from '@/lib/github/fetch-profile'
import { analyzeProfile } from '@/lib/ai/analyze-profile'
import { createClient } from '@/lib/supabase/server'
import type { ProfileAnalysisRecord } from '@/types/profile'

export type ProfileAnalyzeResult =
  | { ok: true; record: ProfileAnalysisRecord }
  | { ok: false; error: string }

export async function analyzeProfileAction(formData: FormData): Promise<ProfileAnalyzeResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const githubUsername = ((formData.get('githubUsername') as string | null) ?? '').trim()
  const linkedinText = ((formData.get('linkedinText') as string | null) ?? '').trim()

  if (!githubUsername) return { ok: false, error: 'יש להזין שם משתמש GitHub' }
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)) {
    return { ok: false, error: 'שם משתמש GitHub אינו תקין' }
  }
  if (linkedinText.length < 30) {
    return { ok: false, error: 'יש להדביק לפחות 30 תווים מפרופיל ה-LinkedIn שלך' }
  }

  let githubData
  try {
    githubData = await fetchGitHubProfile(githubUsername)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'שגיאה בגישה ל-GitHub' }
  }

  let analysis
  try {
    analysis = await analyzeProfile(githubData, linkedinText)
  } catch {
    return { ok: false, error: 'שגיאה בניתוח ה-AI. נסה שוב.' }
  }

  const inputSnapshot = JSON.stringify({ githubUsername, linkedinText })

  const { data: record, error: dbError } = await supabase
    .from('profile_analyses')
    .insert({
      user_id: user.id,
      type: 'combined',
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
        type: 'combined',
        input_text: inputSnapshot,
        result_json: analysis,
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, record: record as ProfileAnalysisRecord }
}
```

- [ ] **Step 2: Run all tests to ensure nothing broke**

```bash
npm run test:run
```

Expected: all existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/\(protected\)/dashboard/profile-grader/actions.ts
git commit -m "feat: add profile grader server action with GitHub + Claude integration"
```

---

## Task 5: Score Card Component

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/_components/score-card.tsx`

This is a self-contained card showing a compact SVG arc, a label, and strengths/improvements lists. It is specific to the Profile Grader (different from the Resume Analyzer's `score-ring.tsx` which only shows a ring).

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/_components/score-card.tsx`**

```typescript
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
        {/* Mini arc */}
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

      {/* Strengths */}
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

      {/* Improvements */}
      {improvements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            לשיפור
          </p>
          <ul className="space-y-1.5">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-xs" style={{ color: 'oklch(0.75 0.16 60)' }}>
                  →
                </span>
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

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass (no new tests for pure UI component).

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/profile-grader/_components/score-card.tsx"
git commit -m "feat: add ScoreCard component for profile grader"
```

---

## Task 6: Profile Input Form

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-input-form.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-input-form.tsx`**

```typescript
'use client'

import { useTransition, useState, useRef } from 'react'
import { Github, Linkedin, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { analyzeProfileAction } from '../actions'
import type { ProfileAnalysisRecord } from '@/types/profile'

interface ProfileInputFormProps {
  onResult: (record: ProfileAnalysisRecord) => void
}

export function ProfileInputForm({ onResult }: ProfileInputFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [linkedinText, setLinkedinText] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await analyzeProfileAction(formData)
      if (result.ok) {
        onResult(result.record)
        formRef.current?.reset()
        setGithubUsername('')
        setLinkedinText('')
      } else {
        setError(result.error)
      }
    })
  }

  const canSubmit = githubUsername.trim().length > 0 && linkedinText.trim().length >= 30 && !isPending

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* GitHub Username */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor="githubUsername">
          <Github className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
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
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors',
              'border-border hover:border-border/70'
            )}
          />
        </div>
      </div>

      {/* LinkedIn Text */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium" htmlFor="linkedinText">
          <Linkedin className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
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
          rows={6}
          disabled={isPending}
          className={cn(
            'w-full rounded-xl border bg-transparent px-4 py-3 text-sm resize-none',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 transition-colors',
            'border-border hover:border-border/70'
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
        disabled={!canSubmit}
        className={cn(
          buttonVariants({ size: 'default' }),
          'w-full gap-2 font-semibold transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
        style={canSubmit ? { background: 'oklch(0.58 0.21 291)', color: 'oklch(0.98 0 0)' } : {}}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            מנתח פרופיל...
          </>
        ) : (
          'נתח את הפרופיל שלי'
        )}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-input-form.tsx"
git commit -m "feat: add ProfileInputForm with GitHub username + LinkedIn text inputs"
```

---

## Task 7: Profile Results Component

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-results.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-results.tsx`**

```typescript
import { Sparkles } from 'lucide-react'
import { ScoreCard } from './score-card'
import type { ProfileAnalysis } from '@/types/profile'

interface ProfileResultsProps {
  analysis: ProfileAnalysis
}

const TECH_COLOR = 'oklch(0.58 0.21 291)'    // violet — GitHub
const PRO_COLOR = 'oklch(0.65 0.15 211)'     // sky — LinkedIn

export function ProfileResults({ analysis }: ProfileResultsProps) {
  const { techScore, professionalScore, overallBrandScore, topTips } = analysis

  const overallColor =
    overallBrandScore >= 75
      ? 'oklch(0.60 0.17 162)'
      : overallBrandScore >= 50
        ? 'oklch(0.75 0.16 60)'
        : 'oklch(0.62 0.22 27)'

  return (
    <div className="space-y-5">
      {/* Overall brand score banner */}
      <div
        className="rounded-2xl p-6 border flex items-center justify-between"
        style={{
          background: `${overallColor.replace(')', ' / 10%)')}`,
          borderColor: overallColor.replace(')', ' / 30%)'),
        }}
      >
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Online Brand Score
          </p>
          <p className="text-4xl font-extrabold" style={{ color: overallColor }}>
            {overallBrandScore}
            <span className="text-lg font-medium text-muted-foreground">/100</span>
          </p>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: overallColor.replace(')', ' / 15%)') }}
        >
          <Sparkles className="w-8 h-8" style={{ color: overallColor }} />
        </div>
      </div>

      {/* Two score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreCard
          title="Tech Score — GitHub"
          score={techScore.score}
          strengths={techScore.strengths}
          improvements={techScore.improvements}
          color={TECH_COLOR}
        />
        <ScoreCard
          title="Professional Score — LinkedIn"
          score={professionalScore.score}
          strengths={professionalScore.strengths}
          improvements={professionalScore.improvements}
          color={PRO_COLOR}
        />
      </div>

      {/* Top tips */}
      {topTips.length > 0 && (
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 8%)',
            borderColor: 'oklch(0.585 0.212 264.4 / 20%)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-4"
            style={{ color: 'oklch(0.585 0.212 264.4)' }}
          >
            פעולות עדיפות להגדיל את הסיכוי להתגלות
          </p>
          <ol className="space-y-3">
            {topTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: 'oklch(0.585 0.212 264.4 / 20%)',
                    color: 'oklch(0.585 0.212 264.4)',
                  }}
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
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-results.tsx"
git commit -m "feat: add ProfileResults with overall brand score + two score cards + tips"
```

---

## Task 8: Profile Grader Client Orchestrator

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-grader-client.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-grader-client.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { History as HistoryIcon, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ProfileInputForm } from './profile-input-form'
import { ProfileResults } from './profile-results'
import type { ProfileAnalysisRecord } from '@/types/profile'

interface ProfileGraderClientProps {
  initialRecords: ProfileAnalysisRecord[]
}

export function ProfileGraderClient({ initialRecords }: ProfileGraderClientProps) {
  const [records, setRecords] = useState<ProfileAnalysisRecord[]>(initialRecords)
  const [selected, setSelected] = useState<ProfileAnalysisRecord | null>(
    initialRecords[0] ?? null
  )

  function handleResult(record: ProfileAnalysisRecord) {
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== record.id)
      return [record, ...filtered]
    })
    setSelected(record)
  }

  const brandColor = (record: ProfileAnalysisRecord) => {
    const score = record.result_json?.overallBrandScore ?? null
    if (score === null) return 'oklch(0.55 0 0)'
    return score >= 75
      ? 'oklch(0.60 0.17 162)'
      : score >= 50
        ? 'oklch(0.75 0.16 60)'
        : 'oklch(0.62 0.22 27)'
  }

  const usernameFromRecord = (record: ProfileAnalysisRecord): string => {
    try {
      const parsed = JSON.parse(record.input_text ?? '{}') as { githubUsername?: string }
      return parsed.githubUsername ?? '—'
    } catch {
      return '—'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Right panel: input + history */}
      <div className="lg:col-span-2 space-y-6">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <ProfileInputForm onResult={handleResult} />
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
                const color = brandColor(r)
                const score = r.result_json?.overallBrandScore ?? null
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
                    <div className="flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
                    </div>
                    {score !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          color,
                          background: color.replace(')', ' / 15%)'),
                        }}
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
        {selected?.result_json ? (
          <ProfileResults analysis={selected.result_json} />
        ) : (
          <div
            className="rounded-2xl p-12 border flex flex-col items-center justify-center text-center gap-4 min-h-64"
            style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.58 0.21 291 / 10%)' }}
            >
              <User className="w-8 h-8" style={{ color: 'oklch(0.58 0.21 291)' }} />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">ממתין לניתוח</p>
              <p className="text-muted-foreground text-sm max-w-xs">
                הזן שם משתמש GitHub והדבק טקסט מ-LinkedIn כדי לקבל את ה-Online Brand Score שלך
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/profile-grader/_components/profile-grader-client.tsx"
git commit -m "feat: add ProfileGraderClient orchestrating input form, results, and history"
```

---

## Task 9: Page + Sidebar + i18n

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/profile-grader/page.tsx`
- Modify: `src/components/layout/sidebar.tsx` (line 28: `/profile` → `/dashboard/profile-grader`)
- Modify: `messages/he.json` (add `profile` section)

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/profile-grader/page.tsx`**

```typescript
import { User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProfileGraderClient } from './_components/profile-grader-client'
import type { ProfileAnalysisRecord } from '@/types/profile'

export default async function ProfileGraderPage() {
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
      .order('created_at', { ascending: false })
      .limit(10)

    initialRecords = (data ?? []) as ProfileAnalysisRecord[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <User className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          <span>ניתוח נוכחות מקצועית</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          דירוג פרופיל מקצועי
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          GitHub + LinkedIn → Online Brand Score מותאם אישית ע"י AI
        </p>
      </div>

      <ProfileGraderClient initialRecords={initialRecords} />
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/layout/sidebar.tsx`**

Find the nav items array. Change the profile `href` from `/profile` to `/dashboard/profile-grader`.

Current:

```typescript
  { href: '/profile', icon: User, key: 'profile', color: 'oklch(0.58 0.21 291)' },
```

Replace with:

```typescript
  { href: '/dashboard/profile-grader', icon: User, key: 'profile', color: 'oklch(0.58 0.21 291)' },
```

- [ ] **Step 3: Update `messages/he.json`**

Add a `profile` section. The full updated file:

```json
{
  "nav": {
    "dashboard": "לוח בקרה",
    "resume": "ניתוח קורות חיים",
    "profile": "דירוג פרופיל",
    "trends": "טרנדים בתעשייה",
    "jobs": "חיפוש עבודה",
    "learn": "מרכז ידע"
  },
  "landing": {
    "headline": "מפסיק לנחש, מתחיל לבלוט",
    "subheadline": "הפלטפורמה שתעזור לך להתגלות לפני הסיום",
    "cta": "התחל בחינם",
    "features": {
      "resume": "ניתוח קורות חיים עם AI",
      "profile": "דירוג פרופיל LinkedIn ו-GitHub",
      "trends": "טרנדים בזמן אמת",
      "jobs": "עוזר חיפוש עבודה",
      "learn": "מסלולי למידה"
    }
  },
  "auth": {
    "login": "התחברות",
    "register": "הרשמה",
    "email": "אימייל",
    "password": "סיסמה",
    "loginButton": "כניסה",
    "registerButton": "יצירת חשבון",
    "noAccount": "אין לך חשבון?",
    "hasAccount": "כבר יש לך חשבון?"
  },
  "dashboard": {
    "welcome": "ברוך הבא",
    "resumeScore": "ציון קורות חיים",
    "noAnalysis": "טרם נותחו קורות חיים",
    "startNow": "התחל עכשיו"
  },
  "resume": {
    "title": "ניתוח קורות חיים",
    "upload": "העלה קורות חיים",
    "dragDrop": "גרור ושחרר PDF או DOCX כאן",
    "orClick": "או לחץ לבחירת קובץ",
    "analyzing": "מנתח את הקורות חיים שלך...",
    "score": "ציון",
    "history": "ניתוחים קודמים",
    "noHistory": "טרם בוצע ניתוח",
    "dimensions": {
      "structure": "מבנה וקריאות",
      "keywords": "מילות מפתח ו-ATS",
      "actionVerbs": "פעלי פעולה",
      "achievements": "הישגים מדידים",
      "clarity": "בהירות וקיצור"
    },
    "issues": "בעיות שזוהו",
    "suggestions": "המלצות לשיפור",
    "rewriteExample": "דוגמה לניסוח מחדש"
  },
  "profile": {
    "title": "דירוג פרופיל מקצועי",
    "subtitle": "GitHub + LinkedIn → Online Brand Score",
    "githubLabel": "שם משתמש GitHub",
    "linkedinLabel": "טקסט LinkedIn",
    "linkedinHint": "העתק והדבק את קטע ה-About ו/או ה-Experience מפרופיל ה-LinkedIn שלך",
    "analyze": "נתח את הפרופיל שלי",
    "analyzing": "מנתח פרופיל...",
    "techScore": "Tech Score — GitHub",
    "professionalScore": "Professional Score — LinkedIn",
    "brandScore": "Online Brand Score",
    "strengths": "נקודות חוזק",
    "improvements": "לשיפור",
    "topTips": "פעולות עדיפות להגדיל את הסיכוי להתגלות",
    "history": "ניתוחים קודמים",
    "empty": "ממתין לניתוח",
    "emptyHint": "הזן שם משתמש GitHub והדבק טקסט מ-LinkedIn כדי לקבל את ה-Online Brand Score שלך"
  },
  "errors": {
    "uploadFailed": "ההעלאה נכשלה. נסה שוב.",
    "analysisFailed": "הניתוח נכשל. נסה שוב.",
    "invalidFile": "קובץ לא תקין. יש להעלות PDF או DOCX בלבד."
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 5: Build to catch TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds. The route `/[locale]/dashboard/profile-grader` is listed as dynamic.

- [ ] **Step 6: Commit**

```bash
git add \
  "src/app/[locale]/(protected)/dashboard/profile-grader/page.tsx" \
  src/components/layout/sidebar.tsx \
  messages/he.json
git commit -m "feat: complete profile grader page, sidebar nav, and Hebrew translations"
```

- [ ] **Step 7: Merge to dev and main**

```bash
git checkout dev
git merge feature/profile-grader --no-ff -m "feat: complete Phase 2 Profile Grader with GitHub API + Claude AI"
git push origin dev
git checkout main
git merge dev --no-ff -m "feat: complete Phase 2 Profile Grader with GitHub API + Claude AI"
git push origin main
git checkout feature/profile-grader
```

---

## Self-Review

**Spec coverage:**

- ✅ Route `/he/dashboard/profile-grader` — Task 9
- ✅ GitHub username input — Task 6
- ✅ LinkedIn text-area — Task 6
- ✅ GitHub API: fetch repos, top languages — Task 2
- ✅ LinkedIn text → Claude — Task 3
- ✅ Combined Online Brand Score — Task 7 (banner)
- ✅ Tech Score (GitHub) visual chart — Task 5 (SVG arc in ScoreCard)
- ✅ Professional Score (LinkedIn) visual chart — Task 5 (ScoreCard)
- ✅ Premium theme (violet color scheme) — Tasks 5, 6, 7, 8, 9
- ✅ History of past analyses — Task 8
- ✅ Save to `profile_analyses` table — Task 4

**Type consistency:**

- `ProfileSubScore.improvements` used consistently across Task 1, 3, 5, 7
- `ProfileAnalysisRecord.result_json` is `ProfileAnalysis | null` in types, handled in client (Task 8)
- `usernameFromRecord()` parses `input_text` JSON (saved as `{ githubUsername, linkedinText }` in Action)

**No placeholders:** All steps have complete code.
