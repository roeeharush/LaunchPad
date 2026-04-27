# LaunchPad v2.0 — Design Specification

**Date:** 2026-04-27  
**Author:** Design session (Roee Harush + Claude)  
**Status:** Approved — ready for implementation planning

---

## 1. Overview

LaunchPad v2.0 is a production readiness upgrade across three parallel workstreams: UX logic overhaul, global infrastructure polish, and an account/persistence layer. The upgrade preserves the existing Indigo-Cyan Glassmorphism design system and full RTL Hebrew support throughout.

**Constraints that apply to all work:**

- Atomic Design component structure (atoms → molecules → organisms)
- Strict TypeScript — no `any`, no type assertions without justification
- All Hebrew copy: professional, benefit-driven, right-aligned
- No breaking changes to existing Supabase tables or RLS policies

---

## 2. Workstream 1 — UX & Logical Flow

### 2.1 Profile Grader Split

The existing `/dashboard/profile-grader` is replaced by two independent routes:

**`/he/dashboard/linkedin-grader`**

- Input: LinkedIn text only (About + Experience sections)
- Output: `LinkedInAnalysis` — professional score, strengths, improvements, top tips
- New AI function: `src/lib/ai/analyze-linkedin.ts`
- New Zod schema: `LinkedInAnalysisSchema`
- New type: `src/types/linkedin.ts`
- Supabase: stores to `profile_analyses` with `type: 'linkedin'`

**`/he/dashboard/github-grader`**

- Input: GitHub username only
- Output: `GitHubAnalysis` — tech score, repo quality, activity signal, top tips
- New AI function: `src/lib/ai/analyze-github.ts`
- New Zod schema: `GitHubAnalysisSchema`
- New type: `src/types/github.ts`
- Supabase: stores to `profile_analyses` with `type: 'github'`

The existing `analyze-profile.ts` (combined) is kept but no longer exposed in the UI. Both new grader routes follow the same two-panel layout as the existing profile grader (input + history on right, results on left in RTL).

**Navigation changes:**

- Sidebar: remove `profile` nav item; add `linkedin` and `github` items
- `messages/he.json`: add `nav.linkedin` and `nav.github` keys
- Old `/profile-grader` route: redirect to `/linkedin-grader`

### 2.2 Data Dependency Check (Empty States)

A resume dependency check runs on page load for **Job Search** and **Knowledge Hub**. The check queries `resumes` table for `extracted_text IS NOT NULL` for the current user.

**Job Search empty state — Option C (Banner + Ghost):**

- Sticky banner above blurred ghost job cards: headline + "העלה קורות חיים עכשיו →" CTA linking to `/dashboard/resume-analyzer`
- Ghost content: 3 blurred placeholder job rows beneath the banner
- Implemented as `<ResumeGateJobSearch />` organism in `src/components/empty-states/`

**Knowledge Hub empty state — Option A (Minimal centered):**

- Centered icon (📚 + 🔒 badge), headline "פתח את מרכז הידע", subtext explaining resume requirement, single upload CTA
- Implemented as `<ResumeGateKnowledgeHub />` organism in `src/components/empty-states/`

When a resume exists: render the normal page content.

### 2.3 Job Analyzer v2 — Card Layout

Replace the existing tab-based output with three simultaneous cards (Option B layout — no tabs):

**Layout:** `grid-cols-[3fr_2fr]` on the card container with `dir="rtl"`. In RTL the first DOM column renders on the visual right, so cover letter (3fr, ~60%) occupies the visual right and skills + interview (2fr, ~40%) stack on the visual left. On mobile (`< lg`) the grid collapses to a single column, cover letter first.

**Card 1 — Cover Letter (`<CoverLetterCard />`):**

- En/He language toggle (state: `'he' | 'en'`)
- Full letter text with RTL/LTR direction switching on toggle
- Copy button triggers sonner success toast
- Edit button (future: inline edit mode)

**Card 2 — Critical Skills (`<CriticalSkillsCard />`):**

- Numbered list of exactly 5 skills
- Each item: skill name + one-line reason ("מוזכר 4× במשרה", "חסר בפרופיל שלך")
- Amber accent color (`oklch(0.75 0.16 60)`)

**Card 3 — Interview Q&As (`<InterviewQACard />`):**

- Exactly 3 items, each with: category badge (Technical / Behavioral / System Design), question, suggested answer
- Sky blue accent (`oklch(0.65 0.15 211)`)

The existing `analyzeJobListingAction` and `JobAnalysisResult` type are unchanged. The `coverLetterHe`, `coverLetterEn`, `criticalSkills`, and `interviewQuestions` fields already exist in the type.

### 2.4 Knowledge Hub — Articles & Dynamic Route

**Content injection:** Add `knowledge.articles` to `messages/he.json` with the 10 provided article items (ids: `hr-interview-tips`, `impressive-github-tips`, `how-to-write-readme`, `linkedin-profile-guide`, `cv-writing-guide`, `technical-interview-prep`, `networking-in-tech`, `portfolio-project-guide`, `questions-to-ask-interviewer`, `elevator-pitch-guide`).

**Article list layout (Option B — Learning Center):**

- Article card grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Each card: category badge, title, read-time chip, excerpt, "קרא עוד →" link
- Categories: ראיונות, GitHub, LinkedIn, קורות חיים, קריירה, פורטפוליו

**Dynamic article route:** `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`

- Params: `{ locale: string; id: string }`
- Reads article from `messages/he.json` by `id`; 404 if not found
- Layout: breadcrumbs (לוח בקרה › מרכז ידע › [title]), article header (category + read-time), full content rendered as paragraphs (split on `\n\n`), RTL throughout
- No external data fetch — articles are static in the messages file
- `generateStaticParams` exports all article ids for static generation

---

## 3. Workstream 2 — Global Infrastructure & Polish

### 3.1 Notification Engine (Sonner)

Install `sonner`. Add `<Toaster />` to `src/app/[locale]/layout.tsx` (position: `top-center`, RTL direction).

**Toast triggers (exhaustive list):**

| Event                        | Type    | Hebrew copy                    |
| ---------------------------- | ------- | ------------------------------ |
| Resume uploaded successfully | success | "קורות החיים הועלו בהצלחה ✓"   |
| Analysis saved               | success | "הניתוח נשמר"                  |
| Cover letter copied          | success | "מכתב הפנייה הועתק ללוח"       |
| Settings saved               | success | "ההגדרות נשמרו"                |
| Resume deleted               | success | "קורות החיים נמחקו"            |
| API/AI error                 | error   | "שגיאה בניתוח ה-AI. נסה שוב."  |
| Auth error                   | error   | "שגיאת אימות. אנא התחבר מחדש." |
| File too large / wrong type  | warning | "יש להעלות PDF או DOCX עד 5MB" |
| No resume found              | warning | "יש להעלות קורות חיים תחילה"   |

All toasts: duration 3500ms. Error toasts: duration 5000ms, include dismiss button.

A `useToast` utility hook in `src/lib/hooks/use-toast.ts` wraps `sonner`'s `toast` to apply consistent Hebrew defaults.

### 3.2 Skeleton Loaders

Skeleton components built as atoms in `src/components/ui/skeleton.tsx` (if not already present via shadcn).

Applied to:

- **Job Search / Discovery Panel**: skeleton of 3 job-card rows during `isPending`
- **Knowledge Hub / Tech Pulse Panel**: skeleton of 3 content rows during generation
- **Trends page** (if it has a data-fetching state): skeleton replacing the trend list

Skeleton design: `animate-pulse` bg `oklch(1 0 0 / 5%)` → `oklch(1 0 0 / 8%)`, `border-radius: 12px`, matching the height of the real content they replace.

### 3.3 Route Transition Progress Bar

A slim (`h-[2px]`) framer-motion animated progress bar fixed at the top of the viewport, rendered in the protected layout (`src/app/[locale]/(protected)/layout.tsx`).

- Triggered by Next.js navigation events via a client component `<RouteProgressBar />`
- Indigo → Cyan gradient: `linear-gradient(90deg, oklch(0.585 0.212 264.4), oklch(0.65 0.15 211))`
- Animation: `width: 0% → 70%` on route change start (ease-out, 400ms), `70% → 100%` on complete (200ms), then fade out
- Uses `usePathname` to detect route changes

### 3.4 Button Loading States

All primary action buttons that trigger async operations get a loading state pattern:

```tsx
<button disabled={isPending}>
  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon />}
  {isPending ? loadingLabel : label}
</button>
```

Buttons affected: "נתח קורות חיים", "נתח פרופיל", "נתח משרה", "מצא משרות", "צור", "שמור שינויים", "העלה קורות חיים". The `disabled` state prevents double-submission.

---

## 4. Workstream 3 — Account & Persistence Layer

### 4.1 Settings Hub — `/he/dashboard/settings`

**Layout:** Stacked sections (Option A — single column, no sidebar nav). Mobile-first.

**Section 1 — פרופיל אישי:**

- Fields: `full_name` (text), `target_title` (text)
- Save button triggers Supabase `profiles` upsert + success toast
- Values pre-populated from `profiles` table on page load (server component fetch)

**Section 2 — מראה:**

- Dark/Light mode toggle (persists to `profiles.theme`)
- Default: `'dark'`; Light mode adds class `light` to `<html>`

**Section 3 — ניהול קורות חיים:**

- Lists resumes from `resumes` table with: filename (derived from `file_url`), upload date, score badge (colored by score range: ≥75 emerald, ≥50 amber, <50 red)
- Per-file delete: removes from `resumes` table + storage, triggers success toast
- Danger zone: "מחק את כל הנתונים שלי" — deletes all rows from `resumes`, `profile_analyses`, `job_analyses`, `trend_bookmarks`, `knowledge_bookmarks`, `job_applications` for `user_id`. Requires confirmation dialog before executing.

**Section 4 — מנוי:**

- Three-column plan cards: Free (current, highlighted indigo), Pro (featured, violet, "הכי פופולרי" badge), Elite
- Upgrade buttons are UI-only in v2 (no payment integration). Pro/Elite CTAs show a "בקרוב" tooltip.

**Navigation:** Add `settings` item to sidebar with `Settings` icon.

### 4.2 Supabase — `profiles` Table

New migration: `supabase/migrations/004_profiles.sql`

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  target_title text,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);
```

Profile row is created (upserted) on first settings save. Theme is read on the protected layout server component to apply the correct class to `<html>` SSR.

### 4.3 Dark/Light Mode

`globals.css` gains a `.light` variant block (`:root.light { ... }`) defining a light palette: white/near-white backgrounds, dark foreground, adjusted sidebar and card surface colors.

**SSR + client pattern:**

1. The protected layout server component fetches `profiles.theme` and passes `initialTheme` as a prop to a client `<ThemeProvider initialTheme={theme}>` wrapper.
2. `ThemeProvider` runs `useEffect` on mount to apply `document.documentElement.classList.toggle('light', initialTheme === 'light')` — avoids flash on hydration.
3. The Settings toggle calls a `setTheme(t)` function that simultaneously: updates `document.documentElement.classList`, calls the Supabase `profiles` upsert server action, and persists to `localStorage` as a fallback for fast re-hydration.

`<html>` itself has no static class — the class is applied purely client-side after hydration, consistent with Next.js App Router constraints where nested layouts cannot write to the root `<html>` tag server-side.

---

## 5. Component Inventory (New & Modified)

### New atoms

- `src/components/ui/skeleton.tsx` — pulse skeleton block
- `src/components/ui/toast.ts` — `useToast` hook wrapping sonner

### New molecules

- `src/components/ui/route-progress-bar.tsx` — framer-motion top bar
- `src/components/empty-states/resume-gate-job-search.tsx`
- `src/components/empty-states/resume-gate-knowledge-hub.tsx`

### New organisms / page components

- `src/app/.../linkedin-grader/_components/linkedin-grader-client.tsx`
- `src/app/.../github-grader/_components/github-grader-client.tsx`
- `src/app/.../job-analyzer/_components/cover-letter-card.tsx`
- `src/app/.../job-analyzer/_components/critical-skills-card.tsx`
- `src/app/.../job-analyzer/_components/interview-qa-card.tsx`
- `src/app/.../knowledge-hub/[id]/page.tsx`
- `src/app/.../settings/page.tsx` + `_components/`

### New AI modules

- `src/lib/ai/analyze-linkedin.ts`
- `src/lib/ai/analyze-github.ts`

### New types

- `src/types/linkedin.ts`
- `src/types/github.ts`
- `src/types/settings.ts`

### Modified

- `src/components/layout/sidebar.tsx` — add linkedin, github, settings items; remove combined profile
- `src/app/[locale]/layout.tsx` — add `<Toaster />`
- `src/app/[locale]/(protected)/layout.tsx` — add `<RouteProgressBar />`, theme class from profiles
- `src/app/.../job-analyzer/_components/job-analyzer-client.tsx` — replace tabs with card grid
- `messages/he.json` — add `nav.linkedin`, `nav.github`, `nav.settings`, `knowledge.articles`
- `supabase/migrations/004_profiles.sql` — new

---

## 6. Data Flow Summary

```
User uploads resume
  └─ resumes table populated
       └─ Job Search / Knowledge Hub: gate lifts, normal content renders
            └─ Job Analyzer: cover letter copy → sonner success toast

Settings save
  └─ profiles table upsert (full_name, target_title, theme)
       └─ theme change → html class toggle → CSS variables switch palette

LinkedIn Grader submit
  └─ analyze-linkedin.ts (Anthropic) → LinkedInAnalysis
       └─ profile_analyses INSERT (type: 'linkedin')

GitHub Grader submit
  └─ fetchGitHubProfile → analyze-github.ts (Anthropic) → GitHubAnalysis
       └─ profile_analyses INSERT (type: 'github')
```

---

## 7. Out of Scope for v2

- Payment integration (Stripe/Paddle) — subscription cards are UI-only previews
- The existing `analyze-profile.ts` combined function — kept but not surfaced in UI
- Trends page beyond skeleton loader addition
- Mobile sidebar (drawer/hamburger) — sidebar layout is unchanged
