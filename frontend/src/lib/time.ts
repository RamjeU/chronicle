import type { Entity } from './types'

export const PRESENT = 2026

export const endYear = (e: Entity): number => (e.end ? e.end.year : PRESENT)
export const isPoint = (e: Entity): boolean => e.end !== null && e.end.year === e.start.year
export const isAlive = (e: Entity, year: number): boolean => e.start.year <= year && year <= endYear(e)

/** Human-readable year. Deep prehistory reads better as "years ago" than as BCE. */
export function fmtYear(y: number): string {
  if (y <= -10000) return `${(PRESENT - y).toLocaleString('en-CA')} years ago`
  if (y < 0) return `${(-y).toLocaleString('en-CA')} BCE`
  return `${y} CE`
}

export function fmtSpan(e: Entity): string {
  const u = (n: number) => (n > 0 ? ` (±${n.toLocaleString('en-CA')})` : '')
  if (isPoint(e)) return `${fmtYear(e.start.year)}${u(e.start.uncertainty)}`
  const end = e.end ? `${fmtYear(e.end.year)}${u(e.end.uncertainty)}` : 'present'
  return `${fmtYear(e.start.year)}${u(e.start.uncertainty)} to ${end}`
}

/* ---------- Allen's interval algebra (Allen, 1983) ---------- */

export type AllenRelation =
  | 'before' | 'meets' | 'overlaps' | 'starts' | 'during' | 'finishes' | 'equals'
  | 'finished-by' | 'contains' | 'started-by' | 'overlapped-by' | 'met-by' | 'after'

export function allen(a: [number, number], b: [number, number]): AllenRelation {
  const [as, ae] = a
  const [bs, be] = b
  if (ae < bs) return 'before'
  if (be < as) return 'after'
  if (ae === bs) return 'meets'
  if (be === as) return 'met-by'
  if (as === bs && ae === be) return 'equals'
  if (as === bs) return ae < be ? 'starts' : 'started-by'
  if (ae === be) return as > bs ? 'finishes' : 'finished-by'
  if (as > bs && ae < be) return 'during'
  if (as < bs && ae > be) return 'contains'
  return as < bs ? 'overlaps' : 'overlapped-by'
}

const PHRASES: Record<AllenRelation, string> = {
  before: 'ended before {b} began',
  after: 'began after {b} had ended',
  meets: 'ended just as {b} began',
  'met-by': 'began just as {b} ended',
  overlaps: 'began before {b}, and the two overlapped',
  'overlapped-by': 'began after {b}, and the two overlapped',
  starts: 'began together with {b} but ended sooner',
  'started-by': 'began together with {b} and outlasted it',
  during: 'existed entirely within the span of {b}',
  contains: 'spanned the whole of {b}',
  finishes: 'began later than {b} but ended together with it',
  'finished-by': 'began earlier than {b} and ended together with it',
  equals: 'spans exactly the same years as {b}',
}

export type Verdict = 'definite' | 'possible' | 'none'

export interface Comparison {
  relation: AllenRelation
  sentence: string
  verdict: Verdict
  /** Years both existed, using the central dates. null when they never overlapped. */
  overlap: [number, number] | null
  /** Years separating them when they never overlapped (central dates). */
  gapYears: number
}

/** Overlap range after widening (loose) or narrowing (tight) each interval by its date uncertainty. */
function overlapWith(a: Entity, b: Entity, mode: 'tight' | 'loose'): number {
  const range = (e: Entity): [number, number] | null => {
    const su = e.start.uncertainty
    const eu = e.end ? e.end.uncertainty : 0
    if (mode === 'loose') return [e.start.year - su, endYear(e) + eu]
    const s = e.start.year + su
    const en = endYear(e) - eu
    return s <= en ? [s, en] : null // dates too fuzzy to guarantee any existence window
  }
  const ra = range(a)
  const rb = range(b)
  if (!ra || !rb) return mode === 'loose' ? 0 : -Infinity
  return Math.min(ra[1], rb[1]) - Math.max(ra[0], rb[0])
}

export function compare(a: Entity, b: Entity): Comparison {
  const ia: [number, number] = [a.start.year, endYear(a)]
  const ib: [number, number] = [b.start.year, endYear(b)]
  const relation = allen(ia, ib)
  const lo = Math.max(ia[0], ib[0])
  const hi = Math.min(ia[1], ib[1])
  const overlap: [number, number] | null = lo <= hi ? [lo, hi] : null

  let verdict: Verdict = 'none'
  if (overlapWith(a, b, 'tight') >= 0) verdict = 'definite'
  else if (overlapWith(a, b, 'loose') >= 0) verdict = 'possible'

  return {
    relation,
    sentence: `${a.name} ${PHRASES[relation].replace('{b}', b.name)}.`,
    verdict,
    overlap,
    gapYears: overlap ? 0 : lo - hi,
  }
}
