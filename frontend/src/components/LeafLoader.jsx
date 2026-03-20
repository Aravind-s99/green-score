import { useEffect, useState } from 'react'

const PHASES = [
  'Fetching registry data...',
  'Checking satellite imagery...',
  'Running AI scoring...',
  'Building evidence trail...',
]

function Leaf({ idx }) {
  const size = 16 + Math.random() * 16
  const left = 5 + Math.random() * 90
  const delay = Math.random() * 3
  const duration = 4 + Math.random() * 3
  const gold = Math.random() > 0.5

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="canopy-leaf"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: 0,
        animation: `leaf-fall ${duration}s ${delay}s ease-in-out infinite`,
        pointerEvents: 'none',
      }}
    >
      <path
        d="M12 2C8 2 4 6 4 11c0 2.5 1 4.5 3 6l5-7 5 7c2-1.5 3-3.5 3-6 0-5-4-9-8-9z"
        fill={gold ? '#c9a84c' : '#133b1a'}
        opacity="0.85"
      />
    </svg>
  )
}

const TREE_TRUNK = "M60 180 L60 120 L55 100 L60 80 L65 100 L60 120"
const BRANCH_L1  = "M60 130 L30 100 L20 85"
const BRANCH_R1  = "M60 130 L90 100 L100 85"
const BRANCH_L2  = "M60 110 L40 85 L32 72"
const BRANCH_R2  = "M60 110 L80 85 L88 72"

const PATHS = [TREE_TRUNK, BRANCH_L1, BRANCH_R1, BRANCH_L2, BRANCH_R2]

const CROWN_CIRCLES = [
  { cx: 60, cy: 62 }, { cx: 45, cy: 72 }, { cx: 75, cy: 72 },
  { cx: 35, cy: 85 }, { cx: 85, cy: 85 }, { cx: 28, cy: 75 },
  { cx: 92, cy: 75 }, { cx: 52, cy: 55 }, { cx: 68, cy: 55 },
]

export default function LeafLoader() {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [showCrown, setShowCrown] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setPhaseIdx(i => (i + 1) % PHASES.length), 1500)
    const crownTimer = setTimeout(() => setShowCrown(true), 2200)
    return () => { clearInterval(t); clearTimeout(crownTimer) }
  }, [])

  const leaves = Array.from({ length: 12 }, (_, i) => <Leaf key={i} idx={i} />)

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '340px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '40px 20px',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {leaves}
      </div>

      <svg width="120" height="200" viewBox="0 0 120 200" style={{ display: 'block' }}>
        {PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#c9a84c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: `draw-path 0.6s ${i * 0.35}s ease forwards`,
            }}
          />
        ))}

        {showCrown && CROWN_CIRCLES.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={10 + Math.random() * 5}
            fill="#1a4023"
            stroke="#2d7a3a"
            strokeWidth="1"
            style={{
              animation: `fade-in 0.4s ${i * 0.07}s ease both`,
            }}
          />
        ))}
      </svg>

      <p style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '13px',
        color: 'var(--gold)',
        letterSpacing: '0.12em',
        marginTop: '20px',
        animation: 'pulse-text 1.5s ease-in-out infinite',
      }}>
        {PHASES[phaseIdx]}
      </p>
    </div>
  )
}
