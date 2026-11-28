import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { fileUrl } from '../../api/client'
import type { Handoff, ProductionDetail, Revision } from '../../api/types'
import { scoreTone } from '../../components/production'
import { Badge, Card, cx, Empty, ExtLink, FileImage, KV, Mono, VideoPreview } from '../../components/ui'
import { fmtBytesMb, fmtDuration, fmtNumber, fmtTimecode, hostOf, humanize } from '../../lib/format'

export function cutLabel(n: number) {
  return n === 0 ? 'Cut 0' : `Revision ${n}`
}

/** The revision shown on the Script and Components tabs: ?rev=, else the chosen cut, else the latest with a handoff. */
export function useCut(p: ProductionDetail): { rev: Revision | null; picker: ReactNode } {
  const [params, setParams] = useSearchParams()
  const withCut = p.revisions.filter((r) => r.handoff)
  const asked = params.get('rev')
  const rev =
    withCut.find((r) => String(r.revision) === asked) ??
    withCut.find((r) => r.revision === p.chosen_revision) ??
    withCut[withCut.length - 1] ??
    null
  const picker =
    withCut.length > 1 ? (
      <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Revision">
        {withCut.map((r) => (
          <button
            key={r.revision}
            type="button"
            aria-pressed={r === rev}
            onClick={() => setParams({ rev: String(r.revision) }, { replace: true })}
            className={cx('rounded-full px-3 py-1 text-xs', r === rev ? 'bg-fg text-page' : 'bg-surface-3 text-fg-2 hover:text-fg')}
          >
            {cutLabel(r.revision)}
            {r.scorecard && <span className="ml-1 tabular opacity-75">{fmtNumber(r.scorecard.total, 0)}</span>}
            {r.revision === p.chosen_revision && ' ★'}
          </button>
        ))}
      </div>
    ) : null
  return { rev, picker }
}

export function posterOf(h: Handoff | null | undefined) {
  return h?.frames?.keyframes?.[0]?.path ?? h?.publish_kit?.thumbnail_candidates?.[0]?.path ?? null
}

function NoCut({ p }: { p: ProductionDetail }) {
  return (
    <Card>
      <Empty>{p.engine?.job_id ? 'The engine is still making the first cut; the script streams into the live log meanwhile.' : 'No cut yet.'}</Empty>
    </Card>
  )
}

export function ScriptTab({ p }: { p: ProductionDetail }) {
  const { rev, picker } = useCut(p)
  const h = rev?.handoff
  if (!h) return <NoCut p={p} />
  const words = h.script.text.split(/\s+/).filter(Boolean).length
  return (
    <>
      {picker}
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="min-w-0 space-y-3">
          <VideoPreview path={h.video.path} poster={posterOf(h)} className="max-h-[70vh]" />
          <KV
            className="text-xs"
            rows={[
              ['Length', `${fmtDuration(h.video.duration_s)} · ${words} words`],
              ['Format', `${h.video.width}×${h.video.height} · ${h.video.fps} fps · ${fmtBytesMb(h.video.size_mb)}`],
              ['Captions', h.captions?.srt ? <a href={fileUrl(h.captions.srt)} className="text-accent-ink hover:underline">subtitles.srt</a> : '—'],
              ['Word timings', h.script.words_path ? <a href={fileUrl(h.script.words_path)} className="text-accent-ink hover:underline">words.json</a> : '—'],
            ]}
          />
        </div>
        <div className="min-w-0 space-y-4">
          <Card title={h.script.title} flush>
            <ol className="divide-y divide-line">
              {h.script.lines.map((l) => (
                <li key={l.id} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-2 sm:grid-cols-[7rem_6rem_1fr]">
                  <span className="text-xs text-fg-3 tabular">
                    {fmtTimecode(l.start_s)}–{fmtTimecode(l.end_s)}
                  </span>
                  <span className="hidden text-xs text-fg-2 sm:block">{l.beat}</span>
                  <span>{l.text}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Beats">
            <ol className="space-y-1">
              {h.beats.map((b) => (
                <li key={b.id} className="grid grid-cols-[6.5rem_6rem_1fr] gap-3">
                  <span className="text-xs text-fg-3 tabular">
                    {fmtTimecode(b.start_s)}–{fmtTimecode(b.end_s)}
                  </span>
                  <span className="font-medium">{b.id}</span>
                  <span className="text-fg-2">{b.summary}</span>
                </li>
              ))}
            </ol>
          </Card>
          {!!h.frames.keyframes?.length && (
            <Card title="Keyframes">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {h.frames.keyframes.map((k) => (
                  <figure key={k.path} className="w-20 shrink-0">
                    <FileImage path={k.path} alt={`Frame at ${fmtTimecode(k.t)}`} className="aspect-[9/16] w-full" />
                    <figcaption className="mt-0.5 text-center text-[11px] text-fg-3 tabular">{fmtTimecode(k.t)}</figcaption>
                  </figure>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

const KIND_TONE = { custom: 'progress', three: 'progress', media: 'good', engine: 'neutral', overlay: 'neutral', transition: 'muted' } as const

export function ComponentsTab({ p }: { p: ProductionDetail }) {
  const { rev, picker } = useCut(p)
  const h = rev?.handoff
  if (!h) return <NoCut p={p} />
  return (
    <>
      {picker}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={`Components (${h.components.length})`} flush>
          <ul className="divide-y divide-line">
            {h.components.map((c) => (
              <li key={`${c.kind}-${c.name}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2">
                <span className="font-medium">{c.name}</span>
                <Badge tone={KIND_TONE[c.kind as keyof typeof KIND_TONE] ?? 'neutral'}>{c.kind}</Badge>
                {c.source && <Mono>{c.source}</Mono>}
                {!!c.used_in?.length && <span className="ml-auto text-xs text-fg-3">in {c.used_in.join(', ')}</span>}
              </li>
            ))}
          </ul>
        </Card>
        <div className="min-w-0 space-y-4">
          <Card title="Media and credits" flush>
            <ul className="divide-y divide-line">
              {h.media.map((m) => (
                <li key={m.file} className="px-4 py-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{m.title ?? m.file}</span>
                    <Badge tone="muted">{m.licence}</Badge>
                  </div>
                  <div className="text-xs text-fg-2">
                    {m.author}
                    {m.source_url && (
                      <>
                        {' · '}
                        <ExtLink href={m.source_url}>source</ExtLink>
                      </>
                    )}
                    {' · '}
                    <Mono>{m.file}</Mono>
                  </div>
                </li>
              ))}
              {h.music && (
                <li className="px-4 py-2">
                  <span className="font-medium">Music: {h.music.track ?? '—'}</span>
                  <div className="text-xs text-fg-2">{h.music.credit}</div>
                </li>
              )}
            </ul>
          </Card>
          <Card title="Sources">
            {h.sources.length ? (
              <ul className="space-y-1.5">
                {h.sources.map((s) => (
                  <li key={s.claim}>
                    {s.claim} <ExtLink href={s.url}>{hostOf(s.url)}</ExtLink>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No sources listed.</Empty>
            )}
          </Card>
          {h.style && (
            <Card title={`Style · ${h.style.name ?? 'unnamed'}`}>
              <div className="flex flex-wrap gap-3">
                {Object.entries(h.style.palette ?? {}).map(([role, hex]) => (
                  <span key={role} className="inline-flex items-center gap-1.5 text-xs">
                    <span className="size-4 rounded border border-line" style={{ background: hex }} />
                    {role} <Mono>{hex}</Mono>
                  </span>
                ))}
              </div>
              {!!h.style.fonts?.length && <p className="mt-2 text-xs text-fg-2">Fonts: {h.style.fonts.join(', ')}</p>}
            </Card>
          )}
          {h.decisions.length > 0 && (
            <Card title="Decisions the engine made">
              <ul className="space-y-2">
                {h.decisions.map((d) => (
                  <li key={d.question}>
                    <span className="text-fg-2">{d.question}</span> <span className="font-medium">{d.choice}</span>
                    {!!d.alternatives?.length && <span className="text-xs text-fg-3"> (not: {d.alternatives.join(', ')})</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Engine">
            <KV
              className="text-xs"
              rows={[
                ['Ref', `${h.engine.ref}${h.engine.source ? ` · ${humanize(h.engine.source)}` : ''}`],
                ['Commit', <Mono>{h.engine.commit ?? '—'}</Mono>],
                ['Overlaid files', h.engine.overlay_files != null ? String(h.engine.overlay_files) : '—'],
                ['Build time', fmtDuration(h.engine.build_seconds)],
                ['Score', rev?.scorecard ? <span className={scoreTone(rev.scorecard.total)}>{fmtNumber(rev.scorecard.total, 0)}</span> : '—'],
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  )
}
