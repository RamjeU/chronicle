import type { Entity } from '../lib/types'
import { REGIONS } from '../lib/types'
import { compare, fmtSpan, fmtYear } from '../lib/time'

const VERDICT_TEXT = {
  definite: 'Contemporaries: they existed at the same time, even allowing for date uncertainty.',
  possible: 'Possibly contemporaries: they only overlap if the uncertain dates fall favourably.',
  none: 'Not contemporaries: their lifespans never overlap.',
}

function Detail({ e, onClear }: { e: Entity; onClear: () => void }) {
  return (
    <section className="card">
      <header>
        <h2>{e.name}</h2>
        <button className="link" onClick={onClear}>Clear</button>
      </header>
      <p className={`pill t-${e.type}`}>{e.type} · {e.region}</p>
      <p>{fmtSpan(e)}</p>
      {e.notes && <p className="muted">{e.notes}</p>}
      {e.sources.map((s) => (
        <a key={s} href={s} target="_blank" rel="noreferrer" className="src">Source ↗</a>
      ))}
      <p className="hint">Select a second item to compare the two.</p>
    </section>
  )
}

function Compare({ a, b, onClear }: { a: Entity; b: Entity; onClear: () => void }) {
  const c = compare(a, b)
  const gap = c.gapYears
  return (
    <section className="card">
      <header>
        <h2>Compare</h2>
        <button className="link" onClick={onClear}>Clear</button>
      </header>
      <p><strong>{a.name}</strong><br /><span className="muted">{fmtSpan(a)}</span></p>
      <p><strong>{b.name}</strong><br /><span className="muted">{fmtSpan(b)}</span></p>
      <p className="sentence">{c.sentence}</p>
      <p className={`verdict v-${c.verdict}`}>{VERDICT_TEXT[c.verdict]}</p>
      {c.overlap && (
        <p className="muted">Shared window: {fmtYear(c.overlap[0])} to {fmtYear(c.overlap[1])} ({(c.overlap[1] - c.overlap[0]).toLocaleString('en-CA')} years).</p>
      )}
      {!c.overlap && <p className="muted">Gap between them: about {gap.toLocaleString('en-CA')} years.</p>}
      <p className="hint">Overlapping in time is necessary for direct knowledge, not sufficient. Geography and trade links (the contact layer) come next.</p>
    </section>
  )
}

function Slice({ year, alive, onClear }: { year: number; alive: Entity[]; onClear: () => void }) {
  return (
    <section className="card">
      <header>
        <h2>The world in {fmtYear(year)}</h2>
        <button className="link" onClick={onClear}>Clear</button>
      </header>
      {alive.length === 0 && <p className="muted">Nothing in the dataset covers this year yet.</p>}
      {REGIONS.map((r) => {
        const here = alive.filter((e) => e.region === r)
        if (!here.length) return null
        return (
          <div key={r} className="slice-group">
            <h3>{r}</h3>
            <ul>{here.map((e) => <li key={e.id}>{e.name}</li>)}</ul>
          </div>
        )
      })}
    </section>
  )
}

interface Props {
  selected: Entity[]
  sliceYear: number | null
  alive: Entity[]
  onClearSelection: () => void
  onClearSlice: () => void
}

export function Panel({ selected, sliceYear, alive, onClearSelection, onClearSlice }: Props) {
  const empty = selected.length === 0 && sliceYear === null
  return (
    <aside className="panel">
      {selected.length === 1 && <Detail e={selected[0]} onClear={onClearSelection} />}
      {selected.length === 2 && <Compare a={selected[0]} b={selected[1]} onClear={onClearSelection} />}
      {sliceYear !== null && <Slice year={sliceYear} alive={alive} onClear={onClearSlice} />}
      {empty && (
        <section className="card">
          <h2>How to use this</h2>
          <ul className="howto">
            <li><strong>Click a bar</strong> for details. Click a second one to compare when they existed.</li>
            <li><strong>Click empty space</strong> to see who was alive in that year.</li>
            <li><strong>Drag</strong> to pan. <strong>Ctrl/Cmd + scroll</strong> or the +/− buttons to zoom.</li>
            <li>Faded edges on a bar show how uncertain that date is.</li>
          </ul>
        </section>
      )}
    </aside>
  )
}
