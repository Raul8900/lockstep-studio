import { Radio } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useOpportunities, useOpportunityAction, useOverview, useRunResearch, useSignals } from '../api/hooks'
import type { EvidenceItem, Opportunity } from '../api/types'
import { ActionButton, Badge, Card, cx, Empty, ExtLink, inputCls, Meter, PageHeader, QueryView } from '../components/ui'
import { asList } from '../api/normalize'
import { countryName, fmtCompact, fmtDateTime, fmtNumber, fmtRelative, humanize } from '../lib/format'

const SCORE_KEYS = ['demand', 'timeliness', 'competition_gap', 'channel_fit', 'revenue_potential', 'explainability'] as const
const STATUSES = ['new', 'producing', 'produced', 'dismissed', 'expired', ''] as const

function metricText(m: EvidenceItem['metric']) {
  if (!m) return null
  if (typeof m === 'string') return m
  return `${humanize(m.name)} ${typeof m.value === 'number' ? fmtCompact(m.value) : (m.value ?? '')}`
}

function OpportunityCard({ o }: { o: Opportunity }) {
  const action = useOpportunityAction()
  const navigate = useNavigate()
  const open = o.status === 'new'
  const produce = async () => {
    const res = (await action.mutateAsync({ id: o.opportunity_id, action: 'produce' })) as { production_id?: string; id?: string } | null
    const id = res?.production_id ?? res?.id
    if (id) navigate(`/productions/${id}`)
  }
  return (
    <Card
      title={
        <span className="flex items-baseline gap-2">
          <span className="rounded bg-accent-soft px-1.5 text-xs font-semibold text-accent-ink tabular" title="Priority">
            {fmtNumber(o.priority, 0)}
          </span>
          {o.topic}
        </span>
      }
      actions={
        <>
          <Badge tone={o.status === 'new' ? 'progress' : o.status === 'dismissed' || o.status === 'expired' ? 'muted' : 'good'}>{humanize(o.status)}</Badge>
          {o.production_id && (
            <Link to={`/productions/${o.production_id}`} className="text-xs text-accent-ink hover:underline">
              Production
            </Link>
          )}
        </>
      }
    >
      <p className="font-medium">{o.angle}</p>
      <p className="mt-1 text-fg-2">{o.why}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="neutral">{o.format === 'long' ? 'Long video' : 'Short'}</Badge>
        {o.markets.map((m) => (
          <Badge key={m.code} tone="muted" title={m.evidence?.join(' · ') || countryName(m.code)}>
            {m.code} {fmtNumber(m.weight * 100, 0)}%
          </Badge>
        ))}
        {o.expires_in_days != null && <Badge tone={o.expires_in_days <= 2 ? 'warn' : 'muted'}>expires in {o.expires_in_days} d</Badge>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {SCORE_KEYS.map((k) => (
          <div key={k}>
            <dt className="flex justify-between text-xs text-fg-2">
              {humanize(k)} <span className="font-medium text-fg tabular">{o.scores?.[k] ?? '—'}</span>
            </dt>
            <dd className="mt-1">
              <Meter value={o.scores?.[k]} />
            </dd>
          </div>
        ))}
      </dl>
      {o.evidence.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs font-medium text-accent-ink">Evidence ({o.evidence.length})</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {o.evidence.map((e, i) => (
              <li key={i} className="flex flex-wrap gap-x-2">
                <span className="text-fg-3">{humanize(e.source)}</span>
                {e.url ? <ExtLink href={e.url}>{e.title ?? e.url}</ExtLink> : <span>{e.title}</span>}
                {e.metric && <span className="text-fg-2 tabular">{metricText(e.metric)}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {o.risks.length > 0 && <p className="mt-2 text-xs text-warn-ink">Risks: {o.risks.join('; ')}</p>}
      {open && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton variant="primary" label="Produce" run={produce} />
          <ActionButton variant="ghost" label="Dismiss" run={() => action.mutateAsync({ id: o.opportunity_id, action: 'dismiss' })} />
        </div>
      )}
    </Card>
  )
}

function Signals({ markets }: { markets: string[] }) {
  const [market, setMarket] = useState(markets[0] ?? 'US')
  const q = useSignals(market)
  return (
    <Card
      title="Trend signals"
      actions={
        <select value={market} onChange={(e) => setMarket(e.target.value)} className={cx(inputCls, 'w-auto py-1')} aria-label="Market">
          {markets.map((m) => (
            <option key={m} value={m}>
              {m} · {countryName(m)}
            </option>
          ))}
        </select>
      }
      flush
    >
      <QueryView q={q}>
        {(packs) => {
          const items = packs.flatMap((p) => p.items)
          const errors = packs.flatMap((p) => p.errors)
          return (
            <>
              {packs[0] && <p className="px-4 pt-3 text-xs text-fg-3">Collected {fmtRelative(packs[0].collected_at)} · {fmtDateTime(packs[0].collected_at)}</p>}
              {errors.length > 0 && (
                <ul className="mx-4 mt-2 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn-ink">
                  {errors.map((e, i) => (
                    <li key={i}>{typeof e === 'string' ? e : `${e.source ?? 'source'}: ${e.message ?? 'failed'}`}</li>
                  ))}
                </ul>
              )}
              {items.length ? (
                <ul className="divide-y divide-line">
                  {items.map((s, i) => (
                    <li key={i} className="flex items-baseline gap-3 px-4 py-2">
                      <span className="w-6 shrink-0 text-right text-xs text-fg-3 tabular">{s.rank ?? ''}</span>
                      <span className="min-w-0 flex-1">
                        {s.url ? <ExtLink href={s.url}>{s.title}</ExtLink> : s.title}
                        <span className="block text-xs text-fg-3">
                          {humanize(s.source)}
                          {s.language && ` · ${s.language}`}
                          {s.category && ` · ${s.category}`}
                        </span>
                      </span>
                      {s.metric && <span className="shrink-0 text-xs text-fg-2 tabular">{metricText(s.metric)}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No signals for this market yet.</Empty>
              )}
            </>
          )
        }}
      </QueryView>
    </Card>
  )
}

export default function Opportunities() {
  const [status, setStatus] = useState<string>('new')
  const [market, setMarket] = useState('')
  const q = useOpportunities({ status: status || undefined, market: market || undefined })
  const overview = useOverview()
  const research = useRunResearch()
  const markets = asList<{ code: string }>(overview.data?.markets).map((m) => m.code)
  const marketList = markets.length ? markets : ['US', 'IN', 'GB']
  return (
    <>
      <PageHeader
        title="Trends & Opportunities"
        sub={`Research ranks what to make next from free trend signals and YouTube demand per market. Last run ${fmtRelative(overview.data?.pipeline.last_research_at)}.`}
        actions={<ActionButton variant="primary" icon={<Radio aria-hidden className="size-4" />} label="Run research" run={() => research.mutateAsync()} />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Status">
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cx('rounded-full px-3 py-1 text-xs', status === s ? 'bg-fg text-page' : 'bg-surface-3 text-fg-2 hover:text-fg')}
            >
              {s ? humanize(s) : 'All'}
            </button>
          ))}
        </div>
        <select value={market} onChange={(e) => setMarket(e.target.value)} className={cx(inputCls, 'ml-auto w-auto py-1')} aria-label="Filter by market">
          <option value="">All markets</option>
          {marketList.map((m) => (
            <option key={m} value={m}>
              {m} · {countryName(m)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_26rem]">
        <QueryView q={q}>
          {(list) =>
            list.length ? (
              <div className="grid min-w-0 content-start gap-4 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {[...list].sort((a, b) => b.priority - a.priority).map((o) => (
                  <OpportunityCard key={o.opportunity_id} o={o} />
                ))}
              </div>
            ) : (
              <Card>
                <Empty>No opportunities here. Run research to find some.</Empty>
              </Card>
            )
          }
        </QueryView>
        <div className="min-w-0">
          <Signals markets={marketList} />
        </div>
      </div>
    </>
  )
}
