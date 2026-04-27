import Anthropic from '@anthropic-ai/sdk'
import type { GitHubProfileData, GitHubAnalysis } from '@/types/profile'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic()
  return _client
}

export function parseGitHubAnalysis(raw: string): GitHubAnalysis {
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
    !('topTips' in parsed)
  ) {
    throw new Error('מבנה תשובת ה-AI שגוי — חסרים שדות נדרשים')
  }

  return parsed as GitHubAnalysis
}

export async function analyzeGitHub(githubData: GitHubProfileData): Promise<GitHubAnalysis> {
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

  const prompt = `אתה מומחה גיוס בתעשיית ההייטק הישראלית. נתח את פרופיל ה-GitHub של המועמד.

החזר אך ורק JSON תקני בפורמט הבא, ללא טקסט נוסף:
{
  "techScore": {
    "score": <מספר שלם 0-100 — חוזק הפרופיל הטכני>,
    "strengths": [<2-3 נקודות חוזק טכניות קצרות, בעברית>],
    "improvements": [<2-3 המלצות לשיפור הפרופיל הטכני, בעברית>]
  },
  "topTips": [<3-5 פעולות עדיפות לשיפור הפרופיל, בעברית, ממוינות לפי השפעה>]
}

קריטריוני ניקוד (techScore):
- מגוון שפות ופרויקטים: עד 30 נק׳
- כוכבים ופורקים: עד 25 נק׳
- מספר ריפוזיטוריז ציבוריים: עד 20 נק׳
- ביוגרפיה ושם מלא: עד 15 נק׳
- עדכניות (פרויקטים ב-12 חודשים האחרונים): עד 10 נק׳

נתוני GitHub:
---
${githubSummary}
---`

  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (!content || content.type !== 'text') throw new Error('תשובת Claude אינה טקסט')

  return parseGitHubAnalysis(content.text)
}
