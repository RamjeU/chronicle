import { ENTITIES } from '../lib/data'
import { REGIONS } from '../lib/types'
import { Compare } from './Panel'

const PRESETS: { q: string; a: string; b: string }[] = [
  { q: 'Did Khalid ibn al-Walid know about Tamil people?', a: 'khalid', b: 'pallava' },
  { q: 'Did Jesus know about China?', a: 'jesus', b: 'han' },
  { q: 'Did Napoleon know about Islam?', a: 'napoleon', b: 'muhammad' },
  { q: 'Did ancient China know about Samoa?', a: 'han', b: 'samoa' },
  { q: 'Did the Prophet Muhammad (peace be upon him) know about China?', a: 'muhammad', b: 'tang' },
  { q: 'Could Mansa Musa have met the Mongols?', a: 'mansa-musa', b: 'mongol' },
]

interface Props {
  selected: string[]
  onSelect: (ids: string[]) => void
}

export function ConnectSection({ selected, onSelect }: Props) {
  const [a = '', b = ''] = selected
  const set = (na: string, nb: string) => onSelect([na, nb].filter((x, i, arr) => x && arr.indexOf(x) === i))
  const ea = ENTITIES.find((e) => e.id === a)
  const eb = ENTITIES.find((e) => e.id === b)

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
        <p>Pick any two entries. The answer follows the recorded links between them, shows each step with its source, and says plainly when nothing is recorded.</p>
      </div>
      <div className="ask-grid">
        <div className="ask-controls">
          {picker('First', a, (v) => set(v, b))}
          {picker('Second', b, (v) => set(a, v))}
          <h3>Try a question</h3>
          <ul className="presets">
            {PRESETS.map((p) => (
              <li key={p.q}>
                <button className={a === p.a && b === p.b ? 'on' : ''} onClick={() => set(p.a, p.b)}>{p.q}</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="ask-result">
          {ea && eb ? (
            <Compare a={ea} b={eb} onClear={() => onSelect([])} />
          ) : (
            <section className="card">
              <h2>Pick two entries</h2>
              <p className="muted">Choose two from the lists, or try one of the questions. Your choice also highlights them on the globe and the timeline.</p>
            </section>
          )}
        </div>
      </div>
    </section>
  )
}
