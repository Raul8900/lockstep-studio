import type { ApiErrorBody } from './types'

/** An error from control, carrying its `{"error":{code,message,details}}` body when there is one. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown> | null

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code || `http_${status}`
    this.details = body.details ?? null
  }
}

function errorBodyFrom(status: number, statusText: string, payload: unknown): ApiErrorBody {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>
    const e = p.error
    if (e && typeof e === 'object') {
      const err = e as Record<string, unknown>
      return {
        code: typeof err.code === 'string' ? err.code : `http_${status}`,
        message: typeof err.message === 'string' ? err.message : statusText,
        details: (err.details as Record<string, unknown> | null | undefined) ?? null,
      }
    }
    // FastAPI's default validation error shape: {"detail": …}
    if ('detail' in p) {
      const detail = p.detail
      return {
        code: status === 422 ? 'validation_error' : `http_${status}`,
        message: typeof detail === 'string' ? detail : 'The request was not valid.',
        details: typeof detail === 'string' ? null : { detail },
      }
    }
  }
  if (typeof payload === 'string' && payload.trim()) {
    return { code: `http_${status}`, message: payload.trim().slice(0, 300) }
  }
  const unreachable = status === 502 || status === 503 || status === 504
  return {
    code: unreachable ? 'control_unreachable' : `http_${status}`,
    message: unreachable ? 'Control is not reachable.' : statusText || `Request failed (${status})`,
  }
}

export interface RequestOptions {
  signal?: AbortSignal
}

export async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: opts.signal,
      credentials: 'same-origin',
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(0, { code: 'network_error', message: 'Control is not reachable (network error).' })
  }
  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('json')
  if (!res.ok) {
    let payload: unknown = null
    try {
      payload = isJson ? await res.json() : await res.text()
    } catch {
      payload = null
    }
    throw new ApiError(res.status, errorBodyFrom(res.status, res.statusText, payload))
  }
  if (res.status === 204) return undefined as T
  if (isJson) return (await res.json()) as T
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** A file under the data dir, served by control (Range supported, so video seeks work). */
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined
  return `/api/files?path=${encodeURIComponent(path)}`
}

export function basename(path: string | null | undefined): string {
  if (!path) return ''
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return String(err)
}
