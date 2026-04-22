import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData } from '@/types/profile'
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
    !('username' in parsed) ||
    !('topLanguages' in parsed) ||
    !('trends' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as TechPulse
}

export async function generateTechPulse(githubData: GitHubProfileData): Promise<TechPulse> {
  const topLanguages = Object.keys(githubData.topLanguages).slice(0, 5)
  const topRepoNames = githubData.topRepos
    .slice(0, 3)
    .map((r) => r.name)
    .join(', ')

  const prompt = `אתה מומחה טכנולוגיה ומדריך קריירה בתעשיית ההייטק. צור עבור המפתח דוח טרנדים יומי מותאם אישית.

פרטי המפתח:
- שם משתמש GitHub: ${githubData.login}
- שפות תכנות עיקריות: ${topLanguages.join(', ') || 'לא ידוע'}
- פרויקטים בולטים: ${topRepoNames || 'לא ידוע'}

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "username": "${githubData.login}",
  "topLanguages": ${JSON.stringify(topLanguages)},
  "trends": [
    {
      "title": "<שם הטרנד, בעברית, קצר וברור>",
      "summary": "<תיאור קצר של הטרנד — 2-3 משפטים בעברית>",
      "whyNow": "<למה הטרנד הזה חם דווקא עכשיו — משפט אחד בעברית>",
      "relevance": "<למה הטרנד רלוונטי למפתח הזה עם השפות שלו — משפט אחד בעברית>",
      "tag": "<קטגוריה קצרה באנגלית: AI/ML | Web | Systems | DevOps | Security | Mobile | Data>"
    }
  ]
}

צור בדיוק 3 טרנדים. כל טרנד חייב להיות:
1. רלוונטי לשפות התכנות של המפתח
2. חדש ומעניין ב-2026
3. בעל ערך מעשי לחיפוש עבודה

החזר JSON בלבד.`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseTechPulse(content.text)
}
