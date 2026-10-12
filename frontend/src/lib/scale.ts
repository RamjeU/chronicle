import { PRESENT } from './time'

export type ScaleMode = 'log' | 'linear'

/**
 * A scale maps a year to a position "t" (monotonic increasing with time).
 * Linear: t is the year itself. Log: t = -log10(years-ago + 10), so the last
 * few centuries get as much room as tens of thousands of years of prehistory.
 */
export interface Scale {
  mode: ScaleMode
  toT: (year: number) => number
  fromT: (t: number) => number
  defaultView: [number, number]
  /** Widest view the user may pan or zoom to. */
  limits: [number, number]
  minSpan: number
  ticks: (t0: number, t1: number) => { t: number; label: string }[]
}

const OFFSET = 10

function niceStep(rough: number): number {
  const pow = 10 ** Math.floor(Math.log10(rough))
  const f = rough / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

function label(year: number): string {
  if (year < 0) return `${(-year).toLocaleString('en-CA')} BCE`
  return `${year} CE`
}

const linear: Scale = {
  mode: 'linear',
  toT: (y) => y,
  fromT: (t) => t,
  defaultView: [-3600, PRESENT + 40],
  limits: [-12000, PRESENT + 200],
  minSpan: 30,
  ticks(t0, t1) {
    const step = niceStep((t1 - t0) / 8)
    const out: { t: number; label: string }[] = []
    for (let y = Math.ceil(t0 / step) * step; y <= t1; y += step) out.push({ t: y, label: label(y) })
    return out
  },
}

const AGO = [0, 100, 300, 1000, 3000, 10000, 30000, 100000, 300000]

const log: Scale = {
  mode: 'log',
  toT: (y) => -Math.log10(Math.max(PRESENT - y, 0) + OFFSET),
  fromT: (t) => PRESENT + OFFSET - 10 ** -t,
  defaultView: [-Math.log10(480000), -Math.log10(OFFSET) + 0.05],
  limits: [-Math.log10(600000), -Math.log10(OFFSET) + 0.1],
  minSpan: 0.08,
  ticks(t0, t1) {
    return AGO.map((ago) => ({
      t: -Math.log10(ago + OFFSET),
      label: ago === 0 ? 'now' : ago >= 1000 ? `${ago / 1000}k ago` : `${ago} ago`,
    })).filter((x) => x.t >= t0 && x.t <= t1)
  },
}

export const SCALES: Record<ScaleMode, Scale> = { linear, log }
