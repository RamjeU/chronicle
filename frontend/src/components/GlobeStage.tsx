import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Entity } from '../lib/types'
import { CONTACTS, ENTITIES } from '../lib/data'
import { fmtYear } from '../lib/time'
import { showsAt } from '../lib/globe'
import { TIER_COLORS } from '../lib/palette'
import { TimeScrubber } from './TimeScrubber'
import { Panel } from './Panel'

const GlobeView = lazy(() => import('./GlobeView'))

interface Props {
  year: number
  onYear: (y: number) => void
  selected: string[]
  selectedEntities: Entity[]
  onToggle: (id: string) => void
  onClear: () => void
  stageRef: React.RefObject<HTMLElement | null>
}

/**
 * A tall section with a pinned viewport. Scrolling cross-fades the opening screen into the explorer
 * while the same globe stays on screen.
 */
export function GlobeStage({ year, onYear, selected, selectedEntities, onToggle, onClear, stageRef }: Props) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [phase, setPhase] = useState<'hero' | 'explore'>('hero')
  const phaseRef = useRef(phase)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const total = el.offsetHeight - window.innerHeight
      const rect = el.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(total, 1)))
      setOnScreen(rect.bottom > 0)
      el.style.setProperty('--p', p.toFixed(4))
      const next = p < 0.2 ? 'hero' : 'explore'
      if (next !== phaseRef.current) {
        phaseRef.current = next
        setPhase(next)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [stageRef])

  const here = useMemo(() => ENTITIES.filter((e) => showsAt(e, year)), [year])
  const unplaced = ENTITIES.filter((e) => !e.location).length

  const explore = () => {
    const el = stageRef.current
    if (!el) return
    const total = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: el.offsetTop + total * 0.5, behavior: 'smooth' })
  }

  return (
    <section id="home" className="stage" data-phase={phase} ref={stageRef}>
      <div className="pin">
        <div className="wordmark" aria-hidden="true">Chronicle</div>

        <div className="globe-wrap">
          <Suspense fallback={<div className="globe-loading">Loading the globe</div>}>
            <GlobeView
              entities={ENTITIES}
              contacts={CONTACTS}
              year={year}
              selected={selected}
              onToggle={onToggle}
              width={size.w}
              height={size.h}
              spin={phase === 'hero' || selected.length === 0}
              paused={!onScreen}
            />
          </Suspense>
        </div>

        <div className="hero-layer">
          <h1 className="visually-hidden">Chronicle</h1>
          <p className="lede">Spin the planet, scrub through 300,000 years, and see who could have known whom.</p>
          <div className="cta">
            <button className="btn primary" onClick={explore}>Explore the globe</button>
            <a className="btn" href="#timeline">Open the timeline</a>
          </div>
          <p className="fine">{ENTITIES.length} entries and {CONTACTS.length} recorded connections, each with a source.</p>
        </div>

        <div className="explore-layer">
          <div className="readout">
            <div className="year">{fmtYear(year)}</div>
            <p>{here.length} places and peoples on the globe</p>
            <ul className="legend">
              <li><i style={{ background: TIER_COLORS.documented }} /> Documented link</li>
              <li><i className="dashed" style={{ color: TIER_COLORS.plausible }} /> Plausible link</li>
            </ul>
            <p className="fine">Click a point to read about it, then another to compare the two.{unplaced ? ` ${unplaced} global entries appear only on the timeline.` : ''}</p>
          </div>
          <div className="explore-panel">
            <Panel
              selected={selectedEntities}
              onClearSelection={onClear}
              empty={<section className="card"><p className="muted">Nothing selected yet. Drag the globe, or pick a point.</p></section>}
            />
          </div>
          <TimeScrubber year={year} onYear={onYear} />
        </div>
      </div>
    </section>
  )
}
