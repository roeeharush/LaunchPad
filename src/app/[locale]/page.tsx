import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function LandingPage() {
  const t = useTranslations('landing')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">{t('headline')}</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-xl">{t('subheadline')}</p>
      <div className="flex gap-4">
        <Link href="/register" className={buttonVariants({ size: 'lg' })}>
          {t('cta')}
        </Link>
        <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
          כניסה
        </Link>
      </div>
    </main>
  )
}
