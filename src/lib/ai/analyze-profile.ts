import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData, ProfileAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseProfileAnalysis(raw: string): ProfileAnalysis {
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
    !('techScore' in parsed) ||
    !('professionalScore' in parsed) ||
    !('overallBrandScore' in parsed) ||
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as ProfileAnalysis
}

export async function analyzeProfile(
  githubData: GitHubProfileData,
  linkedinText: string
): Promise<ProfileAnalysis> {
  const githubSummary = JSON.stringify(
    {
      username: githubData.login,
      name: githubData.name,
      bio: githubData.bio,
      publicRepos: githubData.public_repos,
      followers: githubData.followers,
      topLanguages: githubData.topLanguages,
      topRepos: githubData.topRepos.slice(0, 5).map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
      })),
    },
    null,
    2
  )

  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את הנוכחות המקצועית של המועמד ב-GitHub וב-LinkedIn.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "techScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל הטכני ב-GitHub>,
    "strengths": [<2-3 נקודות חוזק טכניות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור הפרופיל הטכני, בעברית>]
  },
  "professionalScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל המקצועי ב-LinkedIn>,
    "strengths": [<2-3 נקודות חוזק מקצועיות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור פרופיל ה-LinkedIn, בעברית>]
  },
  "overallBrandScore": <ממוצע משוקלל 0-100 של שני הציונים — GitHub 60%, LinkedIn 40%>,
  "topTips": [<3-5 פעולות עדיפות שיגדילו הכי הרבה את הסיכוי להתגלות ע"י מגייסים, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד GitHub (techScore):
- מגוון שפות ופרויקטים: עד 30 נק׳
- כוכבים ופורקים: עד 25 נק׳
- מספר ריפוזיטוריז ציבוריים: עד 20 נק׳
- ביוגרפיה ושם מלא: עד 15 נק׳
- עדכניות (פרויקטים ב-12 חודשים האחרונים): עד 10 נק׳

קריטריוני ניקוד LinkedIn (professionalScore):
- פירוט ניסיון עבודה: עד 35 נק׳
- כישורים טכניים (keywords): עד 30 נק׳
- About section מושכת: עד 20 נק׳
- הישגים מדידים: עד 15 נק׳

נתוני GitHub:
---
${githubSummary}
---

טקסט LinkedIn (About / Experience שהמועמד הדביק):
---
${linkedinText.slice(0, 3000)}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseProfileAnalysis(content.text)
}
