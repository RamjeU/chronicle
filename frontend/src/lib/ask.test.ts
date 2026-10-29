import assert from 'node:assert/strict'
import { ALIASES, CONTACTS, ENTITIES } from './data'
import { interpret, normalize } from './ask'

const read = (q: string) => interpret(q, ENTITIES, CONTACTS, ALIASES)
let passed = 0
const test = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`ok  ${name}`)
}

test('normalize handles hyphens, apostrophes and accents of punctuation', () => {
  assert.equal(normalize("Khalid ibn al-Walid's army?"), 'khalid ibn al walids army')
})

test('Khalid and "Tamil people" resolve to the Tamil dynasty of his era', () => {
  assert.deepEqual(read('Did Khalid ibn al-Walid know about Tamil people?').ids, ['khalid', 'pallava'])
})

test('Jesus and "China" resolve to the Han dynasty', () => {
  assert.deepEqual(read('Did Jesus know about China?').ids, ['jesus', 'han'])
})

test('Napoleon and "Islam" resolve to the Ottoman Empire, with the choice explained', () => {
  const r = read('Did Napoleon know about Islam?')
  assert.deepEqual(r.ids, ['napoleon', 'ottoman'])
  assert.ok(r.notes.some((n) => n.includes('closest in time')))
})

test('Muhammad (peace be upon him) and "China" resolve to the Tang dynasty', () => {
  assert.deepEqual(read('Did the Prophet Muhammad (peace be upon him) know about China?').ids, ['muhammad', 'tang'])
})

test('Han and "Samoa" resolve to the two named entries', () => {
  assert.deepEqual(read('Did ancient China know about Samoa?').ids, ['han', 'samoa'])
})

test('Mansa Musa and the Mongols', () => {
  assert.deepEqual(read('Could Mansa Musa have met the Mongols?').ids, ['mansa-musa', 'mongol'])
})

test('the Han dynasty and "the Romans" resolve to the Roman Empire', () => {
  assert.deepEqual(read('Did the Han dynasty trade with the Romans?').ids, ['han', 'roman-empire'])
})

test('a longer name beats a shorter one ("Roman Empire" is not just "Roman")', () => {
  assert.deepEqual(read('When did the Roman Empire exist?').ids, ['roman-empire'])
})

test('plurals match', () => {
  assert.deepEqual(read('Did the Pallavas meet the Cholas?').ids, ['pallava', 'chola'])
})

test('a single name selects one entry', () => {
  assert.deepEqual(read('Tell me about Mansa Musa').ids, ['mansa-musa'])
})

test('Indigenous peoples map to the North American entries with an honest note', () => {
  const r = read('Did Indigenous peoples of Canada know about the Vikings?')
  assert.deepEqual(r.ids.length, 2)
  assert.ok(r.notes.some((n) => n.includes('not yet included')))
})

test('unrelated text gives a helpful message and selects nothing', () => {
  const r = read('What is the weather like?')
  assert.deepEqual(r.ids, [])
  assert.ok(r.message)
})

test('naming the same entry twice selects it once', () => {
  const r = read('Did Napoleon know Napoleon Bonaparte?')
  assert.deepEqual(r.ids, ['napoleon'])
  assert.equal(r.message, null)
})

console.log(`\n${passed} checks passed`)
