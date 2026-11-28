/**
 * Tolerant readers for the places where contract I leaves a choice to control (a list or an
 * `{items}` wrapper, `id` or `<kind>_id`, where the needs_attention reason lives, …). Everything
 * the pages render goes through these, so a different but reasonable spelling still works.
 */
import type {
  AutopilotSettings,
  ClaudeAccounts,
  FinalKit,
  Learning,
  Opportunity,
  ProductionDetail,
  ProductionSummary,
  ProductionUpload,
  Revision,
  ServiceHealth,
  SignalPack,
  SystemStatus,
  UploadAttempt,
  VideoDetail,
  VideoSummary,
} from './types'

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)

/** A list response: a bare array, or the first array found under the given keys or `items`/`data`/`results`. */
export function asList<T>(raw: unknown, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (isObj(raw)) {
    for (const k of [...keys, 'items', 'data', 'results']) {
      const v = raw[k]
      if (Array.isArray(v)) return v as T[]
    }
  }
  return []
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

export function attentionReason(p: Partial<ProductionSummary> & Obj): string | null {
  const direct =
    str(p.attention_reason) ??
    str(p.needs_attention_reason) ??
    (isObj(p.needs_attention) ? str(p.needs_attention.reason) : str(p.needs_attention)) ??
    (isObj(p.attention) ? str(p.attention.reason) : null) ??
    str(p.reason)
  if (direct) return direct
  if (p.state === 'needs_attention' && isObj(p.error)) return str(p.error.code)
  return null
}

export function normalizeProduction<T extends ProductionSummary>(raw: unknown): T {
  const p = (isObj(raw) ? raw : {}) as Obj
  const production_id = str(p.production_id) ?? str(p.id) ?? ''
  const markets = Array.isArray(p.markets) ? p.markets : []
  return {
    ...p,
    production_id,
    topic: str(p.topic) ?? '(untitled)',
    state: (str(p.state) ?? 'queued') as ProductionSummary['state'],
    attention_reason: attentionReason(p as Partial<ProductionSummary> & Obj),
    best_score: typeof p.best_score === 'number' ? p.best_score : typeof p.score === 'number' ? p.score : null,
    markets: markets.map((m) => (typeof m === 'string' ? { code: m, weight: 0 } : m)),
    created_at: str(p.created_at) ?? str(p.updated_at) ?? new Date(0).toISOString(),
    updated_at: str(p.updated_at) ?? str(p.created_at) ?? null,
  } as unknown as T
}

export function normalizeUpload(raw: unknown): ProductionUpload | null {
  if (!isObj(raw)) return null
  let attempts: UploadAttempt[]
  if (Array.isArray(raw.attempts)) {
    attempts = (raw.attempts as Obj[]).map((a, i) => ({
      ...(a as unknown as UploadAttempt),
      n: typeof a.n === 'number' ? a.n : typeof a.attempt === 'number' ? a.attempt : i + 1,
      steps: Array.isArray(a.steps) ? (a.steps as UploadAttempt['steps']) : [],
    }))
  } else if (Array.isArray(raw.steps) || str(raw.upload_id)) {
    // A single youtube upload status (contract H) without the attempts list.
    attempts = [
      {
        n: 1,
        upload_id: str(raw.upload_id) ?? 'upl_?',
        state: (str(raw.state) ?? 'queued') as UploadAttempt['state'],
        video_id: str(raw.video_id),
        url: str(raw.url),
        steps: (raw.steps as UploadAttempt['steps']) ?? [],
        error: (raw.error as UploadAttempt['error']) ?? null,
      },
    ]
  } else {
    attempts = []
  }
  attempts.sort((a, b) => a.n - b.n)
  const last = attempts[attempts.length - 1]
  return {
    ...(raw as unknown as ProductionUpload),
    state: str(raw.state) ?? (raw.manual === true ? 'manual' : null) ?? last?.state ?? 'pending',
    max_attempts: typeof raw.max_attempts === 'number' ? raw.max_attempts : 3,
    attempts,
    video_id: str(raw.video_id) ?? [...attempts].reverse().find((a) => a.video_id)?.video_id ?? null,
    url: str(raw.url) ?? [...attempts].reverse().find((a) => a.url)?.url ?? null,
  }
}

export function normalizeDetail(raw: unknown): ProductionDetail {
  const base = normalizeProduction<ProductionDetail>(raw)
  const p = (isObj(raw) ? raw : {}) as Obj
  const revisions = asList<Revision & Obj>(p.revisions)
    .map((r) => {
      const sc = r.scorecard as (Revision['scorecard'] & Obj) | null | undefined
      // Review notes belong to the revision; accept them inside the scorecard too.
      const notes = r.review_notes ?? (sc && isObj(sc.review_notes) ? (sc.review_notes as unknown as Revision['review_notes']) : null)
      return { ...r, handoff: r.handoff ?? null, scorecard: sc ?? null, review_notes: notes ?? null } as Revision
    })
    .sort((a, b) => a.revision - b.revision)
  return {
    ...base,
    opportunity: (p.opportunity as ProductionDetail['opportunity']) ?? null,
    brief: (p.brief as ProductionDetail['brief']) ?? null,
    engine: (p.engine as ProductionDetail['engine']) ?? null,
    revisions,
    chosen_revision: typeof p.chosen_revision === 'number' ? p.chosen_revision : null,
    final_kit: (p.final_kit as FinalKit | null) ?? null,
    upload: normalizeUpload(p.upload),
    error: (p.error as ProductionDetail['error']) ?? null,
    timeline: asList<ProductionDetail['timeline'][number]>(p.timeline),
  }
}

/** The rubric threshold (90 unless the brief or scorecard says otherwise). */
export function thresholdOf(p: Pick<ProductionDetail, 'brief'> | null | undefined, sc?: Revision['scorecard']): number {
  return sc?.threshold ?? p?.brief?.rubric?.threshold ?? 90
}

/** A cut passes with a total at or above the threshold and no failed hard gate. */
export function scorePasses(sc: Revision['scorecard'], threshold: number): boolean {
  return !!sc && sc.gates_passed !== false && (sc.failed_gates?.length ?? 0) === 0 && sc.total >= threshold
}

export function failedGates(sc: Revision['scorecard']): string[] {
  if (!sc) return []
  if (sc.failed_gates?.length) return sc.failed_gates
  return []
}

export function normalizeOpportunity(raw: unknown): Opportunity {
  const o = (isObj(raw) ? raw : {}) as Obj
  return {
    ...(o as unknown as Opportunity),
    opportunity_id: str(o.opportunity_id) ?? str(o.id) ?? '',
    markets: Array.isArray(o.markets) ? (o.markets as Opportunity['markets']) : [],
    evidence: Array.isArray(o.evidence) ? (o.evidence as Opportunity['evidence']) : [],
    risks: Array.isArray(o.risks) ? (o.risks as string[]) : [],
    status: str(o.status) ?? 'new',
  }
}

export function normalizeLearning(raw: unknown): Learning {
  const l = (isObj(raw) ? raw : {}) as Obj
  return {
    ...(l as unknown as Learning),
    learning_id: str(l.learning_id) ?? str(l.id) ?? '',
    evidence: Array.isArray(l.evidence) ? (l.evidence as string[]) : [],
    applies_to: Array.isArray(l.applies_to) ? (l.applies_to as string[]) : [],
    status: str(l.status) ?? 'active',
  }
}

export function normalizeVideo<T extends VideoSummary>(raw: unknown): T {
  const v = (isObj(raw) ? raw : {}) as Obj
  return { ...(v as unknown as T), video_id: str(v.video_id) ?? str(v.id) ?? '' }
}

export function normalizeVideoDetail(raw: unknown): VideoDetail {
  const v = normalizeVideo<VideoDetail>(raw)
  const r = (isObj(raw) ? raw : {}) as Obj
  return {
    ...v,
    snapshots: asList(r.snapshots),
    by_country: asList(r.by_country),
    traffic: asList(r.traffic ?? r.traffic_sources),
    retention: asList(r.retention),
    script_lines: asList(r.script_lines),
    diagnosis: (r.diagnosis as VideoDetail['diagnosis']) ?? null,
  }
}

export function signalPacks(raw: unknown): SignalPack[] {
  return asList<SignalPack>(raw, 'packs').map((p) => ({
    ...p,
    items: Array.isArray(p.items) ? p.items : [],
    errors: Array.isArray(p.errors) ? p.errors : [],
  }))
}

export function servicesFrom(status: SystemStatus | undefined | null): ServiceHealth[] {
  if (!status?.services) return []
  const s = status.services
  const list: ServiceHealth[] = Array.isArray(s)
    ? s
    : Object.entries(s).map(([name, v]) => ({ name, ...(isObj(v) ? (v as Omit<ServiceHealth, 'name'>) : { ok: v === true }) }))
  return list.map((svc) => {
    const ok = typeof svc.ok === 'boolean' ? svc.ok : svc.status === 'ok'
    return { ...svc, ok, status: svc.status ?? (ok ? 'ok' : 'down') }
  })
}

export function accountsFrom(status: SystemStatus | undefined | null): ClaudeAccounts | null {
  if (!status) return null
  const s = status as SystemStatus & Obj
  const candidates = [s.claude, s.claude_accounts, s.accounts]
  for (const c of candidates) {
    if (Array.isArray(c)) return { strategy: 'least_used', accounts: c as ClaudeAccounts['accounts'] }
    if (isObj(c) && Array.isArray(c.accounts)) return c as unknown as ClaudeAccounts
  }
  return null
}

/** `GET /api/settings` may return the autopilot settings or wrap them. */
export function settingsFrom(raw: unknown): AutopilotSettings | null {
  if (!isObj(raw)) return null
  if ('mode' in raw && 'schedules' in raw) return raw as unknown as AutopilotSettings
  for (const k of ['autopilot', 'settings']) {
    const v = raw[k]
    if (isObj(v) && 'mode' in v) return v as unknown as AutopilotSettings
  }
  return 'mode' in raw ? (raw as unknown as AutopilotSettings) : null
}

export function kitLanguage(kit: FinalKit | null | undefined): string {
  return kit?.language ?? kit?.default_language ?? 'en'
}

export function kitThumbnail(kit: FinalKit | null | undefined): string | null {
  return kit?.thumbnail_path ?? kit?.thumbnail?.path ?? null
}

export function kitScheduleAt(kit: FinalKit | null | undefined): string | null {
  return kit?.schedule_at ?? kit?.schedule?.at ?? null
}
