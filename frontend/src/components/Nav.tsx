import { useEffect, useState } from 'react'

interface Props {
  onExplore: () => void
}

export function Nav({ onExplore }: Props) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <nav className={`nav${solid ? ' solid' : ''}`} aria-label="Sections">
      <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Chronicle</a>
      <div className="links">
        <button onClick={onExplore}>Globe</button>
        <a href="#timeline">Timeline</a>
        <a href="#connections">Connections</a>
        <a href="#method">Method</a>
        <a href="https://github.com/RamjeU/chronicle" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </nav>
  )
}
