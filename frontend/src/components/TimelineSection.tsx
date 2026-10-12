import { useMemo, useState } from 'react'
import { Timeline } from './Timeline'
import { Panel } from './Panel'
import { ENTITIES } from '../lib/data'
import { ENTITY_TYPES, type Entity, type EntityType } from '../lib/types'
import type { ScaleMode } from '../lib/scale'
import { isAlive } from '../lib/time'

interface Props {
  year: number
  onYear: (y: number) => void
  selected: string[]
  selectedEntities: Entity[]
  onToggle: (id: string) => void
  onClear: () => void
}

export function TimelineSection({ year, onYear, selected, selectedEntities, onToggle, onClear }: Props) {
  const [mode, setMode] = useState<ScaleMode>('log')
  const [query, setQuery] = useState('')
  const [hidden, setHidden] = useState<Set<EntityType>>(new Set())

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ENTITIES.filter((e) => !hidden.has(e.type) && (!q || e.name.toLowerCase().includes(q)))
  }, [query, hidden])
  const alive = useMemo(() => visible.filter((e) => isAlive(e, year)), [visible, year])

  const linked = useMemo(() => new Set<string>(), [])
  const toggleType = (t: EntityType) =>
    setHidden((h) => {
      const n = new Set(h)
      if (n.has(t)) n.delete(t)
      else n.add(t)
      return n
    })

  return (
    <section id="timeline" className="section">
      <div className="section-head">
        <h2>Every era side by side</h2>
        <p>Each bar is a society, person or event. Click empty space to move the year marker, which also turns the globe above. Fuzzy edges show how uncertain a date is.</p>
      </div>
      <div className="tl-controls">
        <input type="search" placeholder="Filter by name" aria-label="Filter by name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="seg" role="group" aria-label="Time scale">
          <button className={mode === 'log' ? 'on' : ''} onClick={() => setMode('log')}>Log scale</button>
          <button className={mode === 'linear' ? 'on' : ''} onClick={() => setMode('linear')}>Linear</button>
        </div>
        <div className="chips">
          {ENTITY_TYPES.map((t) => (
            <button key={t} className={`chip t-${t}${hidden.has(t) ? ' off' : ''}`} onClick={() => toggleType(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="tl-grid">
        <Timeline
          key={mode}
          entities={visible}
          mode={mode}
          selected={selected}
          linked={linked}
          sliceYear={year}
          onToggle={onToggle}
          onSlice={(y) => y !== null && onYear(y)}
        />
        <Panel
          selected={selectedEntities}
          onClearSelection={onClear}
          slice={{ year, alive }}
          empty={
            <section className="card">
              <h2>Reading the timeline</h2>
              <ul className="howto">
                <li>Click a bar for details, then a second one to compare.</li>
                <li>Drag to pan. Hold Ctrl or Cmd and scroll, or use + and −, to zoom.</li>
                <li>Narrow bars are easier to hit once you zoom in.</li>
              </ul>
            </section>
          }
        />
      </div>
    </section>
  )
}
