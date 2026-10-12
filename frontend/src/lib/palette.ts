import type { EntityType, Tier } from './types'

// Mirrors the CSS custom properties in index.css (the globe is drawn in WebGL, so it needs plain values).
export const TYPE_COLORS: Record<EntityType, string> = {
  civilization: '#ffb36b',
  person: '#ff7ea8',
  event: '#ffe27a',
  technology: '#a9b4ff',
  period: '#9be28a',
  species: '#d29bff',
}

export const TIER_COLORS: Record<Tier, string> = {
  documented: '#6df0ff',
  plausible: '#fff3b0',
}
