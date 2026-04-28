import Anthropic from '@anthropic-ai/sdk'
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
    !('generatedAt' in parsed) ||
    !('trends' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as TechPulse
}

export async function generateIndustryTrends(): Promise<TechPulse> {
  const now = new Date().toISOString()

  const prompt = `אתה מומחה טכנולוגיה ותעשיית ההייטק עם יד על הדופק של הטרנדים הכי חמים ב-2026. צור דוח טרנדים עשיר ומעמיק של תעשיית הטכנולוגיה.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "generatedAt": "${now}",
  "trends": [
    {
      "title": "<שם הטרנד, בעברית, קצר וחד>",
      "summary": "<תיאור מעמיק של הטרנד — 3-4 משפטים בעברית, עם פרטים קונקרטיים>",
      "whyNow": "<למה הטרנד הזה חם דווקא עכשיו — עם נתון או אירוע ספציפי, משפט אחד בעברית>",
      "impact": "<מה ההשפעה של הטרנד על מפתחים ועל שוק העבודה הטכנולוגי — משפט אחד בעברית>",
      "tag": "<קטגוריה קצרה באנגלית: AI/ML | Web | Systems | DevOps | Security | Mobile | Data>"
    }
  ]
}

צור בדיוק 6 טרנדים. כיסוי נדרש:
1. טרנד בתחום AI/ML (כלי AI חדשים, מודלים, שימושים בפיתוח)
2. טרנד בתחום Web (פריימוורקים, ביצועים, סטנדרטים חדשים)
3. טרנד בתחום Systems / Backend
4. טרנד בתחום DevOps / Cloud
5. טרנד בתחום Security
6. טרנד נוסף חופשי (Mobile, Data, Open Source, או כל תחום מעניין אחר)

כל טרנד חייב להיות:
- עדכני ל-2026 ומבוסס על מציאות תעשייתית אמיתית
- עם תוכן עשיר ומפורט, לא כותרות ריקות
- כתוב בעברית מקצועית וזורמת
- בעל ערך מעשי לאנשי טכנולוגיה

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseTechPulse(content.text)
}
