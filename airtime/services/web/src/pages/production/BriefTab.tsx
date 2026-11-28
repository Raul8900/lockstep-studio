import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { ProductionDetail } from '../../api/types'
import { Badge, Card, CopyButton, Empty, ExtLink, KV, Pre } from '../../components/ui'
import { countryName, fmtCompact, fmtDateTime, fmtDuration, fmtNumber, languageName } from '../../lib/format'

function List({ items, empty = '—' }: { items: ReactNode[] | undefined; empty?: string }) {
  if (!items?.length) return <span className="text-fg-3">{empty}</span>
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  )
}

export default function BriefTab({ p }: { p: ProductionDetail }) {
  const b = p.brief
  const o = p.opportunity
  if (!b) {
    const writing = p.state === 'queued' || p.state === 'briefing'
    return (
      <Card>
        <Empty>{writing ? 'brain is writing the GrowthBrief; it appears here when it is done.' : 'This production has no brief.'}</Empty>
      </Card>
    )
  }
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
      <div className="min-w-0 space-y-4">
        <Card title="The brief" actions={<span className="text-xs text-fg-3">{fmtDateTime(b.created_at)}</span>}>
          <KV
            rows={[
              ['Angle', b.angle],
              ['Why now', b.why_now],
              ['Audience', b.audience],
              ['Format', `${b.format === 'long' ? 'Long video' : 'Short'} · target ${fmtDuration(b.duration_s.target)}, at most ${fmtDuration(b.duration_s.max)}`],
              ['Language', languageName(b.language)],
              ['Tone', b.tone.join(', ') || '—'],
              ['Hooks', <List items={b.hook_options} />],
              ['Titles', <List items={b.title_options} />],
              [
                'Keywords',
                <span className="flex flex-wrap gap-1">
                  {b.keywords.primary.map((k) => (
                    <Badge key={k} tone="progress">
                      {k}
                    </Badge>
                  ))}
                  {b.keywords.secondary.map((k) => (
                    <Badge key={k} tone="muted">
                      {k}
                    </Badge>
                  ))}
                </span>,
              ],
              ['Must include', <List items={b.must_include} />],
              ['Avoid', <List items={b.avoid} />],
              ['Visuals', b.visual_direction],
              ['Give time to', <List items={b.give_time_to} />],
              ['Music', b.music_mood],
            ]}
          />
        </Card>
        <Card title="Engine request" actions={<CopyButton text={b.engine_request_md} />}>
          <p className="mb-2 text-xs text-fg-3">The brief in the PROMPTING.md format, as the engine session receives it.</p>
          <Pre>{b.engine_request_md}</Pre>
        </Card>
        {b.competitors.length > 0 && (
          <Card title="Competitors" flush>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-fg-2">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2 font-medium">Video</th>
                    <th className="px-2 py-2 text-right font-medium">Views</th>
                    <th className="px-2 py-2 text-right font-medium">Age</th>
                    <th className="px-2 py-2 text-right font-medium">Length</th>
                    <th className="px-4 py-2 font-medium">Takeaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {b.competitors.map((c) => (
                    <tr key={c.url}>
                      <td className="px-4 py-2">
                        <ExtLink href={c.url}>{c.title}</ExtLink>
                      </td>
                      <td className="px-2 py-2 text-right tabular">{fmtCompact(c.views)}</td>
                      <td className="px-2 py-2 text-right tabular">{c.age_days != null ? `${c.age_days} d` : '—'}</td>
                      <td className="px-2 py-2 text-right tabular">{fmtDuration(c.duration_s)}</td>
                      <td className="px-4 py-2 text-fg-2">{c.takeaway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      <div className="min-w-0 space-y-4">
        {o && (
          <Card title="From research">
            <p className="font-medium">{o.topic}</p>
            <p className="mt-1 text-fg-2">{o.why}</p>
            <p className="mt-2 text-xs text-fg-3">
              Priority {fmtNumber(o.priority, 0)} ·{' '}
              <Link to="/opportunities" className="text-accent-ink hover:underline">
                Trends & Opportunities
              </Link>
            </p>
          </Card>
        )}
        <Card title="Markets">
          <ul className="space-y-1">
            {b.markets.map((m) => (
              <li key={m.code} className="flex justify-between gap-3">
                <span>
                  {m.code} <span className="text-fg-3">{countryName(m.code)}</span>
                </span>
                <span className="tabular">{fmtNumber(m.weight * 100, 0)}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Learnings applied">
          {b.learnings.length ? (
            <ul className="space-y-2">
              {b.learnings.map((l) => (
                <li key={l.id}>
                  {l.statement} <span className="text-xs text-fg-3 tabular">weight {fmtNumber(l.weight, 2)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No learnings yet.</Empty>
          )}
        </Card>
        <Card title={`Rubric · passes at ${b.rubric.threshold}`}>
          <ul className="space-y-1.5">
            {b.rubric.dimensions.map((d) => (
              <li key={d.id} className="grid grid-cols-[5.5rem_2rem_1fr] gap-2">
                <span className="font-medium">{d.id}</span>
                <span className="text-right text-fg-2 tabular">{d.weight}</span>
                <span className="text-xs text-fg-2">{d.what}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
