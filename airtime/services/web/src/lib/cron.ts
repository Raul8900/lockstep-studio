/** Five-field cron expressions (minute hour day-of-month month day-of-week), as APScheduler reads them. */

const FIELDS: { name: string; min: number; max: number }[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12 },
  { name: 'day of week', min: 0, max: 7 },
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DOW_ALIASES: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

function validPart(part: string, min: number, max: number, dow: boolean): boolean {
  const [range, step, ...rest] = part.split('/')
  if (rest.length) return false
  if (step !== undefined && !/^\d+$/.test(step)) return false
  if (step !== undefined && Number(step) < 1) return false
  if (range === '*') return true
  const ends = range.split('-')
  if (ends.length > 2) return false
  const nums = ends.map((e) => {
    const lower = e.toLowerCase()
    if (dow && lower in DOW_ALIASES) return DOW_ALIASES[lower]
    return /^\d+$/.test(e) ? Number(e) : NaN
  })
  if (nums.some((n) => Number.isNaN(n) || n < min || n > max)) return false
  return nums.length === 1 || nums[0] <= nums[1]
}

/** Returns an error message, or null when the expression is valid. */
export function cronError(expr: string): string | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Use five fields: minute hour day month weekday'
  for (let i = 0; i < 5; i++) {
    const f = FIELDS[i]
    const ok = parts[i].split(',').every((p) => p !== '' && validPart(p, f.min, f.max, i === 4))
    if (!ok) return `The ${f.name} field "${parts[i]}" is not valid`
  }
  return null
}

const pad = (n: number) => String(n).padStart(2, '0')
const isInt = (s: string) => /^\d+$/.test(s)

/** A plain-English reading of the common shapes; null when it would take more than a phrase. */
export function describeCron(expr: string): string | null {
  if (cronError(expr)) return null
  const [m, h, dom, mon, dow] = expr.trim().split(/\s+/)
  const everyDay = dom === '*' && mon === '*' && dow === '*'
  if (everyDay && isInt(m) && isInt(h)) return `Every day at ${pad(Number(h))}:${pad(Number(m))}`
  if (everyDay && isInt(m) && /^\*\/\d+$/.test(h)) {
    const n = Number(h.slice(2))
    return n === 1 ? `Every hour at :${pad(Number(m))}` : `Every ${n} hours at :${pad(Number(m))}`
  }
  if (everyDay && isInt(m) && h === '*') return `Every hour at :${pad(Number(m))}`
  if (everyDay && /^\*\/\d+$/.test(m) && h === '*') return `Every ${Number(m.slice(2))} minutes`
  if (everyDay && isInt(m) && /^\d+(,\d+)+$/.test(h)) {
    return `Every day at ${h
      .split(',')
      .map((x) => `${pad(Number(x))}:${pad(Number(m))}`)
      .join(', ')}`
  }
  if (dom === '*' && mon === '*' && isInt(m) && isInt(h)) {
    const day = isInt(dow) ? Number(dow) : DOW_ALIASES[dow.toLowerCase()]
    if (day !== undefined) return `Every ${DAY_NAMES[day]} at ${pad(Number(h))}:${pad(Number(m))}`
  }
  return null
}
