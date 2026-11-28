/**
 * Server-Sent Events over fetch. EventSource can't resume with control's `?after=<seq>` query
 * parameter, so streams are read with fetch + a spec-following parser, and reconnect with the
 * last sequence number seen.
 */

export interface SseMessage {
  event: string
  data: string
  id: string | null
}

/** Incremental parser for the text/event-stream format (WHATWG HTML §9.2.6). */
export class SseParser {
  private buffer = ''
  private dataLines: string[] = []
  private eventType = ''
  private lastId: string | null = null

  /** Feeds a decoded chunk; returns the complete messages it finished. */
  feed(chunk: string): SseMessage[] {
    this.buffer += chunk
    const out: SseMessage[] = []
    // Lines end with CRLF, LF or CR. Keep a trailing CR until the next chunk shows whether LF follows.
    for (;;) {
      const m = /\r\n|\n|\r/.exec(this.buffer)
      if (!m) break
      if (m[0] === '\r' && m.index === this.buffer.length - 1) break
      const line = this.buffer.slice(0, m.index)
      this.buffer = this.buffer.slice(m.index + m[0].length)
      const msg = this.line(line)
      if (msg) out.push(msg)
    }
    return out
  }

  private line(line: string): SseMessage | null {
    if (line === '') {
      if (this.dataLines.length === 0) {
        this.eventType = ''
        return null
      }
      const msg = { event: this.eventType || 'message', data: this.dataLines.join('\n'), id: this.lastId }
      this.dataLines = []
      this.eventType = ''
      return msg
    }
    if (line.startsWith(':')) return null
    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)
    switch (field) {
      case 'data':
        this.dataLines.push(value)
        break
      case 'event':
        this.eventType = value
        break
      case 'id':
        if (!value.includes('\0')) this.lastId = value
        break
      default:
        // `retry` and unknown fields: the reconnect delay is ours to choose.
        break
    }
    return null
  }
}

export type StreamStatus = 'connecting' | 'open' | 'retrying' | 'closed'

export interface StreamOptions {
  /** Builds the URL for each (re)connection, so it can carry `after=<last seq>`. */
  url: () => string
  onMessage: (msg: SseMessage) => void
  onStatus?: (status: StreamStatus) => void
  signal: AbortSignal
  /** First retry delay; doubles up to maxRetryMs. */
  retryMs?: number
  maxRetryMs?: number
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        resolve()
      },
      { once: true },
    )
  })

/** Keeps a stream open until the signal aborts, reconnecting with backoff. */
export async function runEventStream(opts: StreamOptions): Promise<void> {
  const { signal } = opts
  const base = opts.retryMs ?? 1500
  const max = opts.maxRetryMs ?? 30_000
  let delay = base
  while (!signal.aborted) {
    opts.onStatus?.('connecting')
    try {
      const res = await fetch(opts.url(), { headers: { Accept: 'text/event-stream' }, signal, cache: 'no-store' })
      if (!res.ok || !res.body) throw new Error(`stream answered ${res.status}`)
      opts.onStatus?.('open')
      delay = base
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      const parser = new SseParser()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        for (const msg of parser.feed(value)) opts.onMessage(msg)
      }
    } catch {
      if (signal.aborted) break
    }
    if (signal.aborted) break
    opts.onStatus?.('retrying')
    await sleep(delay, signal)
    delay = Math.min(max, delay * 2)
  }
  opts.onStatus?.('closed')
}

/** Parses a message's JSON data; null when it isn't JSON (keep-alives, plain text). */
export function parseJsonData<T>(msg: SseMessage): T | null {
  try {
    return JSON.parse(msg.data) as T
  } catch {
    return null
  }
}
