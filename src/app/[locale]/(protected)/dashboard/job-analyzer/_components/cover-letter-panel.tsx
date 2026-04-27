'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CoverLetterPanelProps {
  coverLetterHe: string
  coverLetterEn: string
}

export function CoverLetterPanel({ coverLetterHe, coverLetterEn }: CoverLetterPanelProps) {
  const [lang, setLang] = useState<'he' | 'en'>('he')
  const [copied, setCopied] = useState(false)

  const currentLetter = lang === 'he' ? coverLetterHe : coverLetterEn

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard not available — silently ignore
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: language toggle + copy */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Language toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 10%)' }}
        >
          {(['he', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                lang === l ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              style={
                lang === l
                  ? {
                      background: 'oklch(0.58 0.21 291 / 18%)',
                      color: 'oklch(0.72 0.18 291)',
                    }
                  : {}
              }
            >
              {l === 'he' ? 'עברית' : 'English'}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-sm font-medium transition-all duration-150',
            copied ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          style={copied ? { color: 'oklch(0.60 0.17 162)' } : {}}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'הועתק!' : 'העתק'}
        </button>
      </div>

      {/* Hebrew default badge */}
      <p className="text-xs text-muted-foreground">
        ברירת מחדל: עברית | האנגלית זמינה דרך הכפתור למעלה
      </p>

      {/* Letter body */}
      <div
        className="rounded-2xl border p-6 text-sm leading-relaxed whitespace-pre-wrap"
        dir={lang === 'he' ? 'rtl' : 'ltr'}
        style={{
          background: 'var(--card)',
          borderColor: 'oklch(0.58 0.21 291 / 20%)',
          color: 'oklch(0.88 0.008 252)',
          fontFamily: lang === 'en' ? 'ui-serif, Georgia, serif' : 'inherit',
        }}
      >
        {currentLetter}
      </div>
    </div>
  )
}
