import { useMemo, useState } from 'react'
import { Timeline } from './components/Timeline'
import { Panel } from './components/Panel'
import { CONTACTS, ENTITIES } from './lib/data'
import { ENTITY_TYPES, type EntityType } from './lib/types'
import type { ScaleMode } from './lib/scale'
import { isAlive } from './lib/time'
import './App.css'

export default function App() {
  const [mode, setMode] = useState<ScaleMode>('log')
  const [query, setQuery] = useState('')
  const [hiddenTypes, setHiddenTypes] = useState<Set<EntityType>>(new Set())
  const [selected, setSelected] = useState<string[]>([])
  const [sliceYear, setSliceYear] = useState<number | null>(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ENTITIES.filter((e) => !hiddenTypes.has(e.type) && (!q || e.name.toLowerCase().includes(q)))
  }, [query, hiddenTypes])

  const selectedEntities = selected.map((id) => ENTITIES.find((e) => e.id === id)!).filter(Boolean)
  const linked = useMemo(() => {
    const set = new Set<string>()
    if (selected.length !== 1) return set
    for (const c of CONTACTS) {
      if (c.a === selected[0]) set.add(c.b)
      else if (c.b === selected[0]) set.add(c.a)
    }
    return set
  }, [selected])
  const alive = useMemo(() => (sliceYear === null ? [] : visible.filter((e) => isAlive(e, sliceYear))), [visible, sliceYear])

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)))

  const toggleType = (t: EntityType) =>
    setHiddenTypes((h) => {
      const n = new Set(h)
      if (n.has(t)) n.delete(t)
      else n.add(t)
      return n
    })

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Chronicle</h1>
          <p>Who existed when, and who could have known whom. {ENTITIES.length} entries, {CONTACTS.length} recorded connections.</p>
        </div>
        <div className="controls">
          <input type="search" placeholder="Filter by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="seg" role="group" aria-label="Time scale">
            <button className={mode === 'log' ? 'on' : ''} onClick={() => setMode('log')}>Log scale</button>
            <button className={mode === 'linear' ? 'on' : ''} onClick={() => setMode('linear')}>Linear</button>
          </div>
        </div>
      </header>

      <div className="chips">
        {ENTITY_TYPES.map((t) => (
          <button key={t} className={`chip t-${t}${hiddenTypes.has(t) ? ' off' : ''}`} onClick={() => toggleType(t)}>
            {t}
          </button>
        ))}
      </div>

      <main className="main">
        <Timeline
          key={mode}
          entities={visible}
          mode={mode}
          selected={selected}
          linked={linked}
          sliceYear={sliceYear}
          onToggle={toggle}
          onSlice={setSliceYear}
        />
        <Panel
          selected={selectedEntities}
          sliceYear={sliceYear}
          alive={alive}
          onClearSelection={() => setSelected([])}
          onClearSlice={() => setSliceYear(null)}
        />
      </main>
    </div>
  )
}
