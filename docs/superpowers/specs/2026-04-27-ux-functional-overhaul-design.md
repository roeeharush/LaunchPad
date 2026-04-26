# LaunchPad — UX & Functional Overhaul Design Spec

**Date:** 2026-04-27  
**Status:** Approved by user

---

## Overview

Six coordinated changes to make the platform more intuitive and professional for Israeli software-engineering students. All UI is Hebrew-first, RTL-aware, and uses the existing OKLch color system.

---

## 1. Profile Grader Split

### What

Replace the single `/dashboard/profile-grader` page (combined GitHub + LinkedIn form) with two independent routes:

- `/dashboard/github-grader` — GitHub-only analysis
- `/dashboard/linkedin-grader` — LinkedIn text-only analysis

### Why

Users want to grade one profile at a time. Combining both inputs creates confusion about which score belongs to which platform. Separate pages also let us tailor the UI, scoring logic, and tips to each platform's specific signals.

### Architecture

**New routes (file structure mirrors existing patterns):**

```
src/app/[locale]/(protected)/dashboard/
  github-grader/
    page.tsx                          ← server component, fetches history (type:'github')
    actions.ts                        ← analyzeGitHubAction()
    _components/
      github-grader-client.tsx        ← same 2-col layout as current profile-grader-client
  linkedin-grader/
    page.tsx                          ← server component, fetches history (type:'linkedin')
    actions.ts                        ← analyzeLinkedInAction()
    _components/
      linkedin-grader-client.tsx
```

**Remove:** `src/app/[locale]/(protected)/dashboard/profile-grader/` (all files)

**New AI functions:**

- `src/lib/ai/analyze-github.ts` — takes `GitHubProfileData`, returns `{ techScore: ProfileSubScore, topTips: string[] }`. Extracts only the GitHub scoring logic from the current `analyzeProfile` prompt.
- `src/lib/ai/analyze-linkedin.ts` — takes `linkedinText: string`, returns `{ professionalScore: ProfileSubScore, topTips: string[] }`. Extracts only the LinkedIn scoring logic.

**Database:** Same `profile_analyses` table. `type` field already supports `'github' | 'linkedin' | 'combined'`. GitHub grader saves with `type: 'github'`; LinkedIn grader saves with `type: 'linkedin'`. Each page queries only its own type when fetching history.

**TypeScript types:** Add two new interfaces to `src/types/profile.ts`:

```ts
export interface GitHubAnalysis {
  techScore: ProfileSubScore
  topTips: string[]
}
export interface LinkedInAnalysis {
  professionalScore: ProfileSubScore
  topTips: string[]
}
```

The `ProfileAnalysisRecord.result_json` field is typed as `ProfileAnalysis | null`. For grader records, we store the partial result cast to the respective new type. The server-side page and client components for each grader use the narrower type (`GitHubAnalysis` / `LinkedInAnalysis`) directly from the parsed JSON — they do not depend on `ProfileAnalysis`.

**Result display:** Each grader shows only its own score ring (techScore or professionalScore) + topTips. No `overallBrandScore` on individual grader pages — that's only meaningful when both are analyzed.

**Sidebar:** Replace the single "דירוג פרופיל" item with two items:

```ts
{ href: '/dashboard/github-grader', icon: Github, key: 'githubGrader', color: 'oklch(0.58 0.21 291)' },
{ href: '/dashboard/linkedin-grader', icon: Linkedin, key: 'linkedinGrader', color: 'oklch(0.58 0.21 291)' },
```

Use `Github` and `Linkedin` icons from `lucide-react`.

**Dashboard cards:** Replace the `/profile` card with two separate cards: one for GitHub Grader, one for LinkedIn Grader.

**he.json additions:**

```json
"nav": {
  "githubGrader": "GitHub Grader",
  "linkedinGrader": "LinkedIn Grader"
},
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

**NavKey type** in `sidebar.tsx`: add `'githubGrader' | 'linkedinGrader'` and remove `'profile'`.

---

## 2. Job Search Onboarding

### What

Add a clear step-by-step onboarding state to the Job Search page that explains the prerequisite (analyzed resume) and offers a direct CTA when none exists.

### Architecture

**`job-search/page.tsx` (server component change):**  
Add a second Supabase query to check for an analyzed resume:

```ts
const { data: resumes } = await supabase
  .from('resumes')
  .select('id, score, analysis_json')
  .eq('user_id', user.id)
  .not('analysis_json', 'is', null)
  .order('created_at', { ascending: false })
  .limit(1)

const resumeInfo = resumes?.[0]
  ? { hasResume: true, score: resumes[0].score, skills: resumes[0].analysis_json?.strengths ?? [] }
  : { hasResume: false, score: null, skills: [] }
```

Pass `resumeInfo` as a prop to `JobSearchClient`.

**`JobSearchClient` (client component change):**  
Accept `resumeInfo: { hasResume: boolean; score: number | null; skills: string[] }`.

When `!hasResume`: render the onboarding view (no tabs) — two step indicators + dashed upload prompt + "העלה קורות חיים עכשיו" button that links to `/dashboard/resume-analyzer`.

When `hasResume`: render Step 1 as done (green ✓, shows score), Step 2 as current (active), then the existing tabs below (Discover + Tracker). Steps are shown as a compact banner above the tabs, collapsible after first job search.

**Step 1 done state** shows: `ציון: ${score}/100 · כישורים: ${skills.slice(0,3).join(', ')}`.

**he.json additions under `"jobs"`:**

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

---

## 3. Knowledge Hub Redesign (Option B — Learning Center)

### What

Replace the flat tab-strip navigation with a 3-card header grid (one card per module), each with an icon, title, description, and tooltip. Clicking a card activates its section below. The active card is visually highlighted.

### Architecture

**`knowledge-hub-client.tsx` restructure:**

The existing `Tabs` / `TabsList` / `TabsTrigger` pattern is replaced with a custom `ModuleCard` grid for the selector, while `TabsContent` components remain for the section bodies (the Tabs primitive still handles show/hide under the hood — just replace the trigger UI).

Three module cards (rendered as a `grid-cols-3` above the content area):

| Module           | Icon            | Color                             | Tooltip text                                                 |
| ---------------- | --------------- | --------------------------------- | ------------------------------------------------------------ |
| Daily Tech Pulse | `Zap`           | blue `oklch(0.65 0.15 211)`       | "מנתח את שפות ה-GitHub שלך ומייצר 5 טרנדים יומיים רלוונטיים" |
| הכנה לראיונות    | `GraduationCap` | purple `oklch(0.585 0.212 264.4)` | "הזן נושא טכני וקבל 5 שאלות ראיון עם תשובות מפורטות"         |
| הסימניות שלי     | `Bookmark`      | yellow `oklch(0.75 0.16 60)`      | "תכנים שסימנת מהטרנדים ושאלות הראיון — לחזרה ולמידה עתידית"  |

Each card shows: icon box, title, short description, badge count (for bookmarks), and a `?` tooltip (title attribute + inline info badge). Active card gets a colored border + background tint.

**he.json additions under `"knowledge"`:**

```json
"pulseDesc": "טרנדים מותאמים לשפות ה-GitHub שלך",
"pulseTooltip": "מנתח את שפות ה-GitHub שלך ומייצר 5 טרנדים יומיים רלוונטיים",
"interviewDesc": "שאלות ותשובות לכל נושא טכני",
"interviewTooltip": "הזן נושא (React, SQL, System Design...) וקבל 5 שאלות ראיון עם תשובות מפורטות",
"bookmarksDesc": "תכנים ששמרת לחזרה עתידית",
"bookmarksTooltip": "שמור טרנדים ושאלות מהכלים האחרים — ניתן לעיין בהם בכל עת"
```

The existing `TechPulsePanel`, `InterviewPrepPanel`, and `BookmarksPanel` sub-components are unchanged — only the container/navigation layer changes.

---

## 4. Job Analyzer — Hebrew Output Verification & Label Clarity

### What

The AI prompt already instructs Hebrew output for `criticalSkills` and `interviewQuestions`, and `coverLetterHe` defaults. The cover letter panel already defaults to Hebrew with an English toggle. No prompt changes are needed.

**UI changes only:**

- The html root already has `dir="rtl"`. No wrapper change is needed. The actual issue is that tech skill names (e.g., "TypeScript", "React") are LTR identifiers inside RTL sentences — this is handled by the existing `dir="auto"` convention on text containers. Verify `skills-panel.tsx` and `interview-panel.tsx` use `dir="auto"` or `dir="rtl"` on their text nodes. If not, add `dir="rtl"` to the outer `<div>` of each card body (not the skill name itself).
- Add a small info badge below the cover letter tab strip: `"ברירת מחדל: עברית | האנגלית זמינה דרך הכפתור למעלה"`.
- The language toggle already defaults to `'he'` — no change needed there.

**No changes to `analyze-job-listing.ts`** — prompt already produces correct Hebrew output for all fields.

---

## 5. Trends Page Bug Fix (Broken Hrefs)

### Root Cause

Two files contain invalid hrefs that cause 404s:

1. **`sidebar.tsx`** — `{ href: '/trends', ... }` — no route at `/[locale]/trends/` exists.
2. **`dashboard/page.tsx`** — All module hrefs are wrong: `/resume`, `/profile`, `/trends`, `/jobs`, `/learn` — none of these exist as routes. The actual routes all live under `/dashboard/`.

### Fixes

**`sidebar.tsx`:** Change Trends nav item href from `/trends` → `/dashboard/knowledge-hub`.

**`dashboard/page.tsx`:** Update the `modules` array hrefs:

```ts
{ href: '/dashboard/resume-analyzer', titleKey: 'resume', ... }
{ href: '/dashboard/github-grader',   titleKey: 'githubGrader', ... }   // replaces /profile
{ href: '/dashboard/linkedin-grader', titleKey: 'linkedinGrader', ... } // new card
{ href: '/dashboard/knowledge-hub',   titleKey: 'trends', ... }         // was /trends
{ href: '/dashboard/job-search',      titleKey: 'jobs', ... }
{ href: '/dashboard/knowledge-hub',   titleKey: 'learn', ... }          // was /learn, same as trends
```

**Final dashboard card list (6 cards):**

1. `resume-analyzer` — FileText icon, purple
2. `github-grader` — Github icon, purple
3. `linkedin-grader` — Linkedin icon, purple
4. `knowledge-hub` — TrendingUp icon, cyan (replaces both `/trends` and `/learn` — one card only)
5. `job-search` — Briefcase icon, yellow
6. `job-analyzer` — Wand2 icon, purple (was missing from dashboard; add it)

The current 5-card dashboard grows to 6 by splitting profile into two graders and adding the job-analyzer card. The `/learn` card is removed (duplicate of knowledge-hub).

---

## 6. Global RTL & UI Consistency

### Changes

- **`sidebar.tsx`:** Verify `usePathname()` active-matching handles new routes correctly. Add `githubGrader` and `linkedinGrader` to `NavKey` type.
- All new page components use `dir="rtl"` on text-heavy containers and `dir="auto"` on text inputs (already the convention in the codebase).
- Hebrew tone: all new copy uses second person informal (אתה/שלך) consistent with existing copy.
- No new global CSS — existing OKLch variables and Tailwind classes are sufficient.

---

## Files Changed Summary

| File                                                                       | Change                                                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/components/layout/sidebar.tsx`                                        | Replace profile item with two grader items; fix /trends href                                                               |
| `src/app/.../dashboard/page.tsx`                                           | Fix all module hrefs; add two grader cards                                                                                 |
| `src/app/.../dashboard/profile-grader/`                                    | **Delete all**                                                                                                             |
| `src/app/.../dashboard/github-grader/` (new)                               | page.tsx + actions.ts + client component                                                                                   |
| `src/app/.../dashboard/linkedin-grader/` (new)                             | page.tsx + actions.ts + client component                                                                                   |
| `src/lib/ai/analyze-github.ts` (new)                                       | GitHub-only scoring function                                                                                               |
| `src/lib/ai/analyze-linkedin.ts` (new)                                     | LinkedIn-only scoring function                                                                                             |
| `src/app/.../dashboard/job-search/page.tsx`                                | Add resume check query                                                                                                     |
| `src/app/.../dashboard/job-search/_components/job-search-client.tsx`       | Add onboarding state                                                                                                       |
| `src/app/.../dashboard/knowledge-hub/_components/knowledge-hub-client.tsx` | Redesign header navigation                                                                                                 |
| `src/app/.../dashboard/job-analyzer/_components/cover-letter-panel.tsx`    | Add info badge                                                                                                             |
| `src/app/.../dashboard/job-analyzer/_components/skills-panel.tsx`          | Add RTL wrapper                                                                                                            |
| `src/app/.../dashboard/job-analyzer/_components/interview-panel.tsx`       | Add RTL wrapper                                                                                                            |
| `messages/he.json`                                                         | Add nav.githubGrader, nav.linkedinGrader, githubGrader._, linkedinGrader._, jobs.step\*, knowledge.pulseDesc/Tooltip, etc. |

---

## Out of Scope

- No database schema changes required (profile_analyses.type already supports 'github'|'linkedin').
- No new Supabase migrations.
- No changes to auth, resume-analyzer, or generate-trends AI function.
- No pricing, landing page, or marketing copy changes.
