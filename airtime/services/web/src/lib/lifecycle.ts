import type { ProductionDetail, ProductionState, ProductionSummary } from '../api/types'

export type Tone = 'neutral' | 'progress' | 'action' | 'good' | 'warn' | 'bad' | 'muted'

export const STATE_META: Record<ProductionState, { label: string; tone: Tone; hint: string }> = {
  queued: { label: 'Queued', tone: 'neutral', hint: 'Waiting for a free engine slot' },
  briefing: { label: 'Briefing', tone: 'progress', hint: 'brain is writing the GrowthBrief' },
  producing: { label: 'Producing', tone: 'progress', hint: 'The engine is making the cut' },
  scoring: { label: 'Scoring', tone: 'progress', hint: 'The critic is scoring the cut' },
  revising: { label: 'Revising', tone: 'progress', hint: 'The engine is applying the review notes' },
  finalizing: { label: 'Finalising', tone: 'progress', hint: 'Title, description, translations and captions' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'action', hint: 'Ready: one click uploads it' },
  uploading: { label: 'Uploading', tone: 'progress', hint: 'YouTube Studio is being filled in' },
  scheduled: { label: 'Scheduled', tone: 'good', hint: 'Uploaded; goes public at the scheduled time' },
  published: { label: 'Published', tone: 'good', hint: 'Live on the channel' },
  monitoring: { label: 'Monitoring', tone: 'good', hint: 'Analytics checkpoints at 24 h, 72 h, 7 d, 14 d and 28 d' },
  done: { label: 'Done', tone: 'muted', hint: 'Monitoring finished' },
  failed: { label: 'Failed', tone: 'bad', hint: 'Stopped with an error' },
  cancelled: { label: 'Cancelled', tone: 'muted', hint: 'Cancelled' },
  needs_attention: { label: 'Needs attention', tone: 'warn', hint: 'Waiting for you' },
}

export function stateMeta(state: string) {
  return STATE_META[state as ProductionState] ?? { label: state, tone: 'neutral' as Tone, hint: '' }
}

export const REASON_META: Record<string, { label: string; description: string }> = {
  upload_failed: {
    label: 'Upload failed',
    description: 'The automatic upload failed on every attempt. Upload it by hand with the kit below, then mark it as uploaded so monitoring continues.',
  },
  hard_gate: {
    label: 'Hard gate failed',
    description:
      'Every cut failed a hard gate (technical ≥ 60, accuracy ≥ 70 or policy ≥ 70), so nothing was uploaded. Choose a cut and press Upload anyway, or upload one by hand and mark it.',
  },
  engine_failed: {
    label: 'Engine failed',
    description: 'The engine job stopped with an error. Read the live log, then send another revision or cancel.',
  },
  claude_unavailable: {
    label: 'No Claude account',
    description: 'Every Claude account is signed out or cooling down. control retries the step when the earliest cooldown ends.',
  },
  youtube_session: {
    label: 'YouTube signed out',
    description: 'Chrome is not reachable or YouTube Studio is signed out. Run `airtime chrome`, sign in, then try the upload again.',
  },
  other: { label: 'Needs a look', description: 'Something unexpected happened; the error and the timeline below have the details.' },
}

export function reasonMeta(reason: string | null | undefined) {
  if (!reason) return null
  return REASON_META[reason] ?? { label: reason.replace(/_/g, ' '), description: 'See the error and the timeline below.' }
}

export const ACTIVE: ProductionState[] = ['queued', 'briefing', 'producing', 'scoring', 'revising', 'finalizing', 'uploading']
export const LIVE: ProductionState[] = ['scheduled', 'published', 'monitoring', 'done']
export const ENGINE_BUSY: ProductionState[] = ['producing', 'revising']

export const isActive = (s: string) => ACTIVE.includes(s as ProductionState)
export const isLive = (s: string) => LIVE.includes(s as ProductionState)
export const isClosed = (s: string) => ['done', 'failed', 'cancelled'].includes(s)

/** The lifecycle as the owner sees it. */
export const STEPS = ['Brief', 'Produce', 'Score', 'Revise', 'Finalise', 'Upload', 'Live'] as const

const STEP_OF: Partial<Record<string, number>> = {
  queued: 0,
  briefing: 0,
  producing: 1,
  scoring: 2,
  revising: 3,
  finalizing: 4,
  awaiting_approval: 5,
  uploading: 5,
  scheduled: 6,
  published: 6,
  monitoring: 6,
  done: 6,
}

const REASON_STEP: Record<string, number> = {
  upload_failed: 5,
  youtube_session: 5,
  hard_gate: 4,
  engine_failed: 1,
}

export interface StepPosition {
  /** The step the production is on (or stopped at). */
  index: number
  /** stopped: failed/cancelled/needs attention at this step. */
  status: 'active' | 'waiting' | 'stopped' | 'complete'
}

export function stepPosition(p: Pick<ProductionSummary, 'state' | 'attention_reason'> & { timeline?: ProductionDetail['timeline'] }): StepPosition {
  const s = p.state
  if (s === 'done') return { index: 6, status: 'complete' }
  if (s in STEP_OF && s !== 'awaiting_approval') return { index: STEP_OF[s]!, status: isLive(s) ? 'complete' : 'active' }
  if (s === 'awaiting_approval') return { index: 5, status: 'waiting' }
  // failed / cancelled / needs_attention: where it stopped.
  if (s === 'needs_attention' && p.attention_reason && p.attention_reason in REASON_STEP) {
    return { index: REASON_STEP[p.attention_reason], status: 'stopped' }
  }
  const last = [...(p.timeline ?? [])].reverse().find((t) => t.state in STEP_OF)
  return { index: last ? STEP_OF[last.state]! : 0, status: 'stopped' }
}

/** Which manual buttons make sense now. control is the judge; this only hides the obviously wrong ones. */
export function allowedActions(p: Pick<ProductionDetail, 'state' | 'attention_reason' | 'revisions'>) {
  const s = p.state
  const reason = p.attention_reason ?? null
  const hasCut = p.revisions.some((r) => r.handoff)
  const deciding = s === 'awaiting_approval' || s === 'needs_attention' || s === 'finalizing'
  return {
    cancel: ['queued', 'briefing', 'producing', 'scoring', 'revising', 'finalizing', 'awaiting_approval', 'needs_attention'].includes(s),
    revise: hasCut && (s === 'awaiting_approval' || s === 'failed' || (s === 'needs_attention' && reason !== 'upload_failed')),
    rescore: hasCut && (deciding || s === 'failed'),
    choose: hasCut && deciding,
    editKit: s === 'finalizing' || s === 'awaiting_approval' || s === 'needs_attention',
    approve: s === 'awaiting_approval',
    uploadAnyway: s === 'needs_attention' && reason === 'hard_gate',
    retryUpload: s === 'needs_attention' && (reason === 'upload_failed' || reason === 'youtube_session'),
    markUploaded: s === 'needs_attention' || s === 'awaiting_approval',
  }
}
