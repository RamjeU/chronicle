import { useState, type FormEvent } from 'react'
import { ALIASES, CONTACTS, ENTITIES } from '../lib/data'
import { REGIONS } from '../lib/types'
import { interpret, type Interpretation } from '../lib/ask'
import { Compare, Detail } from './Panel'

const PRESETS = [
  'Did Khalid ibn al-Walid know about Tamil people?',
  'Did Jesus know about China?',
  'Did Napoleon know about Islam?',
  'Did ancient China know about Samoa?',
  'Did the Prophet Muhammad (peace be upon him) know about China?',
  'Could Mansa Musa have met the Mongols?',
]

interface Props {
  selected: string[]
  onSelect: (ids: string[]) => void
}

export function ConnectSection({ selected, onSelect }: Props) {
  const [a = '', b = ''] = selected
  const [question, setQuestion] = useState('')
  const [reading, setReading] = useState<Interpretation | null>(null)
  const ea = ENTITIES.find((e) => e.id === a)
  const eb = ENTITIES.find((e) => e.id === b)

  const set = (na: string, nb: string) => {
    setReading(null)
    onSelect([na, nb].filter((x, i, arr) => x && arr.indexOf(x) === i))
  }

  const ask = (q: string) => {
    setQuestion(q)
    const result = interpret(q, ENTITIES, CONTACTS, ALIASES)
    setReading(result)
    if (result.ids.length) onSelect(result.ids)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (question.trim()) ask(question)
  }

  const picker = (label: string, value: string, onChange: (v: string) => void) => (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose one</option>
        {REGIONS.map((r) => (
          <optgroup key={r} label={r}>
            {ENTITIES.filter((e) => e.region === r)
              .sort((x, y) => x.name.localeCompare(y.name))
              .map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  )

  return (
    <section id="connections" className="section">
      <div className="section-head">
        <h2>Could they have known each other?</h2>
        <p>Ask in your own words, or pick two entries. The answer follows the recorded links between them, shows each step with its source, and says plainly when nothing is recorded.</p>
      </div>
      <div className="ask-grid">
        <div className="ask-controls">
          <form className="ask-form" onSubmit={submit}>
            <label className="field">
              <span>Your question</span>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Did Jesus know about China?"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="btn primary">Ask</button>
          </form>
          {reading && (
            <div className="reading" role="status">
              {reading.message && <p>{reading.message}</p>}
              {reading.notes.map((n) => (
                <p key={n}>{n}</p>
              ))}
            </div>
          )}

          <h3>Or pick two</h3>
          {picker('First', a, (v) => set(v, b))}
          {picker('Second', b, (v) => set(a, v))}

          <h3>Try a question</h3>
          <ul className="presets">
            {PRESETS.map((q) => (
              <li key={q}>
                <button className={question === q ? 'on' : ''} onClick={() => ask(q)}>{q}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="ask-result">
          {ea && eb ? (
            <Compare a={ea} b={eb} onClear={() => onSelect([])} />
          ) : ea ? (
            <Detail e={ea} onClear={() => onSelect([])} />
          ) : (
            <section className="card">
              <h2>Ask or pick two entries</h2>
              <p className="muted">Type a question such as "Did Jesus know about China?", choose two entries from the lists, or try one of the examples. Your choice also highlights them on the globe and the timeline.</p>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
