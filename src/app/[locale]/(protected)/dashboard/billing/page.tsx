import { getTranslations } from 'next-intl/server'
import { Check, X, CreditCard, Zap } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FREE_FEATURES: { key: string; included: boolean | string }[] = [
  { key: 'resume_analysis', included: '3/חודש' },
  { key: 'linkedin_optimization', included: false },
  { key: 'github_analysis', included: false },
  { key: 'job_matching', included: false },
]

const PRO_FEATURES: { key: string }[] = [
  { key: 'resume_analysis' },
  { key: 'linkedin_optimization' },
  { key: 'github_analysis' },
  { key: 'job_matching' },
  { key: 'real_time_trends' },
  { key: 'priority_support' },
  { key: 'mock_interviews' },
]

const FEATURE_LABELS: Record<string, string> = {
  resume_analysis: 'ניתוח קורות חיים',
  linkedin_optimization: 'אופטימיזציית LinkedIn',
  github_analysis: 'ניתוח GitHub',
  job_matching: 'התאמת משרות עם AI',
  real_time_trends: 'טרנדים בזמן אמת',
  priority_support: 'תמיכה מועדפת',
  mock_interviews: 'ראיונות מדומים',
}

const INDIGO = 'oklch(0.585 0.212 264.4)'
const TEAL = 'oklch(0.60 0.17 162)'

export default async function BillingPage() {
  const t = await getTranslations('billing')

  return (
    <div className="min-h-screen bg-ambient">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <CreditCard className="w-4 h-4" style={{ color: INDIGO }} />
          <span>{t('title')}</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          {t('title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Current plan — Free */}
        <div
          className="rounded-2xl p-6 border flex flex-col"
          style={{ background: 'var(--card)', borderColor: INDIGO.replace(')', ' / 25%)') }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">{t('currentPlan')}</h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ background: INDIGO.replace(')', ' / 20%)'), color: INDIGO }}
            >
              {t('free')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{t('freePlanDesc')}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('included')}
          </p>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map(({ key, included }) => (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                {included !== false ? (
                  <Check className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                ) : (
                  <X className="w-4 h-4 shrink-0 opacity-30" />
                )}
                <span className={included === false ? 'opacity-30' : ''}>
                  {FEATURE_LABELS[key]}
                  {typeof included === 'string' && ` (${included})`}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade — Pro */}
        <div
          className="rounded-2xl p-6 border flex flex-col"
          style={{
            background: INDIGO.replace(')', ' / 8%)'),
            borderColor: INDIGO.replace(')', ' / 40%)'),
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">Pro</h2>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold text-white"
              style={{ background: INDIGO }}
            >
              ₪49/חודש
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-5">{t('upgradeDesc')}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('features')}
          </p>
          <ul className="space-y-2.5 mb-6 flex-1">
            {PRO_FEATURES.map(({ key }) => (
              <li key={key} className="flex items-center gap-2.5 text-sm">
                <Check className="w-4 h-4 shrink-0" style={{ color: INDIGO }} />
                <span>{FEATURE_LABELS[key]}</span>
              </li>
            ))}
          </ul>
          <a
            href="mailto:support@launchpad.co.il?subject=Upgrade to Pro"
            className={cn(
              buttonVariants({ size: 'default' }),
              'w-full gap-2 justify-center font-semibold text-white'
            )}
            style={{ background: INDIGO }}
          >
            <Zap className="w-4 h-4" />
            {t('upgradeButton')}
          </a>
        </div>
      </div>
    </div>
  )
}
