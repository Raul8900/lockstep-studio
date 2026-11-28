import { useEffect, useRef, useState } from 'react'
import { useLiveEvents } from '../../api/hooks'
import { JOB_STAGES, type ProductionDetail } from '../../api/types'
import { Card, cx, Empty } from '../../components/ui'
import { eventGroup, summarizeEvent } from '../../lib/events'
import { fmtTime, humanize } from '../../lib/format'

const FILTERS = ['all', 'agent', 'tools', 'files', 'qa', 'state', 'log'] as const
const STATUS = { open: 'Live', connecting: 'Connecting…', retrying: 'Reconnecting…', closed: 'Closed' } as const
const GROUP_CLS: Record<string, string> = {
  agent: 'text-fg',
  tools: 'text-accent-ink',
  files: 'text-fg-2',
  qa: 'text-good-ink',
  state: 'font-medium text-fg',
  log: 'text-fg-2',
}

function timeOf(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${fmtTime(iso)}:${String(d.getSeconds()).padStart(2, '0')}`
}

export default function LiveTab({ p }: { p: ProductionDetail }) {
  const { events, status } = useLiveEvents(p.production_id)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all')
  const [follow, setFollow] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const shown = events.filter((e) => filter === 'all' || eventGroup(e.type) === filter).slice(-800)
  const stage = [...events].reverse().find((e) => e.stage)?.stage ?? p.engine?.stage ?? null
  const stageIndex = stage ? JOB_STAGES.indexOf(stage as (typeof JOB_STAGES)[number]) : -1
  const finished = p.engine?.state === 'completed' || events.some((e) => e.type === 'job.completed')

  useEffect(() => {
    if (follow && box.current) box.current.scrollTop = box.current.scrollHeight
  }, [shown.length, follow])

  return (
    <Card
      title="Live engine log"
      actions={
        <span className="inline-flex items-center gap-1.5 text-xs text-fg-2">
          <span className={cx('size-2 rounded-full', status === 'open' ? 'bg-good' : status === 'closed' ? 'bg-bad' : 'bg-warn')} />
          {STATUS[status]} · {events.length} events
        </span>
      }
      flush
    >
      <ol className="flex gap-1 px-4 pt-3" aria-label="Engine stages">
        {JOB_STAGES.map((s, i) => (
          <li key={s} className="min-w-0 flex-1">
            <span
              className={cx(
                'block h-1.5 rounded-full',
                finished || i < stageIndex ? 'bg-good' : i === stageIndex ? 'animate-pulse bg-accent' : 'bg-surface-3',
              )}
            />
            <span className={cx('mt-1 hidden truncate text-[11px] sm:block', i === stageIndex ? 'font-medium text-fg' : 'text-fg-3')}>{humanize(s)}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-1 px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cx('rounded-full px-2.5 py-0.5 text-xs', filter === f ? 'bg-fg text-page' : 'bg-surface-3 text-fg-2 hover:text-fg')}
          >
            {humanize(f)}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-fg-2">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow
        </label>
      </div>
      <div ref={box} className="h-[60vh] min-h-72 overflow-y-auto border-t border-line bg-surface-2 font-mono text-xs" role="log" aria-live="off">
        {shown.length ? (
          <ol>
            {shown.map((e) => {
              const g = eventGroup(e.type)
              return (
                <li key={`${e.seq}-${e.type}`} className="grid grid-cols-[4.2rem_1fr] gap-x-2 border-b border-line/60 px-4 py-1 sm:grid-cols-[4.2rem_2rem_8.5rem_1fr]">
                  <span className="text-fg-3 tabular">{timeOf(e.ts)}</span>
                  <span className="hidden text-fg-3 sm:inline">{e.revision != null ? `r${e.revision}` : ''}</span>
                  <span className="hidden truncate text-fg-3 sm:inline">{e.type}</span>
                  <span className={cx('min-w-0 whitespace-pre-wrap break-words', GROUP_CLS[g])}>{summarizeEvent(e)}</span>
                </li>
              )
            })}
          </ol>
        ) : (
          <Empty>{p.engine?.job_id ? 'Waiting for engine events…' : 'The engine has not started on this production yet.'}</Empty>
        )}
      </div>
    </Card>
  )
}
