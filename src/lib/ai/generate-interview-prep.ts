import Anthropic from '@anthropic-ai/sdk'
import type { InterviewPrepResult } from '@/types/knowledge'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseInterviewPrep(raw: string): InterviewPrepResult {
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
    !('topic' in parsed) ||
    !('questions' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as InterviewPrepResult
}

export async function generateInterviewPrep(topic: string): Promise<InterviewPrepResult> {
  const prompt = `אתה מומחה ראיונות עבודה בתעשיית ההייטק הישראלית. צור 5 שאלות ראיון מקיפות עם תשובות מפורטות.

נושא הראיון: ${topic}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "topic": "${topic}",
  "questions": [
    {
      "question": "<שאלת ראיון ממוקדת בנושא — באנגלית או עברית לפי הנושא>",
      "answer": "<תשובה מפורטת ומדויקת — 2-4 משפטים>",
      "difficulty": "<easy | medium | hard>"
    }
  ]
}

הנחיות:
- צור בדיוק 5 שאלות
- הפצל: 1 שאלה קלה, 2 בינוניות, 2 קשות
- השאלות חייבות לבדוק הבנה אמיתית, לא זיכרון
- התשובות צריכות להיות מדויקות ופרקטיות
- אם הנושא טכני (React, SQL, etc.) — שאלות ותשובות באנגלית
- אם הנושא רך (System Design, Behavioral) — שאלות ותשובות בעברית

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseInterviewPrep(content.text)
}
