import rawEntities from '../../../data/entities.json'
import rawContacts from '../../../data/contacts.json'
import type { Contact, Entity } from './types'

// Source of truth lives in /data (validated by scripts/validate.py).
export const ENTITIES = rawEntities as unknown as Entity[]
export const CONTACTS = rawContacts as unknown as Contact[]
