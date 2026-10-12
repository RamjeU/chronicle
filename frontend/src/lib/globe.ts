import type { Entity } from './types'
import { isAlive, isPoint } from './time'

export const MIN_YEAR = -300000

/** Whether an entity should be drawn on the globe at the given year. Point events linger briefly so they can be seen. */
export function showsAt(e: Entity, year: number): boolean {
  if (!e.location) return false
  if (isPoint(e)) return Math.abs(year - e.start.year) <= Math.max(25, e.start.uncertainty)
  return isAlive(e, year)
}

export interface GlobePoint {
  id: string
  name: string
  lat: number
  lng: number
  place: string
  type: Entity['type']
}

/** Places that share a location (Rome's republic and empire, say) are fanned out so each stays clickable. */
export function spreadPoints(list: Entity[]): GlobePoint[] {
  const groups = new Map<string, Entity[]>()
  for (const e of list) {
    const key = `${e.location!.lat},${e.location!.lng}`
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  const out: GlobePoint[] = []
  for (const group of groups.values()) {
    group.forEach((e, i) => {
      const n = group.length
      const angle = (2 * Math.PI * i) / n
      const r = n > 1 ? 1.1 : 0
      out.push({
        id: e.id,
        name: e.name,
        lat: e.location!.lat + Math.sin(angle) * r,
        lng: e.location!.lng + Math.cos(angle) * r,
        place: e.location!.label,
        type: e.type,
      })
    })
  }
  return out
}
