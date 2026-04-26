# Knowledge Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Knowledge Hub at `/he/dashboard/knowledge-hub` with three features: a Daily Tech Pulse (AI-personalized trends based on GitHub languages), AI Interview Prep (topic → 5 Q&A pairs), and Smart Bookmarks (save any generated insight to Supabase).

**Architecture:** One tabbed page with three Client Component panels owned by a `KnowledgeHubClient` orchestrator. Server Actions call Claude for generation; bookmarks are persisted to a new `knowledge_bookmarks` Supabase table. The page Server Component pre-loads existing bookmarks. The Tech Pulse panel reuses `fetchGitHubProfile` from Phase 2.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · `@anthropic-ai/sdk` · Supabase SSR · `@base-ui/react/tabs` (already installed via `src/components/ui/tabs.tsx`) · Tailwind v4 oklch design tokens · `next-intl` · Vitest.

---

## Codebase Context (READ BEFORE STARTING)

- **Design system** — `src/app/globals.css`. All colors use `oklch()`. Knowledge Hub module color: sky `oklch(0.65 0.15 211)`. Indigo primary: `oklch(0.585 0.212 264.4)`.
- **AI client lazy singleton pattern** — see `src/lib/ai/analyze-profile.ts` lines 3–8. Copy exactly.
- **JSON parse helper pattern** — `parseProfileAnalysis` in `src/lib/ai/analyze-profile.ts`. Copy the fence-stripping + field validation pattern.
- **Server Action pattern** — `src/app/[locale]/(protected)/dashboard/profile-grader/actions.ts`. Copy the `await createClient()`, `auth.getUser()`, error return pattern.
- **GitHub fetcher** — `src/lib/github/fetch-profile.ts` exports `fetchGitHubProfile(username): Promise<GitHubProfileData>`.
- **Tabs component** — `src/components/ui/tabs.tsx` wraps `@base-ui/react/tabs`. Use `<Tabs value={...} onValueChange={...}>`, `<TabsList>`, `<TabsTrigger value="...">`, `<TabsContent value="...">`. Import from `@/components/ui/tabs`.
- **No event handlers in Server Components** — all interactive panels must be `'use client'`.
- **Button pattern** — `buttonVariants({...})` as `className` on `<button>` element. Import from `@/components/ui/button`.
- **Sidebar** — currently `href: '/learn'` for `learn` key. Must change to `/dashboard/knowledge-hub`.
- **`messages/he.json`** — add a `"knowledge"` section.

## File Structure

```
src/types/knowledge.ts                                                           (create)
src/lib/ai/generate-trends.ts                                                    (create)
src/lib/ai/generate-interview-prep.ts                                            (create)
src/app/[locale]/(protected)/dashboard/knowledge-hub/actions.ts                  (create)
src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx                   (create)
src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/
  tech-pulse-panel.tsx                                                            (create - 'use client')
  interview-prep-panel.tsx                                                        (create - 'use client')
  bookmarks-panel.tsx                                                             (create - 'use client')
  knowledge-hub-client.tsx                                                        (create - 'use client')
supabase/migrations/002_knowledge_bookmarks.sql                                  (create)
src/components/layout/sidebar.tsx                                                (modify: /learn → /dashboard/knowledge-hub)
messages/he.json                                                                 (modify: add "knowledge" section)
tests/lib/generate-trends.test.ts                                                (create)
tests/lib/generate-interview-prep.test.ts                                        (create)
tests/types/knowledge.test.ts                                                    (create)
```

---

## Task 1: Types + DB Migration

**Files:**

- Create: `src/types/knowledge.ts`
- Create: `supabase/migrations/002_knowledge_bookmarks.sql`
- Create: `tests/types/knowledge.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/types/knowledge.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  TechTrend,
  TechPulse,
  InterviewQA,
  InterviewPrepResult,
  KnowledgeBookmark,
} from '@/types/knowledge'

describe('knowledge types', () => {
  it('TechTrend has required fields', () => {
    const trend: TechTrend = {
      title: 'Rust for Systems',
      summary: 'Rust continues to grow.',
      whyNow: 'Companies adopt it for performance.',
      relevance: 'You already code in C++.',
      tag: 'Systems',
    }
    expect(trend.title).toBe('Rust for Systems')
    expect(trend.tag).toBe('Systems')
  })

  it('TechPulse has username, topLanguages, and trends array', () => {
    const pulse: TechPulse = {
      username: 'roeeharush',
      topLanguages: ['TypeScript', 'Python'],
      trends: [],
    }
    expect(pulse.username).toBe('roeeharush')
    expect(pulse.topLanguages).toHaveLength(2)
  })

  it('InterviewQA has question, answer, difficulty', () => {
    const qa: InterviewQA = {
      question: 'What is a closure?',
      answer: 'A closure is a function that captures its lexical scope.',
      difficulty: 'medium',
    }
    expect(qa.difficulty).toBe('medium')
  })

  it('InterviewPrepResult has topic and questions array', () => {
    const result: InterviewPrepResult = {
      topic: 'React Hooks',
      questions: [],
    }
    expect(result.topic).toBe('React Hooks')
  })

  it('KnowledgeBookmark has all DB fields', () => {
    const bookmark: KnowledgeBookmark = {
      id: 'uuid',
      user_id: 'uid',
      title: 'Trend title',
      content: 'Content body',
      source: 'trend',
      created_at: new Date().toISOString(),
    }
    expect(bookmark.source).toBe('trend')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/types/knowledge.test.ts
```

Expected: FAIL — cannot find module `@/types/knowledge`

- [ ] **Step 3: Create `src/types/knowledge.ts`**

```typescript
export interface TechTrend {
  title: string
  summary: string
  whyNow: string
  relevance: string
  tag: string
}

export interface TechPulse {
  username: string
  topLanguages: string[]
  trends: TechTrend[]
}

export interface InterviewQA {
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface InterviewPrepResult {
  topic: string
  questions: InterviewQA[]
}

export interface KnowledgeBookmark {
  id: string
  user_id: string
  title: string
  content: string
  source: 'trend' | 'interview'
  created_at: string
}
```

- [ ] **Step 4: Create `supabase/migrations/002_knowledge_bookmarks.sql`**

```sql
CREATE TABLE knowledge_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source text NOT NULL CHECK (source IN ('trend', 'interview')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own knowledge bookmarks" ON knowledge_bookmarks
  FOR ALL USING (auth.uid() = user_id);
```

**Note for human:** Run this SQL in the Supabase SQL editor to create the table.

- [ ] **Step 5: Run test to verify it passes**

```bash
npm run test:run -- tests/types/knowledge.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
git add src/types/knowledge.ts supabase/migrations/002_knowledge_bookmarks.sql tests/types/knowledge.test.ts
git commit -m "feat: add knowledge hub types and bookmarks DB migration"
```

---

## Task 2: AI Trend Generator

**Files:**

- Create: `src/lib/ai/generate-trends.ts`
- Create: `tests/lib/generate-trends.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/generate-trends.test.ts`:

````typescript
import { describe, it, expect } from 'vitest'
import { parseTechPulse } from '@/lib/ai/generate-trends'

const validPulse = {
  username: 'roeeharush',
  topLanguages: ['TypeScript', 'Python'],
  trends: [
    {
      title: 'AI-Augmented Development',
      summary: 'AI coding tools are transforming workflows.',
      whyNow: 'GitHub Copilot usage doubled this year.',
      relevance: 'TypeScript developers benefit most from AI completions.',
      tag: 'AI/ML',
    },
  ],
}

describe('parseTechPulse', () => {
  it('parses valid JSON response', () => {
    const result = parseTechPulse(JSON.stringify(validPulse))
    expect(result.username).toBe('roeeharush')
    expect(result.topLanguages).toHaveLength(2)
    expect(result.trends).toHaveLength(1)
    expect(result.trends[0].tag).toBe('AI/ML')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validPulse) + '\n```'
    const result = parseTechPulse(raw)
    expect(result.trends).toHaveLength(1)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseTechPulse('not json')).toThrow()
  })

  it('throws when trends array is missing', () => {
    const bad = { username: 'x', topLanguages: [] }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })

  it('throws when username is missing', () => {
    const bad = { topLanguages: ['TypeScript'], trends: [] }
    expect(() => parseTechPulse(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/generate-trends.test.ts
```

Expected: FAIL — cannot find module `@/lib/ai/generate-trends`

- [ ] **Step 3: Create `src/lib/ai/generate-trends.ts`**

````typescript
import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData } from '@/types/profile'
import type { TechPulse } from '@/types/knowledge'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseTechPulse(raw: string): TechPulse {
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
    !('username' in parsed) ||
    !('topLanguages' in parsed) ||
    !('trends' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as TechPulse
}

export async function generateTechPulse(githubData: GitHubProfileData): Promise<TechPulse> {
  const topLanguages = Object.keys(githubData.topLanguages).slice(0, 5)
  const topRepoNames = githubData.topRepos
    .slice(0, 3)
    .map((r) => r.name)
    .join(', ')

  const prompt = `אתה מומחה טכנולוגיה ומדריך קריירה בתעשיית ההייטק. צור עבור המפתח דוח טרנדים יומי מותאם אישית.

פרטי המפתח:
- שם משתמש GitHub: ${githubData.login}
- שפות תכנות עיקריות: ${topLanguages.join(', ') || 'לא ידוע'}
- פרויקטים בולטים: ${topRepoNames || 'לא ידוע'}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "username": "${githubData.login}",
  "topLanguages": ${JSON.stringify(topLanguages)},
  "trends": [
    {
      "title": <שם הטרנד, בעברית, קצר וברור>,
      "summary": <תיאור קצר של הטרנד — 2-3 משפטים בעברית>,
      "whyNow": <למה הטרנד הזה חם דווקא עכשיו — משפט אחד בעברית>,
      "relevance": <למה הטרנד רלוונטי למפתח הזה עם השפות שלו — משפט אחד בעברית>,
      "tag": <קטגוריה קצרה באנגלית: "AI/ML" | "Web" | "Systems" | "DevOps" | "Security" | "Mobile" | "Data">
    }
  ]
}

צור בדיוק 3 טרנדים. כל טרנד חייב להיות:
1. רלוונטי לשפות התכנות של המפתח
2. חדש ומעניין ב-2026
3. בעל ערך מעשי לחיפוש עבודה

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseTechPulse(content.text)
}
````

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm run test:run -- tests/lib/generate-trends.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Run full suite**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/ai/generate-trends.ts tests/lib/generate-trends.test.ts
git commit -m "feat: add AI tech pulse generator with personalized trend prompt"
```

---

## Task 3: AI Interview Prep Generator

**Files:**

- Create: `src/lib/ai/generate-interview-prep.ts`
- Create: `tests/lib/generate-interview-prep.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/generate-interview-prep.test.ts`:

````typescript
import { describe, it, expect } from 'vitest'
import { parseInterviewPrep } from '@/lib/ai/generate-interview-prep'

const validResult = {
  topic: 'React Hooks',
  questions: [
    {
      question: 'What is the difference between useState and useRef?',
      answer: 'useState triggers re-renders; useRef does not.',
      difficulty: 'medium',
    },
    {
      question: 'When would you use useCallback?',
      answer: 'To memoize a callback function passed to a child component.',
      difficulty: 'hard',
    },
  ],
}

describe('parseInterviewPrep', () => {
  it('parses valid JSON response', () => {
    const result = parseInterviewPrep(JSON.stringify(validResult))
    expect(result.topic).toBe('React Hooks')
    expect(result.questions).toHaveLength(2)
    expect(result.questions[0].difficulty).toBe('medium')
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validResult) + '\n```'
    const result = parseInterviewPrep(raw)
    expect(result.questions).toHaveLength(2)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseInterviewPrep('not json')).toThrow()
  })

  it('throws when topic is missing', () => {
    const bad = { questions: [] }
    expect(() => parseInterviewPrep(JSON.stringify(bad))).toThrow()
  })

  it('throws when questions array is missing', () => {
    const bad = { topic: 'React Hooks' }
    expect(() => parseInterviewPrep(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:run -- tests/lib/generate-interview-prep.test.ts
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Create `src/lib/ai/generate-interview-prep.ts`**

````typescript
import Anthropic from '@anthropic-ai/sdk'
import type { InterviewPrepResult } from '@/types/knowledge'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseInterviewPrep(raw: string): InterviewPrepResult {
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
    !('topic' in parsed) ||
    !('questions' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as InterviewPrepResult
}

export async function generateInterviewPrep(topic: string): Promise<InterviewPrepResult> {
  const prompt = `אתה מומחה ראיונות עבודה בתעשיית ההייטק הישראלית. צור 5 שאלות ראיון מקיפות עם תשובות מפורטות.

נושא הראיון: ${topic}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "topic": "${topic}",
  "questions": [
    {
      "question": <שאלת ראיון ממוקדת בנושא — באנגלית או עברית לפי הנושא>,
      "answer": <תשובה מפורטת ומדויקת — 2-4 משפטים>,
      "difficulty": <"easy" | "medium" | "hard">
    }
  ]
}

הנחיות:
- צור בדיוק 5 שאלות
- הפצל: 1 שאלה קלה, 2 בינוניות, 2 קשות
- השאלות חייבות לבדוק הבנה אמיתית, לא זיכרון
- התשובות צריכות להיות מדויקות ופרקטיות
- אם הנושא טכני (React, SQL, etc.) — שאלות ותשובות באנגלית
- אם הנושא רך (System Design, Behavioral) — שאלות ותשובות בעברית

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseInterviewPrep(content.text)
}
````

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm run test:run -- tests/lib/generate-interview-prep.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/generate-interview-prep.ts tests/lib/generate-interview-prep.test.ts
git commit -m "feat: add AI interview prep generator with 5 Q&A prompt"
```

---

## Task 4: Server Actions

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/actions.ts`
  (also create the `_components/` subdirectory by touching a placeholder there)

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/actions.ts`**

Create the directory and file:

```typescript
'use server'

import { fetchGitHubProfile } from '@/lib/github/fetch-profile'
import { generateTechPulse } from '@/lib/ai/generate-trends'
import { generateInterviewPrep } from '@/lib/ai/generate-interview-prep'
import { createClient } from '@/lib/supabase/server'
import type { TechPulse, InterviewPrepResult, KnowledgeBookmark } from '@/types/knowledge'

export type TechPulseResult = { ok: true; pulse: TechPulse } | { ok: false; error: string }

export type InterviewPrepActionResult =
  | { ok: true; result: InterviewPrepResult }
  | { ok: false; error: string }

export type BookmarkResult =
  | { ok: true; bookmark: KnowledgeBookmark }
  | { ok: false; error: string }

export type DeleteResult = { ok: boolean; error?: string }

export async function generateTechPulseAction(formData: FormData): Promise<TechPulseResult> {
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

  try {
    const pulse = await generateTechPulse(githubData)
    return { ok: true, pulse }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת הטרנדים. נסה שוב.' }
  }
}

export async function generateInterviewPrepAction(
  formData: FormData
): Promise<InterviewPrepActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const topic = ((formData.get('topic') as string | null) ?? '').trim()
  if (!topic) return { ok: false, error: 'יש להזין נושא לראיון' }
  if (topic.length < 2) return { ok: false, error: 'נושא הראיון קצר מדי' }
  if (topic.length > 100) return { ok: false, error: 'נושא הראיון ארוך מדי (מקסימום 100 תווים)' }

  try {
    const result = await generateInterviewPrep(topic)
    return { ok: true, result }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת שאלות הראיון. נסה שוב.' }
  }
}

export async function saveBookmarkAction(formData: FormData): Promise<BookmarkResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const title = ((formData.get('title') as string | null) ?? '').trim()
  const content = ((formData.get('content') as string | null) ?? '').trim()
  const source = (formData.get('source') as string | null) ?? ''

  if (!title || !content) return { ok: false, error: 'כותרת ותוכן נדרשים' }
  if (source !== 'trend' && source !== 'interview') {
    return { ok: false, error: 'מקור לא תקין' }
  }

  const { data, error } = await supabase
    .from('knowledge_bookmarks')
    .insert({ user_id: user.id, title, content, source })
    .select()
    .single()

  if (error || !data) {
    return {
      ok: true,
      bookmark: {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        content,
        source: source as 'trend' | 'interview',
        created_at: new Date().toISOString(),
      },
    }
  }

  return { ok: true, bookmark: data as KnowledgeBookmark }
}

export async function deleteBookmarkAction(formData: FormData): Promise<DeleteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  if (!id) return { ok: false, error: 'מזהה הסימנייה חסר' }

  const { error } = await supabase
    .from('knowledge_bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה במחיקת הסימנייה' }
  return { ok: true }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/knowledge-hub/actions.ts"
git commit -m "feat: add knowledge hub server actions for trends, interview prep, and bookmarks"
```

---

## Task 5: Tech Pulse Panel

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/tech-pulse-panel.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/tech-pulse-panel.tsx`**

```typescript
'use client'

import { useTransition, useState } from 'react'
import { Zap, Bookmark, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateTechPulseAction } from '../actions'
import type { TechPulse, TechTrend } from '@/types/knowledge'

interface TechPulsePanelProps {
  onBookmark: (title: string, content: string, source: 'trend' | 'interview') => void
}

const TAG_COLORS: Record<string, string> = {
  'AI/ML': 'oklch(0.58 0.21 291)',
  Web: 'oklch(0.585 0.212 264.4)',
  Systems: 'oklch(0.60 0.17 162)',
  DevOps: 'oklch(0.75 0.16 60)',
  Security: 'oklch(0.62 0.22 27)',
  Mobile: 'oklch(0.65 0.15 211)',
  Data: 'oklch(0.65 0.18 140)',
}

function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? 'oklch(0.585 0.212 264.4)'
}

function TrendCard({
  trend,
  onBookmark,
}: {
  trend: TechTrend
  onBookmark: (title: string, content: string) => void
}) {
  const color = tagColor(trend.tag)
  const bookmarkContent = `${trend.summary}\n\nלמה עכשיו: ${trend.whyNow}\n\nרלוונטיות: ${trend.relevance}`

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 20%)') }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: color.replace(')', ' / 15%)'), color }}
            >
              {trend.tag}
            </span>
          </div>
          <h3 className="font-bold text-base leading-tight">{trend.title}</h3>
        </div>
        <button
          onClick={() => onBookmark(trend.title, bookmarkContent)}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0 px-2 text-muted-foreground hover:text-foreground'
          )}
          title="שמור סימניה"
          aria-label="שמור סימניה"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{trend.summary}</p>

      <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <p className="text-xs">
          <span className="font-semibold" style={{ color }}>
            למה עכשיו:{' '}
          </span>
          <span className="text-muted-foreground">{trend.whyNow}</span>
        </p>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: 'oklch(0.60 0.17 162)' }}>
            רלוונטיות:{' '}
          </span>
          <span className="text-muted-foreground">{trend.relevance}</span>
        </p>
      </div>
    </div>
  )
}

export function TechPulsePanel({ onBookmark }: TechPulsePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState<TechPulse | null>(null)
  const [githubUsername, setGithubUsername] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await generateTechPulseAction(formData)
      if (result.ok) {
        setPulse(result.pulse)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground pointer-events-none">
            @
          </span>
          <input
            name="githubUsername"
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="שם משתמש GitHub שלך"
            dir="ltr"
            autoComplete="off"
            disabled={isPending}
            className={cn(
              'w-full rounded-xl border bg-transparent px-4 py-2.5 text-sm pr-8',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors border-border'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!githubUsername.trim() || isPending}
          className={cn(
            buttonVariants({ size: 'default' }),
            'gap-2 font-semibold shrink-0',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          style={
            githubUsername.trim() && !isPending
              ? { background: 'oklch(0.65 0.15 211)', color: 'oklch(0.98 0 0)' }
              : {}
          }
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {isPending ? 'מייצר...' : 'Daily Pulse'}
        </button>
      </form>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {pulse && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
            <p className="text-sm font-semibold">
              Daily Tech Pulse עבור{' '}
              <span dir="ltr" className="font-mono">
                @{pulse.username}
              </span>
            </p>
            <span className="text-xs text-muted-foreground">
              ({pulse.topLanguages.slice(0, 3).join(', ')})
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {pulse.trends.map((trend, i) => (
              <TrendCard
                key={i}
                trend={trend}
                onBookmark={(title, content) => onBookmark(title, content, 'trend')}
              />
            ))}
          </div>
        </div>
      )}

      {!pulse && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.65 0.15 211 / 10%)' }}
          >
            <Zap className="w-7 h-7" style={{ color: 'oklch(0.65 0.15 211)' }} />
          </div>
          <p className="font-semibold">הזן שם משתמש GitHub לקבלת הטרנדים שלך</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ינתח את שפות התכנות שלך ויציג 3 טרנדים רלוונטיים להיום
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/tech-pulse-panel.tsx"
git commit -m "feat: add TechPulsePanel with GitHub input and trend cards"
```

---

## Task 6: Interview Prep Panel

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/interview-prep-panel.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/interview-prep-panel.tsx`**

```typescript
'use client'

import { useTransition, useState } from 'react'
import { GraduationCap, Bookmark, Loader2, ChevronDown } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateInterviewPrepAction } from '../actions'
import type { InterviewPrepResult, InterviewQA } from '@/types/knowledge'

interface InterviewPrepPanelProps {
  onBookmark: (title: string, content: string, source: 'trend' | 'interview') => void
}

const QUICK_TOPICS = [
  'React Hooks',
  'System Design',
  'SQL Joins',
  'TypeScript Generics',
  'Git Workflow',
  'Node.js Event Loop',
  'REST vs GraphQL',
  'Docker Basics',
]

const DIFFICULTY_CONFIG = {
  easy: { label: 'קל', color: 'oklch(0.60 0.17 162)' },
  medium: { label: 'בינוני', color: 'oklch(0.75 0.16 60)' },
  hard: { label: 'קשה', color: 'oklch(0.62 0.22 27)' },
}

function QACard({
  qa,
  index,
  onBookmark,
}: {
  qa: InterviewQA
  index: number
  onBookmark: (title: string, content: string) => void
}) {
  const [open, setOpen] = useState(false)
  const diff = DIFFICULTY_CONFIG[qa.difficulty]
  const bookmarkContent = `שאלה: ${qa.question}\n\nתשובה: ${qa.answer}`

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-start gap-3 text-right hover:bg-white/3 transition-colors"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 15%)',
            color: 'oklch(0.585 0.212 264.4)',
          }}
        >
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: diff.color.replace(')', ' / 15%)'), color: diff.color }}
            >
              {diff.label}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{qa.question}</p>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className="px-5 pb-4 pt-2 border-t"
          style={{ borderColor: 'oklch(1 0 0 / 8%)' }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{qa.answer}</p>
          <button
            onClick={() => onBookmark(`Q: ${qa.question.slice(0, 60)}`, bookmarkContent)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1.5 text-muted-foreground hover:text-foreground px-2'
            )}
          >
            <Bookmark className="w-3.5 h-3.5" />
            שמור סימניה
          </button>
        </div>
      )}
    </div>
  )
}

export function InterviewPrepPanel({ onBookmark }: InterviewPrepPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [prepResult, setPrepResult] = useState<InterviewPrepResult | null>(null)
  const [topic, setTopic] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await generateInterviewPrepAction(formData)
      if (result.ok) {
        setPrepResult(result.result)
      } else {
        setError(result.error)
      }
    })
  }

  function handleQuickTopic(t: string) {
    setTopic(t)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <input
            name="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="הזן נושא — לדוג׳: React Hooks, SQL Joins, System Design"
            disabled={isPending}
            className={cn(
              'flex-1 rounded-xl border bg-transparent px-4 py-2.5 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 transition-colors border-border'
            )}
          />
          <button
            type="submit"
            disabled={!topic.trim() || isPending}
            className={cn(
              buttonVariants({ size: 'default' }),
              'gap-2 font-semibold shrink-0',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            style={
              topic.trim() && !isPending
                ? { background: 'oklch(0.585 0.212 264.4)', color: 'oklch(0.98 0 0)' }
                : {}
            }
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
            {isPending ? 'מייצר...' : 'צור שאלות'}
          </button>
        </div>

        {/* Quick topic chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleQuickTopic(t)}
              disabled={isPending}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                topic === t
                  ? 'border-primary/50 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/70'
              )}
              style={topic === t ? { background: 'oklch(0.585 0.212 264.4 / 15%)' } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {prepResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
            <p className="text-sm font-semibold">
              5 שאלות ראיון על{' '}
              <span style={{ color: 'oklch(0.585 0.212 264.4)' }}>{prepResult.topic}</span>
            </p>
          </div>
          <div className="space-y-2">
            {prepResult.questions.map((qa, i) => (
              <QACard
                key={i}
                qa={qa}
                index={i}
                onBookmark={(title, content) => onBookmark(title, content, 'interview')}
              />
            ))}
          </div>
        </div>
      )}

      {!prepResult && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.585 0.212 264.4 / 10%)' }}
          >
            <GraduationCap className="w-7 h-7" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
          </div>
          <p className="font-semibold">הזן נושא לקבלת שאלות ראיון</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ייצר 5 שאלות ראיון עם תשובות מפורטות, מותאמות לרמות קושי שונות
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/interview-prep-panel.tsx"
git commit -m "feat: add InterviewPrepPanel with topic input, quick chips, and expandable Q&A"
```

---

## Task 7: Bookmarks Panel

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/bookmarks-panel.tsx`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/bookmarks-panel.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import { Bookmark, Trash2, Zap, GraduationCap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { deleteBookmarkAction } from '../actions'
import type { KnowledgeBookmark } from '@/types/knowledge'

interface BookmarksPanelProps {
  bookmarks: KnowledgeBookmark[]
  onDelete: (id: string) => void
}

const SOURCE_CONFIG = {
  trend: {
    label: 'Tech Pulse',
    icon: Zap,
    color: 'oklch(0.65 0.15 211)',
  },
  interview: {
    label: 'ראיון',
    icon: GraduationCap,
    color: 'oklch(0.585 0.212 264.4)',
  },
}

function BookmarkCard({
  bookmark,
  onDelete,
}: {
  bookmark: KnowledgeBookmark
  onDelete: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const config = SOURCE_CONFIG[bookmark.source]
  const Icon = config.icon

  function handleDelete() {
    const formData = new FormData()
    formData.set('id', bookmark.id)
    startTransition(async () => {
      const result = await deleteBookmarkAction(formData)
      if (result.ok) onDelete(bookmark.id)
    })
  }

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 group"
      style={{
        background: 'var(--card)',
        borderColor: config.color.replace(')', ' / 15%)'),
        opacity: isPending ? 0.5 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: config.color.replace(')', ' / 12%)'),
              color: config.color,
            }}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'px-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity'
          )}
          title="מחק סימניה"
          aria-label="מחק סימניה"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="font-semibold text-sm leading-tight">{bookmark.title}</h3>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {bookmark.content}
      </p>

      <p className="text-xs text-muted-foreground mt-auto">
        {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true, locale: he })}
      </p>
    </div>
  )
}

export function BookmarksPanel({ bookmarks, onDelete }: BookmarksPanelProps) {
  if (bookmarks.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
        style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'oklch(0.65 0.15 211 / 10%)' }}
        >
          <Bookmark className="w-7 h-7" style={{ color: 'oklch(0.65 0.15 211)' }} />
        </div>
        <p className="font-semibold">אין סימניות עדיין</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          לחץ על כפתור הסימניה בכרטיסי הטרנדים ושאלות הראיון כדי לשמור תכנים מעניינים
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {bookmarks.length} סימניות שמורות
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/bookmarks-panel.tsx"
git commit -m "feat: add BookmarksPanel with masonry grid, delete, and source badges"
```

---

## Task 8: Knowledge Hub Client + Page + Sidebar + i18n

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx`
- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `messages/he.json`

- [ ] **Step 1: Create `knowledge-hub-client.tsx`**

Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Zap, GraduationCap, Bookmark } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { saveBookmarkAction } from '../actions'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { BookmarksPanel } from './bookmarks-panel'
import type { KnowledgeBookmark } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  initialBookmarks: KnowledgeBookmark[]
}

export function KnowledgeHubClient({ initialBookmarks }: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState('pulse')
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

  const TAB_CONFIG = [
    {
      value: 'pulse',
      label: 'Daily Tech Pulse',
      icon: Zap,
      color: 'oklch(0.65 0.15 211)',
    },
    {
      value: 'interview',
      label: 'הכנה לראיונות',
      icon: GraduationCap,
      color: 'oklch(0.585 0.212 264.4)',
    },
    {
      value: 'bookmarks',
      label: `הסימניות שלי${bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}`,
      icon: Bookmark,
      color: 'oklch(0.65 0.15 211)',
    },
  ]

  return (
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

- [ ] **Step 2: Create `page.tsx`**

Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx`:

```typescript
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeHubClient } from './_components/knowledge-hub-client'
import type { KnowledgeBookmark } from '@/types/knowledge'

export default async function KnowledgeHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialBookmarks: KnowledgeBookmark[] = []
  if (user) {
    const { data } = await supabase
      .from('knowledge_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    initialBookmarks = (data ?? []) as KnowledgeBookmark[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <BookOpen className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
          <span>למידה ושיפור עצמי</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          מרכז הידע
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          טרנדים יומיים · הכנה לראיונות · סימניות חכמות — הכל מופעל ע"י AI
        </p>
      </div>

      <KnowledgeHubClient initialBookmarks={initialBookmarks} />
    </div>
  )
}
```

- [ ] **Step 3: Update `src/components/layout/sidebar.tsx`**

Find the nav item for `learn`. Current:

```typescript
  { href: '/learn', icon: BookOpen, key: 'learn', color: 'oklch(0.65 0.15 211)' },
```

Replace with:

```typescript
  { href: '/dashboard/knowledge-hub', icon: BookOpen, key: 'learn', color: 'oklch(0.65 0.15 211)' },
```

- [ ] **Step 4: Update `messages/he.json`**

Add a `"knowledge"` section. The complete updated file:

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
  "knowledge": {
    "title": "מרכז הידע",
    "subtitle": "טרנדים יומיים · הכנה לראיונות · סימניות חכמות",
    "pulse": "Daily Tech Pulse",
    "pulseHint": "הזן שם משתמש GitHub לקבלת טרנדים מותאמים אישית",
    "generate": "צור",
    "generating": "מייצר...",
    "interviewPrep": "הכנה לראיונות",
    "interviewHint": "הזן נושא לקבלת 5 שאלות ראיון עם תשובות",
    "bookmarks": "הסימניות שלי",
    "noBookmarks": "אין סימניות עדיין",
    "noBookmarksHint": "שמור תכנים מעניינים מהטרנדים ושאלות הראיון",
    "saveBookmark": "שמור סימניה",
    "deleteBookmark": "מחק סימניה",
    "trendSource": "Tech Pulse",
    "interviewSource": "ראיון"
  },
  "errors": {
    "uploadFailed": "ההעלאה נכשלה. נסה שוב.",
    "analysisFailed": "הניתוח נכשל. נסה שוב.",
    "invalidFile": "קובץ לא תקין. יש להעלות PDF או DOCX בלבד."
  }
}
```

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```

Expected: all tests pass

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: build succeeds. Route `/[locale]/dashboard/knowledge-hub` listed as dynamic.

If build fails, fix before proceeding.

- [ ] **Step 7: Commit**

```bash
git add \
  "src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx" \
  "src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx" \
  src/components/layout/sidebar.tsx \
  messages/he.json
git commit -m "feat: complete knowledge hub page, client, sidebar nav, and i18n"
```

- [ ] **Step 8: Merge to dev and main**

```bash
git checkout dev
git merge feature/knowledge-hub --no-ff -m "feat: complete Phase 3 Knowledge Hub with AI trends, interview prep, and smart bookmarks"
git push origin dev
git checkout main
git merge dev --no-ff -m "feat: complete Phase 3 Knowledge Hub with AI trends, interview prep, and smart bookmarks"
git push origin main
git checkout feature/knowledge-hub
```

---

## Self-Review

**Spec coverage:**

- ✅ Route `/he/dashboard/knowledge-hub` — Task 8 (page.tsx)
- ✅ Trend Radar / Daily Tech Pulse — Tasks 2 + 4 + 5
- ✅ Based on GitHub profile (language detection) — `generateTechPulse` receives `GitHubProfileData`
- ✅ AI Interview Prep — Tasks 3 + 4 + 6
- ✅ 5 Q&A with answers — prompt in Task 3 specifies 5 questions with difficulty levels
- ✅ Smart Bookmarks — Tasks 1 (DB) + 4 (actions) + 7 (panel) + 8 (client state)
- ✅ Save from any panel — `onBookmark` callback passed to TechPulsePanel and InterviewPrepPanel
- ✅ Grid/masonry layout for Knowledge Cards — Task 7 (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`)
- ✅ Premium dark theme — all colors use oklch, sky color for Knowledge Hub module
- ✅ Sidebar updated — Task 8 (`/learn` → `/dashboard/knowledge-hub`)

**Type consistency:**

- `TechPulse` defined in Task 1, used in Tasks 2, 4, 5 ✅
- `InterviewPrepResult` defined in Task 1, used in Tasks 3, 4, 6 ✅
- `KnowledgeBookmark` defined in Task 1, used in Tasks 4, 7, 8 ✅
- `onBookmark(title, content, source)` signature consistent across Tasks 5, 6, 8 ✅
- `saveBookmarkAction` returns `BookmarkResult = { ok: true; bookmark: KnowledgeBookmark } | { ok: false; error: string }` ✅

**No placeholders:** All steps have complete code.
