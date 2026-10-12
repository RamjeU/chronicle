import assert from 'node:assert/strict'
import { CONTACTS, ENTITIES } from './data'
import { assess } from './contact'

const get = (id: string) => {
  const e = ENTITIES.find((x) => x.id === id)
  assert.ok(e, `unknown entity ${id}`)
  return e
}
const ask = (a: string, b: string) => assess(get(a), get(b), ENTITIES, CONTACTS)
let passed = 0
const test = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`ok  ${name}`)
}

test('Muhammad and Khalid: direct, documented', () => {
  const r = ask('muhammad', 'khalid')
  assert.equal(r.outcome, 'direct')
  assert.equal(r.tier, 'documented')
})

test('Jesus and Han China: only an indirect chain through Rome and the Silk Road', () => {
  const r = ask('jesus', 'han')
  assert.equal(r.outcome, 'indirect')
  assert.equal(r.steps.length, 3)
  assert.deepEqual(r.steps.map((s) => s.to.id), ['roman-empire', 'silk-road', 'han'])
})

test('Khalid and the Pallavas: indirect and only plausible', () => {
  const r = ask('khalid', 'pallava')
  assert.equal(r.outcome, 'indirect')
  assert.equal(r.tier, 'plausible')
})

test('Napoleon and Muhammad: knowledge by record, plausible', () => {
  const r = ask('napoleon', 'muhammad')
  assert.equal(r.outcome, 'record')
  assert.equal(r.tier, 'plausible')
})

test('Han China and Samoa: linked only across different eras', () => {
  assert.equal(ask('han', 'samoa').outcome, 'eras')
})

test('Muhammad and Han China: never contemporaries, so no feasible chain', () => {
  assert.equal(ask('muhammad', 'han').outcome, 'eras')
})

test('Muhammad and Asuka Japan: a 2-year coincidence of dates is not accepted as a chain', () => {
  assert.notEqual(ask('muhammad', 'asuka').outcome, 'indirect')
})

test('Muhammad and Tang China: indirect and plausible via the Silk Road', () => {
  const r = ask('muhammad', 'tang')
  assert.equal(r.outcome, 'indirect')
  assert.equal(r.tier, 'plausible')
})

test('Inca and Aztec: nothing recorded', () => {
  assert.equal(ask('inca', 'aztec').outcome, 'none')
})

console.log(`\n${passed} checks passed`)
