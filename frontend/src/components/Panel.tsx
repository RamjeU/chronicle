import type { ReactNode } from 'react'
import type { Contact, Entity } from '../lib/types'
import { REGIONS } from '../lib/types'
import { compare, fmtSpan, fmtYear } from '../lib/time'
import { assess, connectionsOf, type Assessment } from '../lib/contact'
import { CONTACTS, ENTITIES } from '../lib/data'

const span = (c: { from: number; to: number }) => (c.from === c.to ? fmtYear(c.from) : `${fmtYear(c.from)} to ${fmtYear(c.to)}`)

const VERDICT_TEXT = {
  definite: 'Contemporaries: they existed at the same time, even allowing for date uncertainty.',
  possible: 'Possibly contemporaries: they only overlap if the uncertain dates fall favourably.',
  none: 'Not contemporaries: their lifespans never overlap.',
}

function TierBadge({ tier }: { tier: Contact['tier'] }) {
  return <span className={`tier tier-${tier}`}>{tier}</span>
}

function Knowledge({ result }: { result: Assessment }) {
  return (
    <div className={`know k-${result.outcome}`}>
      <h3>Could they have known?</h3>
      <p className="headline">{result.headline}</p>
      {result.window && <p className="muted">Link active: {span({ from: result.window[0], to: result.window[1] })}.</p>}
      {result.steps.length > 0 && (
        <ol className="chain">
          {result.steps.map((st) => (
            <li key={st.contact.id}>
              <div><strong>{st.from.name}</strong> to <strong>{st.to.name}</strong></div>
              <div className="muted">{st.contact.kind}, {span(st.contact)} <TierBadge tier={st.contact.tier} /></div>
              <div>{st.contact.summary}</div>
              {st.contact.sources.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="src">Source</a>
              ))}
            </li>
          ))}
        </ol>
      )}
      {result.caveat && <p className="muted">{result.caveat}</p>}
    </div>
  )
}

function Connections({ id }: { id: string }) {
  const list = connectionsOf(id, CONTACTS)
  if (!list.length) return <p className="muted">No recorded connections yet.</p>
  return (
    <div className="conns">
      <h3>Recorded connections</h3>
      <ul>
        {list.map((c) => {
          const o = ENTITIES.find((e) => e.id === (c.a === id ? c.b : c.a))
          return (
            <li key={c.id}>
              <strong>{o?.name}</strong> <span className="muted">{c.kind}, {span(c)}</span> <TierBadge tier={c.tier} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Detail({ e, onClear }: { e: Entity; onClear: () => void }) {
  return (
    <section className="card">
      <header>
        <h2>{e.name}</h2>
        <button className="link" onClick={onClear}>Clear</button>
      </header>
      <p className={`pill t-${e.type}`}>{e.type}, {e.location?.label ?? e.region}</p>
      <p>{fmtSpan(e)}</p>
      {e.notes && <p className="muted">{e.notes}</p>}
      {e.sources.map((s) => (
        <a key={s} href={s} target="_blank" rel="noreferrer" className="src">Source</a>
      ))}
      <Connections id={e.id} />
      <p className="hint">Select a second item to compare the two.</p>
    </section>
  )
}

export function Compare({ a, b, onClear }: { a: Entity; b: Entity; onClear: () => void }) {
  const c = compare(a, b)
  const k = assess(a, b, ENTITIES, CONTACTS)
  return (
    <section className="card">
      <header>
        <h2>{a.name} and {b.name}</h2>
        <button className="link" onClick={onClear}>Clear</button>
      </header>
      <p><strong>{a.name}</strong><br /><span className="muted">{fmtSpan(a)}</span></p>
      <p><strong>{b.name}</strong><br /><span className="muted">{fmtSpan(b)}</span></p>
      <p className="sentence">{c.sentence}</p>
      <p className={`verdict v-${c.verdict}`}>{VERDICT_TEXT[c.verdict]}</p>
      {c.overlap && (
        <p className="muted">Shared window: {fmtYear(c.overlap[0])} to {fmtYear(c.overlap[1])} ({(c.overlap[1] - c.overlap[0]).toLocaleString('en-CA')} years).</p>
      )}
      {!c.overlap && <p className="muted">Gap between them: about {c.gapYears.toLocaleString('en-CA')} years.</p>}
      <Knowledge result={k} />
      <p className="hint">Dates alone never prove contact. The links are hand-curated from the cited sources, and "plausible" means consistent with the evidence, not attested.</p>
    </section>
  )
}

function Slice({ year, alive }: { year: number; alive: Entity[] }) {
  return (
    <section className="card">
      <header>
        <h2>The world in {fmtYear(year)}</h2>
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
  onClearSelection: () => void
  slice?: { year: number; alive: Entity[] }
  empty?: ReactNode
}

export function Panel({ selected, onClearSelection, slice, empty }: Props) {
  return (
    <aside className="panel">
      {selected.length === 1 && <Detail e={selected[0]} onClear={onClearSelection} />}
      {selected.length === 2 && <Compare a={selected[0]} b={selected[1]} onClear={onClearSelection} />}
      {selected.length === 0 && empty}
      {slice && <Slice year={slice.year} alive={slice.alive} />}
    </aside>
  )
}
