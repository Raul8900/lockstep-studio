import { Bell, BookOpen, ChartColumn, CircleX, Info, Plus, Radio, TriangleExclamationPoint } from 'lucide-react'
import { Link } from 'react-router'
import { useOverview, useProductions, useRunLearning, useRunResearch, useSyncAnalytics } from '../api/hooks'
import type { Alert } from '../api/types'
import { HBars } from '../components/charts'
import { ProductionRow } from '../components/production'
import { ActionButton, Badge, Card, cx, Empty, PageHeader, QueryView, Stat } from '../components/ui'
import { fmtCompact, fmtDateTime, fmtInt, fmtNumber, fmtRelative, fmtUsd, humanize } from '../lib/format'

const ALERT_STYLE = {
  error: { cls: 'border-bad/40 bg-bad-soft text-bad-ink', icon: CircleX },
  warning: { cls: 'border-warn/50 bg-warn-soft text-warn-ink', icon: TriangleExclamationPoint },
  info: { cls: 'border-line bg-surface text-fg-2', icon: Info },
}

function Alerts({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null
  return (
    <ul className="mb-4 space-y-2">
      {alerts.map((a, i) => {
        const s = ALERT_STYLE[a.level as keyof typeof ALERT_STYLE] ?? ALERT_STYLE.info
        const body = (
          <>
            <s.icon aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0 flex-1">{a.message}</span>
          </>
        )
        const cls = cx('flex items-start gap-2 rounded-lg border px-3 py-2', s.cls)
        return (
          <li key={i}>
            {a.link ? (
              <Link to={a.link} className={cx(cls, 'hover:underline')}>
                {body}
              </Link>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Lifecycle() {
  const research = useRunResearch()
  const sync = useSyncAnalytics()
  const learn = useRunLearning()
  return (
    <>
      <ActionButton icon={<Radio aria-hidden className="size-4" />} label="Run research" run={() => research.mutateAsync()} />
      <ActionButton icon={<ChartColumn aria-hidden className="size-4" />} label="Sync analytics" run={() => sync.mutateAsync()} />
      <ActionButton icon={<BookOpen aria-hidden className="size-4" />} label="Run learning" run={() => learn.mutateAsync()} />
    </>
  )
}

export default function Overview() {
  const overview = useOverview()
  const productions = useProductions()
  const waiting = (productions.data ?? []).filter((p) => p.state === 'awaiting_approval' || p.state === 'needs_attention')

  return (
    <>
      <PageHeader
        title="Overview"
        sub="Today's pipeline, the channel's last 28 days and what needs you."
        actions={
          <>
            <Lifecycle />
            <Link to="/productions?new=1" className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover">
              <Plus aria-hidden className="size-4" /> New production
            </Link>
          </>
        }
      />
      <QueryView q={overview}>
        {(o) => (
          <>
            <Alerts alerts={o.alerts} />
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Stat
                label="Channel"
                value={o.channel.channel_name ?? '—'}
                sub={o.channel.connected ? <span className="text-good-ink">Connected</span> : <span className="text-bad-ink">Not connected</span>}
              />
              <Stat label="Subscribers" value={fmtCompact(o.channel.subscribers)} />
              <Stat label="Views · 28 d" value={fmtCompact(o.channel.views_28d)} sub={`${fmtNumber(o.channel.watch_hours_28d, 0)} watch hours`} />
              <Stat label="Revenue · 28 d" value={fmtUsd(o.channel.revenue_28d_usd)} sub={`RPM ${fmtUsd(o.channel.rpm_28d_usd)}`} />
              <Stat label="Pipeline" value={`${o.pipeline.active.length} active`} sub={`${fmtInt(o.pipeline.queued)} queued`} />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
              <div className="min-w-0 space-y-4">
                <Card
                  title={
                    <span className="inline-flex items-center gap-2">
                      <Bell aria-hidden className="size-4" /> Waiting for you
                    </span>
                  }
                  flush
                >
                  {productions.isPending ? null : waiting.length ? (
                    <div className="divide-y divide-line">{waiting.map((p) => <ProductionRow key={p.production_id} p={p} />)}</div>
                  ) : (
                    <Empty>Nothing needs you right now.</Empty>
                  )}
                </Card>
                <Card title="In production" actions={<Link to="/productions" className="text-xs text-accent-ink hover:underline">All productions</Link>} flush>
                  {o.pipeline.active.length ? (
                    <div className="divide-y divide-line">{o.pipeline.active.map((p) => <ProductionRow key={p.production_id} p={p} />)}</div>
                  ) : (
                    <Empty>No production is running.</Empty>
                  )}
                </Card>
              </div>
              <div className="min-w-0 space-y-4">
                <Card title="Schedule">
                  <ul className="space-y-2">
                    {o.pipeline.next_runs.map((r) => (
                      <li key={r.job} className="flex items-baseline justify-between gap-3">
                        <span>{humanize(r.job)}</span>
                        <span className="text-right text-xs text-fg-2 tabular" title={fmtDateTime(r.at)}>
                          {fmtRelative(r.at)} · {fmtDateTime(r.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-fg-3">
                    Last research {fmtRelative(o.pipeline.last_research_at)}.{' '}
                    <Link to="/settings" className="text-accent-ink hover:underline">
                      Change the schedule
                    </Link>
                  </p>
                </Card>
                <Card title="Markets · views in the last 28 days">
                  <HBars
                    rows={o.markets.map((m) => ({
                      label: (
                        <span title={m.name}>
                          {m.code} <span className="text-fg-3">{m.name}</span>
                        </span>
                      ),
                      value: m.views_28d,
                      extra: fmtUsd(m.revenue_28d_usd),
                    }))}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-fg-3">
                    Market weights
                    {o.markets.map((m) => (
                      <Badge key={m.code} tone="muted">
                        {m.code} {fmtNumber(m.weight * 100, 0)}%
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </QueryView>
    </>
  )
}
