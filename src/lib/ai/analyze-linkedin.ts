import Anthropic from '@anthropic-ai/sdk'
import type { LinkedInAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseLinkedInAnalysis(raw: string): LinkedInAnalysis {
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
    !('professionalScore' in parsed) ||
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as LinkedInAnalysis
}

export async function analyzeLinkedIn(linkedinText: string): Promise<LinkedInAnalysis> {
  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את הפרופיל המקצועי מ-LinkedIn.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "professionalScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל המקצועי>,
    "strengths": [<2-3 נקודות חוזק מקצועיות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור הפרופיל המקצועי, בעברית>]
  },
  "topTips": [<3-5 פעולות עדיפות לשיפור הפרופיל, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד (professionalScore):
- סעיף About/Summary — כמה מקצועי ומשכנע: עד 30 נק׳
- ניסיון תעסוקתי מפורט עם הישגים מדידים: עד 25 נק׳
- מילות מפתח טכניות וניהוליות רלוונטיות: עד 20 נק׳
- כישורים (Skills) ו-Endorsements: עד 15 נק׳
- השכלה ופרסים: עד 10 נק׳

טקסט LinkedIn:
---
${linkedinText}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseLinkedInAnalysis(content.text)
}
