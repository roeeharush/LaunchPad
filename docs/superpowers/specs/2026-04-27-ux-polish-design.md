# UX Polish: Toasts, Skeletons, Progress Bar & Button States

**Date:** 2026-04-27  
**Status:** Approved for implementation

---

## Overview

Four focused UX improvements to the Launchpad dashboard: a global toast notification system, skeleton loaders for AI-heavy pages, a top-of-screen route-transition progress bar, and per-button loading micro-interactions on individual save actions.

---

## 1. Global Feedback System (Sonner)

### Library choice

`sonner` — over `react-hot-toast` because it requires no Provider wrapper (just a `<Toaster>` component placed once), has first-class `dir` and `position` props for RTL, and ships with a dark-mode-aware design that matches the existing oklch dark theme.

### Placement

`<Toaster>` goes in `src/app/[locale]/(protected)/layout.tsx` with:

- `position="top-left"` (RTL-natural: text anchors to the right, notification appears where the eye starts reading)
- `dir="rtl"` (aligns icon + text correctly for Hebrew)
- `theme="dark"` (matches the app palette)

### Toast triggers

| Event                             | Type            | Message                                   |
| --------------------------------- | --------------- | ----------------------------------------- |
| Resume uploaded successfully      | `toast.success` | `'קורות החיים הועלו בהצלחה'`              |
| Job saved to tracker              | `toast.success` | `'המשרה נשמרה לטראקר'`                    |
| Trend/interview bookmarked        | `toast.success` | `'הסימניה נשמרה'`                         |
| Cover letter copied               | `toast.success` | `'הועתק ללוח'`                            |
| Clipboard API throws (copy fails) | `toast.error`   | `'ההעתקה נכשלה'`                          |
| Any server action fails           | `toast.error`   | The `res.error` string from the action    |
| Job search with no resume         | `toast.error`   | The error string from the action response |

**Inline error `<p>` blocks** in action-response handlers are replaced by `toast.error()`. Form-level validation errors (e.g. "job description too short") stay inline since they relate to a specific input field.

---

## 2. Skeleton Loaders

### Components

Two new files, no external library — pure Tailwind `animate-pulse`:

**`src/components/ui/skeleton.tsx`**  
Base primitive: a `div` with `animate-pulse rounded-md bg-white/8`. Accepts `className` to control size/shape.

**`src/components/ui/skeleton-card.tsx`**  
Two named exports:

- `JobCardSkeleton` — mirrors the `JobCard` layout: a title line, a company line, two badge pills, a stack of tech tags, and a description block. Wrapped in the same `rounded-2xl p-5 border` shell with `var(--card)` background.
- `TrendCardSkeleton` — mirrors the `TrendCard` layout: a tag pill, a title line, three summary lines, and a `whyNow/relevance` footer. Same shell.

### Usage

- **`JobDiscoveryPanel`**: when `isPending && !result`, render a 6-card grid of `JobCardSkeleton` instead of the empty-state illustration.
- **`TechPulsePanel`**: when `isPending`, render a 3-card row of `TrendCardSkeleton` instead of the empty-state illustration.

Existing spinners on the main action buttons remain as-is (they convey "working" at the button level; skeletons convey "content is coming" at the results level).

---

## 3. Route-Transition Progress Bar

### Library choice

`nextjs-toploader` — single component, zero config, App Router compatible. Preferred over `next-nprogress-bar` for its simpler API.

### Placement

`<NextTopLoader>` placed at the top of `src/app/[locale]/(protected)/layout.tsx`, before `<Sidebar>`.

### Configuration

- `color`: brand amber `oklch(0.75 0.16 60)` — hex approximation `#c9a73c` for the prop
- `height`: `2` (2px — slim and unobtrusive)
- `showSpinner`: `false` (spinner-in-corner would conflict with button spinners)
- `shadow`: `false` (avoids visual noise on the dark background)

---

## 4. Button Micro-interactions

The main action buttons (`UploadForm`, `JobDiscoveryPanel`, `TechPulsePanel`) already correctly implement `Loader2 animate-spin` + disabled state via `useTransition`. No changes needed there.

**Gap to fill: individual JobCard save buttons**  
When `pendingIds.has(job.id)`, the save button currently shows the `Plus` icon (same as unsaved). It should show `Loader2 animate-spin` to signal the in-flight save. Change in `JobDiscoveryPanel`:

```tsx
// before
{
  isSaved ? <CheckCircle2 /> : <Plus />
}

// after
{
  isSaved ? (
    <CheckCircle2 />
  ) : pendingIds.has(job.id) ? (
    <Loader2 className="animate-spin" />
  ) : (
    <Plus />
  )
}
```

`isSaved` prop becomes insufficient; the `pendingIds` set must also be passed to `JobCard` as a prop, or the button needs to receive a combined `isLoading` boolean. Pass `isLoading={pendingIds.has(job.id)}` as a prop to keep `JobCard` simple.

---

## Files Changed

| File                                                                                        | Change                                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `package.json`                                                                              | Add `sonner`, `nextjs-toploader`                                                                                   |
| `src/app/[locale]/(protected)/layout.tsx`                                                   | Add `<NextTopLoader>` + `<Toaster>`                                                                                |
| `src/components/ui/skeleton.tsx`                                                            | **New** — base Skeleton primitive                                                                                  |
| `src/components/ui/skeleton-card.tsx`                                                       | **New** — `JobCardSkeleton`, `TrendCardSkeleton`                                                                   |
| `src/app/[locale]/(protected)/dashboard/resume-analyzer/_components/upload-form.tsx`        | `toast.success` on upload, `toast.error` on failure                                                                |
| `src/app/[locale]/(protected)/dashboard/job-search/_components/job-discovery-panel.tsx`     | `toast.success` on save, `toast.error` on action error, skeleton grid while pending, `isLoading` prop on `JobCard` |
| `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx` | `toast.success` on bookmark saved, `toast.error` on bookmark failure                                               |
| `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/tech-pulse-panel.tsx`     | Skeleton grid while pending, `toast.error` on action error                                                         |
| `src/app/[locale]/(protected)/dashboard/job-analyzer/_components/cover-letter-panel.tsx`    | `toast.success` on copy, `toast.error` on clipboard failure                                                        |

---

## Constraints

- No changes to server actions or data-fetching logic.
- All Hebrew strings are hardcoded in the component files (no i18n key additions — consistent with existing pattern in these client components).
- No new state management — existing `useTransition` / `useState` patterns remain.
- `JobCard` signature change is backward-compatible within its file (it's not exported or used elsewhere).
