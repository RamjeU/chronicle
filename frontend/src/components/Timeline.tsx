import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Entity, Region } from '../lib/types'
import { REGIONS } from '../lib/types'
import { SCALES, type ScaleMode } from '../lib/scale'
import { endYear, fmtSpan, isPoint, PRESENT } from '../lib/time'

const LABEL_W = 108
const RIGHT_PAD = 16
const ROW_H = 26
const LANE_PAD = 10
const AXIS_H = 34

interface Props {
  entities: Entity[]
  mode: ScaleMode
  selected: string[]
  linked: Set<string>
  sliceYear: number | null
  onToggle: (id: string) => void
  onSlice: (year: number | null) => void
}

interface Placed {
  e: Entity
  x1: number
  x2: number
  row: number
  inside: boolean
  labelX: number
}

export function Timeline({ entities, mode, selected, linked, sliceYear, onToggle, onSlice }: Props) {
  const scale = SCALES[mode]
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  const [view, setView] = useState<[number, number]>(scale.defaultView)
  const [hover, setHover] = useState<{ e: Entity; x: number; y: number } | null>(null)
  const drag = useRef<{ startX: number; view: [number, number]; moved: boolean } | null>(null)
  const moved = useRef(false)

  const plotW = Math.max(width - LABEL_W - RIGHT_PAD, 100)
  const [t0, t1] = view
  const xOf = useCallback((t: number) => LABEL_W + ((t - t0) / (t1 - t0)) * plotW, [t0, t1, plotW])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const clampView = useCallback(
    (a: number, b: number): [number, number] => {
      const [lo, hi] = scale.limits
      let span = Math.min(Math.max(b - a, scale.minSpan), hi - lo)
      let s = a
      if (s < lo) s = lo
      if (s + span > hi) s = hi - span
      span = Math.min(span, hi - lo)
      return [s, s + span]
    },
    [scale],
  )

  const zoomAt = useCallback(
    (factor: number, px: number) => {
      const frac = (px - LABEL_W) / plotW
      const tc = t0 + Math.min(Math.max(frac, 0), 1) * (t1 - t0)
      const span = (t1 - t0) * factor
      setView(clampView(tc - frac * span, tc - frac * span + span))
    },
    [t0, t1, plotW, clampView],
  )

  // Ctrl/Cmd + wheel (and trackpad pinch) zooms; horizontal wheel pans; plain wheel scrolls the page.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (ev: WheelEvent) => {
      if (ev.ctrlKey || ev.metaKey) {
        ev.preventDefault()
        zoomAt(Math.exp(ev.deltaY * 0.01), ev.clientX - el.getBoundingClientRect().left)
      } else if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
        ev.preventDefault()
        const dt = (ev.deltaX / plotW) * (t1 - t0)
        setView(clampView(t0 + dt, t1 + dt))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt, plotW, t0, t1, clampView])

  // Drag to pan.
  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      const d = drag.current
      if (!d) return
      const dx = ev.clientX - d.startX
      if (Math.abs(dx) > 3) d.moved = moved.current = true
      if (!d.moved) return
      const dt = (-dx / plotW) * (d.view[1] - d.view[0])
      setView(clampView(d.view[0] + dt, d.view[1] + dt))
    }
    const onUp = () => {
      drag.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [plotW, clampView])

  // Lane layout: greedy row packing in pixel space, so labels never collide.
  const lanes = useMemo(() => {
    let y = AXIS_H
    return REGIONS.map((region: Region) => {
      const items = entities
        .filter((e) => e.region === region)
        .map((e) => {
          const x1 = xOf(scale.toT(e.start.year))
          const x2 = xOf(scale.toT(endYear(e)))
          return { e, x1, x2 }
        })
        .sort((a, b) => a.x1 - b.x1)
      const rowEnds: number[] = []
      const placed: Placed[] = items.map(({ e, x1, x2 }) => {
        const pt = isPoint(e)
        const barW = pt ? 10 : Math.max(x2 - x1, 5)
        const labelX = Math.max(x1, LABEL_W) + (pt ? 12 : 6)
        const labelW = e.name.length * 6.3 + 12
        const inside = !pt && x2 - labelX >= labelW
        const extent = inside ? barW : pt ? 12 + labelW : barW + 6 + labelW
        let row = rowEnds.findIndex((end) => end + 6 <= x1)
        if (row === -1) row = rowEnds.length
        rowEnds[row] = x1 + extent
        return { e, x1, x2: pt ? x1 : x2, row, inside, labelX: inside ? labelX : Math.max(x2, LABEL_W) + 6 }
      })
      const rows = Math.max(rowEnds.length, 1)
      const top = y
      const height = rows * ROW_H + LANE_PAD * 2
      y += height
      return { region, top, height, placed }
    })
  }, [entities, xOf, scale])

  const totalH = lanes.length ? lanes[lanes.length - 1].top + lanes[lanes.length - 1].height + 8 : AXIS_H
  const ticks = scale.ticks(t0, t1)

  const sliceX = sliceYear === null ? null : xOf(scale.toT(sliceYear))

  const onBackgroundClick = (ev: React.MouseEvent<SVGRectElement>) => {
    if (moved.current) return
    const rect = wrapRef.current!.getBoundingClientRect()
    const t = t0 + ((ev.clientX - rect.left - LABEL_W) / plotW) * (t1 - t0)
    onSlice(Math.round(scale.fromT(t)))
  }

  return (
    <div className="timeline" ref={wrapRef}>
      <div className="zoombar">
        <button onClick={() => zoomAt(0.6, LABEL_W + plotW / 2)} aria-label="Zoom in">+</button>
        <button onClick={() => zoomAt(1 / 0.6, LABEL_W + plotW / 2)} aria-label="Zoom out">−</button>
        <button onClick={() => setView(scale.defaultView)}>Reset</button>
      </div>
      <svg
        width={width}
        height={totalH}
        onMouseDown={(ev) => {
          moved.current = false
          drag.current = { startX: ev.clientX, view, moved: false }
        }}
        role="img"
        aria-label="Interactive timeline of human history"
      >
        <defs>
          <clipPath id="plot">
            <rect x={LABEL_W} y={0} width={plotW + RIGHT_PAD} height={totalH} />
          </clipPath>
        </defs>

        {lanes.map((l, i) => (
          <rect key={l.region} x={0} y={l.top} width={width} height={l.height} className={i % 2 ? 'lane lane-b' : 'lane'} />
        ))}
        <rect x={LABEL_W} y={AXIS_H} width={plotW + RIGHT_PAD} height={totalH - AXIS_H} className="bg" onClick={onBackgroundClick} />

        <g clipPath="url(#plot)" pointerEvents="none">
          {ticks.map((tk) => (
            <g key={tk.t}>
              <line x1={xOf(tk.t)} x2={xOf(tk.t)} y1={AXIS_H - 6} y2={totalH} className="grid" />
            </g>
          ))}
        </g>

        {lanes.map((l) => (
          <text key={l.region} x={12} y={l.top + l.height / 2 + 4} className="lane-label">{l.region}</text>
        ))}

        <g clipPath="url(#plot)">
          {lanes.flatMap((l) =>
            l.placed.map((p) => {
              const y = l.top + LANE_PAD + p.row * ROW_H
              const sel = selected.includes(p.e.id)
              const su = p.e.start.uncertainty
              const eu = p.e.end ? p.e.end.uncertainty : 0
              const hx1 = xOf(scale.toT(p.e.start.year - su))
              const hx2 = xOf(scale.toT(p.e.start.year + su))
              const ex1 = xOf(scale.toT(endYear(p.e) - eu))
              const ex2 = xOf(scale.toT(endYear(p.e) + eu))
              const pt = isPoint(p.e)
              return (
                <g
                  key={p.e.id}
                  className={`item t-${p.e.type}${sel ? ' sel' : ''}${linked.has(p.e.id) ? ' linked' : ''}`}
                  onClick={() => !moved.current && onToggle(p.e.id)}
                  onMouseEnter={(ev) => {
                    const r = wrapRef.current!.getBoundingClientRect()
                    setHover({ e: p.e, x: ev.clientX - r.left, y: ev.clientY - r.top })
                  }}
                  onMouseMove={(ev) => {
                    const r = wrapRef.current!.getBoundingClientRect()
                    setHover({ e: p.e, x: ev.clientX - r.left, y: ev.clientY - r.top })
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  {su > 0 && <rect x={hx1} y={y + 3} width={Math.max(hx2 - hx1, 2)} height={ROW_H - 10} className="halo" />}
                  {eu > 0 && !pt && <rect x={ex1} y={y + 3} width={Math.max(ex2 - ex1, 2)} height={ROW_H - 10} className="halo" />}
                  {pt ? (
                    <rect x={p.x1 - 5} y={y + 5} width={10} height={10} transform={`rotate(45 ${p.x1} ${y + 10})`} className="bar" />
                  ) : (
                    <rect x={p.x1} y={y + 4} width={Math.max(p.x2 - p.x1, 5)} height={ROW_H - 8} rx={4} className="bar" />
                  )}
                  <text x={p.labelX} y={y + 17.5} className={p.inside ? 'name in' : 'name out'}>{p.e.name}</text>
                </g>
              )
            }),
          )}
        </g>

        {sliceX !== null && sliceX >= LABEL_W && sliceX <= LABEL_W + plotW + RIGHT_PAD && (
          <g pointerEvents="none">
            <line x1={sliceX} x2={sliceX} y1={AXIS_H - 4} y2={totalH} className="slice" />
          </g>
        )}
        <rect x={0} y={0} width={width} height={AXIS_H - 8} className="axis-bg" pointerEvents="none" />
        <g pointerEvents="none">
          {ticks.map((tk) => (
            <text key={tk.t} x={xOf(tk.t) + 4} y={AXIS_H - 12} className="tick" clipPath="url(#plot)">{tk.label}</text>
          ))}
        </g>
      </svg>

      {hover && (
        <div className="tooltip" style={{ left: Math.min(hover.x + 14, width - 270), top: hover.y + 18 }}>
          <strong>{hover.e.name}</strong>
          <span>{fmtSpan(hover.e)}</span>
          <span className="muted">{hover.e.region} · {hover.e.type}</span>
        </div>
      )}
      <div className="scale-note">{mode === 'log' ? 'Log scale: distance from today. Recent history is stretched, deep prehistory is compressed.' : `Linear scale: evenly spaced years up to ${PRESENT}.`}</div>
    </div>
  )
}
