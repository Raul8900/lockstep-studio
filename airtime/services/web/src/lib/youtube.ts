/** YouTube limits and URL handling for the final kit editor and the Mark as uploaded form. */

export const TITLE_MAX = 100
export const DESCRIPTION_MAX = 5000
export const TAGS_MAX = 500

const ID = /^[A-Za-z0-9_-]{11}$/

/**
 * The video id in a watch, shorts, youtu.be, embed, live or Studio URL, or a bare 11-character
 * id; null when there is none.
 */
export function parseVideoId(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  if (ID.test(text)) return text
  let url: URL
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.replace(/^(www|m|music)\./, '')
  const segments = url.pathname.split('/').filter(Boolean)
  let id: string | null = null
  if (host === 'youtu.be') id = segments[0] ?? null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (segments[0] === 'watch') id = url.searchParams.get('v')
    else if (['shorts', 'embed', 'live', 'v'].includes(segments[0] ?? '')) id = segments[1] ?? null
  } else if (host === 'studio.youtube.com' && segments[0] === 'video') id = segments[1] ?? null
  return id && ID.test(id) ? id : null
}

/**
 * YouTube counts the tags box as the characters of every tag, plus a comma between tags and the
 * quotes it adds around a tag containing a space.
 */
export function tagsLength(tags: string[]): number {
  const clean = tags.map((t) => t.trim()).filter(Boolean)
  const chars = clean.reduce((n, t) => n + t.length + (t.includes(' ') ? 2 : 0), 0)
  return chars + Math.max(0, clean.length - 1)
}

/** Problems YouTube Studio would reject (or silently strip). */
export function textProblems(text: string, max: number, what: string): string[] {
  const out: string[] = []
  if (text.length > max) out.push(`${what} is ${text.length - max} characters over the ${max} limit`)
  if (/[<>]/.test(text)) out.push(`${what} contains < or >, which YouTube does not allow`)
  return out
}

/** Comma-separated, as the Studio tags box takes them. */
export function tagsForStudio(tags: string[]): string {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .join(', ')
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function studioUrl(videoId: string): string {
  return `https://studio.youtube.com/video/${videoId}/edit`
}
