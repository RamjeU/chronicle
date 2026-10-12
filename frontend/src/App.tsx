import { useMemo, useRef, useState } from 'react'
import { Nav } from './components/Nav'
import { GlobeStage } from './components/GlobeStage'
import { TimelineSection } from './components/TimelineSection'
import { ConnectSection } from './components/ConnectSection'
import { MethodSection } from './components/MethodSection'
import { ENTITIES } from './lib/data'
import { MIN_YEAR, showsAt } from './lib/globe'
import { endYear, PRESENT } from './lib/time'
import type { Entity } from './lib/types'
import './App.css'

const clampYear = (y: number) => Math.min(PRESENT, Math.max(MIN_YEAR, Math.round(y)))

/**
 * The year to show so a selection is visible on the globe: the middle of the shared lifespan of two
 * entries when they overlap, otherwise the middle of the most recent pick's lifespan.
 */
function focusYear(picked: Entity[], current: number): number {
  const located = picked.filter((e) => e.location)
  if (!located.length) return current
  const mid = (a: number, b: number) => Math.round((a + b) / 2)
  if (located.length === 2) {
    const lo = Math.max(located[0].start.year, located[1].start.year)
    const hi = Math.min(endYear(located[0]), endYear(located[1]))
    if (lo <= hi) return clampYear(mid(lo, hi))
  }
  const e = located[located.length - 1]
  return clampYear(mid(e.start.year, endYear(e)))
}

export default function App() {
  const stageRef = useRef<HTMLElement | null>(null)
  const [year, setYear] = useState(1)
  const [selected, setSelected] = useState<string[]>([])

  const selectedEntities = useMemo(
    () => selected.map((id) => ENTITIES.find((e) => e.id === id)).filter((e): e is NonNullable<typeof e> => Boolean(e)),
    [selected],
  )
  const select = (ids: string[]) => {
    setSelected(ids)
    const picked = ids.map((id) => ENTITIES.find((e) => e.id === id)).filter((e): e is Entity => Boolean(e))
    const target = focusYear(picked, year)
    // Leave the year alone when the pick is already on the globe (clicking a point should not move time).
    const visibleNow = picked.length > 0 && picked.every((e) => !e.location || showsAt(e, year))
    if (picked.length && !visibleNow) setYear(target)
  }
  const toggle = (id: string) => select(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id].slice(-2))
  const clear = () => setSelected([])
  const onYear = (y: number) => setYear(clampYear(y))

  const explore = () => {
    const el = stageRef.current
    if (!el) return
    window.scrollTo({ top: el.offsetTop + (el.offsetHeight - window.innerHeight) * 0.5, behavior: 'smooth' })
  }

  return (
    <>
      <Nav onExplore={explore} />
      <main>
        <GlobeStage
          stageRef={stageRef}
          year={year}
          onYear={onYear}
          selected={selected}
          selectedEntities={selectedEntities}
          onToggle={toggle}
          onClear={clear}
        />
        <div className="page-body">
          <TimelineSection year={year} onYear={onYear} selected={selected} selectedEntities={selectedEntities} onToggle={toggle} onClear={clear} />
          <ConnectSection selected={selected} onSelect={select} />
          <MethodSection />
          <footer className="footer">
            <span>Chronicle, an open history project</span>
            <a href="https://github.com/RamjeU/chronicle" target="_blank" rel="noreferrer">github.com/RamjeU/chronicle</a>
          </footer>
        </div>
      </main>
    </>
  )
}
