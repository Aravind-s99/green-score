import { useEffect, useRef, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function clamp0to100(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function scoreColor(score) {
  const s = clamp0to100(score)
  if (s < 40) return '#ef4444'
  if (s <= 70) return '#f59e0b'
  return '#4caf50'
}

async function apiJson(path, init) {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed: ${res.status}`)
  }
  return res.json()
}

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [featuredIds, setFeaturedIds] = useState([])
  const [cards, setCards] = useState([])
  const [featuredError, setFeaturedError] = useState(null)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggLoading, setSuggLoading] = useState(false)
  const [showScrollPrompt, setShowScrollPrompt] = useState(true)
  const suggTimer = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const featuredSectionRef = useRef(null)
  const normalizedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    let cancelled = false
    async function loadFeatured() {
      try {
        setLoadingFeatured(true)
        const featured = await apiJson('/api/projects/featured')
        const ids = featured?.project_ids ?? []
        if (!cancelled) setFeaturedIds(ids)
        const cardPromises = ids.map(async (id) => {
          let score = null
          try { score = await apiJson(`/api/score/${encodeURIComponent(id)}`) } catch {}
          return {
            id,
            name: score?.project_name ?? score?.name ?? null,
            country: score?.country ?? null,
            overall: clamp0to100(score?.overall),
            score,
          }
        })
        const resolved = await Promise.all(cardPromises)
        if (!cancelled) setCards(resolved)
      } catch (e) {
        if (!cancelled) setFeaturedError(e?.message ?? 'Failed to load featured projects.')
      } finally {
        if (!cancelled) setLoadingFeatured(false)
      }
    }
    loadFeatured()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function onClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    function hideScrollPrompt() {
      setShowScrollPrompt(false)
    }
    window.addEventListener('scroll', hideScrollPrompt)
    window.addEventListener('touchmove', hideScrollPrompt)
    return () => {
      window.removeEventListener('scroll', hideScrollPrompt)
      window.removeEventListener('touchmove', hideScrollPrompt)
    }
  }, [])

  // scroll OR wheel triggers scrollToFeatured
  useEffect(() => {
    const handleWheel = () => {
      if (showScrollPrompt) scrollToFeatured()
    }
    window.addEventListener('wheel', handleWheel, { once: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [showScrollPrompt])

  function onQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(suggTimer.current)
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    setSuggLoading(true)
    suggTimer.current = setTimeout(async () => {
      try {
        const data = await apiJson(`/api/search?q=${encodeURIComponent(val.trim())}`)
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : [])
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
      finally { setSuggLoading(false) }
    }, 300)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!normalizedQuery) return
    setShowSuggestions(false)
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`)
  }

  function scrollToFeatured() {
    setShowScrollPrompt(false)
    if (featuredSectionRef.current) {
      featuredSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 16px 60px', position: 'relative' }}>
      <section style={{
        background: 'var(--green-mid)',
        border: '1px solid #c9a84c40',
        borderRadius: '16px',
        padding: '40px 32px',
        marginBottom: '48px',
      }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(24px, 4vw, 36px)',
          color: 'var(--gold)',
          margin: '0 0 8px',
          maxWidth: '600px',
        }}>
          CanopyScore
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '28px', maxWidth: '520px', lineHeight: 1.6 }}>
          Every score is backed by satellite data, public registries, and transparent AI analysis
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={onQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search project name, ID, country, methodology…"
              autoComplete="off"
              style={{
                width: '100%',
                background: '#0a1f0e',
                border: '1px solid #c9a84c40',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={e => { e.target.style.borderColor = '#c9a84c'; if (suggestions.length > 0) setShowSuggestions(true) }}
              onBlur={e => e.target.style.borderColor = '#c9a84c40'}
            />
            {suggLoading && (
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <div style={{ width: '14px', height: '14px', border: '2px solid #c9a84c40', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={dropdownRef} style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                marginTop: '4px', background: '#1a4023', border: '1px solid #c9a84c40',
                borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                {suggestions.map(s => (
                  <button key={s.project_id} type="button"
                    onMouseDown={() => { setShowSuggestions(false); navigate(`/score/${encodeURIComponent(s.project_id)}`) }}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '12px', padding: '10px 14px',
                      background: 'transparent', border: 'none', borderBottom: '1px solid #c9a84c15',
                      cursor: 'pointer', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0a1f0e'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {s.country && <span>{s.country}</span>}
                        {s.methodology && <span style={{ color: 'var(--green-glow)', marginLeft: '8px' }}>{s.methodology}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>VCS {s.project_id}</span>
                  </button>
                ))}
                <button type="submit" style={{
                  width: '100%', padding: '8px 14px', background: '#0a1f0e', border: 'none',
                  borderTop: '1px solid #c9a84c20', color: 'var(--gold)', fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textAlign: 'center',
                  letterSpacing: '0.05em',
                }}>
                  See all results for "{query}" →
                </button>
              </div>
            )}
          </div>
          <button type="submit" disabled={!normalizedQuery} className="canopy-btn">
            Search
          </button>
        </form>
      </section>

      {/* Scroll prompt — centered, click or wheel to scroll down */}
      {showScrollPrompt && (
        <div
          onClick={scrollToFeatured}
          style={{
            position: 'fixed',
            bottom: '36px',
            left: 0,
            right: 0,
            margin: '0 auto',
            width: 'fit-content',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 100,
            animation: 'bounce-down 2s infinite',
          }}
        >
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#c9a84c',
            opacity: 0.7,
            fontFamily: "'DM Sans', sans-serif",
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            scroll to explore
          </span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 7L10 13L16 7" stroke="#c9a84c" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      <section ref={featuredSectionRef}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: 'var(--gold)', margin: '0 0 4px' }}>
              Featured Projects
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Real Verra projects for quick evaluation</p>
          </div>
          <Link to="/search" style={{ fontSize: '13px', color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.05em', fontWeight: 500 }}>
            Browse all →
          </Link>
        </div>

        {featuredError ? (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#fca5a5' }}>
            {featuredError}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {(loadingFeatured ? featuredIds : cards).map((item, idx) => {
              const card = typeof item === 'string' ? { id: item } : item
              const overall = clamp0to100(card?.overall ?? 0)
              const color = scoreColor(overall)
              return (
                <Link key={card.id ?? idx} to={`/score/${encodeURIComponent(card.id)}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                  className="canopy-card"
                >
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px' }}>VCS {card.id}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {card.name ?? '\u00A0'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{card.country ?? '\u00A0'}</div>
                      </div>
                      <div style={{
                        flexShrink: 0,
                        background: `${color}18`,
                        border: `1px solid ${color}50`,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: color,
                        fontFamily: 'monospace',
                      }}>
                        {loadingFeatured ? '—' : Math.round(overall)}
                      </div>
                    </div>
                    <div style={{ height: '3px', background: '#0a1f0e', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loadingFeatured ? 0 : overall}%`, background: color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--gold)', fontWeight: 500 }}>View score →</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Watermark */}
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
        Aravind.S
      </p>
    </main>
  )
}