'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState, useEffect } from 'react'
import { motion, useInView, useScroll, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  Network,
  Code2,
  TrendingUp,
  Briefcase,
  BookOpen,
  Check,
  X,
  Menu,
  Star,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type FeatureKey = 'resume' | 'linkedin' | 'github' | 'trends' | 'jobs' | 'learn'

type PricingFeatureKey =
  | 'resume_analysis'
  | 'linkedin_optimization'
  | 'github_analysis'
  | 'job_matching'
  | 'real_time_trends'
  | 'priority_support'
  | 'mock_interviews'
  | 'personal_roadmap'
  | 'linkedin_outreach'
  | 'unlimited_analyses'

type PlanKey = 'free' | 'pro' | 'elite'

type Step = { number: string; title: string; description: string }
type Testimonial = { name: string; role: string; text: string }

// ── Static data ────────────────────────────────────────────────────────────────

const FEATURE_ICONS: Record<FeatureKey, React.ComponentType<{ className?: string }>> = {
  resume: FileText,
  linkedin: Network,
  github: Code2,
  trends: TrendingUp,
  jobs: Briefcase,
  learn: BookOpen,
}

const FEATURE_KEYS: FeatureKey[] = ['resume', 'linkedin', 'github', 'trends', 'jobs', 'learn']

const PRICING_FEATURE_KEYS: PricingFeatureKey[] = [
  'resume_analysis',
  'linkedin_optimization',
  'github_analysis',
  'job_matching',
  'real_time_trends',
  'priority_support',
  'mock_interviews',
  'personal_roadmap',
  'linkedin_outreach',
  'unlimited_analyses',
]

const PLAN_KEYS: PlanKey[] = ['free', 'pro', 'elite']

const PLAN_FEATURES: Record<PlanKey, Record<PricingFeatureKey, boolean | string>> = {
  free: {
    resume_analysis: '3/חודש',
    linkedin_optimization: false,
    github_analysis: false,
    job_matching: false,
    real_time_trends: false,
    priority_support: false,
    mock_interviews: false,
    personal_roadmap: false,
    linkedin_outreach: false,
    unlimited_analyses: false,
  },
  pro: {
    resume_analysis: true,
    linkedin_optimization: true,
    github_analysis: true,
    job_matching: true,
    real_time_trends: true,
    priority_support: true,
    mock_interviews: false,
    personal_roadmap: false,
    linkedin_outreach: false,
    unlimited_analyses: true,
  },
  elite: {
    resume_analysis: true,
    linkedin_optimization: true,
    github_analysis: true,
    job_matching: true,
    real_time_trends: true,
    priority_support: true,
    mock_interviews: true,
    personal_roadmap: true,
    linkedin_outreach: true,
    unlimited_analyses: true,
  },
}

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-pink-500',
] as const

// Brand gradient style — shared across headings
const BRAND_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(90deg, #818CF8 0%, #60A5FA 50%, #22D3EE 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!isInView) return
    const duration = 1200
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * to))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, to])

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  )
}

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === false) {
    return (
      <div className="flex justify-center">
        <X className="w-4 h-4 text-gray-600" />
      </div>
    )
  }
  if (value === true) {
    return (
      <div className="flex justify-center">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
    )
  }
  return <div className="text-center text-xs text-gray-400">{value}</div>
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const t = useTranslations('landing')
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 60))

  // Raw array reads — typed as expected shapes
  const steps = t.raw('how_it_works.steps') as Step[]
  const testimonials = t.raw('social_proof.testimonials') as Testimonial[]

  // Explicit translation maps — avoids template-literal TS strictness
  const featureTitles: Record<FeatureKey, string> = {
    resume: t('features.resume.title'),
    linkedin: t('features.linkedin.title'),
    github: t('features.github.title'),
    trends: t('features.trends.title'),
    jobs: t('features.jobs.title'),
    learn: t('features.learn.title'),
  }

  const featureDescriptions: Record<FeatureKey, string> = {
    resume: t('features.resume.description'),
    linkedin: t('features.linkedin.description'),
    github: t('features.github.description'),
    trends: t('features.trends.description'),
    jobs: t('features.jobs.description'),
    learn: t('features.learn.description'),
  }

  const planTx: Record<PlanKey, { name: string; price: string; period: string; description: string; cta: string }> = {
    free: {
      name: t('pricing.plans.free.name'),
      price: t('pricing.plans.free.price'),
      period: t('pricing.plans.free.period'),
      description: t('pricing.plans.free.description'),
      cta: t('pricing.plans.free.cta'),
    },
    pro: {
      name: t('pricing.plans.pro.name'),
      price: t('pricing.plans.pro.price'),
      period: t('pricing.plans.pro.period'),
      description: t('pricing.plans.pro.description'),
      cta: t('pricing.plans.pro.cta'),
    },
    elite: {
      name: t('pricing.plans.elite.name'),
      price: t('pricing.plans.elite.price'),
      period: t('pricing.plans.elite.period'),
      description: t('pricing.plans.elite.description'),
      cta: t('pricing.plans.elite.cta'),
    },
  }

  const featureLabels: Record<PricingFeatureKey, string> = {
    resume_analysis: t('pricing.features_comparison.resume_analysis'),
    linkedin_optimization: t('pricing.features_comparison.linkedin_optimization'),
    github_analysis: t('pricing.features_comparison.github_analysis'),
    job_matching: t('pricing.features_comparison.job_matching'),
    real_time_trends: t('pricing.features_comparison.real_time_trends'),
    priority_support: t('pricing.features_comparison.priority_support'),
    mock_interviews: t('pricing.features_comparison.mock_interviews'),
    personal_roadmap: t('pricing.features_comparison.personal_roadmap'),
    linkedin_outreach: t('pricing.features_comparison.linkedin_outreach'),
    unlimited_analyses: t('pricing.features_comparison.unlimited_analyses'),
  }

  const statRows = [
    { to: 2400, suffix: '+', label: t('social_proof.stat_students') },
    { to: 89, suffix: '%', label: t('social_proof.stat_improvement') },
    { to: null as null, staticVal: '4.9/5', label: t('social_proof.stat_rating') },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'oklch(0.08 0.018 264)' }}>

      {/* ── Ambient background blobs ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(79,70,229,0.20) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -left-40 w-[450px] h-[450px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        <div
          className="absolute -bottom-80 -left-40 w-[650px] h-[650px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-white/5' : ''
        }`}
        style={
          scrolled
            ? { background: 'rgba(8,6,20,0.88)', backdropFilter: 'blur(16px)' }
            : {}
        }
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo — first child appears on RIGHT in RTL */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/30">
              L
            </div>
            <span className="font-black text-lg" style={BRAND_GRADIENT}>
              LaunchPad
            </span>
          </div>

          {/* Desktop nav links — centre */}
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">
              {t('nav.pricing')}
            </a>
          </div>

          {/* Auth buttons — left in RTL */}
          <div className="flex items-center gap-3">
            <Link
              href="/he/login"
              className="hidden md:block text-sm text-gray-400 hover:text-white transition-colors duration-200 px-3 py-2"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/he/register"
              className="hidden md:inline-flex items-center text-sm font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-full px-5 py-2.5 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              {t('nav.signup')}
            </Link>
            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="תפריט"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {menuOpen && (
          <div
            className="md:hidden border-b border-white/5 px-6 pb-6 flex flex-col gap-3"
            style={{ background: 'rgba(8,6,20,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <a
              href="#features"
              className="text-gray-300 hover:text-white py-2 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.features')}
            </a>
            <a
              href="#pricing"
              className="text-gray-300 hover:text-white py-2 text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.pricing')}
            </a>
            <Link href="/he/login" className="text-gray-300 hover:text-white py-2 text-sm">
              {t('nav.login')}
            </Link>
            <Link
              href="/he/register"
              className="mt-1 text-center font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full px-6 py-3 text-sm shadow-lg shadow-indigo-500/25"
            >
              {t('nav.signup')}
            </Link>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
        {/* Badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border"
          style={{
            background: 'rgba(79,70,229,0.1)',
            borderColor: 'rgba(79,70,229,0.35)',
            color: '#A5B4FC',
            boxShadow: '0 0 20px rgba(79,70,229,0.15)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t('hero.badge')}
        </motion.div>

        {/* H1 — full gradient for maximum impact */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6"
          style={{
            background: 'linear-gradient(135deg, #ffffff 25%, #818CF8 60%, #22D3EE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {t('hero.headline')}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          {t('hero.subheadline')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/he/register"
            className="inline-flex items-center gap-2 font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-full px-8 py-3.5 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
          >
            {t('hero.cta_primary')}
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center font-medium text-sm text-gray-300 hover:text-white border border-white/10 hover:border-white/25 rounded-full px-8 py-3.5 transition-all duration-200 hover:bg-white/5"
          >
            {t('hero.cta_secondary')}
          </a>
        </motion.div>

        {/* Trust line with avatar stack + stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.52 }}
          className="flex items-center justify-center gap-3 text-sm text-gray-500"
        >
          {/* Avatar stack */}
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {AVATAR_GRADIENTS.map((g, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} border-2`}
                style={{ borderColor: 'oklch(0.08 0.018 264)' }}
              />
            ))}
          </div>
          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span>{t('hero.trust')}</span>
        </motion.div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4" style={BRAND_GRADIENT}>
            {t('features.section_title')}
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
            {t('features.section_subtitle')}
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[key]
            return (
              <FadeUp key={key} delay={i * 0.1}>
                <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-shadow duration-300">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-white">{featureTitles[key]}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{featureDescriptions[key]}</p>
                </div>
              </FadeUp>
            )
          })}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {t('how_it_works.section_title')}
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <FadeUp key={i} delay={i * 0.15}>
              <div className="relative text-center">
                {/* Huge gradient numeral — decorative background */}
                <div
                  className="text-9xl font-black select-none leading-none mb-2"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(79,70,229,0.30) 0%, rgba(59,130,246,0.12) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {step.number}
                </div>
                {/* Card — overlaps the numeral */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 -mt-10 relative">
                  <h3 className="font-bold text-lg text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
                {/* Dashed connector between steps */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-10 -left-5 w-10 border-t border-dashed border-white/10"
                    aria-hidden
                  />
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Social Proof ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {t('social_proof.section_title')}
          </h2>
        </FadeUp>

        {/* Stats strip — count-up on scroll */}
        <FadeUp>
          <div className="grid grid-cols-3 gap-4 mb-12">
            {statRows.map((stat, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center"
              >
                <div className="text-3xl font-black mb-1" style={{ color: '#818CF8' }}>
                  {stat.to !== null ? (
                    <CountUp to={stat.to} suffix={stat.suffix} />
                  ) : (
                    stat.staticVal
                  )}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((item, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-5">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="border-t border-white/5 pt-4">
                  <div className="font-semibold text-white text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.role}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <FadeUp className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {t('pricing.section_title')}
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
            {t('pricing.section_subtitle')}
          </p>
        </FadeUp>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-start">
          {PLAN_KEYS.map((plan, i) => {
            const isPro = plan === 'pro'
            const data = planTx[plan]

            return (
              <FadeUp key={plan} delay={i * 0.1}>
                <div
                  className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-300 ${
                    isPro
                      ? 'scale-[1.02]'
                      : 'bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  style={
                    isPro
                      ? {
                          background: 'rgba(79,70,229,0.09)',
                          backdropFilter: 'blur(16px)',
                          borderColor: 'rgba(99,102,241,0.45)',
                          boxShadow:
                            '0 0 0 2px rgba(99,102,241,0.35), 0 25px 60px rgba(79,70,229,0.18)',
                        }
                      : {}
                  }
                >
                  {isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                      <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                        {t('pricing.popular_badge')}
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-8">
                    <h3 className="font-black text-xl text-white mb-2">{data.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-4xl font-black text-white">{data.price}</span>
                      <span className="text-gray-400 text-sm">/{data.period}</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{data.description}</p>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    <Link
                      href="/he/register"
                      className={`block text-center font-semibold rounded-full px-6 py-3 text-sm transition-all duration-200 ${
                        isPro
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.02]'
                          : 'border border-white/15 hover:border-white/30 text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {data.cta}
                    </Link>
                  </div>
                </div>
              </FadeUp>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <FadeUp>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-4 border-b border-white/10">
              <div className="p-4 text-sm font-semibold text-gray-500">יכולת</div>
              {PLAN_KEYS.map((plan) => (
                <div
                  key={plan}
                  className={`p-4 text-center text-sm font-bold ${
                    plan === 'pro' ? 'text-indigo-400 bg-indigo-500/5' : 'text-gray-300'
                  }`}
                >
                  {planTx[plan].name}
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {PRICING_FEATURE_KEYS.map((feat, i) => (
              <div
                key={feat}
                className={`grid grid-cols-4 border-b border-white/5 last:border-0 ${
                  i % 2 !== 0 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <div className="p-4 text-sm text-gray-400">{featureLabels[feat]}</div>
                {PLAN_KEYS.map((plan) => (
                  <div key={plan} className={`p-4 ${plan === 'pro' ? 'bg-indigo-500/5' : ''}`}>
                    <FeatureCell value={PLAN_FEATURES[plan][feat]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-32">
        <FadeUp>
          <div
            className="relative rounded-3xl p-14 text-center overflow-hidden border"
            style={{
              background:
                'linear-gradient(135deg, rgba(79,70,229,0.18) 0%, rgba(59,130,246,0.12) 60%, rgba(6,182,212,0.08) 100%)',
              borderColor: 'rgba(79,70,229,0.30)',
            }}
          >
            {/* Top radial bloom */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 70% 55% at 50% -5%, rgba(79,70,229,0.32), transparent)',
              }}
              aria-hidden
            />
            <h2 className="relative text-3xl md:text-4xl font-black text-white mb-4">
              {t('cta_banner.headline')}
            </h2>
            <p className="relative text-gray-400 mb-10 max-w-md mx-auto text-base leading-relaxed">
              {t('cta_banner.subheadline')}
            </p>
            <Link
              href="/he/register"
              className="relative inline-flex items-center gap-2 font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-full px-10 py-4 shadow-2xl shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            >
              {t('cta_banner.button')}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-500/20">
              L
            </div>
            <span className="font-black text-base" style={BRAND_GRADIENT}>
              LaunchPad
            </span>
          </div>
          <p className="text-sm text-gray-500">{t('footer.tagline')}</p>
          <p className="text-xs text-gray-600">{t('footer.copyright')}</p>
        </div>
      </footer>

    </div>
  )
}
