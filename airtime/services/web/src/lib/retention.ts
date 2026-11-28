import type { RetentionPoint, ScriptLine } from '../api/types'

export interface RetentionSample {
  /** Seconds into the video. */
  t: number
  /** Audience still watching, in percent of starts (can exceed 100 with rewatches). */
  pct: number
}

/** Retention points (t_ratio, audience_watch_ratio) on a seconds axis. */
export function retentionSeries(points: RetentionPoint[], durationS: number): RetentionSample[] {
  return [...points]
    .filter((p) => Number.isFinite(p.t_ratio) && Number.isFinite(p.audience_watch_ratio))
    .sort((a, b) => a.t_ratio - b.t_ratio)
    .map((p) => ({ t: round(p.t_ratio * durationS, 2), pct: round(p.audience_watch_ratio * 100, 1) }))
}

function round(n: number, d: number) {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/** Linear interpolation of retention at time t (clamped to the ends). */
export function retentionAt(series: RetentionSample[], t: number): number | null {
  if (!series.length) return null
  if (t <= series[0].t) return series[0].pct
  const last = series[series.length - 1]
  if (t >= last.t) return last.pct
  let lo = 0
  let hi = series.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (series[mid].t <= t) lo = mid
    else hi = mid
  }
  const a = series[lo]
  const b = series[hi]
  const f = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
  return a.pct + (b.pct - a.pct) * f
}

/** The script line being spoken at time t (the last one that started, if t falls in a pause). */
export function lineAt(lines: ScriptLine[], t: number): ScriptLine | null {
  let found: ScriptLine | null = null
  for (const l of lines) {
    if (l.start_s <= t) {
      if (t < l.end_s) return l
      found = l
    }
  }
  return found
}

export interface LineRetention {
  line: ScriptLine
  start: number | null
  end: number | null
  /** Points lost across the line (negative = viewers left). */
  delta: number | null
  /** Points lost per second while the line plays. */
  rate: number | null
}

export function lineRetention(lines: ScriptLine[], series: RetentionSample[]): LineRetention[] {
  return lines.map((line) => {
    const start = retentionAt(series, line.start_s)
    const end = retentionAt(series, line.end_s)
    const delta = start !== null && end !== null ? round(end - start, 1) : null
    const len = Math.max(0.1, line.end_s - line.start_s)
    return { line, start, end, delta, rate: delta === null ? null : round(delta / len, 2) }
  })
}

/** The n lines that lose the most viewers per second, worst first (ignoring the first-second swipe). */
export function worstLines(rows: LineRetention[], n = 3): LineRetention[] {
  return rows
    .filter((r) => r.rate !== null && r.line.start_s >= 1 && (r.delta ?? 0) < 0)
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))
    .slice(0, n)
}
