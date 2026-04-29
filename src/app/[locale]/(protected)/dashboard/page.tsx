import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
  FileText,
  GitBranch,
  Link2,
  Briefcase,
  ArrowLeft,
  Target,
  TrendingUp,
  Folder,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [resumesRes, profileRes, jobsRes] = await Promise.all([
    supabase
      .from('resumes')
      .select('score')
      .eq('user_id', user!.id)
      .not('analysis_json', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase.from('profile_analyses').select('type').eq('user_id', user!.id),
    supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
  ])

  const latestResume = resumesRes.data?.[0] ?? null
  const profileAnalyses = profileRes.data ?? []
  const jobCount = jobsRes.count ?? 0
  const analysisCount = profileAnalyses.length + (latestResume ? 1 : 0)

  const hasResume = latestResume !== null
  const hasLinkedIn = profileAnalyses.some((a) => a.type === 'linkedin')
  const hasGitHub = profileAnalyses.some((a) => a.type === 'github')

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? 'מחובר'

  type StepIcon = typeof FileText
  type NextStep = { labelKey: string; descKey: string; href: string; color: string; icon: StepIcon }

  const allNextSteps: NextStep[] = [
    {
      labelKey: 'stepUploadResume',
      descKey: 'stepUploadResumeDesc',
      href: '/dashboard/resume-analyzer',
      color: 'oklch(0.585 0.212 264.4)',
      icon: FileText,
    },
    {
      labelKey: 'stepLinkedIn',
      descKey: 'stepLinkedInDesc',
      href: '/dashboard/linkedin-grader',
      color: 'oklch(0.58 0.21 291)',
      icon: Link2,
    },
    {
      labelKey: 'stepGitHub',
      descKey: 'stepGitHubDesc',
      href: '/dashboard/github-grader',
      color: 'oklch(0.58 0.21 291)',
      icon: GitBranch,
    },
    {
      labelKey: 'stepFindJobs',
      descKey: 'stepFindJobsDesc',
      href: '/dashboard/job-search',
      color: 'oklch(0.75 0.16 60)',
      icon: Briefcase,
    },
  ]

  const nextSteps = allNextSteps
    .filter(({ href }) => {
      if (href.includes('resume-analyzer')) return !hasResume
      if (href.includes('linkedin-grader')) return !hasLinkedIn
      if (href.includes('github-grader')) return !hasGitHub
      if (href.includes('job-search')) return hasResume && jobCount === 0
      return false
    })
    .slice(0, 3)

  const stats = [
    {
      label: t('resumeScore'),
      value: latestResume?.score != null ? `${latestResume.score}/100` : t('noScore'),
      icon: Target,
      color: 'oklch(0.585 0.212 264.4)',
    },
    {
      label: t('analyses'),
      value: String(analysisCount),
      icon: TrendingUp,
      color: 'oklch(0.60 0.17 162)',
    },
    {
      label: t('applications'),
      value: String(jobCount),
      icon: Folder,
      color: 'oklch(0.75 0.16 60)',
    },
  ]

  return (
    <div className="min-h-screen bg-ambient">
      {/* Welcome header */}
      <div className="mb-10">
        <p className="text-muted-foreground text-sm mb-2">{t('readyToLaunch')}</p>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text-bright">
          {t('welcomeBack')}, {userName}!
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4 border flex flex-col gap-2"
            style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 20%)') }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: color.replace(')', ' / 15%)') }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Next steps */}
      {nextSteps.length > 0 ? (
        <div className="mb-10">
          <h2 className="text-base font-bold mb-4">{t('nextSteps')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {nextSteps.map(({ labelKey, descKey, href, color, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl p-4 border transition-all duration-150',
                  'card-hover no-underline'
                )}
                style={{ background: 'var(--card)', borderColor: color.replace(')', ' / 25%)') }}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color.replace(')', ' / 15%)') }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t(labelKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(descKey)}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="mb-10 rounded-2xl p-6 border text-center"
          style={{ background: 'var(--card)', borderColor: 'oklch(0.60 0.17 162 / 25%)' }}
        >
          <p className="font-bold text-base mb-1">{t('allDone')}</p>
          <p className="text-sm text-muted-foreground">{t('allDoneDesc')}</p>
        </div>
      )}

      <p className="text-muted-foreground text-xs text-center mt-12">
        כל הנתונים שלך מוגנים ומאובטחים ✦ LaunchPad
      </p>
    </div>
  )
}
