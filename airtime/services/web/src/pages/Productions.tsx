import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { errorMessage } from '../api/client'
import { useCreateProduction, useProductions } from '../api/hooks'
import type { MarketWeight, ProductionSummary } from '../api/types'
import { ProductionRow } from '../components/production'
import { Button, Card, cx, Empty, Field, inputCls, PageHeader, QueryView } from '../components/ui'
import { ACTIVE, isClosed, isLive } from '../lib/lifecycle'

const GROUPS: { id: string; label: string; test: (p: ProductionSummary) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'active', label: 'In production', test: (p) => ACTIVE.includes(p.state) },
  { id: 'waiting', label: 'Waiting for you', test: (p) => p.state === 'awaiting_approval' || p.state === 'needs_attention' },
  { id: 'live', label: 'Live', test: (p) => isLive(p.state) },
  { id: 'closed', label: 'Failed or cancelled', test: (p) => isClosed(p.state) && p.state !== 'done' },
]

/** "US:0.5, IN 0.3, GB" → [{code, weight}], weights shared equally when none are given. */
export function parseMarkets(text: string): MarketWeight[] {
  const parts = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const parsed = parts.map((p) => {
    const [code, w] = p.split(/[\s:=]+/)
    return { code: code.toUpperCase(), weight: w ? Number(w) : NaN }
  })
  const valid = parsed.filter((m) => /^[A-Z]{2}$/.test(m.code))
  if (valid.some((m) => Number.isNaN(m.weight))) return valid.map((m) => ({ code: m.code, weight: Math.round((1 / valid.length) * 100) / 100 }))
  return valid
}

function NewProduction({ onClose }: { onClose: () => void }) {
  const create = useCreateProduction()
  const navigate = useNavigate()
  const [form, setForm] = useState({ topic: '', angle: '', markets: '', notes: '' })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const markets = parseMarkets(form.markets)
    try {
      const res = (await create.mutateAsync({
        topic: form.topic.trim(),
        angle: form.angle.trim() || undefined,
        markets: markets.length ? markets : undefined,
        notes: form.notes.trim() || undefined,
      })) as { production_id?: string; id?: string } | null
      const id = res?.production_id ?? res?.id
      if (id) navigate(`/productions/${id}`)
      else onClose()
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <Card title="New production" className="mb-4">
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <Field label="Topic">
          <input required value={form.topic} onChange={set('topic')} className={inputCls} placeholder="Why the Millennium Bridge wobbled" />
        </Field>
        <Field label="Angle (optional)">
          <input value={form.angle} onChange={set('angle')} className={inputCls} placeholder="The crowd that walked in step without meaning to" />
        </Field>
        <Field label="Markets (optional)" hint="Codes with optional weights, e.g. US:0.5, GB:0.3, IN:0.2. Empty uses the default market weights.">
          <input value={form.markets} onChange={set('markets')} className={inputCls} placeholder="US, GB, IN" />
        </Field>
        <Field label="Notes for the brief (optional)">
          <input value={form.notes} onChange={set('notes')} className={inputCls} placeholder="Use the real opening-day footage" />
        </Field>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <Button type="submit" variant="primary" disabled={create.isPending || !form.topic.trim()}>
            {create.isPending ? 'Starting…' : 'Start production'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {error && <span className="text-xs text-bad-ink">{error}</span>}
        </div>
      </form>
    </Card>
  )
}

export default function Productions() {
  const q = useProductions()
  const [params, setParams] = useSearchParams()
  const group = params.get('show') ?? 'all'
  const showNew = params.get('new') === '1'
  const update = (k: string, v: string | null) =>
    setParams(
      (p) => {
        if (v === null) p.delete(k)
        else p.set(k, v)
        return p
      },
      { replace: true },
    )
  return (
    <>
      <PageHeader
        title="Productions"
        sub="Every video from brief to upload. Open one for its brief, live engine log, script, cuts and upload."
        actions={
          !showNew && (
            <Button variant="primary" onClick={() => update('new', '1')}>
              <Plus aria-hidden className="size-4" /> New production
            </Button>
          )
        }
      />
      {showNew && <NewProduction onClose={() => update('new', null)} />}
      <QueryView q={q}>
        {(list) => {
          const rows = [...list].sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at))
          const g = GROUPS.find((x) => x.id === group) ?? GROUPS[0]
          const shown = rows.filter(g.test)
          return (
            <>
              <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Show">
                {GROUPS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    aria-pressed={x.id === g.id}
                    onClick={() => update('show', x.id === 'all' ? null : x.id)}
                    className={cx('rounded-full px-3 py-1 text-xs', x.id === g.id ? 'bg-fg text-page' : 'bg-surface-3 text-fg-2 hover:text-fg')}
                  >
                    {x.label} <span className="tabular opacity-70">{rows.filter(x.test).length}</span>
                  </button>
                ))}
              </div>
              <Card flush>
                {shown.length ? (
                  <div className="divide-y divide-line">
                    {shown.map((p) => (
                      <ProductionRow key={p.production_id} p={p} />
                    ))}
                  </div>
                ) : (
                  <Empty>No productions here.</Empty>
                )}
              </Card>
            </>
          )
        }}
      </QueryView>
    </>
  )
}
