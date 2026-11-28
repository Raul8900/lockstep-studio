import { CircleCheck, CircleX, Download, ExternalLink } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { basename, errorMessage, fileUrl } from '../../api/client'
import { useMarkUploaded } from '../../api/hooks'
import { kitLanguage, kitScheduleAt, kitThumbnail } from '../../api/normalize'
import type { ProductionDetail, UploadAttempt } from '../../api/types'
import { Badge, Button, Card, CopyButton, cx, Empty, ExtLink, FileImage, inputCls, KV, Mono } from '../../components/ui'
import { errorText } from '../../lib/events'
import { fmtBytesMb, fmtDateTime, fmtDuration, fmtRelative, humanize, languageName } from '../../lib/format'
import { parseVideoId, studioUrl, tagsForStudio, watchUrl } from '../../lib/youtube'
import { cutLabel } from './CutTabs'

const ATTEMPT_TONE: Record<string, 'good' | 'bad' | 'progress' | 'warn'> = {
  published: 'good',
  scheduled: 'good',
  failed: 'bad',
  needs_attention: 'warn',
  running: 'progress',
  queued: 'progress',
}

function Attempt({ a, max }: { a: UploadAttempt; max: number }) {
  const err = errorText(a.error)
  return (
    <Card
      title={`Attempt ${a.n} of ${max}`}
      actions={
        <>
          {a.resume_video_id && <Badge tone="muted">continued on {a.resume_video_id}</Badge>}
          <Badge tone={ATTEMPT_TONE[a.state] ?? 'neutral'} icon>
            {humanize(a.state)}
          </Badge>
        </>
      }
      flush
    >
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 py-2 text-xs text-fg-2">
        <span>
          Task <Mono>{a.upload_id}</Mono>
        </span>
        {a.video_id && (
          <span>
            Video <ExtLink href={studioUrl(a.video_id)}>{a.video_id}</ExtLink>
          </span>
        )}
        {a.started_at && <span>Started {fmtDateTime(a.started_at)}</span>}
        {a.finished_at && a.started_at && <span>took {fmtDuration((Date.parse(a.finished_at) - Date.parse(a.started_at)) / 1000)}</span>}
      </div>
      {err && <p className="mx-4 mb-2 rounded-md bg-bad-soft px-3 py-2 font-mono text-xs text-bad-ink">{err}</p>}
      {a.steps.length ? (
        <ol className="divide-y divide-line border-t border-line">
          {a.steps.map((s, i) => (
            <li key={i} className="grid grid-cols-[1.25rem_1fr_auto] items-start gap-3 px-4 py-2">
              {s.ok ? <CircleCheck aria-label="ok" className="mt-0.5 size-4 text-good-ink" /> : <CircleX aria-label="failed" className="mt-0.5 size-4 text-bad-ink" />}
              <span className="min-w-0">
                <span className="font-medium">{humanize(s.name)}</span>
                {s.detail && <span className="block break-words text-xs text-fg-2">{s.detail}</span>}
                {s.at && <span className="block text-xs text-fg-3">{fmtDateTime(s.at)}</span>}
              </span>
              {s.screenshot ? (
                <a href={fileUrl(s.screenshot)} target="_blank" rel="noreferrer" title="Open the screenshot">
                  <FileImage path={s.screenshot} alt={`Screenshot: ${s.name}`} className="h-14 w-24" />
                </a>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ol>
      ) : (
        <Empty>No steps recorded.</Empty>
      )}
    </Card>
  )
}

export function UploadLog({ p }: { p: ProductionDetail }) {
  const u = p.upload
  if (!u || (!u.attempts.length && !u.video_id)) {
    return (
      <Card>
        <Empty>Nothing has been uploaded yet. Each upload attempt (at most three) and its step screenshots appear here.</Empty>
      </Card>
    )
  }
  return (
    <div className="space-y-4">
      <Card>
        <KV
          rows={[
            ['State', <Badge tone={ATTEMPT_TONE[u.state ?? ''] ?? 'neutral'}>{humanize(u.state)}</Badge>],
            ['Attempts', `${u.attempts.length} of ${u.max_attempts}`],
            ['Video', u.url ? <ExtLink href={u.url}>{u.url}</ExtLink> : u.video_id ? <ExtLink href={watchUrl(u.video_id)}>{u.video_id}</ExtLink> : '—'],
            ['Uploaded by', u.manual ? 'You, by hand (marked as uploaded)' : 'Airtime'],
            ...(u.schedule_at ? ([['Goes public', `${fmtDateTime(u.schedule_at)} (${fmtRelative(u.schedule_at)})`]] as [string, string][]) : []),
          ]}
        />
      </Card>
      {[...u.attempts].reverse().map((a) => (
        <Attempt key={a.upload_id} a={a} max={u.max_attempts} />
      ))}
    </div>
  )
}

function CopyRow({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 border-t border-line py-2 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-2">{label}</span>
        <CopyButton text={value} />
      </div>
      {children ?? <p className="mt-1 whitespace-pre-wrap break-words">{value || '—'}</p>}
    </div>
  )
}

/** Addendum F: everything needed to upload by hand after the third failed attempt. */
export function UploadManually({ p }: { p: ProductionDetail }) {
  const kit = p.final_kit
  const cut = p.revisions.find((r) => r.revision === p.chosen_revision) ?? p.revisions[p.revisions.length - 1]
  const video = kit?.video_path ?? cut?.handoff?.video.path ?? null
  const thumb = kitThumbnail(kit)
  const scheduleAt = kitScheduleAt(kit)
  const created = [...(p.upload?.attempts ?? [])].reverse().find((a) => a.video_id)?.video_id ?? p.upload?.video_id ?? null
  if (!kit) return null
  return (
    <Card title="Upload manually" className="mb-4 border-warn/60" actions={<ExtLink href="https://studio.youtube.com">Open YouTube Studio</ExtLink>}>
      <p className="mb-3 text-fg-2">
        Upload this cut in YouTube Studio with the details below, then paste its link into <span className="font-medium text-fg">Mark as uploaded</span> so Airtime
        keeps monitoring it.
      </p>
      {created && (
        <p className="mb-3 rounded-md bg-warn-soft px-3 py-2 text-warn-ink">
          An earlier attempt already created video <Mono>{created}</Mono>. Finish that one instead of uploading a duplicate:{' '}
          <ExtLink href={studioUrl(created)}>edit it in Studio</ExtLink>.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <div className="min-w-0 space-y-3">
          {video ? (
            <a href={fileUrl(video)} download={basename(video)} className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 font-medium text-on-accent hover:bg-accent-hover">
              <Download aria-hidden className="size-4 shrink-0" />
              <span className="min-w-0 truncate">Download {basename(video)}</span>
            </a>
          ) : (
            <p className="text-bad-ink">No video file is recorded for the chosen cut.</p>
          )}
          {cut?.handoff && (
            <p className="text-xs text-fg-3">
              {cutLabel(cut.revision)} · {fmtDuration(cut.handoff.video.duration_s)} · {fmtBytesMb(cut.handoff.video.size_mb)}
            </p>
          )}
          {thumb && (
            <div>
              <FileImage path={thumb} alt="Thumbnail" className="aspect-[9/16] w-28" />
              <a href={fileUrl(thumb)} download={basename(thumb)} className="mt-1 inline-flex items-center gap-1 text-xs text-accent-ink hover:underline">
                <Download aria-hidden className="size-3.5" /> Thumbnail
              </a>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-fg-2">Captions</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {kit.captions.map((c) => (
                <li key={c.path}>
                  <a href={fileUrl(c.path)} download={basename(c.path)} className="text-accent-ink hover:underline">
                    {languageName(c.language)} ({c.language})
                  </a>
                </li>
              ))}
              {!kit.captions.length && <li className="text-fg-3">None</li>}
            </ul>
          </div>
          <KV
            className="text-xs"
            rows={[
              ['Category', kit.category],
              ['Language', languageName(kitLanguage(kit))],
              ['Made for kids', kit.made_for_kids ? 'Yes' : 'No'],
              ['Altered content', kit.altered_content ? 'Yes' : 'No'],
              ['Visibility', humanize(kit.visibility ?? 'public')],
              ['Schedule', scheduleAt ? `${fmtDateTime(scheduleAt)} (your time)` : 'Publish now'],
            ]}
          />
          {kit.schedule?.why && <p className="text-xs text-fg-3">{kit.schedule.why}</p>}
        </div>
        <div className="min-w-0">
          <CopyRow label="Title" value={kit.title} />
          <CopyRow label="Description" value={kit.description}>
            <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-surface-2 px-2.5 py-1.5 text-xs">{kit.description}</p>
          </CopyRow>
          <CopyRow label="Tags" value={tagsForStudio(kit.tags)} />
          {kit.pinned_comment && <CopyRow label="Pinned comment" value={kit.pinned_comment} />}
          {kit.localizations.map((l) => (
            <CopyRow key={l.language} label={`${languageName(l.language)} (${l.language}): title and description`} value={`${l.title}\n\n${l.description}`}>
              <p className="mt-1 font-medium">{l.title}</p>
              <p className="whitespace-pre-wrap break-words text-xs text-fg-2">{l.description}</p>
            </CopyRow>
          ))}
        </div>
      </div>
    </Card>
  )
}

/** POST /api/productions/{id}/mark-uploaded {video_url}: monitoring continues as if Airtime had uploaded it. */
export function MarkUploaded({ id }: { id: string }) {
  const mark = useMarkUploaded(id)
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const videoId = parseVideoId(url)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!videoId) return setError('Paste a YouTube link (watch, shorts or youtu.be) or the 11-character video id.')
    try {
      await mark.mutateAsync(url.trim())
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <Card title="Mark as uploaded" className="mb-4">
      <form onSubmit={submit} className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-72">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputCls}
            placeholder="https://youtube.com/shorts/… or the video id"
            aria-label="YouTube link or video id"
            aria-invalid={!!error}
          />
          <p className={cx('mt-1 text-xs', error ? 'text-bad-ink' : 'text-fg-3')}>
            {error ??
              (videoId ? (
                <>
                  Video id <Mono>{videoId}</Mono> ·{' '}
                  <a href={watchUrl(videoId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent-ink hover:underline">
                    check it <ExternalLink aria-hidden className="size-3" />
                  </a>
                </>
              ) : (
                'After you upload it yourself, Airtime monitors it like its own uploads.'
              ))}
          </p>
        </div>
        <Button type="submit" variant="primary" disabled={mark.isPending || !url.trim()}>
          {mark.isPending ? 'Saving…' : 'Mark as uploaded'}
        </Button>
      </form>
    </Card>
  )
}
