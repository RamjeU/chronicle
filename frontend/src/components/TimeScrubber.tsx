import { useEffect, useRef, useState } from 'react'
import { SCALES } from '../lib/scale'
import { fmtYear, PRESENT } from '../lib/time'
import { MIN_YEAR } from '../lib/globe'

const log = SCALES.log
const T0 = log.toT(MIN_YEAR)
const T1 = log.toT(PRESENT)
const toPos = (y: number) => (log.toT(y) - T0) / (T1 - T0)
const fromPos = (p: number) => Math.min(PRESENT, Math.max(MIN_YEAR, Math.round(log.fromT(T0 + p * (T1 - T0)))))

const JUMPS = [
  { year: -100000, label: '100k years ago' },
  { year: -9500, label: '9500 BCE' },
  { year: -3000, label: '3000 BCE' },
  { year: -500, label: '500 BCE' },
  { year: 1, label: '1 CE' },
  { year: 600, label: '600 CE' },
  { year: 1000, label: '1000 CE' },
  { year: 1500, label: '1500 CE' },
  { year: 1800, label: '1800 CE' },
  { year: PRESENT, label: 'Today' },
]

interface Props {
  year: number
  onYear: (year: number) => void
}

export function TimeScrubber({ year, onYear }: Props) {
  const [playing, setPlaying] = useState(false)
  const onYearRef = useRef(onYear)
  const yearRef = useRef(year)
  onYearRef.current = onYear
  yearRef.current = year

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let pos = toPos(yearRef.current)
    if (pos > 0.995) pos = 0
    const tick = (now: number) => {
      pos = Math.min(1, pos + (now - last) / 1000 / 40)
      last = now
      onYearRef.current(fromPos(pos))
      if (pos >= 1) setPlaying(false)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  return (
    <div className="scrubber">
      <div className="scrubber-row">
        <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play through time'}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(toPos(year) * 1000)}
          onChange={(e) => {
            setPlaying(false)
            onYear(fromPos(Number(e.target.value) / 1000))
          }}
          aria-label="Year"
          aria-valuetext={fmtYear(year)}
        />
      </div>
      <div className="jumps" role="group" aria-label="Jump to a year">
        {JUMPS.map((j) => (
          <button
            key={j.year}
            className={Math.abs(year - j.year) < Math.max(2, Math.abs(j.year) * 0.02) ? 'on' : ''}
            onClick={() => {
              setPlaying(false)
              onYear(j.year)
            }}
          >
            {j.label}
          </button>
        ))}
      </div>
    </div>
  )
}
