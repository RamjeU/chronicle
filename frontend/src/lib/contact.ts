import type { Contact, Entity, Tier } from './types'

export interface Step {
  from: Entity
  to: Entity
  contact: Contact
}

export type Outcome =
  | 'direct' // one contact link, both parties active in its window
  | 'record' // the later party learned of the earlier through texts or legacy
  | 'indirect' // a chain of links that all coexisted for a while
  | 'eras' // links exist, but never at the same time
  | 'none' // nothing recorded in the dataset

export interface Assessment {
  outcome: Outcome
  /** Weakest tier along the chain; null when there is no feasible chain. */
  tier: Tier | null
  steps: Step[]
  window: [number, number] | null
  headline: string
  caveat: string | null
}

const MAX_EDGES = 3
/** A chain of 2+ links must share at least this many years, or it is treated as a coincidence of dates. */
const MIN_CHAIN_WINDOW = 5

interface Path {
  edges: Contact[]
  nodes: string[]
}

function adjacency(contacts: Contact[]): Map<string, Contact[]> {
  const m = new Map<string, Contact[]>()
  for (const c of contacts) {
    for (const id of [c.a, c.b]) {
      const list = m.get(id)
      if (list) list.push(c)
      else m.set(id, [c])
    }
  }
  return m
}

const other = (c: Contact, id: string) => (c.a === id ? c.b : c.a)

function window(edges: Contact[]): [number, number] | null {
  const lo = Math.max(...edges.map((e) => e.from))
  const hi = Math.min(...edges.map((e) => e.to))
  return lo <= hi ? [lo, hi] : null
}

function weakest(edges: Contact[]): Tier {
  return edges.some((e) => e.tier === 'plausible') ? 'plausible' : 'documented'
}

function* paths(adj: Map<string, Contact[]>, start: string, goal: string, maxEdges: number): Generator<Path> {
  const stack: { node: string; edges: Contact[]; nodes: string[] }[] = [{ node: start, edges: [], nodes: [start] }]
  while (stack.length) {
    const cur = stack.pop()!
    if (cur.node === goal && cur.edges.length) {
      yield { edges: cur.edges, nodes: cur.nodes }
      continue
    }
    if (cur.edges.length >= maxEdges) continue
    for (const e of adj.get(cur.node) ?? []) {
      const next = other(e, cur.node)
      if (cur.nodes.includes(next)) continue
      stack.push({ node: next, edges: [...cur.edges, e], nodes: [...cur.nodes, next] })
    }
  }
}

function toSteps(p: Path, byId: Map<string, Entity>): Step[] {
  return p.edges.map((contact, i) => ({ from: byId.get(p.nodes[i])!, to: byId.get(p.nodes[i + 1])!, contact }))
}

/**
 * Could A have known about B? Looks for the shortest, best-attested chain of contact links
 * whose time windows overlap. Absence of a chain means "not recorded", never "impossible".
 */
export function assess(a: Entity, b: Entity, entities: Entity[], contacts: Contact[]): Assessment {
  const byId = new Map(entities.map((e) => [e.id, e]))
  const adj = adjacency(contacts)

  const feasible: { path: Path; win: [number, number]; tier: Tier }[] = []
  for (const path of paths(adj, a.id, b.id, MAX_EDGES)) {
    const win = window(path.edges)
    if (!win) continue
    if (path.edges.length > 1 && win[1] - win[0] < MIN_CHAIN_WINDOW) continue
    feasible.push({ path, win, tier: weakest(path.edges) })
  }
  feasible.sort(
    (x, y) =>
      x.path.edges.length - y.path.edges.length ||
      (x.tier === y.tier ? 0 : x.tier === 'documented' ? -1 : 1) ||
      y.win[1] - y.win[0] - (x.win[1] - x.win[0]),
  )

  const best = feasible[0]
  if (best) {
    const steps = toSteps(best.path, byId)
    const { tier, win } = best
    if (steps.length === 1) {
      const kind = steps[0].contact.kind
      const record = kind === 'textual' || kind === 'legacy'
      return {
        outcome: record ? 'record' : 'direct',
        tier,
        steps,
        window: win,
        headline: record
          ? tier === 'documented'
            ? 'Knowledge by record or legacy is documented.'
            : 'Knowledge by record or legacy is plausible, but not firmly documented.'
          : tier === 'documented'
            ? 'Direct contact is documented.'
            : 'Direct contact is plausible, but not documented.',
        caveat: null,
      }
    }
    return {
      outcome: 'indirect',
      tier,
      steps,
      window: win,
      headline:
        tier === 'documented'
          ? 'No direct contact recorded, but knowledge could have passed through intermediaries.'
          : 'No direct contact recorded. Knowledge could have passed through intermediaries, though at least one link is itself uncertain.',
      caveat:
        steps.length >= 3
          ? 'A chain this long means any knowledge would likely have been faint or distorted along the way.'
          : null,
    }
  }

  // Links may exist but never at the same time (shared ancestry, or successive eras).
  for (const path of paths(adj, a.id, b.id, MAX_EDGES + 1)) {
    return {
      outcome: 'eras',
      tier: null,
      steps: toSteps(path, byId),
      window: null,
      headline: 'These are connected only across different eras, never during the same period of contact.',
      caveat: 'The chain below shows how they are linked, but its links did not overlap in time.',
    }
  }

  return {
    outcome: 'none',
    tier: null,
    steps: [],
    window: null,
    headline: 'No connection is recorded in the dataset.',
    caveat: 'That means unrecorded here, not impossible. The dataset is small and biased toward written records.',
  }
}

export function connectionsOf(id: string, contacts: Contact[]): Contact[] {
  return contacts.filter((c) => c.a === id || c.b === id).sort((x, y) => x.from - y.from)
}
