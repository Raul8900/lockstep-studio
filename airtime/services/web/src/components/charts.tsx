/**
 * Charts, following the dataviz method: thin marks, recessive grid, a hover tooltip on every chart,
 * categorical hues in fixed order (series-1, -2, -3), and a table next to each one on its page.
 */
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ScriptLine } from '../api/types'
import { fmtClock, fmtCompact, fmtNumber } from '../lib/format'
import { lineAt, type RetentionSample } from '../lib/retention'

const tick = { fill: 'var(--fg-3)', fontSize: 11 }

function TipBox({ children }: { children: ReactNode }) {
  return <div className="max-w-72 rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-lg">{children}</div>
}

/** Audience retention on a seconds axis, with each script line as a band and the drops marked. */
export function RetentionChart({ series, lines, drops }: { series: RetentionSample[]; lines: ScriptLine[]; drops: { t_s: number; drop_pct: number }[] }) {
  const max = Math.max(100, ...series.map((s) => s.pct))
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 18, right: 12, bottom: 0, left: -8 }}>
          {lines.map((l, i) => (
            <ReferenceArea key={l.id} x1={l.start_s} x2={l.end_s} fill={i % 2 ? 'var(--band-b)' : 'var(--band-a)'} fillOpacity={1} strokeOpacity={0} ifOverflow="hidden" />
          ))}
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="t" type="number" domain={[0, 'dataMax']} tickFormatter={(v: number) => fmtClock(v)} stroke="var(--axis)" tick={tick} />
          <YAxis domain={[0, Math.ceil(max / 10) * 10]} tickFormatter={(v: number) => `${v}%`} stroke="var(--axis)" tick={tick} width={44} />
          {drops.map((d) => (
            <ReferenceLine
              key={d.t_s}
              x={d.t_s}
              stroke="var(--bad)"
              strokeDasharray="3 3"
              label={{ value: `−${fmtNumber(d.drop_pct)}%`, position: 'top', fill: 'var(--bad-ink)', fontSize: 11 }}
            />
          ))}
          <Tooltip
            cursor={{ stroke: 'var(--axis)' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as RetentionSample | undefined
              if (!active || !p) return null
              const line = lineAt(lines, p.t)
              return (
                <TipBox>
                  <div className="font-medium tabular">
                    {fmtClock(p.t)} · {fmtNumber(p.pct)}% watching
                  </div>
                  {line && (
                    <div className="mt-1 text-fg-2">
                      {line.beat && <span className="font-medium text-fg">{line.beat}: </span>}
                      {line.text}
                    </div>
                  )}
                </TipBox>
              )
            }}
          />
          <Line dataKey="pct" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Dimension scores of up to three cuts, one bar per cut (cut 0 = series-1, …). */
export function ScoreBars({ rows, cuts }: { rows: Record<string, number | string | null>[]; cuts: { key: string; label: string }[] }) {
  return (
    <div className="w-full" style={{ height: rows.length * (cuts.length * 9 + 14) + 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barGap={2} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" domain={[0, 100]} stroke="var(--axis)" tick={tick} />
          <YAxis type="category" dataKey="id" width={78} stroke="var(--axis)" tick={{ ...tick, fill: 'var(--fg-2)' }} />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox>
                  <div className="mb-1 font-medium">{label}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="flex items-center gap-2 tabular">
                      <span className="size-2 rounded-sm" style={{ background: String(p.color) }} />
                      <span className="text-fg-2">{p.name}</span>
                      <span className="ml-auto font-medium">{p.value ?? '—'}</span>
                    </div>
                  ))}
                </TipBox>
              ) : null
            }
          />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 12, color: 'var(--fg-2)' }} />
          {cuts.map((c, i) => (
            <Bar key={c.key} dataKey={c.key} name={c.label} fill={`var(--series-${i + 1})`} radius={[0, 4, 4, 0]} barSize={8} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** One measure across checkpoints (views at 24 h, 72 h, 7 d, …). */
export function CheckpointChart({ points, name }: { points: { label: string; value: number | null }[]; name: string }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -4 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="label" stroke="var(--axis)" tick={tick} />
          <YAxis tickFormatter={(v: number) => fmtCompact(v)} stroke="var(--axis)" tick={tick} width={48} />
          <Tooltip
            cursor={{ stroke: 'var(--axis)' }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox>
                  <span className="font-medium">{label}</span> · {fmtCompact(payload[0].value as number)} {name}
                </TipBox>
              ) : null
            }
          />
          <Line dataKey="value" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-1)' }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Horizontal bars in plain markup, for ranked lists (countries, traffic sources, weights). */
export function HBars({ rows, format = fmtCompact }: { rows: { label: ReactNode; value: number | null; extra?: ReactNode }[]; format?: (n: number | null) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0))
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-3" title={`${format(r.value)}`}>
          <span className="truncate text-fg-2">{r.label}</span>
          <span className="block h-2 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-r-[4px] bg-[var(--series-1)]" style={{ width: `${((r.value ?? 0) / max) * 100}%` }} />
          </span>
          <span className="text-right tabular">
            {format(r.value)}
            {r.extra && <span className="ml-2 text-fg-3">{r.extra}</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}
