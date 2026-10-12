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
