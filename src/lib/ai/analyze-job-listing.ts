import Anthropic from '@anthropic-ai/sdk'
import type { JobAnalysisResult } from '@/types/job-analyzer'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseJobAnalysis(raw: string): JobAnalysisResult {
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

  const p = parsed as Record<string, unknown>
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('resumeMatchSummary' in parsed) ||
    !('coverLetterHe' in parsed) ||
    !('coverLetterEn' in parsed) ||
    !('criticalSkills' in parsed) ||
    !('interviewQuestions' in parsed) ||
    !Array.isArray(p.criticalSkills) ||
    !Array.isArray(p.interviewQuestions)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as JobAnalysisResult
}

export async function analyzeJobListing(
  jobText: string,
  resumeProfile: {
    text: string
    strengths: string[]
    score: number
  }
): Promise<JobAnalysisResult> {
  const { text, strengths, score } = resumeProfile

  const prompt = `אתה מאמן קריירה מקצועי המתמחה בשוק ההייטק הישראלי. נתח את מודעת העבודה הבאה ביחס לפרופיל המועמד, וצור חומרי הכנה מקיפים.

מודעת עבודה:
---
${jobText}
---

פרופיל קורות חיים:
ציון: ${score}/100
נקודות חוזק: ${strengths.join(', ')}
קטע מקורות החיים:
${text.slice(0, 2000)}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "resumeMatchSummary": "<סיכום קצר (2 משפטים) עד כמה הפרופיל מתאים למשרה>",
  "coverLetterHe": "<מכתב פנייה מקצועי בעברית, 3-4 פסקאות, מותאם למשרה ולפרופיל המועמד>",
  "coverLetterEn": "<professional cover letter in English, 3-4 paragraphs, tailored to the job and candidate profile>",
  "criticalSkills": [
    {
      "skill": "<שם הכישור או הטכנולוגיה>",
      "whyImportant": "<למה הכישור הזה קריטי למשרה — משפט אחד בעברית>",
      "howToHighlight": "<איך להדגיש אותו בראיון — משפט אחד בעברית>"
    }
  ],
  "interviewQuestions": [
    {
      "question": "<שאלת ראיון ספציפית למשרה זו>",
      "answer": "<תשובה מפורטת (2-3 משפטים) המבוססת על פרופיל המועמד>",
      "tip": "<טיפ נוסף לאופן ההצגה בראיון — משפט אחד>"
    }
  ]
}

הנחיות:
- רשום בדיוק 5 כישורים קריטיים
- רשום בדיוק 3 שאלות ראיון
- מכתב הפנייה בעברית — סגנון מקצועי אך חם, מתאים לתרבות ההייטק הישראלית
- מכתב הפנייה באנגלית — סגנון professional ומובנה, מתאים לחברות בינלאומיות
- הכישורים והשאלות חייבים להתייחס ספציפית לדרישות המשרה המתוארת
- שאלות הראיון צריכות לבדוק הבנה עמוקה, לא שינון

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseJobAnalysis(content.text)
}
