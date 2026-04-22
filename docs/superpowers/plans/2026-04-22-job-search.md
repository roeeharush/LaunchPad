# Job Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Job Search dashboard at `/he/dashboard/job-search` with AI-driven job discovery (based on the user's resume), smart client-side filters (Remote / Junior-friendly / Tech Stack), and a Kanban-style application tracker with four status columns.

**Architecture:** A tabbed two-panel layout — Discover (AI generates ~10 job suggestions from the user's last resume analysis, filtered client-side) and Tracker (persisted applications in a new `job_applications` Supabase table, status toggled via dropdown). No external job API is required; Claude generates realistic, personalised suggestions from the resume `analysis_json` already stored in the `resumes` table.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · `@anthropic-ai/sdk` · Supabase SSR · `@base-ui/react/tabs` (via `src/components/ui/tabs.tsx`) · Tailwind v4 oklch design tokens · `next-intl` · Vitest.

---

## Codebase Context (READ BEFORE STARTING)

- **Design system** — `src/app/globals.css`. All colors use `oklch()`. Job Search module color: amber `oklch(0.75 0.16 60)`. Indigo primary: `oklch(0.585 0.212 264.4)`.
- **AI client lazy singleton pattern** — see `src/lib/ai/analyze-profile.ts` lines 3–8. Copy exactly.
- **JSON parse helper pattern** — `parseProfileAnalysis` in `src/lib/ai/analyze-profile.ts`. Copy the fence-stripping + field validation pattern.
- **Server Action pattern** — `src/app/[locale]/(protected)/dashboard/knowledge-hub/actions.ts`. Copy the `await createClient()`, `auth.getUser()`, discriminated-union return pattern.
- **Resume type** — `src/types/resume.ts` exports `ResumeRecord` (fields: `id`, `user_id`, `file_url`, `extracted_text`, `analysis_json: ResumeMatchAnalysis | null`, `score`, `created_at`). `ResumeMatchAnalysis` has `{ matchPercentage, strengths, gaps, tips }`.
- **Tabs component** — `src/components/ui/tabs.tsx`. Use `<Tabs value onValueChange>`, `<TabsList>`, `<TabsTrigger value>`, `<TabsContent value>`. Import from `@/components/ui/tabs`.
- **Button pattern** — `buttonVariants({...})` as `className` on `<button>`. Import from `@/components/ui/button`.
- **No event handlers in Server Components** — all interactive panels must be `'use client'`.
- **Sidebar** — currently `href: '/jobs'` for the `jobs` key. Must change to `/dashboard/job-search`.

## File Structure

```
src/types/jobs.ts                                                                (create)
src/lib/ai/generate-job-suggestions.ts                                           (create)
src/app/[locale]/(protected)/dashboard/job-search/actions.ts                    (create)
src/app/[locale]/(protected)/dashboard/job-search/page.tsx                      (create)
src/app/[locale]/(protected)/dashboard/job-search/_components/
  job-discovery-panel.tsx                                                         (create - 'use client')
  application-tracker.tsx                                                         (create - 'use client')
  job-search-client.tsx                                                           (create - 'use client')
supabase/migrations/003_job_applications.sql                                     (create)
src/components/layout/sidebar.tsx                                                (modify: /jobs → /dashboard/job-search)
messages/he.json                                                                 (modify: add "jobs" section)
tests/types/jobs.test.ts                                                         (create)
tests/lib/generate-job-suggestions.test.ts                                       (create)
```

---

## Task 1: Types + DB Migration

**Files:**

- Create: `src/types/jobs.ts`
- Create: `supabase/migrations/003_job_applications.sql`
- Create: `tests/types/jobs.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/types/jobs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type {
  JobSuggestion,
  JobSuggestionsResult,
  ApplicationStatus,
  JobApplication,
} from '@/types/jobs'

describe('jobs types', () => {
  it('JobSuggestion has all required fields', () => {
    const job: JobSuggestion = {
      id: 'j0',
      title: 'Frontend Developer',
      company: 'Wix',
      location: 'Tel Aviv',
      isRemote: false,
      isJuniorFriendly: true,
      techStack: ['React', 'TypeScript'],
      description: 'Build UI components.',
      matchReason: 'Your React projects align.',
      salaryRange: '18,000–25,000 ₪',
    }
    expect(job.title).toBe('Frontend Developer')
    expect(job.isJuniorFriendly).toBe(true)
    expect(job.techStack).toHaveLength(2)
  })

  it('JobSuggestionsResult has jobs array and basedOn string', () => {
    const result: JobSuggestionsResult = {
      jobs: [],
      basedOn: 'React, TypeScript',
    }
    expect(result.basedOn).toBe('React, TypeScript')
  })

  it('ApplicationStatus is a valid union literal', () => {
    const statuses: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']
    expect(statuses).toHaveLength(4)
  })

  it('JobApplication has all DB fields', () => {
    const app: JobApplication = {
      id: 'uuid',
      user_id: 'uid',
      job_title: 'Backend Dev',
      company: 'Monday.com',
      location: 'Remote',
      is_remote: true,
      tech_stack: ['Node.js', 'PostgreSQL'],
      status: 'applied',
      notes: null,
      applied_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    expect(app.status).toBe('applied')
    expect(app.is_remote).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run -- tests/types/jobs.test.ts
```

Expected: FAIL — cannot find module `@/types/jobs`

- [ ] **Step 3: Create `src/types/jobs.ts`**

```typescript
export interface JobSuggestion {
  id: string
  title: string
  company: string
  location: string
  isRemote: boolean
  isJuniorFriendly: boolean
  techStack: string[]
  description: string
  matchReason: string
  salaryRange: string
}

export interface JobSuggestionsResult {
  jobs: JobSuggestion[]
  basedOn: string
}

export type ApplicationStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface JobApplication {
  id: string
  user_id: string
  job_title: string
  company: string
  location: string | null
  is_remote: boolean
  tech_stack: string[]
  status: ApplicationStatus
  notes: string | null
  applied_at: string
  created_at: string
}
```

- [ ] **Step 4: Create `supabase/migrations/003_job_applications.sql`**

```sql
CREATE TABLE job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  job_title text NOT NULL,
  company text NOT NULL,
  location text,
  is_remote boolean NOT NULL DEFAULT false,
  tech_stack jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected')),
  notes text,
  applied_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own job applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);
```

**Note for human:** Run this SQL in the Supabase SQL editor to create the table.

- [ ] **Step 5: Run test to verify it passes**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run -- tests/types/jobs.test.ts
```

Expected: PASS — 4 tests

- [ ] **Step 6: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add src/types/jobs.ts supabase/migrations/003_job_applications.sql tests/types/jobs.test.ts
git commit -m "feat: add job search types and job_applications DB migration"
```

---

## Task 2: AI Job Suggestions Generator

**Files:**

- Create: `src/lib/ai/generate-job-suggestions.ts`
- Create: `tests/lib/generate-job-suggestions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/generate-job-suggestions.test.ts`:

````typescript
import { describe, it, expect } from 'vitest'
import { parseJobSuggestions } from '@/lib/ai/generate-job-suggestions'

const validRaw = {
  basedOn: 'React, TypeScript, Node.js',
  jobs: [
    {
      title: 'Frontend Developer',
      company: 'Wix',
      location: 'Tel Aviv',
      isRemote: false,
      isJuniorFriendly: true,
      techStack: ['React', 'TypeScript'],
      description: 'Build UI components for a leading platform.',
      matchReason: 'Your React and TypeScript projects are a strong match.',
      salaryRange: '18,000–25,000 ₪',
    },
    {
      title: 'Full Stack Developer',
      company: 'Monday.com',
      location: 'Remote',
      isRemote: true,
      isJuniorFriendly: false,
      techStack: ['Node.js', 'React'],
      description: 'Work on the core product.',
      matchReason: 'Your full-stack experience fits well.',
      salaryRange: '25,000–35,000 ₪',
    },
  ],
}

describe('parseJobSuggestions', () => {
  it('parses valid JSON and adds sequential ids', () => {
    const result = parseJobSuggestions(JSON.stringify(validRaw))
    expect(result.basedOn).toBe('React, TypeScript, Node.js')
    expect(result.jobs).toHaveLength(2)
    expect(result.jobs[0].id).toBe('j0')
    expect(result.jobs[1].id).toBe('j1')
    expect(result.jobs[0].isJuniorFriendly).toBe(true)
  })

  it('strips markdown code fences before parsing', () => {
    const raw = '```json\n' + JSON.stringify(validRaw) + '\n```'
    const result = parseJobSuggestions(raw)
    expect(result.jobs).toHaveLength(2)
  })

  it('throws on invalid JSON', () => {
    expect(() => parseJobSuggestions('not json')).toThrow()
  })

  it('throws when jobs array is missing', () => {
    const bad = { basedOn: 'React' }
    expect(() => parseJobSuggestions(JSON.stringify(bad))).toThrow()
  })

  it('throws when basedOn is missing', () => {
    const bad = { jobs: [] }
    expect(() => parseJobSuggestions(JSON.stringify(bad))).toThrow()
  })
})
````

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run -- tests/lib/generate-job-suggestions.test.ts
```

Expected: FAIL — cannot find module `@/lib/ai/generate-job-suggestions`

- [ ] **Step 3: Create `src/lib/ai/generate-job-suggestions.ts`**

````typescript
import Anthropic from '@anthropic-ai/sdk'
import type { JobSuggestionsResult } from '@/types/jobs'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseJobSuggestions(raw: string): JobSuggestionsResult {
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
    !('basedOn' in parsed) ||
    !('jobs' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  const rawResult = parsed as { basedOn: string; jobs: object[] }
  return {
    basedOn: rawResult.basedOn,
    jobs: rawResult.jobs.map((j, i) => ({
      ...(j as object),
      id: `j${i}`,
    })) as JobSuggestionsResult['jobs'],
  }
}

export async function generateJobSuggestions(resumeProfile: {
  strengths: string[]
  gaps: string[]
  tips: string[]
  score: number
}): Promise<JobSuggestionsResult> {
  const { strengths, gaps, tips, score } = resumeProfile

  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. בהתבסס על פרופיל קורות החיים של המועמד, הצע 10 משרות עבודה מתאימות וריאליסטיות.

ציון קורות חיים: ${score}/100
נקודות חוזק: ${strengths.join(', ')}
פערים: ${gaps.join(', ')}
טיפים לשיפור: ${tips.slice(0, 3).join(', ')}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "basedOn": "<רשימת הטכנולוגיות/כישורים העיקריים שזוהו מהפרופיל>",
  "jobs": [
    {
      "title": "<תפקיד בעברית או אנגלית כמקובל בתעשייה>",
      "company": "<שם חברה ישראלית ריאלית בתחום ההייטק>",
      "location": "<עיר, לדוגמה: תל אביב | חיפה | רמת גן | Remote>",
      "isRemote": <true אם Remote, false אחרת>,
      "isJuniorFriendly": <true אם מתאים לג׳וניור עם 0-2 שנות ניסיון>,
      "techStack": ["<טכנולוגיה1>", "<טכנולוגיה2>", "<עד 5 טכנולוגיות>"],
      "description": "<תיאור קצר של התפקיד — 2 משפטים בעברית>",
      "matchReason": "<למה המשרה הזו מתאימה לפרופיל — משפט אחד בעברית>",
      "salaryRange": "<טווח שכר בשקלים, לדוגמה: 18,000–25,000 ₪>"
    }
  ]
}

הנחיות:
- צור בדיוק 10 משרות מגוונות
- לפחות 3 משרות Junior-friendly
- לפחות 2 משרות Remote
- חברות ריאליות: Wix, Monday.com, Fiverr, Check Point, Amdocs, NICE, Sela, Tikal, Matrix, וכד׳
- התאם את המשרות לכישורים שזוהו בפרופיל
- אם ציון קורות החיים מתחת ל-60, הצע יותר משרות Junior-friendly

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseJobSuggestions(content.text)
}
````

- [ ] **Step 4: Run tests and verify they pass**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run -- tests/lib/generate-job-suggestions.test.ts
```

Expected: PASS — 5 tests

- [ ] **Step 5: Run full suite**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add src/lib/ai/generate-job-suggestions.ts tests/lib/generate-job-suggestions.test.ts
git commit -m "feat: add AI job suggestions generator with resume-based personalised prompt"
```

---

## Task 3: Server Actions

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/job-search/actions.ts`

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/job-search/actions.ts`**

Create the directory and file:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateJobSuggestions } from '@/lib/ai/generate-job-suggestions'
import type { JobSuggestionsResult, JobApplication, ApplicationStatus } from '@/types/jobs'
import type { ResumeRecord } from '@/types/resume'

export type JobSuggestionsActionResult =
  | { ok: true; result: JobSuggestionsResult }
  | { ok: false; error: string }

export type SaveApplicationResult =
  | { ok: true; application: JobApplication }
  | { ok: false; error: string }

export type UpdateStatusResult = { ok: boolean; error?: string }
export type DeleteApplicationResult = { ok: boolean; error?: string }

export async function generateJobSuggestionsAction(): Promise<JobSuggestionsActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  // Fetch the user's latest resume with an analysis
  const { data: resumes } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .not('analysis_json', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestResume = (resumes ?? [])[0] as ResumeRecord | undefined
  if (!latestResume?.analysis_json) {
    return {
      ok: false,
      error: 'טרם נותחו קורות חיים. העלה ונתח קורות חיים תחילה.',
    }
  }

  const { strengths, gaps, tips } = latestResume.analysis_json
  const score = latestResume.score ?? 50

  try {
    const result = await generateJobSuggestions({ strengths, gaps, tips, score })
    return { ok: true, result }
  } catch {
    return { ok: false, error: 'שגיאה ביצירת הצעות העבודה. נסה שוב.' }
  }
}

export async function saveApplicationAction(formData: FormData): Promise<SaveApplicationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const job_title = ((formData.get('job_title') as string | null) ?? '').trim()
  const company = ((formData.get('company') as string | null) ?? '').trim()
  const location = ((formData.get('location') as string | null) ?? '').trim() || null
  const is_remote = formData.get('is_remote') === 'true'
  const tech_stack_raw = (formData.get('tech_stack') as string | null) ?? '[]'
  const tech_stack: string[] = JSON.parse(tech_stack_raw)

  if (!job_title || !company) return { ok: false, error: 'כותרת ותפקיד נדרשים' }

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_title,
      company,
      location,
      is_remote,
      tech_stack,
      status: 'applied',
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, error: 'שגיאה בשמירת הבקשה. נסה שוב.' }
  }

  return { ok: true, application: data as JobApplication }
}

export async function updateApplicationStatusAction(
  formData: FormData
): Promise<UpdateStatusResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  const status = ((formData.get('status') as string | null) ?? '') as ApplicationStatus
  const validStatuses: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']

  if (!id) return { ok: false, error: 'מזהה חסר' }
  if (!validStatuses.includes(status)) return { ok: false, error: 'סטטוס לא תקין' }

  const { error } = await supabase
    .from('job_applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה בעדכון הסטטוס' }
  return { ok: true }
}

export async function deleteApplicationAction(
  formData: FormData
): Promise<DeleteApplicationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'לא מחובר למערכת' }

  const id = ((formData.get('id') as string | null) ?? '').trim()
  if (!id) return { ok: false, error: 'מזהה חסר' }

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: 'שגיאה במחיקת הבקשה' }
  return { ok: true }
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add "src/app/[locale]/(protected)/dashboard/job-search/actions.ts"
git commit -m "feat: add job search server actions for suggestions, tracker CRUD"
```

---

## Task 4: Job Discovery Panel

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx`

This file contains two components:

1. `JobCard` — internal sub-component that renders one job suggestion
2. `JobDiscoveryPanel` — exported component with generate button, filter chips, and job grid

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx`**

```typescript
'use client'

import { useState, useTransition, useMemo } from 'react'
import { Briefcase, Wifi, Sparkles, Loader2, Plus, CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generateJobSuggestionsAction, saveApplicationAction } from '../actions'
import type { JobSuggestion, JobSuggestionsResult, JobApplication } from '@/types/jobs'

interface JobDiscoveryPanelProps {
  onApplicationSaved: (application: JobApplication) => void
}

function JobCard({
  job,
  onSave,
  isSaved,
}: {
  job: JobSuggestion
  onSave: (job: JobSuggestion) => void
  isSaved: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 group"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug truncate">{job.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
        </div>
        <button
          onClick={() => onSave(job)}
          disabled={isSaved}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0 px-2 gap-1 text-xs',
            isSaved
              ? 'text-emerald-400 cursor-default'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
          aria-label={isSaved ? 'נשמר לטראקר' : 'הוסף לטראקר'}
        >
          {isSaved ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: 'oklch(0.60 0.17 162)' }} />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'oklch(1 0 0 / 8%)', color: 'oklch(0.75 0.05 252)' }}>
          📍 {job.location}
        </span>
        {job.isRemote && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'oklch(0.65 0.15 211 / 15%)', color: 'oklch(0.65 0.15 211)' }}>
            Remote
          </span>
        )}
        {job.isJuniorFriendly && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'oklch(0.60 0.17 162 / 15%)', color: 'oklch(0.60 0.17 162)' }}>
            Junior ✓
          </span>
        )}
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1">
        {job.techStack.map((tech) => (
          <span
            key={tech}
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ borderColor: 'oklch(0.75 0.16 60 / 25%)', color: 'oklch(0.75 0.16 60)', background: 'oklch(0.75 0.16 60 / 8%)' }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{job.description}</p>

      {/* Match reason */}
      <div className="pt-2 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <p className="text-xs">
          <span className="font-semibold" style={{ color: 'oklch(0.75 0.16 60)' }}>✦ התאמה: </span>
          <span className="text-muted-foreground">{job.matchReason}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{job.salaryRange}</p>
      </div>
    </div>
  )
}

export function JobDiscoveryPanel({ onApplicationSaved }: JobDiscoveryPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JobSuggestionsResult | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [filterRemote, setFilterRemote] = useState(false)
  const [filterJunior, setFilterJunior] = useState(false)
  const [filterTechs, setFilterTechs] = useState<Set<string>>(new Set())

  // Extract unique tech stacks from all results
  const allTechs = useMemo(() => {
    if (!result) return []
    const techs = new Set<string>()
    result.jobs.forEach((j) => j.techStack.forEach((t) => techs.add(t)))
    return Array.from(techs).sort()
  }, [result])

  // Apply filters
  const filteredJobs = useMemo(() => {
    if (!result) return []
    return result.jobs.filter((j) => {
      if (filterRemote && !j.isRemote) return false
      if (filterJunior && !j.isJuniorFriendly) return false
      if (filterTechs.size > 0 && !j.techStack.some((t) => filterTechs.has(t))) return false
      return true
    })
  }, [result, filterRemote, filterJunior, filterTechs])

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const res = await generateJobSuggestionsAction()
      if (res.ok) {
        setResult(res.result)
        setFilterRemote(false)
        setFilterJunior(false)
        setFilterTechs(new Set())
        setSavedIds(new Set())
      } else {
        setError(res.error)
      }
    })
  }

  function toggleTech(tech: string) {
    setFilterTechs((prev) => {
      const next = new Set(prev)
      if (next.has(tech)) next.delete(tech)
      else next.add(tech)
      return next
    })
  }

  function handleSave(job: JobSuggestion) {
    if (savedIds.has(job.id)) return
    const formData = new FormData()
    formData.set('job_title', job.title)
    formData.set('company', job.company)
    formData.set('location', job.location)
    formData.set('is_remote', String(job.isRemote))
    formData.set('tech_stack', JSON.stringify(job.techStack))
    startSaveTransition(async () => {
      const res = await saveApplicationAction(formData)
      if (res.ok) {
        setSavedIds((prev) => new Set([...prev, job.id]))
        onApplicationSaved(res.application)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Generate button + context */}
      <div className="flex items-start gap-4">
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className={cn(
            buttonVariants({ size: 'default' }),
            'gap-2 font-semibold shrink-0',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          style={!isPending ? { background: 'oklch(0.75 0.16 60)', color: 'oklch(0.15 0.02 60)' } : {}}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isPending ? 'מחפש משרות...' : 'מצא משרות מתאימות'}
        </button>
        {result && (
          <p className="text-xs text-muted-foreground pt-2.5">
            בהתאם ל: <span className="font-medium">{result.basedOn}</span>
          </p>
        )}
      </div>

      {error && (
        <p
          className="text-sm rounded-xl px-4 py-2.5"
          style={{ background: 'oklch(0.62 0.22 27 / 12%)', color: 'oklch(0.75 0.18 27)' }}
        >
          {error}
        </p>
      )}

      {/* Filters — only show after results */}
      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">סינון:</span>
            <button
              onClick={() => setFilterRemote((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium',
                filterRemote
                  ? 'border-sky-400/50 text-sky-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
              style={filterRemote ? { background: 'oklch(0.65 0.15 211 / 15%)' } : {}}
            >
              <Wifi className="w-3 h-3" />
              Remote בלבד
            </button>
            <button
              onClick={() => setFilterJunior((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium',
                filterJunior
                  ? 'border-emerald-400/50 text-emerald-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
              style={filterJunior ? { background: 'oklch(0.60 0.17 162 / 15%)' } : {}}
            >
              Junior בלבד
            </button>
          </div>

          {/* Tech stack filter pills */}
          {allTechs.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTechs.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-all duration-150',
                    filterTechs.has(tech)
                      ? 'border-amber-400/50 font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                  style={filterTechs.has(tech) ? { background: 'oklch(0.75 0.16 60 / 15%)', color: 'oklch(0.75 0.16 60)' } : {}}
                >
                  {tech}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredJobs.length} מתוך {result.jobs.length} משרות
          </p>
        </div>
      )}

      {/* Job cards grid */}
      {filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSave={handleSave}
              isSaved={savedIds.has(job.id) || isSaving}
            />
          ))}
        </div>
      )}

      {/* Empty filter state */}
      {result && filteredJobs.length === 0 && (
        <div
          className="rounded-2xl p-8 border text-center"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <p className="font-semibold mb-1">אין משרות מתאימות לסינון הנוכחי</p>
          <p className="text-muted-foreground text-sm">נסה להסיר אחד מהמסננים</p>
        </div>
      )}

      {/* Initial empty state */}
      {!result && !isPending && !error && (
        <div
          className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'oklch(0.75 0.16 60 / 10%)' }}
          >
            <Briefcase className="w-7 h-7" style={{ color: 'oklch(0.75 0.16 60)' }} />
          </div>
          <p className="font-semibold">גלה משרות מותאמות לפרופיל שלך</p>
          <p className="text-muted-foreground text-sm max-w-xs">
            ה-AI ינתח את קורות החיים שהעלית ויציע 10 משרות רלוונטיות בתעשיית ההייטק הישראלית
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build to check TypeScript**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run build
```

Expected: Build succeeds. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Run full test suite**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add "src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx"
git commit -m "feat: add JobDiscoveryPanel with AI generation, filters, and job cards"
```

---

## Task 5: Application Tracker

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/job-search/_components/application-tracker.tsx`

This file contains:

1. `ApplicationCard` — internal sub-component for a single tracked application
2. `ApplicationTracker` — exported component rendering 4 status columns

- [ ] **Step 1: Create `src/app/[locale]/(protected)/dashboard/job-search/_components/application-tracker.tsx`**

```typescript
'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateApplicationStatusAction, deleteApplicationAction } from '../actions'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'

interface ApplicationTrackerProps {
  applications: JobApplication[]
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; nextStatus: ApplicationStatus | null }
> = {
  applied: {
    label: 'הגשתי',
    color: 'oklch(0.585 0.212 264.4)',
    nextStatus: 'interviewing',
  },
  interviewing: {
    label: 'ראיון',
    color: 'oklch(0.75 0.16 60)',
    nextStatus: 'offer',
  },
  offer: {
    label: 'הצעה',
    color: 'oklch(0.60 0.17 162)',
    nextStatus: null,
  },
  rejected: {
    label: 'נדחיתי',
    color: 'oklch(0.62 0.22 27)',
    nextStatus: null,
  },
}

const ALL_STATUSES: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']

function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
}: {
  application: JobApplication
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void
  onDelete: (id: string) => void
}) {
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const config = STATUS_CONFIG[application.status]

  function handleStatusChange(newStatus: ApplicationStatus) {
    const formData = new FormData()
    formData.set('id', application.id)
    formData.set('status', newStatus)
    startUpdateTransition(async () => {
      const result = await updateApplicationStatusAction(formData)
      if (result.ok) onStatusChange(application.id, newStatus)
    })
  }

  function handleDelete() {
    const formData = new FormData()
    formData.set('id', application.id)
    startDeleteTransition(async () => {
      const result = await deleteApplicationAction(formData)
      if (result.ok) onDelete(application.id)
    })
  }

  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-2 group"
      style={{
        background: 'var(--card)',
        borderColor: config.color.replace(')', ' / 18%)'),
        opacity: isDeleting ? 0.4 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{application.job_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{application.company}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isUpdating}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'px-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
          )}
          aria-label="מחק"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {application.location && (
        <p className="text-xs text-muted-foreground">
          {application.is_remote ? '🌐 Remote' : `📍 ${application.location}`}
        </p>
      )}

      {application.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {application.tech_stack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'oklch(1 0 0 / 7%)', color: 'oklch(0.75 0.05 252)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Status change dropdown */}
      <div className="pt-1 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <select
          value={application.status}
          onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
          disabled={isUpdating || isDeleting}
          className="w-full text-xs rounded-lg px-2 py-1.5 border bg-transparent cursor-pointer disabled:opacity-50"
          style={{
            borderColor: config.color.replace(')', ' / 30%)'),
            color: config.color,
          }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s} style={{ color: 'inherit', background: 'var(--background)' }}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true, locale: he })}
      </p>
    </div>
  )
}

export function ApplicationTracker({
  applications,
  onStatusChange,
  onDelete,
}: ApplicationTrackerProps) {
  if (applications.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
        style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'oklch(0.75 0.16 60 / 10%)' }}
        >
          <span className="text-2xl">📋</span>
        </div>
        <p className="font-semibold">טרם שמרת בקשות עבודה</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          עבור ללשונית &quot;גילוי משרות&quot;, מצא משרות מתאימות ולחץ + להוספה לטראקר
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{applications.length} בקשות</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ALL_STATUSES.map((status) => {
          const config = STATUS_CONFIG[status]
          const statusApps = applications.filter((a) => a.status === status)
          return (
            <div key={status} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: config.color.replace(')', ' / 25%)') }}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: config.color }}
                />
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground mr-auto">{statusApps.length}</span>
              </div>

              {/* Cards */}
              {statusApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}

              {statusApps.length === 0 && (
                <div
                  className="rounded-xl p-4 border text-center"
                  style={{ borderColor: 'oklch(1 0 0 / 6%)', borderStyle: 'dashed' }}
                >
                  <p className="text-xs text-muted-foreground">ריק</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run build
```

Expected: Build succeeds. Fix any TypeScript errors.

- [ ] **Step 3: Run full test suite**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add "src/app/[locale]/(protected)/dashboard/job-search/_components/application-tracker.tsx"
git commit -m "feat: add ApplicationTracker with 4-column kanban and status dropdown"
```

---

## Task 6: Job Search Client + Page + Sidebar + i18n

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/job-search/_components/job-search-client.tsx`
- Create: `src/app/[locale]/(protected)/dashboard/job-search/page.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `messages/he.json`

- [ ] **Step 1: Create `job-search-client.tsx`**

Create `src/app/[locale]/(protected)/dashboard/job-search/_components/job-search-client.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Briefcase, ClipboardList } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { JobDiscoveryPanel } from './job-discovery-panel'
import { ApplicationTracker } from './application-tracker'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'

interface JobSearchClientProps {
  initialApplications: JobApplication[]
}

export function JobSearchClient({ initialApplications }: JobSearchClientProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)

  function handleApplicationSaved(application: JobApplication) {
    setApplications((prev) => [application, ...prev])
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )
  }

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const TAB_CONFIG = [
    {
      value: 'discover',
      label: 'גילוי משרות',
      icon: Briefcase,
      color: 'oklch(0.75 0.16 60)',
    },
    {
      value: 'tracker',
      label: `טראקר${applications.length > 0 ? ` (${applications.length})` : ''}`,
      icon: ClipboardList,
      color: 'oklch(0.585 0.212 264.4)',
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
  )
}
```

- [ ] **Step 2: Create `page.tsx`**

Create `src/app/[locale]/(protected)/dashboard/job-search/page.tsx`:

```typescript
import { Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { JobSearchClient } from './_components/job-search-client'
import type { JobApplication } from '@/types/jobs'

export default async function JobSearchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialApplications: JobApplication[] = []
  if (user) {
    const { data } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    initialApplications = (data ?? []) as JobApplication[]
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

      <JobSearchClient initialApplications={initialApplications} />
    </div>
  )
}
```

- [ ] **Step 3: Update `src/components/layout/sidebar.tsx`**

Find the nav item:

```typescript
{ href: '/jobs', icon: Briefcase, key: 'jobs', color: 'oklch(0.75 0.16 60)' },
```

Replace with:

```typescript
{ href: '/dashboard/job-search', icon: Briefcase, key: 'jobs', color: 'oklch(0.75 0.16 60)' },
```

- [ ] **Step 4: Update `messages/he.json`**

Add a `"jobs"` section before `"errors"`. The complete updated object should include the existing sections plus:

```json
"jobs": {
  "title": "מרכז חיפוש העבודה",
  "subtitle": "משרות מותאמות לפרופיל שלך · סינון חכם · מעקב בקשות",
  "discover": "גילוי משרות",
  "discoverHint": "ה-AI ינתח את קורות החיים שלך ויציע משרות מתאימות",
  "generate": "מצא משרות מתאימות",
  "generating": "מחפש משרות...",
  "filterRemote": "Remote בלבד",
  "filterJunior": "Junior בלבד",
  "addToTracker": "הוסף לטראקר",
  "saved": "נשמר",
  "tracker": "טראקר",
  "noApplications": "טרם שמרת בקשות עבודה",
  "statusApplied": "הגשתי",
  "statusInterviewing": "ראיון",
  "statusOffer": "הצעה",
  "statusRejected": "נדחיתי"
}
```

- [ ] **Step 5: Run all tests**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run test:run
```

Expected: all tests pass

- [ ] **Step 6: Build**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad && npm run build
```

Expected: build succeeds. Route `/[locale]/dashboard/job-search` listed as dynamic.

Fix any errors before proceeding.

- [ ] **Step 7: Commit**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git add \
  "src/app/[locale]/(protected)/dashboard/job-search/_components/job-search-client.tsx" \
  "src/app/[locale]/(protected)/dashboard/job-search/page.tsx" \
  src/components/layout/sidebar.tsx \
  messages/he.json
git commit -m "feat: complete job search page, client, sidebar nav, and i18n"
```

- [ ] **Step 8: Merge to dev and main**

```bash
cd /c/Projects/Claude/Projects/SelfSoftware/launchpad
git checkout dev
git merge feature/job-search --no-ff -m "feat: complete Phase 4 Job Search with AI discovery, smart filters, and application tracker"
git push origin dev
git checkout main
git merge dev --no-ff -m "feat: complete Phase 4 Job Search with AI discovery, smart filters, and application tracker"
git push origin main
```

---

## Self-Review

**Spec coverage:**

- ✅ Route `/he/dashboard/job-search` — Task 6 (page.tsx)
- ✅ Job Discovery — AI-driven mock based on resume analysis — Tasks 2 + 3 + 4
- ✅ Jobs based on uploaded resume — `generateJobSuggestionsAction` reads latest resume from `resumes` table
- ✅ Smart filters: Remote — filter chip in Task 4
- ✅ Smart filters: Junior-friendly — filter chip in Task 4
- ✅ Smart filters: Tech Stack — dynamic pill filter from all job tech stacks in Task 4
- ✅ Application Tracker with Applied / Interviewing / Offer / Rejected — Task 5
- ✅ Premium dark theme, all colors oklch — all components
- ✅ Clean card view for jobs — JobCard sub-component in Task 4
- ✅ Sidebar updated — Task 6 (`/jobs` → `/dashboard/job-search`)
- ✅ i18n `jobs` section — Task 6

**Placeholder scan:** No TBD, no TODO, no "similar to Task N", all code blocks complete.

**Type consistency:**

- `JobSuggestion` (id, title, company, ...) defined Task 1 → used in Task 4 ✅
- `JobSuggestionsResult` defined Task 1 → returned by `parseJobSuggestions` Task 2 ✅
- `JobApplication` defined Task 1 → returned by `saveApplicationAction` Task 3, used in Tasks 5 + 6 ✅
- `ApplicationStatus` union defined Task 1 → used in `STATUS_CONFIG` Task 5, `handleStatusChange` Task 6 ✅
- `generateJobSuggestionsAction()` returns `JobSuggestionsActionResult` → consumed in Task 4 ✅
- `saveApplicationAction(formData)` returns `SaveApplicationResult` → consumed in Task 4 ✅
- `onApplicationSaved: (application: JobApplication) => void` — Task 4 calls it, Task 6 defines it ✅
- `onStatusChange: (id, newStatus) => void` — Task 5 calls it, Task 6 defines it ✅
- `onDelete: (id: string) => void` — Task 5 calls it, Task 6 defines it ✅
