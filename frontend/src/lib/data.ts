import rawEntities from '../../../data/entities.json'
import rawContacts from '../../../data/contacts.json'
import rawAliases from '../../../data/aliases.json'
import type { Contact, Entity } from './types'

export interface AliasGroup {
  phrases: string[]
  ids: string[]
  note?: string
}

// Source of truth lives in /data (validated by scripts/validate.py).
export const ENTITIES = rawEntities as unknown as Entity[]
export const CONTACTS = rawContacts as unknown as Contact[]
export const ALIASES = (rawAliases as unknown as { groups: AliasGroup[] }).groups
