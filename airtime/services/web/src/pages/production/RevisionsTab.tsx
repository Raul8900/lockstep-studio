import { useChooseRevision } from '../../api/hooks'
import { failedGates, scorePasses, thresholdOf } from '../../api/normalize'
import type { ProductionDetail, Revision } from '../../api/types'
import { ScoreBars } from '../../components/charts'
import { scoreTone } from '../../components/production'
import { ActionButton, Badge, Card, CopyButton, cx, Empty, KV, Pre, VideoPreview } from '../../components/ui'
import { fmtNumber, fmtPct, fmtSigned, fmtTimecode, humanize } from '../../lib/format'
import { allowedActions } from '../../lib/lifecycle'
import { cutLabel, posterOf } from './CutTabs'

function Verdict({ r, threshold }: { r: Revision; threshold: number }) {
  const sc = r.scorecard
  if (!sc) return <Badge tone="progress" icon>{r.state === 'failed' ? 'Failed' : 'Not scored yet'}</Badge>
  const gates = failedGates(sc)
  if (gates.length || !sc.gates_passed) return <Badge tone="bad" icon>Gate failed{gates.length ? `: ${gates.join(', ')}` : ''}</Badge>
  return scorePasses(sc, threshold) ? (
    <Badge tone="good" icon>
      Passes
    </Badge>
  ) : (
    <Badge tone="warn" icon>
      Below {threshold}
    </Badge>
  )
}

function CutColumn({ p, r, threshold, canChoose }: { p: ProductionDetail; r: Revision; threshold: number; canChoose: boolean }) {
  const choose = useChooseRevision(p.production_id)
  const sc = r.scorecard
  const qa = r.handoff?.qa
  const chosen = r.revision === p.chosen_revision
  return (
    <div className={cx('min-w-0 rounded-lg border bg-surface p-3', chosen ? 'border-accent ring-1 ring-accent' : 'border-line')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{cutLabel(r.revision)}</h3>
        {chosen && <Badge tone="action">Chosen</Badge>}
      </div>
      <VideoPreview path={r.handoff?.video.path} poster={posterOf(r.handoff)} className="max-h-80" />
      <div className="mt-3 flex items-baseline gap-2">
        <span className={cx('text-3xl font-semibold tabular', scoreTone(sc?.total, threshold))}>{sc ? fmtNumber(sc.total, 0) : '—'}</span>
        <span className="text-xs text-fg-3">/ 100 · passes at {threshold}</span>
      </div>
      {sc?.raw_total != null && sc.raw_total !== sc.total && <p className="text-xs text-fg-3">{fmtNumber(sc.raw_total, 1)} before the gate cap</p>}
      <div className="mt-1.5">
        <Verdict r={r} threshold={threshold} />
      </div>
      <KV
        className="mt-3 text-xs"
        rows={[
          ['Predicted view %', fmtPct(sc?.predicted?.avg_view_pct)],
          ['Viewed vs swiped', fmtPct(sc?.predicted?.viewed_vs_swiped_pct)],
          ['QA', qa ? (qa.passed ? 'passed' : <span className="text-bad-ink">failed</span>) : '—'],
          ['Loudness', qa?.summary.loudness_lufs != null ? `${qa.summary.loudness_lufs} LUFS` : '—'],
          ['Sync', qa?.summary.sync_ms != null ? `${qa.summary.sync_ms} ms` : '—'],
          ['WER', fmtPct(qa?.summary.wer_percent)],
          ['Lint warnings', qa?.summary.lint_warnings ?? '—'],
        ]}
      />
      {!!qa?.issues.length && (
        <ul className="mt-2 list-disc pl-4 text-xs text-fg-2">
          {qa.issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
      {canChoose && !chosen && r.handoff && (
        <div className="mt-3">
          <ActionButton label="Choose this cut" run={() => choose.mutateAsync(r.revision)} />
        </div>
      )}
    </div>
  )
}

function Notes({ r }: { r: Revision }) {
  const n = r.review_notes
  if (!n) return null
  return (
    <Card
      title={`Critic's notes on ${cutLabel(r.revision).toLowerCase()} · round ${n.round}`}
      actions={<CopyButton text={n.engine_feedback_md} label="Copy feedback" />}
    >
      <p className="mb-3">{n.summary}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="text-xs text-fg-2">
            <tr className="border-b border-line">
              <th className="py-1.5 pr-2 font-medium">#</th>
              <th className="py-1.5 pr-2 font-medium">Where</th>
              <th className="py-1.5 pr-2 font-medium">Issue</th>
              <th className="py-1.5 pr-2 font-medium">Change</th>
              <th className="py-1.5 text-right font-medium">Gain</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {[...n.notes]
              .sort((a, b) => a.priority - b.priority)
              .map((x, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-2 text-fg-3 tabular">{x.priority}</td>
                  <td className="py-1.5 pr-2 text-xs">
                    <span className="font-medium">{x.dimension}</span>
                    <span className="block text-fg-3">{[x.at_s != null ? fmtTimecode(x.at_s) : null, x.beat].filter(Boolean).join(' · ')}</span>
                  </td>
                  <td className="py-1.5 pr-2">{x.issue}</td>
                  <td className="py-1.5 pr-2">{x.change}</td>
                  <td className="py-1.5 text-right text-good-ink tabular">{x.expected_gain != null ? fmtSigned(x.expected_gain) : '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {n.keep.length > 0 && <p className="mt-3 text-xs text-fg-2">Keep: {n.keep.join('; ')}</p>}
      <details className="mt-3">
        <summary className="text-xs font-medium text-accent-ink">Feedback as sent to the engine</summary>
        <Pre className="mt-2">{n.engine_feedback_md}</Pre>
      </details>
    </Card>
  )
}

export default function RevisionsTab({ p }: { p: ProductionDetail }) {
  const revs = p.revisions
  if (!revs.length) {
    return (
      <Card>
        <Empty>No cut yet. Each cut is scored on the rubric here, side by side, as it arrives.</Empty>
      </Card>
    )
  }
  const threshold = thresholdOf(p, revs.find((r) => r.scorecard)?.scorecard)
  const canChoose = allowedActions(p).choose
  const scored = revs.filter((r) => r.scorecard)
  const dims = [...new Set(scored.flatMap((r) => r.scorecard!.dimensions.map((d) => d.id)))]
  const weightOf = (id: string) => scored.flatMap((r) => r.scorecard!.dimensions).find((d) => d.id === id)?.weight
  const scoreOf = (r: Revision, id: string) => r.scorecard?.dimensions.find((d) => d.id === id)?.score ?? null
  return (
    <div className="space-y-4">
      <div className="grid grid-flow-col auto-cols-[minmax(15rem,1fr)] gap-3 overflow-x-auto pb-1">
        {revs.map((r) => (
          <CutColumn key={r.revision} p={p} r={r} threshold={threshold} canChoose={canChoose} />
        ))}
      </div>
      {scored.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Scorecards by dimension" flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-fg-2">
                  <tr className="border-b border-line">
                    <th className="px-4 py-2 text-left font-medium">Dimension</th>
                    <th className="px-2 py-2 text-right font-medium">Weight</th>
                    {scored.map((r) => (
                      <th key={r.revision} className="px-3 py-2 text-right font-medium">
                        {cutLabel(r.revision)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {dims.map((id) => (
                    <tr key={id}>
                      <td className="px-4 py-1.5">{humanize(id)}</td>
                      <td className="px-2 py-1.5 text-right text-fg-3 tabular">{weightOf(id) ?? '—'}</td>
                      {scored.map((r, i) => {
                        const v = scoreOf(r, id)
                        const prev = i > 0 ? scoreOf(scored[i - 1], id) : null
                        const dim = r.scorecard!.dimensions.find((d) => d.id === id)
                        const gate = r.scorecard!.failed_gates?.includes(id)
                        return (
                          <td key={r.revision} className="px-3 py-1.5 text-right tabular" title={[dim?.evidence, ...(dim?.issues ?? [])].filter(Boolean).join('\n')}>
                            <span className={cx(gate && 'font-semibold text-bad-ink')}>{v ?? '—'}</span>
                            {v != null && prev != null && v !== prev && (
                              <span className={cx('ml-1 text-xs', v > prev ? 'text-good-ink' : 'text-bad-ink')}>{fmtSigned(v - prev)}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="px-4 py-2">Total</td>
                    <td />
                    {scored.map((r) => (
                      <td key={r.revision} className={cx('px-3 py-2 text-right tabular', scoreTone(r.scorecard!.total, threshold))}>
                        {fmtNumber(r.scorecard!.total, 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Scores by dimension">
            <ScoreBars
              rows={dims.map((id) => Object.fromEntries([['id', id], ...scored.map((r) => [`r${r.revision}`, scoreOf(r, id)])]))}
              cuts={scored.map((r) => ({ key: `r${r.revision}`, label: cutLabel(r.revision) }))}
            />
          </Card>
        </div>
      )}
      {[...revs].reverse().map((r) => (
        <Notes key={r.revision} r={r} />
      ))}
    </div>
  )
}
