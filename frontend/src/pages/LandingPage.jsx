import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LeafIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ display: 'block', margin: '0 auto 16px' }}>
      <path
        d="M24 4C15 4 7 13 7 22c0 5.5 2.5 10 7 13.5L24 20l10 15.5C38.5 32 41 27.5 41 22c0-9-8-18-17-18z"
        fill="#c9a84c"
        opacity="0.9"
      />
      <line x1="24" y1="36" x2="24" y2="44" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`

export default function LandingPage() {
  const navigate = useNavigate()
  const sentinelRef = useRef(null)
  const [transitioning, setTransitioning] = useState(false)

  function enter() {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => navigate('/home'), 820)
  }

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 60) enter()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transitioning])

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--green-deep)',
        backgroundImage: NOISE_SVG,
        backgroundRepeat: 'repeat',
        zIndex: -1,
      }} />

      {transitioning && (
        <div className="clip-reveal" style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--green-deep)',
          zIndex: 500,
        }} />
      )}

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px',
      }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>
          <LeafIcon />

          <h1 className="gold-shimmer" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(48px, 8vw, 72px)',
            fontWeight: 700,
            margin: '0 0 16px',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            CanopyScore
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '28px',
            fontWeight: 300,
          }}>
            AI-powered truth for carbon markets
          </p>

          <div style={{
            width: '120px',
            height: '1px',
            background: 'var(--gold)',
            margin: '0 auto 28px',
            opacity: 0.6,
          }} />

          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            maxWidth: '480px',
            margin: '0 auto 48px',
            fontWeight: 300,
          }}>
            Every green project. Verified by satellite data,
            public registries, and transparent AI scoring.
          </p>

          <button
            onClick={enter}
            className="canopy-btn"
            style={{ fontSize: '13px', letterSpacing: '0.1em', padding: '12px 32px' }}
          >
            EXPLORE PROJECTS
          </button>
        </div>

        <div
          className="bounce-down"
          onClick={enter}
          style={{
            position: 'absolute',
            bottom: '36px',
            
            transform: 'translateX(-50%)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            scroll to explore
          </span>
          <ChevronDown />
        </div>
      </div>

      <p style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        fontSize: '11px',
        color: '#c9a84c30',
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.12em',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none',
        margin: 0,
      }}>
        crafted by aravind
      </p>
    </div>
  )
}
