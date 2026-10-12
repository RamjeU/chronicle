import raw from '../../../data/entities.json'
import type { Entity } from './types'

// Source of truth lives in /data/entities.json (validated by scripts/validate.py).
export const ENTITIES = raw as unknown as Entity[]
