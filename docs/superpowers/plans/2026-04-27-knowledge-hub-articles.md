# Knowledge Hub Articles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 static Hebrew professional articles to the Knowledge Hub as a new "מאמרים" tab with individual article detail pages and breadcrumb navigation.

**Architecture:** Articles are stored as static JSON in `messages/he.json` (no DB). A new tab in the existing `KnowledgeHubClient` renders an `ArticleList` grid of `ArticleCard` components. Each card links to `/dashboard/knowledge-hub/[id]`, a server-component detail page that reads the article from translations and renders its body with paragraph classification.

**Tech Stack:** Next.js 16 (params is `Promise<{…}>` — always `await`), next-intl 4.9.1 (`getTranslations` server / `useTranslations` client), Vitest + React Testing Library, oklch inline styles (no Tailwind color classes for brand colors), `Link` from `next/link`.

---

## File Map

| Action | Path                                                                                        | Responsibility                                            |
| ------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Edit   | `messages/he.json`                                                                          | Add `knowledge.articles` with 10 article objects          |
| Edit   | `src/types/knowledge.ts`                                                                    | Add `KnowledgeArticle` interface                          |
| Edit   | `tests/types/knowledge.test.ts`                                                             | Add `KnowledgeArticle` type shape test                    |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card.tsx`         | Single article card with hover glow, category color, link |
| Create | `tests/components/article-card.test.tsx`                                                    | Render test for ArticleCard                               |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list.tsx`         | Grid of ArticleCards with section header                  |
| Create | `tests/components/article-list.test.tsx`                                                    | Render test for ArticleList                               |
| Edit   | `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx`                             | Read articles from translations, pass to client           |
| Edit   | `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx` | Add articles prop + 4th tab                               |
| Create | `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`                        | Article detail: breadcrumb, meta, body rendering          |
| Create | `tests/knowledge-hub/article-detail.test.tsx`                                               | Unit test for `renderParagraph` helper                    |

---

## Task 1: Add `KnowledgeArticle` Type

**Files:**

- Modify: `src/types/knowledge.ts`
- Modify: `tests/types/knowledge.test.ts`

- [ ] **Step 1.1 — Write the failing test**

Open `tests/types/knowledge.test.ts` and add this test inside the existing `describe('knowledge types', ...)` block, after the last `it(...)`:

```ts
it('KnowledgeArticle has all required fields', () => {
  const article: KnowledgeArticle = {
    id: 'hr-interview-tips',
    category: 'ראיונות',
    title: 'איך לעבור ראיון HR בהצלחה',
    readTime: '4',
    excerpt: 'ראיון HR הוא השלב הראשון.',
    content: 'פסקה ראשונה.\n\nפסקה שנייה.',
  }
  expect(article.id).toBe('hr-interview-tips')
  expect(article.readTime).toBe('4')
})
```

Also add `KnowledgeArticle` to the import at the top of the file:

```ts
import type {
  TechTrend,
  TechPulse,
  InterviewQA,
  InterviewPrepResult,
  KnowledgeBookmark,
  KnowledgeArticle,
} from '@/types/knowledge'
```

- [ ] **Step 1.2 — Run test to confirm it fails**

```bash
npm run test:run -- tests/types/knowledge.test.ts
```

Expected: FAIL — `KnowledgeArticle` is not exported from `@/types/knowledge`.

- [ ] **Step 1.3 — Add the interface to `src/types/knowledge.ts`**

Append after the `KnowledgeBookmark` interface:

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

- [ ] **Step 1.4 — Run test to confirm it passes**

```bash
npm run test:run -- tests/types/knowledge.test.ts
```

Expected: all 6 tests PASS.

- [ ] **Step 1.5 — Commit**

```bash
git add src/types/knowledge.ts tests/types/knowledge.test.ts
git commit -m "feat: add KnowledgeArticle type"
```

---

## Task 2: Inject Articles into `messages/he.json`

**Files:**

- Modify: `messages/he.json`

- [ ] **Step 2.1 — Add `articles` key inside the `knowledge` object**

In `messages/he.json`, find the `"knowledge"` object. Add a new `"articles"` key as the last entry before the closing `}` of `"knowledge"`:

```json
"articles": {
  "sectionTitle": "מאמרים מקצועיים",
  "readMinutes": "דקות קריאה",
  "items": [
    {
      "id": "hr-interview-tips",
      "category": "ראיונות",
      "title": "איך לעבור ראיון HR בהצלחה",
      "readTime": "4",
      "excerpt": "ראיון HR הוא השלב הראשון בדרך להצעה — הנה איך להכין את עצמך ולעשות רושם ראשוני שלא נשכח.",
      "content": "ראיון HR נועד לבדוק אם אתה מתאים לתרבות הארגונית ולתפקיד ברמה הכללית. שלוש שניות של רושם ראשוני קובעות הרבה מאוד, לכן הופעה, שפת גוף ובטחון עצמי חשובים לא פחות מהתשובות עצמן.\n\nהשאלות השכיחות ביותר: 'ספר לי על עצמך', 'למה אתה רוצה לעבוד פה?', 'מה החולשות שלך?' — תרגל תשובות קצרות ומדויקות לכל אחת מהן בקול. שיטת STAR (Situation, Task, Action, Result) תעזור לך לספר סיפורים שמדגימים יכולות אמיתיות.\n\nלפני הראיון: חקור את החברה, הבן את המוצר ואת הערכים שלה, ותמצא נקודת חיבור אמיתית בין הסיפור שלך לבין מה שהם מחפשים. לקראת הסוף, תמיד שאל שאלה אחת שמראה שקראת ולא רק שלחת קורות חיים."
    },
    {
      "id": "impressive-github-tips",
      "category": "GitHub",
      "title": "5 טיפים לפרופיל GitHub שמגייסים שומרים",
      "readTime": "5",
      "excerpt": "הפרופיל ב-GitHub הוא קורות החיים הטכניים שלך — הנה איך לגרום לו לדבר בעדך גם כשאתה ישן.",
      "content": "רוב הסטודנטים מזניחים את פרופיל ה-GitHub שלהם, וזו בדיוק ההזדמנות שלך להתבלט. התחל עם פרופיל README — זה קובץ מיוחד שמופיע בעמוד הראשי שלך ומאפשר לך לספר את הסיפור שלך בפורמט חופשי.\n\nהמשך עם pinned repositories: בחר 4-6 פרויקטים שמציגים טווח יכולות — לא רק כמות. לכל פרויקט כתוב תיאור ברור שמסביר מה הוא עושה, באיזו טכנולוגיה, ולמה בנית אותו. הוסף screenshots או GIFs לפרויקטי UI.\n\nהרגלי commit חשובים: commits קטנים עם הודעות ברורות ('feat: add user authentication') מספרים סיפור על תהליך החשיבה שלך. Contribution graph פעיל (גם אם זה פרויקטים אישיים) מראה עקביות. כבונוס — contribute לפרויקט open-source ולו בפעם אחת, אפילו תיקון קטן."
    },
    {
      "id": "how-to-write-readme",
      "category": "GitHub",
      "title": "איך לכתוב README שגורם למגייסים להבין את הפרויקט תוך 30 שניות",
      "readTime": "4",
      "excerpt": "README טוב הוא ההבדל בין פרויקט שנראה רציני לבין תיקייה אנונימית בגיטהאב.",
      "content": "מבנה README אפקטיבי מתחיל בשם הפרויקט + משפט אחד שמסביר מה הוא עושה. מיד אחרי כן — screenshots או demo GIF. מגייס שמגיע לפרויקט שלך יחליט תוך 10 שניות אם להמשיך לקרוא.\n\nהסקשנים החיוניים: About (מה הפרויקט ולמה), Tech Stack (הטכנולוגיות בשימוש עם badges), Getting Started (איך להריץ locally ב-3-5 פקודות), ו-Features (רשימה קצרה של מה הפרויקט עושה).\n\nטיפ מתקדם: הוסף סקשן 'What I learned' — זה לא נראה חובבני, זה מראה שאתה אדם שמשקף על עצמו ומדבר בשפה של מפתחים. מגייסים ומנהלים טכניים מאוד מעריכים את זה. תוכל לגמור README מוצלח תוך שעה עם תבניות כמו Best-README-Template בגיטהאב."
    },
    {
      "id": "linkedin-profile-guide",
      "category": "LinkedIn",
      "title": "מדריך מהיר: LinkedIn שמביא Inbound מגייסים",
      "readTime": "5",
      "excerpt": "מגייסים מחפשים מועמדים אקטיבית ב-LinkedIn — הנה איך לוודא שהם מוצאים אותך ורוצים לפנות.",
      "content": "הכותרת (Headline) היא השדה הכי חשוב בפרופיל — היא מופיעה בתוצאות החיפוש לפני שמגייס נכנס לפרופיל שלך. אל תכתוב 'סטודנט למדעי המחשב'. במקום זאת: 'Full Stack Developer | React & Node.js | Open to Junior Roles'.\n\nה-About (Summary) צריך לעשות שלושה דברים: לספר מי אתה, מה אתה יכול לעשות, ולמה אתה מחפש עכשיו. כתוב בגוף ראשון, היה אנושי ולא רובוטי. שלושה פסקאות זה מספיק.\n\nמילות מפתח: LinkedIn פועל כמו מנוע חיפוש. מגייסים מחפשים 'React developer Tel Aviv' — וודא שהמילות האלה מופיעות ב-Headline, About, ו-Experience שלך. Skills endorsements שעוברות 50 נותנות boost נוסף. לסיום — פרסם תוכן: אפילו פוסט אחד בשבוע על מה שלמדת מגדיל את הנראות שלך משמעותית."
    },
    {
      "id": "cv-writing-guide",
      "category": "קורות חיים",
      "title": "7 עקרונות לקורות חיים שעוברים ATS ומגיעים לשולחן המגייס",
      "readTime": "5",
      "excerpt": "רוב קורות החיים נפסלים אוטומטית לפני שאדם ראה אותם — הנה איך להימנע מזה.",
      "content": "ATS (Applicant Tracking System) הוא תוכנה שסורקת קורות חיים לפני שמגייס רואה אותם. כדי לעבור: השתמש בפורמט פשוט (ללא טבלאות, ללא headers/footers, ללא גרפים), ועם פונט קריא. PDF בדרך כלל עובד טוב.\n\nשבעת העקרונות: (1) התאמה לתפקיד — שנה כל פעם לפי JD. (2) פעלי פעולה — 'פיתחתי', 'הובלתי', לא 'אחראי על'. (3) מספרים — 'שיפרתי ביצועים ב-30%' טוב מ'שיפרתי ביצועים'. (4) סדר הפוך — ניסיון הכי חדש קודם. (5) עמוד אחד — כן, גם אם קשה. (6) ללא תמונה — בישראל מותר אבל לא מומלץ בחלק מהחברות. (7) לינקים — GitHub וLinkedIn בחלק העליון.\n\nטעות שכיחה: כתיבת תיאורי תפקיד במקום הישגים. 'עבדתי על פיתוח REST API' הוא תיאור. 'פיתחתי REST API שמשרת 500 בקשות בשנייה' הוא הישג."
    },
    {
      "id": "technical-interview-prep",
      "category": "ראיונות",
      "title": "איך להתכונן לראיון טכני תוך 4 שבועות",
      "readTime": "6",
      "excerpt": "ראיון טכני לא בודק אם אתה גאון — הוא בודק אם אתה חושב טוב. הנה תוכנית הכנה ריאלית.",
      "content": "שבועות 1-2: חזור על יסודות Data Structures — Arrays, HashMaps, Linked Lists, Trees, Graphs. לכל מבנה נתונים — הבן מתי משתמשים בו ומה המורכלות של הפעולות הנפוצות. LeetCode Easy הוא נקודת ההתחלה, לא Easy משמעו קל.\n\nשבועות 3-4: עבור לבעיות Medium עם דגש על Sliding Window, Two Pointers, BFS/DFS, ו-Dynamic Programming בסיסי. אל תשנן פתרונות — הבן את הפטרן. כתוב קוד בידיים, לא רק תאר את הפתרון בקול.\n\nיום הראיון: דבר תוך כדי פתרון. מגייסים רוצים לראות את תהליך החשיבה שלך, לא רק את התשובה הנכונה. שאל שאלות קלריפיקציה לפני שמתחיל לכתוב קוד. אם נתקעת — אמור זאת ותאר מה אתה מנסה. ואל תשכח: בדוק edge cases לפני שאומר שסיימת."
    },
    {
      "id": "networking-in-tech",
      "category": "קריירה",
      "title": "נטוורקינג בהייטק: איך לבנות קשרים שבאמת פותחים דלתות",
      "readTime": "4",
      "excerpt": "80% מהמשרות בישראל מתמלאות דרך היכרויות — הנה איך לבנות רשת גם כשאתה מתחיל.",
      "content": "נטוורקינג לא אומר לשלוח הודעות גנריות לכולם ב-LinkedIn. זה אומר לבנות מערכות יחסים אמיתיות עם אנשים בתחום. התחל עם מי שכבר מכיר אותך: מרצים, חברים שכבר עובדים, alumni מהאוניברסיטה.\n\nהגישה הנכונה ל-cold outreach: שלח הודעה קצרה (3-4 משפטים) שמסבירה מי אתה, למה פנית ספציפית לאדם הזה, ושואלת שאלה אחת ספציפית — לא 'אפשר קפה?'. לדוגמה: 'ראיתי את הפוסט שלך על אדריכלות microservices — אני עובד על פרויקט דומה. איך החלטתם על גבולות ה-service?'\n\nמקומות לפגוש אנשים: meetups טכנולוגיים (Pycon, ReactIL, DevSecOps), hackathons, קהילות Discord ו-Slack של מפתחים ישראלים. גם Open Source — contribute לפרויקט שצוות טוב עובד עליו וזה שווה 10 הגשות קורות חיים."
    },
    {
      "id": "portfolio-project-guide",
      "category": "פורטפוליו",
      "title": "איך לבנות פרויקט פורטפוליו שמרשים מנהלים טכניים",
      "readTime": "5",
      "excerpt": "פרויקט אחד טוב שווה יותר מעשרה פרויקטים Tutorial — הנה איך לבנות אחד שכזה.",
      "content": "הטעות הנפוצה ביותר: לבנות Todo App נוסף. מגייסים רואים אלפים מהם. במקום זאת — בחר בעיה שאתה באמת מכיר: כלי לניהול ציונים, מערכת להזמנת תורים לשכונה, אפליקציה שפותרת בעיה שיש לך בחיים האמיתיים.\n\nמה שהופך פרויקט לטוב: (1) בעיה ברורה שהוא פותר. (2) Stack מוגדר ומנומק — מדוע בחרת ב-React ולא Vue? (3) אוטנטיקציה אמיתית (לא stub). (4) Database שמחזיקה data אמיתי. (5) Deploy חי — Vercel, Railway, Render — שמגייס יכול להיכנס ולהשתמש.\n\nבונוס גדול: כתוב על הפרויקט. פוסט ב-LinkedIn על מה בנית ומה למדת מביא visibility ומגייסים שמוצאים אותך. וודא שיש לך unit tests — גם בסיסיים — כי זה מראה שאתה כותב קוד שאחרים יכולים לסמוך עליו."
    },
    {
      "id": "questions-to-ask-interviewer",
      "category": "ראיונות",
      "title": "10 שאלות לשאול בסוף ראיון שמראות שאתה רציני",
      "readTime": "3",
      "excerpt": "'יש לך שאלות?' — המשפט שמגייסים שואלים ורוב המועמדים מבזבזים. הנה איך לנצל אותו.",
      "content": "שאלות בסוף ראיון הן הזדמנות, לא פורמליות. הן מראות עניין אמיתי, חשיבה ביקורתית, ועוזרות לך גם להחליט אם אתה רוצה את העבודה הזו.\n\nשאלות על הצוות: 'איך נראה יום עבודה טיפוסי של ה-Junior בצוות?', 'מה הכי אהבת בלעבוד כאן ב-12 חודשים האחרונים?', 'איך הצוות מתמודד עם disagreements טכניים?'\n\nשאלות על הצמיחה: 'מה ה-onboarding נראה בחודש הראשון?', 'יש מנטורשיפ פורמלי או זה יותר אורגני?', 'איפה הג'וניורים שהתחילו כאן לפני שנה-שנתיים נמצאים היום?'\n\nשאלות על הטכנולוגיה: 'מה ה-tech debt הכי משמעותי שאתם מתמודדים איתו?', 'איך מתקבלות החלטות טכניות — top-down או bottom-up?'. שאלה אחת אסורה: 'כמה משלמים?' — זה לשלב ההצעה."
    },
    {
      "id": "elevator-pitch-guide",
      "category": "קריירה",
      "title": "איך לספר את הסיפור שלך ב-60 שניות: מדריך ה-Elevator Pitch",
      "readTime": "4",
      "excerpt": "ספר לי על עצמך — שאלת הפתיחה שרוב המועמדים עונים עליה בצורה הכי לא אפקטיבית. הנה הנוסחה.",
      "content": "תשובה ל'ספר לי על עצמך' לא אמורה להיות קריאה של קורות החיים. זה אמור להיות נרטיב שמוביל מי אתה → מה עשית → למה אתה כאן עכשיו.\n\nנוסחה שעובדת: 'אני [שם], [מה אתה לומד/עשית]. בשנה האחרונה [הישג ספציפי אחד שקשור לתפקיד]. אני מתעניין בחברה שלכם כי [סיבה ספציפית שמראה שחקרת]. אני מחפש [מה אתה מחפש] ואני מאמין שאני יכול לתרום ל[מה]'.\n\nתרגל בקול מול מראה עד שזה ישמע טבעי, לא שנון."
    }
  ]
}
```

- [ ] **Step 2.2 — Verify JSON is valid and types check**

```bash
npm run test:run -- tests/i18n.test.ts
```

Expected: PASS. (The i18n test validates message file structure.)

- [ ] **Step 2.3 — Commit**

```bash
git add messages/he.json
git commit -m "feat: add 10 Hebrew professional articles to knowledge translations"
```

---

## Task 3: Create `ArticleCard` Component

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card.tsx`
- Create: `tests/components/article-card.test.tsx`

- [ ] **Step 3.1 — Write the failing test**

Create `tests/components/article-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { ArticleCard } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card'
import type { KnowledgeArticle } from '@/types/knowledge'

const mockArticle: KnowledgeArticle = {
  id: 'hr-interview-tips',
  category: 'ראיונות',
  title: 'איך לעבור ראיון HR בהצלחה',
  readTime: '4',
  excerpt: 'ראיון HR הוא השלב הראשון.',
  content: 'תוכן המאמר.',
}

describe('ArticleCard', () => {
  it('renders the article title', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('איך לעבור ראיון HR בהצלחה')).toBeInTheDocument()
  })

  it('renders the category badge', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('ראיונות')).toBeInTheDocument()
  })

  it('renders the excerpt', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText('ראיון HR הוא השלב הראשון.')).toBeInTheDocument()
  })

  it('links to the correct article route', () => {
    render(<ArticleCard article={mockArticle} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/knowledge-hub/hr-interview-tips')
  })

  it('renders read time', () => {
    render(<ArticleCard article={mockArticle} />)
    expect(screen.getByText(/4/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3.2 — Run test to confirm it fails**

```bash
npm run test:run -- tests/components/article-card.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3.3 — Create `article-card.tsx`**

Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-card.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'
import type { KnowledgeArticle } from '@/types/knowledge'

const CATEGORY_COLORS: Record<string, string> = {
  ראיונות: 'oklch(0.585 0.212 264.4)',
  GitHub: 'oklch(0.65 0.15 211)',
  LinkedIn: 'oklch(0.60 0.17 162)',
  קריירה: 'oklch(0.75 0.16 60)',
  פורטפוליו: 'oklch(0.58 0.21 291)',
  'קורות חיים': 'oklch(0.62 0.22 27)',
}

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'oklch(0.585 0.212 264.4)'
}

interface ArticleCardProps {
  article: KnowledgeArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  const color = categoryColor(article.category)

  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.boxShadow = `0 0 0 1px ${color.replace(')', ' / 30%)')}, 0 4px 20px ${color.replace(')', ' / 15%)')}`
    e.currentTarget.style.background = color.replace(')', ' / 5%)')
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.boxShadow = ''
    e.currentTarget.style.background = 'var(--card)'
  }

  return (
    <Link
      href={`/dashboard/knowledge-hub/${article.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="block rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 no-underline"
      style={{
        background: 'var(--card)',
        borderColor: color.replace(')', ' / 20%)'),
        borderRightWidth: '3px',
        borderRightColor: color,
      }}
    >
      {/* Header: category badge + read time */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: color.replace(')', ' / 15%)'), color }}
        >
          {article.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {article.readTime}
        </span>
      </div>

      {/* Title */}
      <h3
        className="font-bold text-base leading-snug line-clamp-2"
        style={{ color: 'oklch(0.93 0.008 252)' }}
      >
        {article.title}
      </h3>

      {/* Excerpt */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {article.excerpt}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
        קרא עוד
        <ArrowLeft className="w-3 h-3" />
      </div>
    </Link>
  )
}
```

- [ ] **Step 3.4 — Run test to confirm it passes**

```bash
npm run test:run -- tests/components/article-card.test.tsx
```

Expected: all 5 tests PASS.

- [ ] **Step 3.5 — Commit**

```bash
git add src/app/[locale]/\(protected\)/dashboard/knowledge-hub/_components/article-card.tsx tests/components/article-card.test.tsx
git commit -m "feat: add ArticleCard component with category glow hover"
```

---

## Task 4: Create `ArticleList` Component

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list.tsx`
- Create: `tests/components/article-list.test.tsx`

- [ ] **Step 4.1 — Write the failing test**

Create `tests/components/article-list.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { ArticleList } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list'
import type { KnowledgeArticle } from '@/types/knowledge'

const mockArticles: KnowledgeArticle[] = [
  {
    id: 'hr-interview-tips',
    category: 'ראיונות',
    title: 'איך לעבור ראיון HR',
    readTime: '4',
    excerpt: 'תקציר.',
    content: 'תוכן.',
  },
  {
    id: 'github-tips',
    category: 'GitHub',
    title: 'טיפים ל-GitHub',
    readTime: '5',
    excerpt: 'תקציר GitHub.',
    content: 'תוכן GitHub.',
  },
]

describe('ArticleList', () => {
  it('renders the section title', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים מקצועיים" />)
    expect(screen.getByText('מאמרים מקצועיים')).toBeInTheDocument()
  })

  it('renders all articles', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים" />)
    expect(screen.getByText('איך לעבור ראיון HR')).toBeInTheDocument()
    expect(screen.getByText('טיפים ל-GitHub')).toBeInTheDocument()
  })

  it('renders the article count badge', () => {
    render(<ArticleList articles={mockArticles} sectionTitle="מאמרים" />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4.2 — Run test to confirm it fails**

```bash
npm run test:run -- tests/components/article-list.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4.3 — Create `article-list.tsx`**

Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/article-list.tsx`:

```tsx
import { LibraryBig } from 'lucide-react'
import { ArticleCard } from './article-card'
import type { KnowledgeArticle } from '@/types/knowledge'

interface ArticleListProps {
  articles: KnowledgeArticle[]
  sectionTitle: string
}

export function ArticleList({ articles, sectionTitle }: ArticleListProps) {
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(0.65 0.15 211 / 12%)' }}
        >
          <LibraryBig className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
        </div>
        <h2 className="font-bold text-base">{sectionTitle}</h2>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'oklch(0.65 0.15 211 / 12%)',
            color: 'oklch(0.65 0.15 211)',
          }}
        >
          {articles.length}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4.4 — Run test to confirm it passes**

```bash
npm run test:run -- tests/components/article-list.test.tsx
```

Expected: all 3 tests PASS.

- [ ] **Step 4.5 — Commit**

```bash
git add src/app/[locale]/\(protected\)/dashboard/knowledge-hub/_components/article-list.tsx tests/components/article-list.test.tsx
git commit -m "feat: add ArticleList grid component"
```

---

## Task 5: Update Knowledge Hub Page + Client — Articles Tab

**Files:**

- Modify: `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx`
- Modify: `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx`

This task has no dedicated test file — component integration is covered by the existing `16 test files` suite. The build check (`npm run build`) is the verification gate.

- [ ] **Step 5.1 — Update `page.tsx` to read and forward articles**

Replace the contents of `src/app/[locale]/(protected)/dashboard/knowledge-hub/page.tsx` with:

```tsx
import { BookOpen } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeHubClient } from './_components/knowledge-hub-client'
import type { KnowledgeBookmark } from '@/types/knowledge'
import type { KnowledgeArticle } from '@/types/knowledge'

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

  const t = await getTranslations('knowledge')
  const articlesData = t.raw('articles') as {
    sectionTitle: string
    items: KnowledgeArticle[]
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
          טרנדים יומיים · הכנה לראיונות · סימניות חכמות — הכל מופעל ע&quot;י AI
        </p>
      </div>

      <KnowledgeHubClient
        initialBookmarks={initialBookmarks}
        articles={articlesData.items}
        articlesSectionTitle={articlesData.sectionTitle}
      />
    </div>
  )
}
```

- [ ] **Step 5.2 — Update `knowledge-hub-client.tsx` to accept articles + add 4th tab**

Replace the contents of `src/app/[locale]/(protected)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx` with:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { Zap, GraduationCap, Bookmark, LibraryBig } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { saveBookmarkAction } from '../actions'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { BookmarksPanel } from './bookmarks-panel'
import { ArticleList } from './article-list'
import type { KnowledgeBookmark, KnowledgeArticle } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  initialBookmarks: KnowledgeBookmark[]
  articles: KnowledgeArticle[]
  articlesSectionTitle: string
}

export function KnowledgeHubClient({
  initialBookmarks,
  articles,
  articlesSectionTitle,
}: KnowledgeHubClientProps) {
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
    {
      value: 'articles',
      label: 'מאמרים',
      icon: LibraryBig,
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
              activeTab === value ? { background: color.replace(')', ' / 15%)'), color } : undefined
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

      <TabsContent value="articles">
        <ArticleList articles={articles} sectionTitle={articlesSectionTitle} />
      </TabsContent>
    </Tabs>
  )
}
```

- [ ] **Step 5.3 — Run full test suite**

```bash
npm run test:run
```

Expected: all 16+ test files PASS.

- [ ] **Step 5.4 — Commit**

```bash
git add src/app/[locale]/\(protected\)/dashboard/knowledge-hub/page.tsx src/app/[locale]/\(protected\)/dashboard/knowledge-hub/_components/knowledge-hub-client.tsx
git commit -m "feat: wire articles tab into KnowledgeHubClient"
```

---

## Task 6: Create Article Detail Page `[id]/page.tsx`

**Files:**

- Create: `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`
- Create: `tests/knowledge-hub/article-detail.test.tsx`

- [ ] **Step 6.1 — Write the failing test for `renderParagraph`**

Create `tests/knowledge-hub/article-detail.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderParagraph } from '@/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page'

const color = 'oklch(0.585 0.212 264.4)'

describe('renderParagraph', () => {
  it('renders a plain paragraph with muted text', () => {
    const el = renderParagraph('פסקה רגילה של טקסט.', color, 0)
    render(el)
    expect(screen.getByText('פסקה רגילה של טקסט.')).toBeInTheDocument()
  })

  it('renders a dash paragraph with bullet prefix', () => {
    const el = renderParagraph('- פריט ברשימה', color, 1)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט ברשימה')
  })

  it('renders a numbered paragraph (digit+dot) with accent border', () => {
    const el = renderParagraph('1. פריט ממוספר', color, 2)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט ממוספר')
  })

  it('renders a (digit) paragraph with accent border', () => {
    const el = renderParagraph('(1) פריט בסוגריים', color, 3)
    const { container } = render(el)
    expect(container.textContent).toContain('פריט בסוגריים')
  })
})
```

- [ ] **Step 6.2 — Run test to confirm it fails**

```bash
npm run test:run -- tests/knowledge-hub/article-detail.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 6.3 — Create the detail page**

Create `src/app/[locale]/(protected)/dashboard/knowledge-hub/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Clock, ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KnowledgeArticle } from '@/types/knowledge'

const CATEGORY_COLORS: Record<string, string> = {
  ראיונות: 'oklch(0.585 0.212 264.4)',
  GitHub: 'oklch(0.65 0.15 211)',
  LinkedIn: 'oklch(0.60 0.17 162)',
  קריירה: 'oklch(0.75 0.16 60)',
  פורטפוליו: 'oklch(0.58 0.21 291)',
  'קורות חיים': 'oklch(0.62 0.22 27)',
}

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'oklch(0.585 0.212 264.4)'
}

export async function generateStaticParams() {
  const t = await getTranslations('knowledge')
  const items = t.raw('articles.items') as KnowledgeArticle[]
  return items.map((a) => ({ id: a.id }))
}

export function renderParagraph(chunk: string, color: string, index: number) {
  const trimmed = chunk.trimStart()
  const isNumberedDot = /^\d+\./.test(trimmed)
  const isNumberedParen = /^\(\d+\)/.test(trimmed)
  const isDash = trimmed.startsWith('-')

  if (isNumberedDot || isNumberedParen) {
    return (
      <p
        key={index}
        dir="rtl"
        className="text-sm leading-relaxed font-medium pr-4"
        style={{
          borderRightWidth: '2px',
          borderRightStyle: 'solid',
          borderRightColor: color.replace(')', ' / 50%)'),
          color: 'oklch(0.85 0.01 252)',
        }}
      >
        {chunk}
      </p>
    )
  }

  if (isDash) {
    return (
      <p key={index} dir="rtl" className="text-sm text-muted-foreground leading-relaxed pr-4">
        <span className="font-bold ml-1" style={{ color }}>
          ·
        </span>
        {chunk.replace(/^-\s*/, '')}
      </p>
    )
  }

  return (
    <p key={index} dir="rtl" className="text-sm text-muted-foreground leading-relaxed">
      {chunk}
    </p>
  )
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const t = await getTranslations('knowledge')
  const items = t.raw('articles.items') as KnowledgeArticle[]
  const article = items.find((a) => a.id === id)

  if (!article) notFound()

  const color = categoryColor(article.category)
  const paragraphs = article.content.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-ambient" dir="rtl">
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href="/dashboard/knowledge-hub"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            מרכז הידע
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 opacity-40" />
          <span className="truncate max-w-xs" style={{ color: 'oklch(0.80 0.01 252)' }}>
            {article.title}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: color.replace(')', ' / 15%)'), color }}
          >
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.readTime} דקות קריאה
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-extrabold tracking-tight mb-5"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          {article.title}
        </h1>

        {/* Divider */}
        <div className="border-t mb-6" style={{ borderColor: 'oklch(1 0 0 / 9%)' }} />

        {/* Body */}
        <div className="space-y-4">
          {paragraphs.map((chunk, i) => renderParagraph(chunk, color, i))}
        </div>

        {/* Back button */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: 'oklch(1 0 0 / 9%)' }}>
          <Link
            href="/dashboard/knowledge-hub"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2')}
          >
            <ArrowRight className="w-4 h-4" />
            חזרה למרכז הידע
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.4 — Run the detail page test**

```bash
npm run test:run -- tests/knowledge-hub/article-detail.test.tsx
```

Expected: all 4 tests PASS.

- [ ] **Step 6.5 — Run full test suite**

```bash
npm run test:run
```

Expected: all test files PASS.

- [ ] **Step 6.6 — Commit**

```bash
git add src/app/[locale]/\(protected\)/dashboard/knowledge-hub/[id]/page.tsx tests/knowledge-hub/article-detail.test.tsx
git commit -m "feat: add article detail page with breadcrumb and body rendering"
```

---

## Task 7: Final Build Verification

- [ ] **Step 7.1 — Run the full test suite one last time**

```bash
npm run test:run
```

Expected: all test files PASS, 0 failures.

- [ ] **Step 7.2 — Type-check the entire project**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 7.3 — Start dev server and smoke-test manually**

```bash
npm run dev
```

Navigate to `http://localhost:3000/he/dashboard/knowledge-hub`:

- [ ] "מאמרים" tab is visible as the 4th tab
- [ ] Clicking it shows a 3-column grid of 10 cards
- [ ] Each card shows category badge, title, excerpt, read time
- [ ] Hovering a card shows the glow effect in the category color
- [ ] Clicking a card navigates to `/he/dashboard/knowledge-hub/[id]`
- [ ] Detail page shows breadcrumb: `← מרכז הידע / [title]`
- [ ] Detail page shows meta (category badge + read time)
- [ ] Detail page body renders all paragraphs correctly
- [ ] "חזרה למרכז הידע" back button navigates back
- [ ] Navigating to a non-existent id (e.g. `/he/dashboard/knowledge-hub/fake`) returns 404

- [ ] **Step 7.4 — Final commit**

```bash
git add .
git commit -m "feat: Knowledge Hub articles — complete feature"
```
