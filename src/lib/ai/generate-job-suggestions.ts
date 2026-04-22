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
