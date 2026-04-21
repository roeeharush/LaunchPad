import Anthropic from '@anthropic-ai/sdk'
import type { ResumeMatchAnalysis } from '@/types/resume'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseAnalysisResponse(raw: string): ResumeMatchAnalysis {
  // Strip markdown code fences if Claude wraps in ```json
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
    !('matchPercentage' in parsed) ||
    !('strengths' in parsed) ||
    !('gaps' in parsed) ||
    !('tips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as ResumeMatchAnalysis
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<ResumeMatchAnalysis> {
  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את קורות החיים ביחס למשרה המבוקשת.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "matchPercentage": <מספר שלם 0-100 המייצג כמה קורות החיים מתאים למשרה>,
  "strengths": [<3-5 נקודות חוזק של המועמד ביחס למשרה, בעברית>],
  "gaps": [<3-5 כישורים חסרים או פערים ביחס לדרישות המשרה, בעברית>],
  "tips": [<3-5 טיפים קונקרטיים לשיפור קורות החיים למשרה זו, בעברית>]
}

קורות החיים:
---
${resumeText.slice(0, 6000)}
---

תיאור המשרה:
---
${jobDescription.slice(0, 3000)}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseAnalysisResponse(content.text)
}
