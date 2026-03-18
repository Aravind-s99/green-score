import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function LeafIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C7 2 3 7 3 12c0 3 1.5 5.5 4 7l5-7 5 7c2.5-1.5 4-4 4-7 0-5-4-10-9-10z"
        fill="#c9a84c"
        opacity="0.9"
      />
      <line x1="12" y1="19" x2="12" y2="22" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: scrolled ? 'rgba(10,31,14,0.85)' : '#0a1f0e',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: scrolled ? '1px solid #c9a84c60' : '1px solid #c9a84c25',
      transition: 'all 0.3s ease',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <LeafIcon size={22} />
        <span className="gold-shimmer" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '0.03em',
        }}>
          CanopyScore
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        <Link to="/search" style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--gold)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          SEARCH PROJECTS
        </Link>
        <Link to="/about" style={{
          color: 'var(--text-muted)',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color = 'var(--gold)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          ABOUT
        </Link>
      </div>
    </nav>
  )
}
