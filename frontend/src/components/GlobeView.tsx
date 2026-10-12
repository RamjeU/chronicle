import { useCallback, useEffect, useMemo, useRef } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { Color, Mesh, MeshPhongMaterial, SphereGeometry, TextureLoader } from 'three'
import type { Contact, Entity } from '../lib/types'
import { fmtSpan } from '../lib/time'
import { showsAt, spreadPoints, type GlobePoint } from '../lib/globe'
import { TIER_COLORS, TYPE_COLORS } from '../lib/palette'

interface Props {
  entities: Entity[]
  contacts: Contact[]
  year: number
  selected: string[]
  onToggle: (id: string) => void
  width: number
  height: number
  /** Slowly turn the globe when nobody is interacting. */
  spin: boolean
  /** Stop rendering while the globe is scrolled out of view. */
  paused: boolean
}

interface Arc {
  id: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  tier: Contact['tier']
}

/** Camera distance that keeps the whole globe inside the frame on both wide and narrow screens. */
const baseAltitude = (width: number, height: number) => Math.max(2.6, 2.7 / (width / height) - 1)

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export default function GlobeView({ entities, contacts, year, selected, onToggle, width, height, spin, paused }: Props) {
  const ref = useRef<GlobeMethods | undefined>(undefined)
  const wantSpin = useRef(false)
  const idleTimer = useRef<number>(0)
  const cleanup = useRef<(() => void) | null>(null)
  const sizeRef = useRef({ w: width, h: height })
  sizeRef.current = { w: width, h: height }

  // Relief from the bump map and a gentle shine on the oceans (the specular map loads in onReady).
  const material = useMemo(() => new MeshPhongMaterial({ bumpScale: 7, specular: new Color('#31456b'), shininess: 14 }), [])

  const byId = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities])

  const visible = useMemo(() => entities.filter((e) => showsAt(e, year)), [entities, year])
  const points = useMemo(() => spreadPoints(visible), [visible])
  const pos = useMemo(() => new Map(points.map((p) => [p.id, p])), [points])

  const linkedIds = useMemo(() => {
    const s = new Set<string>()
    if (selected.length === 1) {
      for (const c of contacts) {
        if (c.a === selected[0]) s.add(c.b)
        else if (c.b === selected[0]) s.add(c.a)
      }
    }
    return s
  }, [selected, contacts])

  const arcs = useMemo<Arc[]>(() => {
    const out: Arc[] = []
    for (const c of contacts) {
      if (year < c.from || year > c.to) continue
      const a = pos.get(c.a)
      const b = pos.get(c.b)
      if (!a || !b) continue
      out.push({ id: c.id, startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng, tier: c.tier })
    }
    return out
  }, [contacts, year, pos])

  const rings = useMemo(() => points.filter((p) => selected.includes(p.id)), [points, selected])

  // One-time scene setup: controls, relief, ocean shine and a slow cloud layer.
  const onReady = useCallback(() => {
    const g = ref.current
    if (!g) return
    const controls = g.controls()
    controls.enableZoom = false // keep the mouse wheel for scrolling the page
    controls.enablePan = false
    controls.autoRotateSpeed = 0.5
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      window.clearTimeout(idleTimer.current)
    })
    controls.addEventListener('end', () => {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(() => {
        controls.autoRotate = wantSpin.current
      }, 4000)
    })
    g.pointOfView({ lat: 22, lng: 35, altitude: baseAltitude(sizeRef.current.w, sizeRef.current.h) }, 0)

    new TextureLoader().load('/textures/earth-water.png', (tex) => {
      material.specularMap = tex
      material.needsUpdate = true
    })

    let raf = 0
    let clouds: Mesh | null = null
    new TextureLoader().load('/textures/clouds.png', (tex) => {
      clouds = new Mesh(
        new SphereGeometry(g.getGlobeRadius() * 1.012, 64, 64),
        new MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false }),
      )
      g.scene().add(clouds)
      if (!reducedMotion()) {
        const turn = () => {
          if (clouds) clouds.rotation.y += 0.00005
          raf = requestAnimationFrame(turn)
        }
        turn()
      }
    })
    cleanup.current = () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idleTimer.current)
      if (clouds) g.scene().remove(clouds)
    }
  }, [material])

  useEffect(() => () => cleanup.current?.(), [])

  useEffect(() => {
    wantSpin.current = spin && !reducedMotion() && selected.length === 0
    const g = ref.current
    if (g) g.controls().autoRotate = wantSpin.current
  }, [spin, selected])

  // Re-frame when the window changes shape, keeping the current view.
  useEffect(() => {
    const g = ref.current
    if (g) g.pointOfView({ ...g.pointOfView(), altitude: baseAltitude(width, height) }, 0)
  }, [width, height])

  useEffect(() => {
    const g = ref.current
    if (!g) return
    if (paused) g.pauseAnimation()
    else g.resumeAnimation()
  }, [paused])

  // Fly to the most recently selected entity.
  const last = selected[selected.length - 1]
  useEffect(() => {
    const g = ref.current
    const p = last ? pos.get(last) : undefined
    if (g && p) g.pointOfView({ lat: p.lat, lng: p.lng, altitude: Math.max(1.9, baseAltitude(sizeRef.current.w, sizeRef.current.h) * 0.72) }, 900)
    // Only re-aim when the selection changes, not while scrubbing through time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last])

  return (
    <Globe
      ref={ref}
      width={width}
      height={height}
      onGlobeReady={onReady}
      backgroundColor="rgba(0,0,0,0)"
      globeMaterial={material}
      globeImageUrl="/textures/earth-blue-marble.jpg"
      bumpImageUrl="/textures/earth-topology.png"
      showAtmosphere
      atmosphereColor="#7ab8ff"
      atmosphereAltitude={0.22}
      pointsData={points}
      pointLat="lat"
      pointLng="lng"
      pointAltitude={(d: object) => (selected.includes((d as GlobePoint).id) ? 0.08 : linkedIds.has((d as GlobePoint).id) ? 0.05 : 0.022)}
      pointRadius={(d: object) => (selected.includes((d as GlobePoint).id) ? 1.3 : 0.8)}
      pointColor={(d: object) => TYPE_COLORS[(d as GlobePoint).type]}
      pointsTransitionDuration={150}
      pointLabel={(d: object) => {
        const p = d as GlobePoint
        const e = byId.get(p.id)!
        return `<div class="globe-tip"><strong>${esc(p.name)}</strong><span>${esc(fmtSpan(e))}</span><span>${esc(p.place)}</span></div>`
      }}
      onPointClick={(d: object) => onToggle((d as GlobePoint).id)}
      arcsData={arcs}
      arcColor={(d: object) => TIER_COLORS[(d as Arc).tier]}
      arcStroke={(d: object) => ((d as Arc).tier === 'documented' ? 0.45 : 0.3)}
      arcDashLength={(d: object) => ((d as Arc).tier === 'documented' ? 1 : 0.3)}
      arcDashGap={(d: object) => ((d as Arc).tier === 'documented' ? 0 : 0.2)}
      arcDashAnimateTime={(d: object) => ((d as Arc).tier === 'documented' ? 0 : 3200)}
      arcAltitudeAutoScale={0.38}
      arcsTransitionDuration={0}
      ringsData={rings}
      ringLat="lat"
      ringLng="lng"
      ringColor={() => (t: number) => `rgba(236,231,218,${1 - t})`}
      ringMaxRadius={4}
      ringPropagationSpeed={2}
      ringRepeatPeriod={1400}
    />
  )
}
