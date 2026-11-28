import type { ApiErrorBody, JobEvent } from '../api/types'

/** An error as one line: `{code, message}` objects, plain strings, or anything else as JSON. */
export function errorText(err: ApiErrorBody | string | null | undefined | unknown): string | null {
  if (err == null || err === '') return null
  if (typeof err === 'string') return err
  if (typeof err === 'object') {
    const e = err as Partial<ApiErrorBody>
    if (e.message) return e.code ? `${e.code}: ${e.message}` : e.message
  }
  return JSON.stringify(err)
}

const s = (v: unknown) => (typeof v === 'string' && v ? v : null)

/** The kind of event, for the live log's filter. */
export function eventGroup(type: string): 'agent' | 'tools' | 'files' | 'qa' | 'state' | 'log' {
  if (type === 'agent.message') return 'agent'
  if (type === 'agent.tool') return 'tools'
  if (type === 'file.changed' || type === 'script.updated' || type === 'components.updated' || type === 'artifact.created') return 'files'
  if (type === 'qa.result') return 'qa'
  if (type === 'log') return 'log'
  return 'state'
}

/**
 * One readable line per engine event. The bridge's `data` is open-ended, so this reads the
 * likely fields and falls back to compact JSON.
 */
export function summarizeEvent(ev: JobEvent): string {
  const d = (ev.data ?? {}) as Record<string, unknown>
  switch (ev.type) {
    case 'stage.changed':
      return `Stage ${s(d.from) ? `${d.from} → ` : ''}${ev.stage ?? s(d.to) ?? '?'}${s(d.command) ? ` (${d.command})` : ''}`
    case 'job.state_changed':
      return `Job ${s(d.from) ? `${d.from} → ` : ''}${s(d.to) ?? s(d.state) ?? '?'}`
    case 'agent.message':
      return s(d.text) ?? s(d.message) ?? ''
    case 'agent.tool': {
      const tool = s(d.tool) ?? s(d.name) ?? 'tool'
      const input = s(d.command) ?? s(d.path) ?? s(d.summary) ?? (d.input && typeof d.input === 'object' ? JSON.stringify(d.input) : s(d.input))
      return input ? `${tool}: ${input}` : tool
    }
    case 'file.changed':
    case 'artifact.created':
      return [s(d.kind), s(d.path) ?? s(d.file)].filter(Boolean).join(' ') || JSON.stringify(d)
    case 'script.updated':
      return `Script updated${typeof d.lines === 'number' ? `: ${d.lines} lines` : ''}${s(d.title) ? ` · ${d.title}` : ''}`
    case 'components.updated':
      return `Components updated${typeof d.count === 'number' ? `: ${d.count}` : ''}`
    case 'qa.result': {
      const passed = d.passed === true ? 'passed' : d.passed === false ? 'failed' : 'finished'
      const issues = Array.isArray(d.issues) ? d.issues.length : null
      return `QA ${passed}${issues != null ? ` · ${issues} issue${issues === 1 ? '' : 's'}` : ''}`
    }
    case 'revision.completed':
      return `Revision ${ev.revision ?? s(d.revision) ?? ''} completed`
    case 'job.completed':
      return 'Job completed'
    case 'job.failed':
      return `Job failed: ${errorText(d.error) ?? s(d.message) ?? ''}`
    case 'job.cancelled':
      return 'Job cancelled'
    case 'log':
      return s(d.message) ?? s(d.line) ?? s(d.text) ?? JSON.stringify(d)
    default:
      return JSON.stringify(d)
  }
}
