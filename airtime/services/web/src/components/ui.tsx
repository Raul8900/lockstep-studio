/** The few building blocks every page uses. Plain markup with Tailwind and the colour roles in index.css. */
import type { UseQueryResult } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, CircleCheck, CircleDot, CircleX, Copy, Hand, Info, LoaderCircle, TriangleExclamationPoint } from 'lucide-react'
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { errorMessage, fileUrl } from '../api/client'
import { reasonMeta, stateMeta, type Tone } from '../lib/lifecycle'

export const cx = clsx

export const inputCls =
  'w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm outline-none placeholder:text-fg-3 focus:border-accent disabled:opacity-60'

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        {sub && <div className="mt-0.5 text-fg-2">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Card(props: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cx('min-w-0 rounded-lg border border-line bg-surface', props.className)}>
      {(props.title || props.actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <h2 className="text-[13px] font-semibold">{props.title}</h2>
          {props.actions && <div className="flex flex-wrap items-center gap-2">{props.actions}</div>}
        </header>
      )}
      <div className={props.flush ? '' : 'p-4'}>{props.children}</div>
    </section>
  )
}

const TONE_CLS: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-fg-2',
  progress: 'bg-accent-soft text-accent-ink',
  action: 'bg-accent text-on-accent',
  good: 'bg-good-soft text-good-ink',
  warn: 'bg-warn-soft text-warn-ink',
  bad: 'bg-bad-soft text-bad-ink',
  muted: 'bg-surface-2 text-fg-3',
}

const TONE_ICON: Partial<Record<Tone, typeof Info>> = {
  progress: LoaderCircle,
  action: Hand,
  good: CircleCheck,
  warn: TriangleExclamationPoint,
  bad: CircleX,
}

export function Badge({ tone = 'neutral', children, title, icon = false }: { tone?: Tone; children: ReactNode; title?: string; icon?: boolean }) {
  const Icon = icon ? (TONE_ICON[tone] ?? CircleDot) : null
  return (
    <span title={title} className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLS[tone])}>
      {Icon && <Icon aria-hidden className="size-3.5" />}
      {children}
    </span>
  )
}

/** A production state, with the needs_attention reason when there is one. Never colour alone: icon + label. */
export function StatePill({ state, reason }: { state: string; reason?: string | null }) {
  const m = stateMeta(state)
  const r = state === 'needs_attention' ? reasonMeta(reason) : null
  return (
    <Badge tone={m.tone} icon title={r?.description ?? m.hint}>
      {m.label}
      {r && <span className="font-normal">· {r.label}</span>}
    </Badge>
  )
}

type Variant = 'default' | 'primary' | 'danger' | 'ghost'
const VARIANT_CLS: Record<Variant, string> = {
  default: 'border border-line-strong bg-surface hover:bg-surface-2',
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  danger: 'border border-line-strong bg-surface text-bad-ink hover:bg-bad-soft',
  ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
}

export function Button({ variant = 'default', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLS[variant],
        className,
      )}
    />
  )
}

/**
 * A button for one lifecycle step (run research, revise, upload, …): it shows that it is working,
 * then "Done" or the error control returned, next to itself.
 */
export function ActionButton(props: {
  label: ReactNode
  run: () => Promise<unknown>
  confirm?: string
  variant?: Variant
  icon?: ReactNode
  disabled?: boolean
  title?: string
}) {
  const [state, setState] = useState<{ busy: boolean; msg?: string; ok?: boolean }>({ busy: false })
  const click = async () => {
    if (props.confirm && !window.confirm(props.confirm)) return
    setState({ busy: true })
    try {
      await props.run()
      setState({ busy: false, ok: true, msg: 'Done' })
      window.setTimeout(() => setState((s) => (s.ok ? { busy: false } : s)), 2500)
    } catch (err) {
      setState({ busy: false, ok: false, msg: errorMessage(err) })
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Button variant={props.variant} onClick={click} disabled={props.disabled || state.busy} title={props.title}>
        {state.busy ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : props.icon}
        {props.label}
      </Button>
      {state.msg && (
        <span role="status" className={cx('text-xs', state.ok ? 'text-good-ink' : 'text-bad-ink')}>
          {state.msg}
        </span>
      )}
    </span>
  )
}

export function Stat({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface px-4 py-3">
      <div className="truncate text-xs text-fg-2">{label}</div>
      <div className="mt-1 truncate text-xl font-semibold tabular">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-fg-3">{sub}</div>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-fg-3">{children}</p>
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-bad/40 bg-bad-soft px-4 py-3 text-bad-ink">
      <CircleX aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{errorMessage(error)}</span>
      {retry && (
        <Button variant="ghost" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-fg-3" role="status">
      <LoaderCircle aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  )
}

/** Renders a query's data, or its loading state or error. */
export function QueryView<T>({ q, children }: { q: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (q.isPending) return <Loading />
  if (q.isError) return <ErrorBox error={q.error} retry={() => void q.refetch()} />
  return <>{children(q.data)}</>
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard API needs a secure context; fall back to a hidden textarea.
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    window.setTimeout(() => setDone(false), 1500)
  }
  return (
    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={copy} aria-label={`${label}: copy to clipboard`}>
      {done ? <Check aria-hidden className="size-3.5 text-good-ink" /> : <Copy aria-hidden className="size-3.5" />}
      {done ? 'Copied' : label}
    </Button>
  )
}

/** Label/value rows. */
export function KV({ rows, className }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cx('grid grid-cols-[minmax(7rem,max-content)_1fr] gap-x-4 gap-y-1.5', className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-fg-2">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Tabs({ tabs }: { tabs: { to: string; label: ReactNode; end?: boolean }[] }) {
  return (
    <nav className="scrollbar-none -mx-4 mb-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" aria-label="Sections">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          replace
          className={({ isActive }) =>
            cx(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium',
              isActive ? 'border-accent text-fg' : 'border-transparent text-fg-2 hover:text-fg',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Field({ label, hint, error, children }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-fg-2">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-bad-ink">{error}</span> : hint && <span className="mt-1 block text-xs text-fg-3">{hint}</span>}
    </label>
  )
}

/** A meter for a 0–100 score (or any value against a max). */
export function Meter({ value, max = 100, tone = 'progress' }: { value: number | null | undefined; max?: number; tone?: 'progress' | 'good' | 'warn' | 'bad' }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100))
  const fill = { progress: 'bg-accent', good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' }[tone]
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden>
      <span className={cx('block h-full rounded-full', fill)} style={{ width: `${pct}%` }} />
    </span>
  )
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cx('break-all font-mono text-xs text-fg-2', className)}>{children}</code>
}

export function Pre({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre className={cx('max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-surface-2 p-3 font-mono text-xs leading-relaxed', className)}>
      {children}
    </pre>
  )
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent-ink hover:underline">
      {children}
    </a>
  )
}

/** A cut or upload preview from the data dir. With a poster nothing downloads until play is pressed. */
export function VideoPreview({ path, poster, className }: { path: string | null | undefined; poster?: string | null; className?: string }) {
  if (!path) return <div className={cx('grid aspect-[9/16] place-items-center rounded-md bg-surface-3 text-xs text-fg-3', className)}>No video yet</div>
  return (
    <video
      controls
      playsInline
      preload={poster ? 'none' : 'metadata'}
      poster={fileUrl(poster)}
      src={fileUrl(path)}
      className={cx('aspect-[9/16] w-full rounded-md bg-black object-contain', className)}
    />
  )
}

export function FileImage({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  if (!path) return null
  return <img src={fileUrl(path)} alt={alt} loading="lazy" className={cx('rounded-md border border-line bg-surface-3 object-cover', className)} />
}
