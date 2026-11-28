import { Link } from 'react-router'
import type { ProductionDetail, ProductionSummary } from '../api/types'
import { fmtNumber, fmtRelative } from '../lib/format'
import { STEPS, stepPosition } from '../lib/lifecycle'
import { cx, StatePill } from './ui'

/** Score colour: at or above the threshold is good, within 6 points is a warning, below is bad. */
export function scoreTone(score: number | null | undefined, threshold = 90) {
  if (score == null) return 'text-fg-3'
  return score >= threshold ? 'text-good-ink' : score >= threshold - 6 ? 'text-warn-ink' : 'text-bad-ink'
}

/** Brief → Produce → Score → Revise → Finalise → Upload → Live, with where this production is. */
export function LifecycleSteps({ p, compact }: { p: Pick<ProductionSummary, 'state' | 'attention_reason'> & { timeline?: ProductionDetail['timeline'] }; compact?: boolean }) {
  const pos = stepPosition(p)
  return (
    <ol className="flex w-full gap-1" aria-label="Lifecycle">
      {STEPS.map((label, i) => {
        const done = i < pos.index || (i === pos.index && pos.status === 'complete')
        const here = i === pos.index && pos.status !== 'complete'
        const bar = done
          ? 'bg-good'
          : here
            ? pos.status === 'stopped'
              ? p.state === 'needs_attention'
                ? 'bg-warn'
                : 'bg-bad'
              : pos.status === 'waiting'
                ? 'bg-accent'
                : 'bg-accent animate-pulse'
            : 'bg-surface-3'
        return (
          <li key={label} className="min-w-0 flex-1" aria-current={here ? 'step' : undefined}>
            <span className={cx('block h-1.5 rounded-full', bar)} />
            {!compact && <span className={cx('mt-1 block truncate text-[11px]', here ? 'font-medium text-fg' : 'text-fg-3')}>{label}</span>}
          </li>
        )
      })}
    </ol>
  )
}

export function ProductionRow({ p }: { p: ProductionSummary }) {
  return (
    <Link
      to={`/productions/${p.production_id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3 hover:bg-surface-2 md:grid-cols-[minmax(0,1fr)_12rem_9rem_5rem_6rem]"
    >
      <span className="min-w-0">
        <span className="block truncate font-medium">{p.topic}</span>
        {p.angle && <span className="block truncate text-xs text-fg-2">{p.angle}</span>}
      </span>
      <span className="justify-self-end md:justify-self-start">
        <StatePill state={p.state} reason={p.attention_reason} />
      </span>
      <span className="col-span-2 md:col-span-1">
        <LifecycleSteps p={p} compact />
      </span>
      <span className="text-xs text-fg-2 tabular md:text-right">
        {p.best_score != null ? (
          <>
            best <span className={cx('font-semibold', scoreTone(p.best_score))}>{fmtNumber(p.best_score, 0)}</span>
            {p.revision != null && <span className="text-fg-3"> · r{p.revision}</span>}
          </>
        ) : (
          <span className="text-fg-3">no score yet</span>
        )}
      </span>
      <span className="justify-self-end text-xs text-fg-3">{fmtRelative(p.updated_at ?? p.created_at)}</span>
    </Link>
  )
}
