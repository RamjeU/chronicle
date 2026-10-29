import type { Contact, Entity } from './types'
import type { AliasGroup } from './data'
import { assess, type Outcome } from './contact'
import { compare } from './time'

export interface Interpretation {
  /** Entity ids to select: none, one, or two. */
  ids: string[]
  /** Plain-language notes on how the question was read, shown to the user. */
  notes: string[]
  /** Set when nothing usable was found. */
  message: string | null
}

interface Phrase {
  text: string
  ids: string[]
  note?: string
}

interface Mention {
  phrase: string
  start: number
  ids: string[]
  note?: string
}

const OUTCOME_RANK: Record<Outcome, number> = { direct: 0, record: 1, indirect: 2, eras: 3, none: 4 }

/** Lowercase, drop accents' punctuation and hyphens so "al-Walid" and "al Walid" match. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‐-―-]/g, ' ')
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Names a person might type for an entry, derived from its title: with and without brackets and common suffixes. */
function entityPhrases(e: Entity): string[] {
  const full = normalize(e.name)
  const bare = normalize(e.name.replace(/\([^)]*\)/g, ''))
  const out = new Set([full, bare])
  for (const base of [bare]) {
    out.add(base.replace(/^the /, ''))
    out.add(base.replace(/ (dynasty|empire|period|caliphate|culture|confederacy)$/, ''))
  }
  return [...out].filter((p) => p.length >= 3)
}

function buildPhrases(entities: Entity[], groups: AliasGroup[]): Phrase[] {
  const table = new Map<string, Phrase>()
  for (const g of groups) {
    for (const p of g.phrases) table.set(normalize(p), { text: normalize(p), ids: g.ids, note: g.note })
  }
  for (const e of entities) {
    for (const p of entityPhrases(e)) if (!table.has(p)) table.set(p, { text: p, ids: [e.id] })
  }
  return [...table.values()].sort((a, b) => b.text.length - a.text.length)
}

/** Longest phrase wins; a word is never matched twice. A trailing "s" is allowed for plurals. */
function findMentions(question: string, phrases: Phrase[]): Mention[] {
  const q = ` ${normalize(question)} `
  const taken: [number, number][] = []
  const found: Mention[] = []
  for (const p of phrases) {
    const needle = ` ${p.text}`
    let from = 0
    for (;;) {
      const at = q.indexOf(needle, from)
      if (at === -1) break
      from = at + 1
      const rest = q.slice(at + needle.length)
      const plural = rest.startsWith('s ') && p.text.length > 3
      const end = at + needle.length + (plural ? 1 : 0)
      if (!plural && !rest.startsWith(' ')) continue
      const start = at + 1
      if (taken.some(([s, e]) => start < e && end > s)) continue
      taken.push([start, end])
      found.push({ phrase: p.text, start, ids: p.ids, note: p.note })
    }
  }
  return found.sort((a, b) => a.start - b.start)
}

/**
 * Read a question and decide which one or two entries it is about.
 * When a name covers several entries ("China", "Tamil people"), the pair is chosen by closeness in time first,
 * then by how strong a recorded connection exists. The choice is always explained in `notes`.
 */
export function interpret(question: string, entities: Entity[], contacts: Contact[], groups: AliasGroup[]): Interpretation {
  const byId = new Map(entities.map((e) => [e.id, e]))
  const name = (id: string) => byId.get(id)!.name
  const all = findMentions(question, buildPhrases(entities, groups))

  // One mention per distinct set of candidates, in the order they appear.
  const mentions: Mention[] = []
  for (const m of all) if (!mentions.some((x) => x.ids.join() === m.ids.join())) mentions.push(m)

  if (mentions.length === 0) {
    return {
      ids: [],
      notes: [],
      message: 'No entry in the dataset matches that question. Name two people, places or societies, for example "Did Jesus know about China?", or use the lists below.',
    }
  }

  const notes: string[] = []
  const first = mentions[0]
  const second = mentions[1]
  if (mentions.length > 2) notes.push(`The question names more than two entries. Using the first two: "${first.phrase}" and "${second.phrase}".`)

  const describe = (m: Mention, chosen: string) => {
    if (m.ids.length > 1) {
      notes.push(`"${m.phrase}" covers several entries (${m.ids.map(name).join(', ')}). Chose ${name(chosen)}, the closest in time to the other entry. Change it with the lists below.`)
    }
    if (m.note) notes.push(m.note)
  }

  if (!second) {
    const chosen = first.ids[0]
    if (first.ids.length > 1) {
      notes.push(`"${first.phrase}" covers several entries (${first.ids.map(name).join(', ')}). Showing ${name(chosen)}. Name a second entry to compare, or choose another below.`)
    }
    if (first.note) notes.push(first.note)
    return { ids: [chosen], notes, message: null }
  }

  let best: { a: string; b: string; key: number[] } | null = null
  for (const a of first.ids) {
    for (const b of second.ids) {
      if (a === b) continue
      const gap = compare(byId.get(a)!, byId.get(b)!).gapYears
      const rank = OUTCOME_RANK[assess(byId.get(a)!, byId.get(b)!, entities, contacts).outcome]
      const key = [gap, rank, first.ids.indexOf(a) + second.ids.indexOf(b)]
      if (!best || lexLess(key, best.key)) best = { a, b, key }
    }
  }
  if (!best) {
    return { ids: [first.ids[0]], notes, message: 'Both names refer to the same entry. Name two different people, places or societies.' }
  }
  describe(first, best.a)
  describe(second, best.b)
  return { ids: [best.a, best.b], notes, message: null }
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]
  return false
}
