/** Number, time and name formatting. Everything takes null/undefined and returns an em dash for it. */

export const DASH = '—'

type Num = number | null | undefined

const isNum = (n: Num): n is number => typeof n === 'number' && Number.isFinite(n)

const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export function fmtInt(n: Num): string {
  return isNum(n) ? intFmt.format(n) : DASH
}

/** 1,284 / 12.9K / 4.2M: full under 10,000, compact above. */
export function fmtCompact(n: Num): string {
  if (!isNum(n)) return DASH
  return Math.abs(n) < 10_000 ? intFmt.format(n) : compactFmt.format(n)
}

export function fmtNumber(n: Num, digits = 1): string {
  if (!isNum(n)) return DASH
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n)
}

/** A value already in percent (62.4 → "62.4%"). */
export function fmtPct(n: Num, digits = 1): string {
  if (!isNum(n)) return DASH
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n)}%`
}

/** A ratio (0.624 → "62%"). */
export function fmtRatio(n: Num, digits = 0): string {
  return isNum(n) ? fmtPct(n * 100, digits) : DASH
}

export function fmtUsd(n: Num): string {
  if (!isNum(n)) return DASH
  const digits = Math.abs(n) < 100 ? 2 : 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)
}

export function fmtSigned(n: Num, digits = 0, suffix = ''): string {
  if (!isNum(n)) return DASH
  const s = new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Math.abs(n))
  return `${n > 0 ? '+' : n < 0 ? '−' : '±'}${s}${suffix}`
}

/** Seconds as a clock: 0:42, 3:05, 1:02:09. */
export function fmtClock(s: Num): string {
  if (!isNum(s)) return DASH
  const total = Math.max(0, Math.round(s))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const sec = total % 60
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Seconds with one decimal under a minute, for script timings: 3.4 s → "0:03.4". */
export function fmtTimecode(s: Num): string {
  if (!isNum(s)) return DASH
  const m = Math.floor(s / 60)
  const sec = s - m * 60
  return `${m}:${sec.toFixed(1).padStart(4, '0')}`
}

/** A duration in words: 42 s, 3 min 5 s, 2 h 10 min. */
export function fmtDuration(seconds: Num): string {
  if (!isNum(seconds)) return DASH
  const s = Math.round(seconds)
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`
}

export function fmtMs(ms: Num): string {
  return isNum(ms) ? fmtDuration(ms / 1000) : DASH
}

export function fmtTokens(n: Num): string {
  if (!isNum(n)) return DASH
  return n < 1000 ? intFmt.format(n) : compactFmt.format(n)
}

export function fmtBytesMb(mb: Num): string {
  if (!isNum(mb)) return DASH
  return mb >= 1024 ? `${fmtNumber(mb / 1024, 2)} GB` : `${fmtNumber(mb, 1)} MB`
}

// --- Dates --------------------------------------------------------------------------------------

export function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' })

/** "in 3 hr", "2 days ago", "now". */
export function fmtRelative(iso: string | null | undefined, now: Date = new Date()): string {
  const d = toDate(iso)
  if (!d) return DASH
  const diff = (d.getTime() - now.getTime()) / 1000
  const abs = Math.abs(diff)
  if (abs < 45) return 'now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86_400 * 30) return rtf.format(Math.round(diff / 86_400), 'day')
  if (abs < 86_400 * 365) return rtf.format(Math.round(diff / (86_400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86_400 * 365)), 'year')
}

/** "28 Nov, 14:05" in the viewer's zone (with the year when it isn't this year). */
export function fmtDateTime(iso: string | null | undefined, opts: { timeZone?: string } = {}): string {
  const d = toDate(iso)
  if (!d) return DASH
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: opts.timeZone,
  }).format(d)
}

export function fmtDate(iso: string | null | undefined): string {
  const d = toDate(iso)
  if (!d) return DASH
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric' }).format(d)
}

export function fmtTime(iso: string | null | undefined, timeZone?: string): string {
  const d = toDate(iso)
  if (!d) return DASH
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(d)
}

/** Whole days between now and a date (negative = past). */
export function daysFromNow(iso: string | null | undefined, now: Date = new Date()): number | null {
  const d = toDate(iso)
  return d ? (d.getTime() - now.getTime()) / 86_400_000 : null
}

// --- Names --------------------------------------------------------------------------------------

const regionNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
const languageNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'language' }) : null

export function countryName(code: string | null | undefined): string {
  if (!code) return DASH
  try {
    return regionNames?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

export function languageName(code: string | null | undefined): string {
  if (!code) return DASH
  try {
    return languageNames?.of(code) ?? code
  } catch {
    return code
  }
}

/** snake_case or dotted codes to a sentence: "upload_failed" → "Upload failed". */
export function humanize(code: string | null | undefined): string {
  if (!code) return DASH
  const s = code.replace(/[._-]+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function shortId(id: string | null | undefined, keep = 6): string {
  if (!id) return DASH
  const i = id.indexOf('_')
  if (i > 0 && id.length > i + keep + 1) return `${id.slice(0, i + 1)}…${id.slice(-keep)}`
  return id
}

export function shortCommit(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 8) : DASH
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${fmtInt(n)} ${n === 1 ? one : many}`
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
