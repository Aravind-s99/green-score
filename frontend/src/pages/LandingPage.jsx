import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function ChevronDown() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`

const LEAF_PATH = "M12 2C8 2 4 6 4 11c0 2.5 1 4.5 3 6l5-7 5 7c2-1.5 3-3.5 3-6 0-5-4-9-8-9z"

const FALLING_LEAVES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left:     4 + (i * 7.1) % 92,
  size:     13 + (i * 3) % 12,
  delay:    (i * 0.45) % 4,
  duration: 6 + (i % 4),
  rotate:   (i * 37) % 360,
  gold:     i % 3 === 0,
}))

function FallingLeaves() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      <style>{`
        @keyframes leafDrop {
          0%   { transform: translateY(-60px) translateX(0px)    rotate(0deg);   opacity: 0; }
          8%   { opacity: 0.9; }
          28%  { transform: translateY(22vh)  translateX(22px)   rotate(55deg); }
          52%  { transform: translateY(50vh)  translateX(-14px)  rotate(160deg); opacity: 0.75; }
          78%  { transform: translateY(78vh)  translateX(18px)   rotate(270deg); }
          92%  { opacity: 0.5; }
          100% { transform: translateY(108vh) translateX(-8px)   rotate(360deg); opacity: 0; }
        }
        .fl { position: absolute; top: 0; animation: leafDrop var(--dur)s var(--del)s ease-in-out infinite; }
      `}</style>
      {FALLING_LEAVES.map(l => (
        <svg key={l.id} className="fl" width={l.size} height={l.size} viewBox="0 0 24 24"
          style={{ left: `${l.left}%`, '--dur': l.duration, '--del': l.delay }}>
          <path d={LEAF_PATH}
            fill={l.gold ? 'var(--gold)' : 'var(--green-bright)'}
            opacity="0.75"/>
        </svg>
      ))}
    </div>
  )
}

const TITLE_LEAVES = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  size:     8 + (i % 3) * 3,
  startX:   10 + (i * 14) % 80,
  startY:   20 + (i * 11) % 60,
  driftX:   (i % 2 === 0 ? 1 : -1) * (8 + (i * 5) % 18),
  driftY:   -(10 + (i * 7) % 20),
  delay:    (i * 0.3) % 2,
  duration: 2.5 + (i % 3) * 0.6,
  gold:     i % 2 === 0,
}))

function TitleLeaves() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        ${TITLE_LEAVES.map(l => `
          @keyframes tleaf${l.id} {
            0%   { transform: translate(0px, 0px) rotate(0deg);   opacity: 0; }
            15%  { opacity: 0.9; }
            60%  { transform: translate(${l.driftX}px, ${l.driftY}px) rotate(${l.driftX > 0 ? 45 : -45}deg); opacity: 0.8; }
            100% { transform: translate(${l.driftX * 1.8}px, ${l.driftY * 2}px) rotate(${l.driftX > 0 ? 80 : -80}deg); opacity: 0; }
          }
        `).join('')}
        ${TITLE_LEAVES.map(l => `.tl${l.id} { animation: tleaf${l.id} ${l.duration}s ${l.delay}s ease-in-out infinite; }`).join(' ')}
      `}</style>
      {TITLE_LEAVES.map(l => (
        <svg key={l.id} className={`tl${l.id}`} width={l.size} height={l.size} viewBox="0 0 24 24"
          style={{ position: 'absolute', left: `${l.startX}%`, top: `${l.startY}%` }}>
          <path d={LEAF_PATH}
            fill={l.gold ? 'var(--gold)' : 'var(--green-bright)'}
            opacity="0.85"/>
        </svg>
      ))}
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [transitioning, setTransitioning] = useState(false)
  const triggeredRef = useRef(false)

  function enter() {
    if (triggeredRef.current) return
    triggeredRef.current = true
    setTransitioning(true)
    setTimeout(() => navigate('/home'), 820)
  }

  useEffect(() => {
    function onScroll() { if (window.scrollY > 60) enter() }
    function onWheel()  { enter() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel',  onWheel,  { passive: true, once: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel',  onWheel)
    }
  }, [transitioning])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, background: 'var(--green-deep)', backgroundImage: NOISE_SVG, backgroundRepeat: 'repeat', zIndex: -1 }}/>

      {/* Page transition */}
      {transitioning && (
        <div className="clip-reveal" style={{ position: 'fixed', inset: 0, background: 'var(--green-deep)', zIndex: 500 }}/>
      )}

      {/* Full-page falling leaves */}
      <FallingLeaves/>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>

          {/* Leaf icon above title */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
            style={{ display: 'block', margin: '0 auto 16px' }}>
            <path d="M24 4C15 4 7 13 7 22c0 5.5 2.5 10 7 13.5L24 20l10 15.5C38.5 32 41 27.5 41 22c0-9-8-18-17-18z"
              fill="var(--gold)" opacity="0.9"/>
            <line x1="24" y1="36" x2="24" y2="44" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Title with flying leaves inside */}
          <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            <TitleLeaves/>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(44px, 8vw, 72px)',
              fontWeight: 700,
              margin: '8px 0 16px',
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 40%, var(--gold) 60%, var(--gold-light) 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.25))',
              position: 'relative',
              zIndex: 1,
            }}>
              CanopyScore
            </h1>
          </div>

          <p style={{ fontSize: '15px', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '28px', fontWeight: 300 }}>
            AI-powered truth for carbon markets
          </p>

          <div style={{ width: '120px', height: '1px', background: 'var(--gold)', margin: '0 auto 28px', opacity: 0.6 }}/>

          <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 48px', fontWeight: 300 }}>
            Every green project. Verified by satellite data, public registries, and transparent AI scoring.
          </p>

          <button onClick={enter} className="canopy-btn"
            style={{ fontSize: '13px', letterSpacing: '0.1em', padding: '12px 32px' }}>
            EXPLORE PROJECTS
          </button>
        </div>

        {/* Scroll prompt */}
        <div className="bounce-down" onClick={enter} style={{
          position: 'absolute', bottom: '36px', transform: 'translateX(-50%)',
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            scroll to explore
          </span>
          <ChevronDown/>
        </div>
      </div>

    </div>
  )
}