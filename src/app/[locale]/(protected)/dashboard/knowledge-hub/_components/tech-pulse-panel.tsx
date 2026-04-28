'use client'

import { TrendingUp } from 'lucide-react'
import type { TechTrend } from '@/types/knowledge'

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

const STATIC_TRENDS: TechTrend[] = [
  {
    title: 'כלי AI בפיתוח תוכנה — המהפכה כבר כאן',
    summary:
      'כלי AI גנרטיביים כמו GitHub Copilot, Cursor ו-Claude Code הפכו לחלק בלתי נפרד מסביבת הפיתוח המודרנית. מחקר של GitHub מראה שמפתחים שמשתמשים ב-Copilot מסיימים משימות 55% מהר יותר. ב-2026, יכולת לעבוד עם AI agents אוטונומיים הפכה לציפייה בסיסית.',
    whyNow:
      'מודלי Claude 4, GPT-5 ו-Gemini Ultra שוחררו עם יכולות קוד חסרות תקדים — כולל כתיבה ובדיקת קוד אוטונומית על מאגרים שלמים.',
    impact:
      'מפתחים שמשלבים AI בזרימת העבודה שלהם מספקים פי 2-3 ערך יותר; ידע ב-AI tools הפך לכישור חובה בראיונות.',
    tag: 'AI/ML',
  },
  {
    title: 'React Server Components בסביבת ייצור',
    summary:
      'Next.js 15 ו-React 19 הבשילו את ארכיטקטורת Server Components לשימוש ייצורי רחב. ארגונים גדולים כמו Vercel, Shopify ו-Linear עברו לארכיטקטורה זו, שמפחיתה JavaScript בצד הלקוח ב-30-70% ומשפרת Core Web Vitals משמעותית.',
    whyNow: 'לאחר שנתיים של beta, RSC הגיעו לבגרות מלאה עם תיעוד מקיף ואקוסיסטם כלים בשל.',
    impact:
      'Frontend developers שאינם מכירים את גבולות Server/Client Components יתקשו להתקבל בחברות הייטק מובילות.',
    tag: 'Web',
  },
  {
    title: 'Rust חודרת לפיתוח ליבה',
    summary:
      'Rust נמצאת בשנה ה-9 ברצף כשפת התכנות הנחשקת ביותר (Stack Overflow Survey 2025). Linux kernel, Android ו-AWS משתמשים ב-Rust לקוד קריטי. Cloudflare, Discord ו-Figma כתבו מחדש רכיבי ביצועים ב-Rust עם שיפורים של עד 10x.',
    whyNow:
      'ממשל ארה"ב פרסם הנחיות רשמיות לכתיבת קוד memory-safe, שדחפו אימוץ מאסיבי של Rust בתעשייה.',
    impact:
      'ידע ב-Rust פותח דלתות לתפקידי Senior ב-Systems, Embedded ו-Cloud Infrastructure עם שכר גבוה משמעותית.',
    tag: 'Systems',
  },
  {
    title: 'Platform Engineering — מקצוע עצמאי',
    summary:
      'Platform Engineering — בניית ה"golden path" לצוותי פיתוח — הפכה למחלקה עצמאית בחברות בינוניות וגדולות. IDP (Internal Developer Platforms) מבוסס Backstage, Terraform ו-ArgoCD מאפשר לצוותי R&D להיות עצמאיים בתשתית ללא תלות בצוות DevOps.',
    whyNow:
      'עלות ה-DevOps burnout גבוהה מדי; חברות מחפשות לסקייל את פיתוח ה-infrastructure בלי להכפיל את הצוות.',
    impact:
      'Platform Engineers עם ניסיון ב-Kubernetes, Terraform ו-developer experience מקבלים חבילות שכר Senior ומעלה.',
    tag: 'DevOps',
  },
  {
    title: 'Supply Chain Security — המגזר הלוהט',
    summary:
      'פרשות SolarWinds, Log4Shell ומתקפות npm הפכו את אבטחת שרשרת האספקה לעדיפות עליונה. SBOM (Software Bill of Materials), SLSA Framework ו-Sigstore הפכו לדרישות בסיסיות בחוזי ממשל ואנטרפרייז. שוק ה-supply chain security צפוי להגיע ל-$8B ב-2026.',
    whyNow:
      'תקנות ה-EU Cyber Resilience Act נכנסו לתוקף ב-2025, מחייבות כל ספק תוכנה לתעד ולאבטח את רכיבי הקוד.',
    impact:
      'Security Engineers עם ידע ב-DevSecOps, container scanning ו-secrets management הם מצרך נדיר עם דרישה גבוהה.',
    tag: 'Security',
  },
  {
    title: 'Vector Databases ו-RAG בייצור',
    summary:
      'מסדי נתונים וקטוריים כמו Pinecone, Weaviate ו-pgvector הפכו לתשתית סטנדרטית עבור אפליקציות AI. RAG (Retrieval-Augmented Generation) מאפשרת לחברות לחבר את ה-LLMs לנתונים הפנימיים שלהן בצורה מאובטחת, ויוצרת גל של AI features מותאמים-ארגון.',
    whyNow:
      'עלות ה-token של LLMs ירדה פי 10 ב-2024-2025, מה שהפך RAG ל-production-ready גם לחברות קטנות.',
    impact:
      'Backend developers שמבינים embeddings, vector search ו-RAG pipelines מוצאים את עצמם בעמדת ביקוש גבוהה.',
    tag: 'Data',
  },
]

function TrendCard({ trend }: { trend: TechTrend }) {
  const color = tagColor(trend.tag)

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 20%)') }}
    >
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
            השפעה:{' '}
          </span>
          <span className="text-muted-foreground">{trend.impact}</span>
        </p>
      </div>
    </div>
  )
}

export function TechPulsePanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5" style={{ color: 'oklch(0.65 0.15 211)' }} />
        <h2 className="font-bold text-lg">מגמות ענף</h2>
        <span className="text-xs text-muted-foreground">AI · תוכנה · טכנולוגיה</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATIC_TRENDS.map((trend, i) => (
          <TrendCard key={i} trend={trend} />
        ))}
      </div>
    </div>
  )
}
