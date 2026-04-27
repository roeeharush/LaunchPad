# Knowledge Hub — Static Articles Feature

**Date:** 2026-04-27
**Status:** Approved

---

## Overview

Add a curated library of 10 static Hebrew professional articles to the Knowledge Hub. Articles are stored in the `messages/he.json` translation file (no database), rendered in a new "מאמרים" tab inside the existing Tabs component, and each article has its own dynamic route with a breadcrumb and rich body rendering.

---

## Data Layer

### `messages/he.json` — `knowledge.articles`

A new key `articles` is added inside the existing `knowledge` object:

```json
"articles": {
  "sectionTitle": "מאמרים מקצועיים",
  "readMinutes": "דקות קריאה",
  "items": [ ...10 article objects... ]
}
```

Each article object:

```ts
{
  id: string // URL slug, e.g. "hr-interview-tips"
  category: string // Display label, e.g. "ראיונות"
  title: string // Article headline
  readTime: string // Numeric string, minutes, e.g. "4"
  excerpt: string // 1–2 sentence teaser for the card
  content: string // Full body; paragraphs separated by "\n\n"
}
```

Content paragraphs that begin with a digit+period (`1. foo`) or a dash (`- foo`) are styled as pseudo-list items (see Body Rendering section).

### `src/types/knowledge.ts`

Add:

```ts
export interface KnowledgeArticle {
  id: string
  category: string
  title: string
  readTime: string
  excerpt: string
  content: string
}
```

No DB migration required. No API calls. No server actions.

---

## Color System

Category colors follow the existing `TAG_COLORS` oklch pattern in the codebase:

| Category   | oklch color                |
| ---------- | -------------------------- |
| ראיונות    | `oklch(0.585 0.212 264.4)` |
| GitHub     | `oklch(0.65 0.15 211)`     |
| LinkedIn   | `oklch(0.60 0.17 162)`     |
| קריירה     | `oklch(0.75 0.16 60)`      |
| פורטפוליו  | `oklch(0.58 0.21 291)`     |
| קורות חיים | `oklch(0.62 0.22 27)`      |

Fallback: Indigo `oklch(0.585 0.212 264.4)`.

---

## Components

### `article-card.tsx` — Client Component

**Location:** `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card.tsx`

**Props:** `article: KnowledgeArticle`

**Layout:**

- Full-card `Link` to `/dashboard/knowledge-hub/[id]`
- `rounded-2xl border` card with a `3px solid` left-border accent in the category color
- **Header row:** category pill badge (color-coded background/text) + readTime chip on the right
- **Title:** `font-bold text-base leading-snug`, 2-line clamp
- **Excerpt:** `text-sm text-muted-foreground leading-relaxed`, 3-line clamp
- **Footer:** "קרא עוד →" in category color

**Hover state (premium glow):**

```css
box-shadow: 0 0 0 1px {categoryColor / 30%}, 0 4px 20px {categoryColor / 15%}
```

Implemented via `onMouseEnter`/`onMouseLeave` inline style swap — same pattern as Sidebar nav items. Card background subtly shifts: `{categoryColor / 5%}` on hover.

No Framer Motion. Pure CSS transitions via `transition-all duration-200`.

### `article-list.tsx` — Shared Component (no `'use client'` directive)

**Location:** `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list.tsx`

**Props:** `articles: KnowledgeArticle[], sectionTitle: string`

**Layout:**

- Section header: `LibraryBig` icon (Cyan `oklch(0.65 0.15 211)`) + `sectionTitle` + article count badge
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Maps each article to `<ArticleCard />`

No `'use client'` directive — it has no async data needs and no server-only APIs, so it is renderable both from server pages and from client components like `KnowledgeHubClient`. This avoids the Next.js restriction that client components cannot directly import server components.

### `knowledge-hub-client.tsx` — Edit existing

Add a 4th tab entry to `TAB_CONFIG`:

```ts
{
  value: 'articles',
  label: 'מאמרים',
  icon: LibraryBig,
  color: 'oklch(0.65 0.15 211)',   // Cyan
}
```

The `TabsContent` for `articles` renders `<ArticleList articles={...} />`. Since `KnowledgeHubClient` is a client component, articles are passed down as a prop from the server page (`knowledge-hub/page.tsx`), which reads them via `getTranslations('knowledge').raw('articles')`.

---

## Dynamic Article Route

**File:** `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`

**Type:** Server Component (async)

**Data access:**

```ts
// Next.js 15+: params is a Promise — must be awaited
const { id } = await params
const t = await getTranslations('knowledge')
const items = t.raw('articles.items') as KnowledgeArticle[]
const article = items.find((a) => a.id === id)
if (!article) notFound()
```

> **Next.js version note:** This project runs Next.js 16.x (per `package.json`). Per AGENTS.md, verify the exact `params` typing against `node_modules/next/dist/docs/` before writing implementation code. The pattern above follows the Next.js 15+ async params convention.

**Page layout (top to bottom):**

1. **Breadcrumb row**
   - `← מרכז הידע` — `Link` to `/dashboard/knowledge-hub`, muted foreground, hover → foreground
   - Separator `/`
   - Current article title, truncated if long

2. **Meta row**
   - Category badge (same pill style as ArticleCard)
   - readTime chip: `{readTime} דקות קריאה` with a Clock icon

3. **Title**
   - `text-3xl font-extrabold tracking-tight`, `color: oklch(0.93 0.008 252)` (matches existing page titles)

4. **Divider** — `border-t` line

5. **Article body** (Body Rendering — see below)

6. **Back button** — ghost button variant, `← חזרה למרכז הידע`, links to `/dashboard/knowledge-hub`

All wrapper elements: `dir="rtl"`.

The sidebar correctly highlights "מרכז הידע" because the existing active check uses `pathname.includes('/dashboard/knowledge-hub')`.

---

## Body Rendering

Content is split by `"\n\n"` into paragraph chunks. Each chunk is classified and rendered differently:

| Condition                        | Rendering                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Starts with `\d+\.` (e.g. `1.`)  | `<p>` with `pr-4 border-r-2` accent border in category color, slightly bolder text |
| Starts with `(\d+)` (e.g. `(1)`) | Same as above — covers inline numbered lists used in the current 10 articles       |
| Starts with `-`                  | `<p>` with `pr-4` and a colored `·` prefix injected before text                    |
| Otherwise                        | Plain `<p className="leading-relaxed text-muted-foreground">`                      |

Detection regex: `/^(\d+\.|$$\d+$$|-)/` applied to `chunk.trimStart()`.

> **Coverage note:** The current 10 articles use `(1) item` inline format inside paragraphs rather than leading each paragraph with a number. The classification is therefore a forward-looking guard for future articles. No existing paragraph will mis-classify.

This is a simple inline classification — no Markdown parser. Logic lives in a `renderParagraph(chunk, categoryColor, index)` helper function within the detail page file.

---

## File Change Summary

| Action | File                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Edit   | `messages/he.json` — add `knowledge.articles` with 10 items                                                                        |
| Edit   | `src/types/knowledge.ts` — add `KnowledgeArticle` interface                                                                        |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card.tsx`                                                |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list.tsx`                                                |
| Edit   | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx` — add 4th tab + accept `articles` prop |
| Edit   | `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx` — read articles, pass to client                                    |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`                                                               |

---

## Non-Goals

- No EN translation (single locale: `he`)
- No article CMS or admin panel
- No Supabase storage for articles
- No `react-markdown` dependency
- No animations beyond CSS transitions
- No article search or filtering (future scope)
