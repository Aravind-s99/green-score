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

function MiniTree() {
  return (
    <>
      <style>{`
        @keyframes miniTrunk { from{stroke-dashoffset:80} to{stroke-dashoffset:0} }
        @keyframes miniLeaf  { 0%,40%{opacity:0;transform:scale(0)} 100%{opacity:1;transform:scale(1)} }
        .mt { animation:miniTrunk 0.8s ease-out forwards; stroke-dasharray:80; stroke-dashoffset:80; }
        .ml { animation:miniLeaf 1.2s ease-out forwards; transform-origin:center; }
      `}</style>
      <svg width="48" height="56" viewBox="0 0 48 56" fill="none" style={{ display:'block', margin:'0 auto 8px' }}>
        <line x1="24" y1="52" x2="24" y2="28" stroke="#7a5230" strokeWidth="3" strokeLinecap="round" className="mt"/>
        <line x1="24" y1="38" x2="14" y2="28" stroke="#7a5230" strokeWidth="2" strokeLinecap="round" className="mt" style={{animationDelay:'0.3s'}}/>
        <line x1="24" y1="38" x2="34" y2="28" stroke="#7a5230" strokeWidth="2" strokeLinecap="round" className="mt" style={{animationDelay:'0.3s'}}/>
        <line x1="24" y1="32" x2="16" y2="22" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="round" className="mt" style={{animationDelay:'0.55s'}}/>
        <line x1="24" y1="32" x2="32" y2="22" stroke="#7a5230" strokeWidth="1.5" strokeLinecap="round" className="mt" style={{animationDelay:'0.55s'}}/>
        <circle cx="24" cy="16" r="9"  fill="var(--green-bright)" opacity="0.85" className="ml" style={{animationDelay:'0.8s'}}/>
        <circle cx="14" cy="22" r="7"  fill="var(--green-glow)"   opacity="0.7"  className="ml" style={{animationDelay:'0.9s'}}/>
        <circle cx="34" cy="22" r="7"  fill="var(--green-glow)"   opacity="0.7"  className="ml" style={{animationDelay:'0.95s'}}/>
        <circle cx="16" cy="14" r="5"  fill="var(--green-bright)" opacity="0.6"  className="ml" style={{animationDelay:'1.05s'}}/>
        <circle cx="32" cy="14" r="5"  fill="var(--green-bright)" opacity="0.6"  className="ml" style={{animationDelay:'1.1s'}}/>
      </svg>
    </>
  )
}

function SkeletonCard({ id }) {
  return (
    <div className="canopy-card" style={{ padding:'20px', minHeight:'160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
      <MiniTree/>
      <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.12em', textTransform:'uppercase', opacity:0.7 }}>
        VCS {id}
      </div>
      <div className="shimmer" style={{ height:'14px', width:'75%', borderRadius:'4px' }}/>
      <div className="shimmer" style={{ height:'10px', width:'45%', borderRadius:'4px', marginTop:'2px' }}/>
      <div className="shimmer" style={{ height:'3px',  width:'100%', borderRadius:'2px', marginTop:'8px' }}/>
    </div>
  )
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
        const resolved = await Promise.all(ids.map(async (id) => {
          let score = null
          try { score = await apiJson(`/api/score/${encodeURIComponent(id)}`) } catch {}
          return { id, name: score?.project_name ?? score?.name ?? null, country: score?.country ?? null, overall: clamp0to100(score?.overall), score }
        }))
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
    function onOut(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [])

  useEffect(() => {
    function hide() { setShowScrollPrompt(false) }
    window.addEventListener('scroll', hide)
    window.addEventListener('touchmove', hide)
    return () => { window.removeEventListener('scroll', hide); window.removeEventListener('touchmove', hide) }
  }, [])

  useEffect(() => {
    const h = () => { if (showScrollPrompt) scrollToFeatured() }
    window.addEventListener('wheel', h, { once: true })
    return () => window.removeEventListener('wheel', h)
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
    featuredSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const inputBase = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--green-bright)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
  }

  return (
    <main style={{ maxWidth:'1100px', margin:'0 auto', padding:'80px 16px 60px', position:'relative' }}>

      <style>{`
        input::placeholder { color: var(--text-muted); opacity: 0.75; }
        @keyframes promptBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(7px)} }
        .sp-bounce { animation: promptBounce 1.6s ease-in-out infinite; }
      `}</style>

      {/* Search hero */}
      <section style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:'16px', padding:'40px 32px', marginBottom:'48px' }}>
        <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:'clamp(24px,4vw,36px)', color:'var(--green-bright)', margin:'0 0 8px', maxWidth:'600px' }}>
          CanopyScore
        </h1>
        <p style={{ fontSize:'15px', color:'var(--text-muted)', marginBottom:'28px', maxWidth:'520px', lineHeight:1.6 }}>
          Every score is backed by satellite data, public registries, and transparent AI analysis
        </p>

        <form onSubmit={onSubmit} style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:'260px' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={onQueryChange}
              placeholder="Search project name, ID, country, methodology…"
              autoComplete="off"
              style={inputBase}
              onFocus={e => {
                e.target.style.borderColor = 'var(--gold)'
                e.target.style.borderWidth = '2px'
                e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'
                if (suggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--green-bright)'
                e.target.style.borderWidth = '1.5px'
                e.target.style.boxShadow = 'none'
              }}
            />
            {suggLoading && (
              <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}>
                <div style={{ width:'14px', height:'14px', border:'2px solid var(--card-border)', borderTopColor:'var(--green-bright)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              </div>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={dropdownRef} style={{
                position:'absolute', top:'100%', left:0, right:0, zIndex:200,
                marginTop:'4px', background:'var(--card-bg)', border:'1px solid var(--card-border)',
                borderRadius:'10px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
              }}>
                {suggestions.map(s => (
                  <button key={s.project_id} type="button"
                    onMouseDown={() => { setShowSuggestions(false); navigate(`/score/${encodeURIComponent(s.project_id)}`) }}
                    style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', padding:'10px 14px', background:'transparent', border:'none', borderBottom:'1px solid var(--card-border)', cursor:'pointer', color:'var(--text-primary)', fontFamily:"'DM Sans', sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--input-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-primary)' }}>{s.name}</div>
                      <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>
                        {s.country && <span>{s.country}</span>}
                        {s.methodology && <span style={{ color:'var(--green-bright)', marginLeft:'8px' }}>{s.methodology}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize:'11px', color:'var(--text-muted)', flexShrink:0 }}>VCS {s.project_id}</span>
                  </button>
                ))}
                <button type="submit" style={{ width:'100%', padding:'8px 14px', background:'var(--input-bg)', border:'none', borderTop:'1px solid var(--card-border)', color:'var(--green-bright)', fontSize:'12px', fontFamily:"'DM Sans', sans-serif", cursor:'pointer', textAlign:'center', letterSpacing:'0.05em' }}>
                  See all results for "{query}" →
                </button>
              </div>
            )}
          </div>
          <button type="submit" disabled={!normalizedQuery} className="canopy-btn">Search</button>
        </form>
      </section>

      {/* Scroll prompt */}
      {showScrollPrompt && (
        <div onClick={scrollToFeatured} style={{ position:'fixed', bottom:'36px', left:0, right:0, margin:'0 auto', width:'fit-content', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', zIndex:100 }}>
          <div className="sp-bounce" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <span style={{ fontSize:'11px', letterSpacing:'0.2em', color:'var(--gold)', opacity:0.7, fontFamily:"'DM Sans', sans-serif", textTransform:'uppercase', fontWeight:500 }}>
              scroll to explore
            </span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 7L10 13L16 7" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Featured projects */}
      <section ref={featuredSectionRef}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'20px', gap:'12px' }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display', serif", fontSize:'22px', color:'var(--green-bright)', margin:'0 0 4px' }}>Featured Projects</h2>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>Real Verra projects for quick evaluation</p>
          </div>
          <Link to="/search" style={{ fontSize:'13px', color:'var(--green-bright)', textDecoration:'none', letterSpacing:'0.05em', fontWeight:500 }}>Browse all →</Link>
        </div>

        {featuredError ? (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', padding:'14px', fontSize:'13px', color:'#ef4444' }}>
            {featuredError}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px' }}>
            {loadingFeatured
              ? featuredIds.map(id => <SkeletonCard key={id} id={id}/>)
              : cards.map((card, idx) => {
                  const overall = clamp0to100(card?.overall ?? 0)
                  const color   = scoreColor(overall)
                  return (
                    <Link key={card.id ?? idx} to={`/score/${encodeURIComponent(card.id)}`}
                      style={{ textDecoration:'none', display:'block', borderLeft:`3px solid ${color}` }}
                      className="canopy-card"
                    >
                      <div style={{ padding:'20px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', marginBottom:'10px' }}>
                          <div style={{ fontSize:'11px', fontWeight:600, color:'#fff', background:'var(--green-bright)', padding:'3px 10px', borderRadius:'12px', whiteSpace:'nowrap' }}>
                            VCS {card.id}
                          </div>
                          <div style={{ flexShrink:0, background:`${color}18`, border:`1px solid ${color}50`, borderRadius:'6px', padding:'4px 8px', fontSize:'14px', fontWeight:700, color, fontFamily:'monospace' }}>
                            {Math.round(overall)}
                          </div>
                        </div>

                        <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'4px', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {card.name || `Project ${card.id}`}
                        </div>

                        {card.country && (
                          <div style={{ fontSize:'11px', fontWeight:500, color:'#fff', background:'rgba(45,122,58,0.65)', padding:'2px 8px', borderRadius:'10px', display:'inline-block', marginBottom:'10px' }}>
                            {card.country}
                          </div>
                        )}

                        <div style={{ height:'4px', background:'var(--card-border)', borderRadius:'2px', overflow:'hidden', marginTop:'10px', marginBottom:'10px' }}>
                          <div style={{ height:'100%', width:`${overall}%`, background:color, borderRadius:'2px', transition:'width 0.8s ease' }}/>
                        </div>

                        <div style={{ fontSize:'12px', color:'var(--green-bright)', fontWeight:600 }}>View score →</div>
                      </div>
                    </Link>
                  )
                })
            }
          </div>
        )}
      </section>

      <p style={{ position:'fixed', bottom:'12px', right:'16px', fontSize:'11px', color:'rgba(201,168,76,0.2)', fontFamily:"'DM Sans', sans-serif", letterSpacing:'0.12em', pointerEvents:'none', zIndex:9999, userSelect:'none', margin:0 }}>
        Aravind.S &copy;
      </p>
    </main>
  )
}