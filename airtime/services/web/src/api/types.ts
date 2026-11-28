/**
 * The shapes the dashboard reads from control (contract I) and every shape it embeds:
 * GrowthBrief (A), ReviewNotes (B), Handoff (C), JobEvent (D), Diagnosis (F), analytics (H),
 * Claude accounts (addendum B) and upload attempts (addendum F).
 *
 * Times are UTC ISO-8601 strings; ids are a prefix plus a ULID. Fields the contracts leave open
 * are optional here, and `api/normalize.ts` accepts the few spellings control might reasonably use.
 */

export type ISODate = string

export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------------------------
// Production lifecycle

export const PRODUCTION_STATES = [
  'queued',
  'briefing',
  'producing',
  'scoring',
  'revising',
  'finalizing',
  'awaiting_approval',
  'uploading',
  'scheduled',
  'published',
  'monitoring',
  'done',
  'failed',
  'cancelled',
  'needs_attention',
] as const
export type ProductionState = (typeof PRODUCTION_STATES)[number]

/** control-api.schema.json `attention_reason`; anything new is shown by its code. */
export const ATTENTION_REASONS = ['upload_failed', 'hard_gate', 'engine_failed', 'claude_unavailable', 'youtube_session', 'other'] as const
export type AttentionReason = (typeof ATTENTION_REASONS)[number] | (string & {})

export const JOB_STAGES = ['briefing', 'media', 'scripting', 'voicing', 'scenes', 'rendering', 'qa', 'packaging'] as const
export type JobStage = (typeof JOB_STAGES)[number]
export type JobState = 'queued' | 'preparing' | 'running' | 'revising' | 'packaging' | 'completed' | 'failed' | 'cancelled'

export interface MarketWeight {
  code: string
  weight: number
}

export interface TokenUsage {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

/** control-api.schema.json `production_summary` (the optional extras are shown when control sends them). */
export interface ProductionSummary {
  production_id: string
  topic: string
  angle?: string | null
  state: ProductionState
  /** Set when state is needs_attention: upload_failed, hard_gate, engine_failed, … */
  attention_reason?: AttentionReason | null
  /** The revision the engine is on (0 = first cut). */
  revision?: number | null
  /** Best weighted total so far, 0–100. */
  best_score?: number | null
  stage?: JobStage | null
  format?: 'short' | 'long' | null
  markets?: MarketWeight[]
  origin?: 'manual' | 'autopilot' | 'opportunity' | (string & {}) | null
  opportunity_id?: string | null
  video_id?: string | null
  video_url?: string | null
  scheduled_at?: ISODate | null
  published_at?: ISODate | null
  error?: ApiErrorBody | string | null
  created_at: ISODate
  updated_at?: ISODate | null
}

// --- A. GrowthBrief ---------------------------------------------------------------------------

export interface RubricDimension {
  id: string
  weight: number
  what: string
  deterministic?: boolean
}

export interface GrowthBrief {
  schema_version: '1'
  brief_id: string
  opportunity_id: string | null
  created_at: ISODate
  format: 'short' | 'long'
  duration_s: { target: number; max: number }
  topic: string
  angle: string
  why_now: string
  audience: string
  markets: MarketWeight[]
  language: string
  tone: string[]
  hook_options: string[]
  title_options: string[]
  keywords: { primary: string[]; secondary: string[] }
  must_include: string[]
  avoid: string[]
  visual_direction: string
  give_time_to: string[]
  music_mood: string
  competitors: { title: string; url: string; views: number | null; age_days: number | null; duration_s: number | null; takeaway: string }[]
  learnings: { id: string; statement: string; weight: number }[]
  rubric: { threshold: number; dimensions: RubricDimension[] }
  engine_request_md: string
}

// --- B. ReviewNotes ---------------------------------------------------------------------------

export interface ReviewNote {
  /** 1 = most important. */
  priority: number
  dimension: string
  at_s?: number | null
  beat?: string | null
  issue: string
  change: string
  /** Points of total score this change should add. */
  expected_gain?: number | null
}

export interface ReviewNotes {
  round: number
  score: number
  threshold: number
  summary: string
  notes: ReviewNote[]
  keep: string[]
  engine_feedback_md: string
}

// --- C. Handoff -------------------------------------------------------------------------------

export interface ScriptLine {
  id: string
  beat?: string | null
  text: string
  start_s: number
  end_s: number
}

export interface Beat {
  id: string
  start_s: number
  end_s: number
  summary?: string | null
}

export type ComponentKind = 'custom' | 'engine' | 'media' | 'transition' | 'overlay' | 'three'

export interface QaSummary {
  loudness_lufs: number | null
  true_peak_dbtp: number | null
  sync_ms: number | null
  wer_percent: number | null
  freeze_segments: number | null
  black_segments: number | null
  decode_errors: number | null
  lint_warnings: number | null
}

export interface PublishKit {
  title_options: string[]
  description: string
  tags: string[]
  hashtags?: string[]
  category?: string | null
  language?: string | null
  made_for_kids?: boolean
  altered_content?: boolean
  thumbnail_candidates?: { path: string; t?: number | null; why?: string | null }[]
  chapters?: { t: number; title: string }[]
  credits_text?: string | null
  pinned_comment?: string | null
}

export interface EngineRef {
  ref: string
  commit: string | null
  build_seconds?: number | null
  source?: 'ref' | 'working_tree' | (string & {})
  /** How many uncommitted files were overlaid (ENGINE_SOURCE=working_tree). */
  overlay_files?: number | null
}

export interface Handoff {
  schema_version: '1'
  job_id: string
  revision: number
  slug: string
  status: 'completed' | 'unfinished'
  video: { path: string; phone_path?: string | null; duration_s: number; width: number; height: number; fps: number; size_mb?: number | null }
  script: { title: string; text: string; lines: ScriptLine[]; words_path?: string | null }
  beats: Beat[]
  components: { name: string; kind: ComponentKind | (string & {}); source?: string | null; used_in?: string[] }[]
  style?: { name?: string | null; palette?: Record<string, string>; fonts?: string[]; path?: string | null } | null
  media: { file: string; title?: string | null; licence: string; author?: string | null; source_url?: string | null }[]
  music: { track?: string | null; credit?: string | null } | null
  sources: { claim: string; url: string }[]
  qa: { passed: boolean; validation_path?: string | null; summary: Partial<QaSummary>; issues: string[] }
  frames: { contact_sheet?: string | null; keyframes?: { t: number; path: string }[] }
  captions: { srt?: string | null; language?: string | null } | null
  publish_kit: PublishKit
  decisions: { question: string; choice: string; alternatives?: string[] }[]
  engine: EngineRef
  notes?: string | null
}

// --- Scoring (control) ------------------------------------------------------------------------

export interface ScoreDimension {
  id: string
  score: number
  weight: number
  evidence?: string | null
  issues?: string[]
}

/** control-api.schema.json `scorecard`. Pass = total ≥ the rubric threshold and gates_passed. */
export interface Scorecard {
  /** Weighted total, 0–100, after a failed gate capped it at threshold − 1. */
  total: number
  /** Before a failed gate capped it. */
  raw_total?: number | null
  gates_passed: boolean
  /** Dimension ids whose hard gate failed. */
  failed_gates?: string[]
  dimensions: ScoreDimension[]
  predicted?: { avg_view_pct?: number | null; viewed_vs_swiped_pct?: number | null } | null
  /** Optional extras. */
  threshold?: number | null
  scored_at?: ISODate | null
}

export interface Revision {
  revision: number
  state?: string | null
  handoff: Handoff | null
  scorecard: Scorecard | null
  /** The critic's notes on this cut, sent to the engine for the next round. */
  review_notes?: ReviewNotes | null
  started_at?: ISODate | null
  finished_at?: ISODate | null
}

// --- Final kit (control, from the seo and translator roles) -----------------------------------

export type Visibility = 'public' | 'unlisted' | 'private'

export interface Localization {
  language: string
  title: string
  description: string
}

export interface CaptionTrack {
  language: string
  path: string
}

export interface FinalKit {
  video_path?: string | null
  title: string
  title_alternates?: string[]
  description: string
  tags: string[]
  hashtags?: string[]
  category: string
  /** Contract H calls it `language`; the seo role calls it `default_language`. */
  language?: string | null
  default_language?: string | null
  made_for_kids: boolean
  altered_content: boolean
  visibility?: Visibility | null
  schedule_at?: ISODate | null
  schedule?: { market?: string | null; why?: string | null; at?: ISODate | null } | null
  thumbnail_path?: string | null
  thumbnail?: { path: string; why?: string | null } | null
  captions: CaptionTrack[]
  localizations: Localization[]
  pinned_comment?: string | null
  playlist?: string | null
  credits_text?: string | null
  warnings?: string[]
  updated_at?: ISODate | null
}

// --- Upload (contract H plus addendum F's attempts) --------------------------------------------

export type UploadState = 'queued' | 'running' | 'scheduled' | 'published' | 'failed' | 'needs_attention'

export interface UploadStep {
  name: string
  ok: boolean
  screenshot: string | null
  at: ISODate | null
  detail: string | null
}

/** control-api.schema.json `upload_attempt` (1–3), each one youtube upload task. */
export interface UploadAttempt {
  n: number
  upload_id: string
  state: UploadState | (string & {})
  video_id?: string | null
  url?: string | null
  /** Set when this attempt continued on a video an earlier attempt had already created. */
  resume_video_id?: string | null
  steps: UploadStep[]
  error?: ApiErrorBody | string | null
  started_at?: ISODate | null
  finished_at?: ISODate | null
}

export interface ProductionUpload {
  state?: UploadState | 'pending' | 'manual' | (string & {}) | null
  max_attempts: number
  attempts: UploadAttempt[]
  video_id: string | null
  url: string | null
  /** True when the owner uploaded by hand and marked it. */
  manual?: boolean
  visibility?: Visibility | null
  schedule_at?: ISODate | null
  published_at?: ISODate | null
}

export interface ClaudeRun {
  account_id?: string | null
  session_id?: string | null
  model?: string | null
  effort?: string | null
  turns?: number | null
  usage?: TokenUsage | null
  duration_ms?: number | null
}

export interface ProductionDetail extends ProductionSummary {
  opportunity: Opportunity | null
  brief: GrowthBrief | null
  engine: {
    job_id: string | null
    state: JobState | null
    stage: JobStage | null
    revision: number | null
    claude: ClaudeRun | null
    /** Set while the job waits for a Claude account to come out of cooldown. */
    retry_at?: ISODate | null
    slug?: string | null
    error?: ApiErrorBody | string | null
  } | null
  revisions: Revision[]
  chosen_revision: number | null
  final_kit: FinalKit | null
  upload: ProductionUpload | null
  error?: ApiErrorBody | string | null
  timeline: { at: ISODate; state: ProductionState | (string & {}); note?: string | null }[]
}

// --- D. Engine job events (proxied by control) -------------------------------------------------

export const JOB_EVENT_TYPES = [
  'job.state_changed',
  'stage.changed',
  'agent.message',
  'agent.tool',
  'file.changed',
  'script.updated',
  'components.updated',
  'qa.result',
  'artifact.created',
  'revision.completed',
  'job.completed',
  'job.failed',
  'job.cancelled',
  'log',
] as const
export type JobEventType = (typeof JOB_EVENT_TYPES)[number]

export interface JobEvent {
  seq: number
  ts: ISODate
  job_id: string
  revision: number | null
  type: JobEventType | (string & {})
  stage: JobStage | (string & {}) | null
  data: Record<string, unknown> | null
}

/** Control's own stream, `GET /api/events`. */
export interface ControlEvent {
  seq: number
  at: ISODate
  type: string
  production_id: string | null
  data: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------------------------
// Research

export type OpportunityStatus = 'new' | 'producing' | 'produced' | 'dismissed' | 'expired' | (string & {})

export interface OpportunityScores {
  demand: number
  timeliness: number
  competition_gap: number
  channel_fit: number
  revenue_potential: number
  explainability: number
}

export interface EvidenceItem {
  source?: string | null
  title?: string | null
  url?: string | null
  metric?: string | { name: string; value: number | string | null } | null
}

export interface Opportunity {
  opportunity_id: string
  topic: string
  angle: string
  format: 'short' | 'long'
  markets: { code: string; weight: number; evidence?: string[] }[]
  scores: OpportunityScores
  priority: number
  evidence: EvidenceItem[]
  why: string
  risks: string[]
  expires_in_days?: number | null
  status: OpportunityStatus
  production_id?: string | null
  created_at: ISODate
  expires_at?: ISODate | null
}

export interface SignalItem {
  source: string
  title: string
  url?: string | null
  language?: string | null
  rank?: number | null
  metric?: { name: string; value: number | null } | null
  first_seen?: ISODate | null
  category?: string | null
}

export interface SignalPack {
  market: string
  collected_at: ISODate
  items: SignalItem[]
  errors: (string | { source?: string; message?: string })[]
}

// ---------------------------------------------------------------------------------------------
// Overview

export interface Alert {
  level: 'info' | 'warning' | 'error' | (string & {})
  message: string
  link: string | null
}

export interface Overview {
  pipeline: {
    active: ProductionSummary[]
    queued: number
    next_runs: { job: string; at: ISODate }[]
    last_research_at: ISODate | null
  }
  channel: {
    connected: boolean
    channel_name: string | null
    subscribers: number | null
    views_28d: number | null
    watch_hours_28d: number | null
    revenue_28d_usd: number | null
    rpm_28d_usd: number | null
  }
  markets: { code: string; name: string; weight: number; views_28d: number | null; revenue_28d_usd: number | null }[]
  alerts: Alert[]
}

// ---------------------------------------------------------------------------------------------
// Channel and analytics (H)

export interface VideoMetrics {
  views: number | null
  engaged_views: number | null
  watch_hours: number | null
  avg_view_duration_s: number | null
  avg_view_pct: number | null
  impressions: number | null
  ctr_pct: number | null
  viewed_vs_swiped_pct: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  subscribers_gained: number | null
  estimated_revenue_usd: number | null
  rpm_usd: number | null
}

export type Verdict = 'outperforming' | 'on_track' | 'underperforming' | 'too_early'
export type PrimaryCause =
  | 'hook'
  | 'packaging'
  | 'topic_demand'
  | 'retention_midroll'
  | 'distribution'
  | 'timing'
  | 'market_mismatch'
  | 'unknown'

export interface Diagnosis {
  video_id: string
  as_of: ISODate
  verdict: Verdict
  percentile_vs_channel?: number | null
  primary_cause: PrimaryCause | (string & {})
  findings: { metric: string; value?: unknown; baseline?: unknown; interpretation: string }[]
  retention_drops?: { t_s: number; drop_pct: number; line_id?: string | null; beat?: string | null; on_screen?: string | null }[]
  actions: string[]
  hypotheses?: { statement: string; confidence: number }[]
}

export interface CountryRow {
  country: string
  views: number | null
  watch_hours: number | null
  estimated_revenue_usd: number | null
}

export interface RetentionPoint {
  t_ratio: number
  audience_watch_ratio: number
}

export interface VideoSummary {
  video_id: string
  title: string
  published_at: ISODate | null
  is_short: boolean
  url?: string | null
  production_id?: string | null
  thumbnail_path?: string | null
  duration_s?: number | null
  metrics: VideoMetrics | null
  verdict?: Verdict | null
  as_of?: ISODate | null
}

export interface VideoSnapshot {
  taken_at: ISODate
  checkpoint?: string | null
  period?: { start: ISODate; end: ISODate } | null
  metrics: VideoMetrics
}

export interface VideoDetail extends VideoSummary {
  snapshots: VideoSnapshot[]
  by_country: CountryRow[]
  traffic: { source: string; views: number | null }[]
  retention: RetentionPoint[]
  script_lines: ScriptLine[]
  beats?: Beat[]
  diagnosis: Diagnosis | null
}

// ---------------------------------------------------------------------------------------------
// Playbook and calibration

export interface Learning {
  learning_id: string
  scope: string
  statement: string
  evidence: string[]
  effect: string | null
  confidence: number
  applies_to: string[]
  status: 'active' | 'retired' | (string & {})
  /** confidence × 0.5^(age / half_life) */
  current_weight: number
  /** Days until it retires unless confirmed; null once retired. */
  expires_in_days: number | null
  confirmations?: number
  created_at: ISODate
  last_confirmed_at: ISODate | null
  retired_at?: ISODate | null
  retire_reason?: string | null
}

export interface Calibration {
  as_of: ISODate | null
  active: boolean
  videos_with_data: number
  min_videos: number
  window_days: number
  max_weight_change: number
  dimensions: { id: string; default_weight: number; weight: number; correlation?: number | null }[]
  markets: { code: string; name?: string | null; default_weight: number; weight: number; views_28d?: number | null; revenue_28d_usd?: number | null }[]
  predictions?: {
    production_id?: string | null
    video_id?: string | null
    title: string
    score: number | null
    predicted_avg_view_pct: number | null
    actual_avg_view_pct: number | null
  }[]
}

// ---------------------------------------------------------------------------------------------
// Settings (the autopilot.yaml shape) and status

export type AutopilotMode = 'off' | 'assist' | 'auto'

export interface AutopilotSettings {
  mode: AutopilotMode
  auto_upload: boolean
  upload_visibility: Visibility
  upload_max_attempts: number
  timezone: string
  schedules: {
    research_cron: string
    production_cron: string
    analytics_cron: string
    learning_cron: string
  }
  limits: {
    max_productions_per_day: number
    max_concurrent: number
  }
  timing: {
    schedule_strategy: 'market_prime_time' | 'immediate' | (string & {})
    half_life_days: number
    max_age_days: number
    signal_max_age_days: number
    topic_cooldown_days: number
  }
  analytics_checkpoints_h?: number[]
  markets_refit?: { min_videos: number; max_weight_change: number; window_days: number }
}

export interface ServiceHealth {
  name: string
  ok: boolean
  url?: string | null
  /** Anything: a message, or the service's /readyz body. */
  detail?: unknown
  status?: 'ok' | 'degraded' | 'error' | 'down' | (string & {})
  version?: string | null
  latency_ms?: number | null
}

export interface AccountUsage {
  input_tokens: number
  output_tokens: number
  runs: number
}

/** brain's account pool (addendum B). The e-mail is never returned. */
export interface ClaudeAccount {
  id: string
  config_dir: string
  enabled: boolean
  logged_in: boolean | null
  subscription_type?: string | null
  org_name?: string | null
  cooling_down_until?: ISODate | null
  last_error?: string | null
  last_used_at?: ISODate | null
  usage_5h?: Partial<AccountUsage> | null
  usage_7d?: Partial<AccountUsage> | null
}

export interface ClaudeAccounts {
  strategy: 'least_used' | 'ordered' | (string & {})
  accounts: ClaudeAccount[]
}

export interface YouTubeSession {
  chrome: { reachable: boolean; version: string | null }
  youtube: { logged_in: boolean; channel_id: string | null; channel_name: string | null }
}

export interface EngineStatus extends EngineRef {
  doctor?: string | Record<string, unknown> | null
  queue?: Record<string, unknown> | number | null
}

/** control-api.schema.json `status`: services is a map of name → {ok, url, detail}. */
export interface SystemStatus {
  services: Record<string, Omit<ServiceHealth, 'name'>> | ServiceHealth[]
  youtube?: YouTubeSession | null
  engine?: EngineStatus | null
  claude?: ClaudeAccounts | null
  version?: string | null
  fake?: boolean | null
  checked_at?: ISODate | null
}

export interface CalibrationRun {
  steps: { name: string; selector: string | null; ok: boolean; screenshot: string | null }[]
}

// ---------------------------------------------------------------------------------------------
// Requests

export interface NewProduction {
  topic: string
  angle?: string
  markets?: MarketWeight[]
  notes?: string
}

export type ProductionAction = 'revise' | 'rescore' | 'cancel' | 'upload'
