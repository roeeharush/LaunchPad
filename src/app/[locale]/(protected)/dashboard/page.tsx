import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FileText, User, TrendingUp, Briefcase, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

const modules = [
  { href: '/resume', icon: FileText, titleKey: 'resume' },
  { href: '/profile', icon: User, titleKey: 'profile' },
  { href: '/trends', icon: TrendingUp, titleKey: 'trends' },
  { href: '/jobs', icon: Briefcase, titleKey: 'jobs' },
  { href: '/learn', icon: BookOpen, titleKey: 'learn' },
] as const

export default function DashboardPage() {
  const t = useTranslations()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('dashboard.welcome')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules.map(({ href, icon: Icon, titleKey }) => (
          <Card key={href} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {t(`nav.${titleKey}`)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">{t('dashboard.noAnalysis')}</p>
              <Link href={href} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                {t('dashboard.startNow')}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
