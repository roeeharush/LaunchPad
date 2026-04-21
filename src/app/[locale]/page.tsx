import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  FileText,
  User,
  TrendingUp,
  Briefcase,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: FileText,
    key: 'resume',
    color: 'oklch(0.585 0.212 264.4)',
    bg: 'oklch(0.585 0.212 264.4 / 12%)',
  },
  {
    icon: User,
    key: 'profile',
    color: 'oklch(0.58 0.21 291)',
    bg: 'oklch(0.58 0.21 291 / 12%)',
  },
  {
    icon: TrendingUp,
    key: 'trends',
    color: 'oklch(0.60 0.17 162)',
    bg: 'oklch(0.60 0.17 162 / 12%)',
  },
  {
    icon: Briefcase,
    key: 'jobs',
    color: 'oklch(0.75 0.16 60)',
    bg: 'oklch(0.75 0.16 60 / 12%)',
  },
  {
    icon: BookOpen,
    key: 'learn',
    color: 'oklch(0.65 0.15 211)',
    bg: 'oklch(0.65 0.15 211 / 12%)',
  },
  {
    icon: Sparkles,
    key: 'resume',
    color: 'oklch(0.585 0.212 264.4)',
    bg: 'oklch(0.585 0.212 264.4 / 12%)',
  },
] as const

const stats = [
  { value: '94%', label: 'מהסטודנטים שיפרו את הציון שלהם' },
  { value: '3×', label: 'יותר ראיונות עבודה לאחר השימוש' },
  { value: '2 דק׳', label: 'זמן ממוצע לקבלת ניתוח' },
]

export default function LandingPage() {
  const t = useTranslations('landing')

  return (
    <main className="min-h-screen bg-ambient overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full animate-float animate-pulse-glow"
          style={{
            background:
              'radial-gradient(circle, oklch(0.585 0.212 264.4 / 18%), oklch(0.585 0.212 264.4 / 0%) 70%)',
            filter: 'blur(1px)',
          }}
        />
        <div
          className="absolute -bottom-60 -left-40 w-[500px] h-[500px] rounded-full animate-float-delayed animate-pulse-glow"
          style={{
            background:
              'radial-gradient(circle, oklch(0.58 0.21 291 / 12%), oklch(0.58 0.21 291 / 0%) 70%)',
            filter: 'blur(1px)',
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'oklch(0.585 0.212 264.4)' }}
          >
            L
          </div>
          <span className="font-bold text-lg tracking-tight">לאנצ׳פד</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/he/login"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-muted-foreground hover:text-foreground'
            )}
          >
            כניסה
          </Link>
          <Link
            href="/he/register"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25'
            )}
          >
            התחל בחינם
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-28 max-w-5xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border animate-fade-in"
          style={{
            background: 'oklch(0.585 0.212 264.4 / 12%)',
            borderColor: 'oklch(0.585 0.212 264.4 / 30%)',
            color: 'oklch(0.775 0.14 264)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          מופעל ע״י Claude AI
        </div>

        <h1
          className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-slide-up gradient-text-bright"
          style={{ animationDelay: '0.1s' }}
        >
          {t('headline')}
        </h1>

        <p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          {t('subheadline')}
        </p>

        <div
          className="flex flex-wrap items-center justify-center gap-4 animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Link
            href="/he/register"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30',
              'px-8 gap-2 text-base font-semibold',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]'
            )}
          >
            {t('cta')}
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/he/login"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-border/60 hover:border-primary/50 hover:bg-accent',
              'px-8 text-base font-medium',
              'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]'
            )}
          >
            כניסה לחשבון קיים
          </Link>
        </div>

        {/* Trust row */}
        <div
          className="flex items-center gap-6 mt-12 text-muted-foreground text-sm animate-fade-in"
          style={{ animationDelay: '0.5s' }}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" style={{ color: 'oklch(0.60 0.17 162)' }} />
            ללא כרטיס אשראי
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" style={{ color: 'oklch(0.75 0.16 60)' }} />
            ניתוח תוך שניות
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" style={{ color: 'oklch(0.585 0.212 264.4)' }} />
            Claude AI
          </span>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center card-hover glow-indigo">
              <div
                className="text-3xl font-extrabold mb-2"
                style={{ color: 'oklch(0.775 0.14 264)' }}
              >
                {value}
              </div>
              <div className="text-sm text-muted-foreground leading-snug">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <h2 className="text-3xl font-bold text-center mb-3">הכלים שישנו את החיפוש שלך</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          חמישה כלים מבוססי AI שפועלים יחד כדי לתת לך יתרון אמיתי בשוק העבודה
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, key, color, bg }, i) => (
            <div
              key={`${key}-${i}`}
              className="glass rounded-2xl p-6 card-hover border border-border/50"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{t(`features.${key}`)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                ניתוח מעמיק ומותאם אישית עם המלצות ממוקדות
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden border"
          style={{
            background:
              'linear-gradient(135deg, oklch(0.585 0.212 264.4 / 15%), oklch(0.58 0.21 291 / 10%))',
            borderColor: 'oklch(0.585 0.212 264.4 / 30%)',
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background:
                'radial-gradient(ellipse 60% 60% at 50% 0%, oklch(0.585 0.212 264.4 / 15%), transparent)',
            }}
            aria-hidden
          />
          <h2 className="relative text-3xl font-extrabold mb-4 gradient-text-bright">
            מוכן לבלוט מבין האחרים?
          </h2>
          <p className="relative text-muted-foreground mb-8 max-w-md mx-auto">
            הצטרף לסטודנטים שכבר משתמשים בלאנצ׳פד כדי לנחות את העבודה הראשונה שלהם
          </p>
          <Link
            href="/he/register"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'relative bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30',
              'px-10 gap-2 font-semibold',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]'
            )}
          >
            התחל בחינם עכשיו
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
