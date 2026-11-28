import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { api, qs } from './client'
import {
  accountsFrom,
  asList,
  normalizeDetail,
  normalizeLearning,
  normalizeOpportunity,
  normalizeProduction,
  normalizeVideo,
  normalizeVideoDetail,
  settingsFrom,
  signalPacks,
} from './normalize'
import { parseJsonData, runEventStream, type StreamStatus } from './sse'
import type {
  Calibration,
  CalibrationRun,
  ClaudeAccount,
  ControlEvent,
  FinalKit,
  JobEvent,
  Learning,
  NewProduction,
  Overview,
  ProductionAction,
  ProductionDetail,
  ProductionState,
  ProductionSummary,
  SystemStatus,
  VideoSummary,
} from './types'

export const keys = {
  overview: ['overview'] as const,
  opportunities: (f: { status?: string; market?: string }) => ['opportunities', f] as const,
  signals: (market?: string) => ['signals', market ?? 'all'] as const,
  productions: (state?: string) => ['productions', state ?? 'all'] as const,
  production: (id: string) => ['production', id] as const,
  videos: ['videos'] as const,
  video: (id: string) => ['video', id] as const,
  learnings: ['learnings'] as const,
  calibration: ['calibration'] as const,
  settings: ['settings'] as const,
  status: ['status'] as const,
}

/** States in which the engine or a service is working on the production right now. */
export const ACTIVE_STATES: ProductionState[] = ['queued', 'briefing', 'producing', 'scoring', 'revising', 'finalizing', 'uploading']

// ------------------------------------------------------------------------------------------------
// Queries

export function useOverview() {
  return useQuery({
    queryKey: keys.overview,
    queryFn: ({ signal }) => api.get<Overview>('/api/overview', { signal }),
    refetchInterval: 30_000,
  })
}

export function useOpportunities(filters: { status?: string; market?: string }) {
  return useQuery({
    queryKey: keys.opportunities(filters),
    queryFn: async ({ signal }) =>
      asList(await api.get<unknown>(`/api/opportunities${qs(filters)}`, { signal }), 'opportunities').map(normalizeOpportunity),
    refetchInterval: 60_000,
  })
}

export function useSignals(market?: string) {
  return useQuery({
    queryKey: keys.signals(market),
    queryFn: async ({ signal }) => signalPacks(await api.get<unknown>(`/api/signals${qs({ market })}`, { signal })),
    refetchInterval: 120_000,
  })
}

export function useProductions(state?: string) {
  return useQuery({
    queryKey: keys.productions(state),
    queryFn: async ({ signal }) =>
      asList(await api.get<unknown>(`/api/productions${qs({ state })}`, { signal }), 'productions').map((p) =>
        normalizeProduction<ProductionSummary>(p),
      ),
    refetchInterval: 20_000,
  })
}

export function useProduction(id: string) {
  return useQuery({
    queryKey: keys.production(id),
    queryFn: async ({ signal }) => normalizeDetail(await api.get<unknown>(`/api/productions/${encodeURIComponent(id)}`, { signal })),
    refetchInterval: (q) => {
      const state = q.state.data?.state
      return state && ACTIVE_STATES.includes(state) ? 5_000 : 30_000
    },
  })
}

export function useVideos() {
  return useQuery({
    queryKey: keys.videos,
    queryFn: async ({ signal }) =>
      asList(await api.get<unknown>('/api/videos', { signal }), 'videos').map((v) => normalizeVideo<VideoSummary>(v)),
    refetchInterval: 120_000,
  })
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: keys.video(id),
    queryFn: async ({ signal }) => normalizeVideoDetail(await api.get<unknown>(`/api/videos/${encodeURIComponent(id)}`, { signal })),
  })
}

export function useLearnings() {
  return useQuery({
    queryKey: keys.learnings,
    queryFn: async ({ signal }) => asList(await api.get<unknown>('/api/learnings', { signal }), 'learnings').map(normalizeLearning),
  })
}

export function useCalibration() {
  return useQuery({
    queryKey: keys.calibration,
    queryFn: ({ signal }) => api.get<Calibration>('/api/calibration', { signal }),
  })
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: async ({ signal }) => {
      const raw = await api.get<unknown>('/api/settings', { signal })
      return { raw, settings: settingsFrom(raw) }
    },
  })
}

export function useStatus() {
  return useQuery({
    queryKey: keys.status,
    queryFn: ({ signal }) => api.get<SystemStatus>('/api/status', { signal }),
    refetchInterval: 30_000,
    select: (status) => ({ status, accounts: accountsFrom(status) }),
  })
}

// ------------------------------------------------------------------------------------------------
// Mutations. Each invalidates what it changes; pages add toasts.

function useInvalidating<TVars, TData>(fn: (vars: TVars) => Promise<TData>, invalidate: (vars: TVars) => QueryKey[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: (_d, _e, vars) => Promise.all(invalidate(vars).map((queryKey) => qc.invalidateQueries({ queryKey }))),
  })
}

const productionKeys = (id: string): QueryKey[] => [keys.production(id), ['productions'], keys.overview]

export function useRunResearch() {
  return useInvalidating(
    () => api.post<unknown>('/api/research/run'),
    () => [['opportunities'], ['signals'], keys.overview],
  )
}

export function useOpportunityAction() {
  return useInvalidating(
    ({ id, action }: { id: string; action: 'produce' | 'dismiss' }) =>
      api.post<unknown>(`/api/opportunities/${encodeURIComponent(id)}/${action}`),
    () => [['opportunities'], ['productions'], keys.overview],
  )
}

export function useCreateProduction() {
  return useInvalidating(
    (body: NewProduction) => api.post<unknown>('/api/productions', body),
    () => [['productions'], keys.overview],
  )
}

export function useProductionAction(id: string) {
  return useInvalidating(
    (action: ProductionAction) => api.post<unknown>(`/api/productions/${encodeURIComponent(id)}/${action}`),
    () => productionKeys(id),
  )
}

export function useChooseRevision(id: string) {
  return useInvalidating(
    (revision: number) => api.post<unknown>(`/api/productions/${encodeURIComponent(id)}/choose`, { revision }),
    () => productionKeys(id),
  )
}

export function useSaveFinalKit(id: string) {
  return useInvalidating(
    (kit: FinalKit) => api.put<unknown>(`/api/productions/${encodeURIComponent(id)}/final-kit`, kit),
    () => productionKeys(id),
  )
}

export function useMarkUploaded(id: string) {
  return useInvalidating(
    (video_url: string) => api.post<unknown>(`/api/productions/${encodeURIComponent(id)}/mark-uploaded`, { video_url }),
    () => [...productionKeys(id), keys.videos],
  )
}

export function useSyncAnalytics() {
  return useInvalidating(
    () => api.post<unknown>('/api/analytics/sync', {}),
    () => [keys.videos, ['video'], keys.overview],
  )
}

export function usePatchLearning() {
  return useInvalidating(
    ({ id, patch }: { id: string; patch: Partial<Pick<Learning, 'status' | 'confidence' | 'statement'>> }) =>
      api.patch<unknown>(`/api/learnings/${encodeURIComponent(id)}`, patch),
    () => [keys.learnings, keys.calibration],
  )
}

/** Not named in contract I: runs the learner now (the learning step's manual button). */
export function useRunLearning() {
  return useInvalidating(
    () => api.post<unknown>('/api/learning/run'),
    () => [keys.learnings, keys.calibration, keys.overview],
  )
}

export function useSaveSettings() {
  return useInvalidating(
    (settings: unknown) => api.put<unknown>('/api/settings', settings),
    () => [keys.settings, keys.overview, keys.status],
  )
}

/** Addendum B / control change: re-runs `claude auth status` for one account via brain. */
export function useRefreshAccount() {
  return useInvalidating(
    (id: string) => api.post<ClaudeAccount | unknown>(`/api/claude/accounts/${encodeURIComponent(id)}/refresh`),
    () => [keys.status],
  )
}

/** Not named in contract I: the YouTube calibration dry run (addendum G's Settings button). */
export function useYoutubeCalibration() {
  return useInvalidating(
    () => api.post<CalibrationRun | unknown>('/api/youtube/calibrate'),
    () => [keys.status],
  )
}

// ------------------------------------------------------------------------------------------------
// Streams

/** The engine's live job events for one production, `GET /api/productions/{id}/live?after=`. */
export function useLiveEvents(productionId: string, max = 4000) {
  const [events, setEvents] = useState<JobEvent[]>([])
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const lastSeq = useRef(0)

  useEffect(() => {
    lastSeq.current = 0
    setEvents([])
    const ctrl = new AbortController()
    let pending: JobEvent[] = []
    let flush: number | undefined
    const commit = () => {
      flush = undefined
      const batch = pending
      pending = []
      setEvents((prev) => {
        const next = prev.concat(batch)
        return next.length > max ? next.slice(next.length - max) : next
      })
    }
    void runEventStream({
      signal: ctrl.signal,
      url: () => `/api/productions/${encodeURIComponent(productionId)}/live${qs({ after: lastSeq.current || undefined })}`,
      onStatus: setStatus,
      onMessage: (msg) => {
        const ev = parseJsonData<JobEvent>(msg)
        if (!ev || typeof ev !== 'object') return
        const seq = typeof ev.seq === 'number' ? ev.seq : Number(msg.id ?? NaN)
        if (Number.isFinite(seq) && seq <= lastSeq.current) return
        if (Number.isFinite(seq)) lastSeq.current = seq
        pending.push({ ...ev, seq, type: ev.type ?? msg.event })
        flush ??= window.setTimeout(commit, 120)
      },
    })
    return () => {
      ctrl.abort()
      if (flush) window.clearTimeout(flush)
    }
  }, [productionId, max])

  return { events, status }
}

function invalidateFor(qc: QueryClient, ev: ControlEvent) {
  const t = ev.type ?? ''
  const out: QueryKey[] = [keys.overview]
  if (ev.production_id) out.push(keys.production(ev.production_id), ['productions'])
  if (/research|opportunit|signal/.test(t)) out.push(['opportunities'], ['signals'])
  if (/analytics|video/.test(t)) out.push(keys.videos, ['video'])
  if (/learn|calibrat/.test(t)) out.push(keys.learnings, keys.calibration)
  if (/setting|autopilot/.test(t)) out.push(keys.settings)
  if (/status|service|account|claude|session|engine/.test(t)) out.push(keys.status)
  for (const queryKey of out) void qc.invalidateQueries({ queryKey })
}

/** Control's event stream: refreshes whatever an event touches. Returns the connection status. */
export function useControlEvents() {
  const qc = useQueryClient()
  const [status, setStatus] = useState<StreamStatus>('connecting')
  useEffect(() => {
    const ctrl = new AbortController()
    let last = 0
    let queue: ControlEvent[] = []
    let timer: number | undefined
    const drain = () => {
      timer = undefined
      const batch = queue
      queue = []
      const seen = new Set<string>()
      for (const ev of batch) {
        const k = `${ev.type}|${ev.production_id ?? ''}`
        if (seen.has(k)) continue
        seen.add(k)
        invalidateFor(qc, ev)
      }
    }
    void runEventStream({
      signal: ctrl.signal,
      url: () => `/api/events${qs({ after: last || undefined })}`,
      onStatus: setStatus,
      onMessage: (msg) => {
        const ev = parseJsonData<ControlEvent>(msg)
        if (!ev || typeof ev !== 'object' || !ev.type) return
        if (typeof ev.seq === 'number') {
          if (ev.seq <= last) return
          last = ev.seq
        }
        queue.push(ev)
        timer ??= window.setTimeout(drain, 400)
      },
    })
    return () => {
      ctrl.abort()
      if (timer) window.clearTimeout(timer)
    }
  }, [qc])
  return status
}

export type { ProductionDetail }
