import type { GitHubRepo, GitHubProfileData } from '@/types/profile'

export function computeTopLanguages(repos: GitHubRepo[]): Record<string, number> {
  const langs: Record<string, number> = {}
  for (const repo of repos) {
    if (repo.language) {
      langs[repo.language] = (langs[repo.language] ?? 0) + 1
    }
  }
  return langs
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfileData> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=stars&per_page=10`,
      { headers }
    ),
  ])

  if (!userRes.ok) {
    if (userRes.status === 404) {
      throw new Error(`משתמש GitHub "${username}" לא נמצא`)
    }
    throw new Error(`שגיאה בגישה ל-GitHub API: ${userRes.status}`)
  }

  let user: {
    login: string
    name: string | null
    bio: string | null
    public_repos: number
    followers: number
  }
  try {
    user = (await userRes.json()) as typeof user
  } catch {
    throw new Error('שגיאה בפענוח תשובת GitHub API')
  }

  // Repos fetch is best-effort: if it fails, Claude grades from user profile data alone
  const rawRepos: Array<{
    name: string
    description: string | null
    stargazers_count: number
    forks_count: number
    language: string | null
    updated_at: string
  }> = reposRes.ok ? ((await reposRes.json()) as typeof rawRepos) : []

  const topRepos: GitHubRepo[] = rawRepos.map((r) => ({
    name: r.name,
    description: r.description,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    language: r.language,
    updated_at: r.updated_at,
  }))

  return {
    login: user.login,
    name: user.name ?? null,
    bio: user.bio ?? null,
    public_repos: user.public_repos,
    followers: user.followers,
    topLanguages: computeTopLanguages(topRepos),
    topRepos,
  }
}
