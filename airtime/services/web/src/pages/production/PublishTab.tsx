import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { errorMessage, fileUrl } from '../../api/client'
import { useSaveFinalKit } from '../../api/hooks'
import { kitScheduleAt, kitThumbnail } from '../../api/normalize'
import type { FinalKit, ProductionDetail } from '../../api/types'
import { Button, Card, cx, Empty, Field, FileImage, inputCls } from '../../components/ui'
import { fmtDateTime, languageName } from '../../lib/format'
import { allowedActions } from '../../lib/lifecycle'
import { DESCRIPTION_MAX, tagsLength, TAGS_MAX, textProblems, TITLE_MAX } from '../../lib/youtube'

/** ISO (UTC) ⇄ the value of a datetime-local input, in the viewer's zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

const splitTags = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={cx('tabular', n > max ? 'text-bad-ink' : 'text-fg-3')}>{`${n} / ${max}`}</span>
}

function Editor({ p, kit }: { p: ProductionDetail; kit: FinalKit }) {
  const save = useSaveFinalKit(p.production_id)
  const editable = allowedActions(p).editKit
  const [k, setK] = useState<FinalKit>(kit)
  const [tags, setTags] = useState(kit.tags.join(', '))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const set = <K extends keyof FinalKit>(key: K, value: FinalKit[K]) => setK((x) => ({ ...x, [key]: value }))
  const tagList = splitTags(tags)
  const problems = [
    ...textProblems(k.title, TITLE_MAX, 'The title'),
    ...textProblems(k.description, DESCRIPTION_MAX, 'The description'),
    ...(tagsLength(tagList) > TAGS_MAX ? [`The tags are ${tagsLength(tagList) - TAGS_MAX} characters over the ${TAGS_MAX} limit`] : []),
    ...(k.title.trim() ? [] : ['The title is empty']),
  ]
  const thumb = kitThumbnail(k)
  const chosen = p.revisions.find((r) => r.revision === p.chosen_revision) ?? p.revisions[p.revisions.length - 1]
  const candidates = chosen?.handoff?.publish_kit.thumbnail_candidates ?? []
  const scheduleAt = kitScheduleAt(k)

  const submit = async () => {
    setMsg(null)
    try {
      await save.mutateAsync({ ...k, tags: tagList })
      setMsg({ ok: true, text: 'Saved' })
    } catch (err) {
      setMsg({ ok: false, text: errorMessage(err) })
    }
  }

  return (
    <fieldset disabled={!editable || save.isPending} className="grid min-w-0 gap-4 xl:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-4">
        <Card title="Title and description">
          <div className="space-y-3">
            <Field label={<span className="flex justify-between">Title <Counter n={k.title.length} max={TITLE_MAX} /></span>}>
              <input value={k.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
            </Field>
            {!!k.title_alternates?.length && (
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="text-fg-3">Alternatives:</span>
                {k.title_alternates.map((t) => (
                  <button key={t} type="button" onClick={() => set('title', t)} className="rounded-full bg-surface-3 px-2 py-0.5 text-fg-2 hover:text-fg">
                    {t}
                  </button>
                ))}
              </div>
            )}
            <Field label={<span className="flex justify-between">Description <Counter n={k.description.length} max={DESCRIPTION_MAX} /></span>}>
              <textarea value={k.description} onChange={(e) => set('description', e.target.value)} rows={9} className={inputCls} />
            </Field>
            <Field label={<span className="flex justify-between">Tags, comma-separated <Counter n={tagsLength(tagList)} max={TAGS_MAX} /></span>}>
              <textarea value={tags} onChange={(e) => setTags(e.target.value)} rows={2} className={inputCls} />
            </Field>
            <Field label="Hashtags">
              <input value={(k.hashtags ?? []).join(' ')} onChange={(e) => set('hashtags', e.target.value.split(/\s+/).filter(Boolean))} className={inputCls} />
            </Field>
            <Field label="Pinned comment">
              <textarea value={k.pinned_comment ?? ''} onChange={(e) => set('pinned_comment', e.target.value)} rows={2} className={inputCls} />
            </Field>
            {k.credits_text && (
              <Field label="Credits (added to the description by control; CC BY needs them)">
                <p className="rounded-md bg-surface-2 px-2.5 py-1.5 text-xs text-fg-2">{k.credits_text}</p>
              </Field>
            )}
          </div>
        </Card>
        <Card
          title="Localizations"
          actions={
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set('localizations', [...k.localizations, { language: '', title: '', description: '' }])}>
              <Plus aria-hidden className="size-3.5" /> Add
            </Button>
          }
        >
          {k.localizations.length ? (
            <ul className="space-y-3">
              {k.localizations.map((l, i) => {
                const upd = (patch: Partial<typeof l>) => set('localizations', k.localizations.map((x, j) => (j === i ? { ...x, ...patch } : x)))
                return (
                  <li key={i} className="grid gap-2 rounded-md border border-line p-2 sm:grid-cols-[5rem_1fr_auto]">
                    <input value={l.language} onChange={(e) => upd({ language: e.target.value })} className={inputCls} placeholder="hi" aria-label="Language code" title={languageName(l.language)} />
                    <div className="min-w-0 space-y-2">
                      <input value={l.title} onChange={(e) => upd({ title: e.target.value })} className={inputCls} aria-label={`Title (${l.language})`} />
                      <textarea value={l.description} onChange={(e) => upd({ description: e.target.value })} rows={2} className={inputCls} aria-label={`Description (${l.language})`} />
                    </div>
                    <Button variant="ghost" className="self-start px-2" aria-label="Remove" onClick={() => set('localizations', k.localizations.filter((_, j) => j !== i))}>
                      <X aria-hidden className="size-4" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty>No localizations.</Empty>
          )}
        </Card>
      </div>
      <div className="min-w-0 space-y-4">
        <Card title="Publishing">
          <div className="space-y-3">
            <Field label="Visibility">
              <select value={k.visibility ?? 'public'} onChange={(e) => set('visibility', e.target.value as FinalKit['visibility'])} className={inputCls}>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </Field>
            <Field
              label="Publish at (your time; empty publishes at once)"
              hint={k.schedule?.market ? `Suggested: ${k.schedule.market} prime time${k.schedule.why ? `, ${k.schedule.why}` : ''}` : undefined}
            >
              <input type="datetime-local" value={toLocalInput(scheduleAt)} onChange={(e) => set('schedule_at', fromLocalInput(e.target.value))} className={inputCls} />
            </Field>
            {scheduleAt && <p className="text-xs text-fg-3">{fmtDateTime(scheduleAt, { timeZone: 'UTC' })} UTC</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <input value={k.category} onChange={(e) => set('category', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Language">
                <input value={k.language ?? k.default_language ?? ''} onChange={(e) => set('language', e.target.value)} className={inputCls} />
              </Field>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={k.made_for_kids} onChange={(e) => set('made_for_kids', e.target.checked)} /> Made for kids
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={k.altered_content} onChange={(e) => set('altered_content', e.target.checked)} /> Altered or synthetic content
            </label>
          </div>
        </Card>
        <Card title="Thumbnail">
          {thumb ? <FileImage path={thumb} alt="Chosen thumbnail" className="aspect-[9/16] w-32" /> : <Empty>No thumbnail chosen.</Empty>}
          {k.thumbnail?.why && <p className="mt-2 text-xs text-fg-2">{k.thumbnail.why}</p>}
          {candidates.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {candidates.map((c) => (
                <button
                  key={c.path}
                  type="button"
                  title={c.why ?? undefined}
                  onClick={() => setK((x) => ({ ...x, thumbnail_path: c.path, thumbnail: { path: c.path, why: c.why ?? null } }))}
                  className={cx('rounded-md border-2', c.path === thumb ? 'border-accent' : 'border-transparent')}
                >
                  <FileImage path={c.path} alt={c.why ?? 'Thumbnail candidate'} className="aspect-[9/16] w-14" />
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card title="Captions">
          {k.captions.length ? (
            <ul className="space-y-1">
              {k.captions.map((c) => (
                <li key={c.path} className="flex justify-between gap-2">
                  <span>{languageName(c.language)}</span>
                  <a href={fileUrl(c.path)} className="text-xs text-accent-ink hover:underline">
                    {c.language}.srt
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No caption tracks.</Empty>
          )}
        </Card>
      </div>
      <div className="flex flex-wrap items-center gap-3 xl:col-span-2">
        <Button variant="primary" onClick={submit} disabled={!editable || problems.length > 0}>
          {save.isPending ? 'Saving…' : 'Save the final kit'}
        </Button>
        {!editable && <span className="text-xs text-fg-3">The kit can be edited until the upload starts.</span>}
        {msg && <span className={cx('text-xs', msg.ok ? 'text-good-ink' : 'text-bad-ink')}>{msg.text}</span>}
        {[...problems, ...(k.warnings ?? [])].map((w) => (
          <span key={w} className="text-xs text-warn-ink">
            {w}
          </span>
        ))}
      </div>
    </fieldset>
  )
}

export default function PublishTab({ p }: { p: ProductionDetail }) {
  if (!p.final_kit) {
    return (
      <Card>
        <Empty>The final kit (title, description, tags, translations, captions and schedule) is written once a cut is chosen.</Empty>
      </Card>
    )
  }
  // Remount when control sends a newer kit, so the form starts from it.
  return <Editor key={p.final_kit.updated_at ?? 'kit'} p={p} kit={p.final_kit} />
}
