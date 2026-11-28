import { ChevronLeft, CircleX, TriangleExclamationPoint } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useProduction, useProductionAction } from '../api/hooks'
import type { ProductionDetail } from '../api/types'
import { LifecycleSteps } from '../components/production'
import { ActionButton, Badge, ErrorBox, Loading, Mono, PageHeader, StatePill, Tabs } from '../components/ui'
import { errorText } from '../lib/events'
import { fmtDateTime, fmtMs, fmtRelative, fmtTokens, humanize, shortId } from '../lib/format'
import { allowedActions, reasonMeta } from '../lib/lifecycle'
import BriefTab from './production/BriefTab'
import { ComponentsTab, ScriptTab } from './production/CutTabs'
import LiveTab from './production/LiveTab'
import PublishTab from './production/PublishTab'
import RevisionsTab from './production/RevisionsTab'
import { MarkUploaded, UploadLog, UploadManually } from './production/UploadTab'

const TABS = [
  { id: 'brief', label: 'Brief' },
  { id: 'live', label: 'Live engine log' },
  { id: 'script', label: 'Script' },
  { id: 'components', label: 'Components' },
  { id: 'revisions', label: 'Revisions' },
  { id: 'publish', label: 'Publish' },
  { id: 'upload', label: 'Upload log' },
] as const

function Actions({ p }: { p: ProductionDetail }) {
  const a = allowedActions(p)
  const act = useProductionAction(p.production_id)
  const run = (action: Parameters<typeof act.mutateAsync>[0]) => () => act.mutateAsync(action)
  return (
    <>
      {a.approve && <ActionButton variant="primary" label="Approve and upload" run={run('upload')} title="Uploads the chosen cut with the final kit" />}
      {a.uploadAnyway && (
        <ActionButton variant="primary" label="Upload anyway" confirm="Every cut failed a hard gate. Upload the chosen cut anyway?" run={run('upload')} />
      )}
      {a.retryUpload && <ActionButton label="Retry upload" run={run('upload')} title="Starts a new upload attempt" />}
      {a.revise && <ActionButton label="Revise" run={run('revise')} title="Sends the latest review notes to the engine for another cut" />}
      {a.rescore && <ActionButton label="Rescore" run={run('rescore')} title="Runs the critic again on the cuts" />}
      {a.cancel && <ActionButton variant="danger" label="Cancel" confirm="Cancel this production? The engine job stops." run={run('cancel')} />}
    </>
  )
}

function Attention({ p }: { p: ProductionDetail }) {
  const failed = p.state === 'failed'
  if (p.state !== 'needs_attention' && !failed) return null
  const r = reasonMeta(p.attention_reason)
  const err = errorText(p.error ?? p.engine?.error)
  const retryAt = p.engine?.retry_at ?? (p.error && typeof p.error === 'object' ? (p.error.details?.retry_at as string | undefined) : undefined)
  return (
    <div
      role="alert"
      className={
        failed
          ? 'mb-4 flex gap-3 rounded-lg border border-bad/40 bg-bad-soft px-4 py-3 text-bad-ink'
          : 'mb-4 flex gap-3 rounded-lg border border-warn/50 bg-warn-soft px-4 py-3 text-warn-ink'
      }
    >
      {failed ? <CircleX aria-hidden className="mt-0.5 size-4 shrink-0" /> : <TriangleExclamationPoint aria-hidden className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 text-fg">
        <p className="font-semibold">{failed ? 'Failed' : (r?.label ?? 'Needs attention')}</p>
        {!failed && r && <p className="text-fg-2">{r.description}</p>}
        {retryAt && (
          <p className="text-fg-2">
            Retries {fmtRelative(retryAt)} ({fmtDateTime(retryAt)}), when the first Claude account comes out of cooldown.{' '}
            <Link to="/settings" className="text-accent-ink hover:underline">
              Claude accounts
            </Link>
          </p>
        )}
        {err && <p className="mt-1 break-words font-mono text-xs text-fg-2">{err}</p>}
      </div>
    </div>
  )
}

function EngineStrip({ p }: { p: ProductionDetail }) {
  const e = p.engine
  if (!e?.job_id) return null
  const c = e.claude
  const items: [string, string][] = [
    ['Job', shortId(e.job_id)],
    ['Engine', [e.state, e.stage].filter(Boolean).map((s) => humanize(s)).join(' · ') || '—'],
    ['Revision', e.revision != null ? String(e.revision) : '—'],
  ]
  if (c) {
    items.push(['Claude', [c.account_id, c.model, c.effort].filter(Boolean).join(' · ') || '—'])
    items.push(['Turns', c.turns != null ? String(c.turns) : '—'])
    items.push(['Tokens', `${fmtTokens(c.usage?.input_tokens)} in · ${fmtTokens(c.usage?.output_tokens)} out`])
    items.push(['Time', fmtMs(c.duration_ms)])
  }
  return (
    <dl className="mb-4 flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-line bg-surface px-4 py-2 text-xs">
      {items.map(([k, v]) => (
        <div key={k} className="flex gap-1.5">
          <dt className="text-fg-3">{k}</dt>
          <dd className="font-medium tabular" title={k === 'Job' ? (e.job_id ?? '') : undefined}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function Production() {
  const { id = '', tab = 'brief' } = useParams()
  const q = useProduction(id)
  if (q.isPending) return <Loading />
  if (q.isError) return <ErrorBox error={q.error} retry={() => void q.refetch()} />
  const p = q.data
  const manual = p.state === 'needs_attention' && (p.attention_reason === 'upload_failed' || p.attention_reason === 'hard_gate')
  const base = `/productions/${encodeURIComponent(p.production_id)}`
  return (
    <>
      <Link to="/productions" className="mb-2 inline-flex items-center gap-1 text-xs text-fg-2 hover:text-fg">
        <ChevronLeft aria-hidden className="size-3.5" /> Productions
      </Link>
      <PageHeader
        title={p.topic}
        sub={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {p.angle && <span>{p.angle}</span>}
            <StatePill state={p.state} reason={p.attention_reason} />
            {p.markets?.map((m) => (
              <Badge key={m.code} tone="muted">
                {m.code}
              </Badge>
            ))}
            <Mono>{p.production_id}</Mono>
            <span className="text-xs text-fg-3">started {fmtRelative(p.created_at)}</span>
          </span>
        }
        actions={<Actions p={p} />}
      />
      <div className="mb-4 max-w-3xl">
        <LifecycleSteps p={p} />
      </div>
      <Attention p={p} />
      {p.state === 'needs_attention' && p.attention_reason === 'upload_failed' && <UploadManually p={p} />}
      {manual && <MarkUploaded id={p.production_id} />}
      <EngineStrip p={p} />
      <Tabs tabs={TABS.map((t) => ({ to: t.id === 'brief' ? base : `${base}/${t.id}`, label: t.label, end: t.id === 'brief' }))} />
      {tab === 'brief' && <BriefTab p={p} />}
      {tab === 'live' && <LiveTab p={p} />}
      {tab === 'script' && <ScriptTab p={p} />}
      {tab === 'components' && <ComponentsTab p={p} />}
      {tab === 'revisions' && <RevisionsTab p={p} />}
      {tab === 'publish' && <PublishTab p={p} />}
      {tab === 'upload' && <UploadLog p={p} />}
    </>
  )
}
