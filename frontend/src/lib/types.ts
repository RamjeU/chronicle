export const ENTITY_TYPES = ['civilization', 'person', 'event', 'technology', 'period', 'species'] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

// Display order of the lanes on the timeline.
export const REGIONS = [
  'Global', 'Europe', 'Middle East', 'Africa', 'South Asia', 'East Asia', 'Eurasia', 'Oceania', 'Americas',
] as const
export type Region = (typeof REGIONS)[number]

/** A year (negative = BCE) with a +/- margin in years. 0 means the date is firm. */
export interface FuzzyYear {
  year: number
  uncertainty: number
}

export interface Entity {
  id: string
  name: string
  type: EntityType
  region: Region
  start: FuzzyYear
  /** null means ongoing / still existing today */
  end: FuzzyYear | null
  sources: string[]
  notes: string
}

export const CONTACT_KINDS = [
  'trade', 'diplomatic', 'military', 'political', 'migration', 'textual', 'legacy', 'cultural', 'biological',
] as const
export type ContactKind = (typeof CONTACT_KINDS)[number]

/** documented = attested in sources; plausible = fits the evidence but is not directly attested. */
export type Tier = 'documented' | 'plausible'

/** A link along which knowledge could have passed, active during [from, to]. */
export interface Contact {
  id: string
  a: string
  b: string
  kind: ContactKind
  tier: Tier
  from: number
  to: number
  summary: string
  sources: string[]
}
