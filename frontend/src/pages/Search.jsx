import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

async function apiJson(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function ResultCard({ project }) {
  return (
    <Link to={`/score/${encodeURIComponent(project.project_id)}`}
      style={{ textDecoration: 'none', display: 'block' }}
      className="canopy-card"
    >
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '6px' }}>
          VCS {project.project_id}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.35 }}>
          {project.name ?? 'Untitled Project'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {project.country && (
            <span style={{ fontSize: '11px', color: '#fff', background: 'rgba(45,122,58,0.65)', borderRadius: '10px', padding: '2px 10px', fontWeight: 500 }}>
              {project.country}
            </span>
          )}
          {project.status && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(45,122,58,0.07)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '2px 8px' }}>
              {project.status}
            </span>
          )}
          {project.methodology && (
            <span style={{ fontSize: '11px', color: 'var(--green-bright)', background: 'rgba(45,122,58,0.07)', border: '1px solid rgba(45,122,58,0.25)', borderRadius: '4px', padding: '2px 8px' }}>
              {project.methodology}
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--green-bright)', fontWeight: 600 }}>View green score →</div>
      </div>
    </Link>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggLoading, setSuggLoading] = useState(false)
  const suggTimer = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => { if (initialQuery) runSearch(initialQuery) }, [])

  useEffect(() => {
    function onOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  async function runSearch(q) {
    if (!q.trim()) return
    setLoading(true); setError(null); setSearched(true); setShowSuggestions(false)
    try {
      const data = await apiJson(`/api/search?q=${encodeURIComponent(q.trim())}`)
      setResults(Array.isArray(data) ? data : [])
    } catch (e) { setError(e.message); setResults([]) }
    finally { setLoading(false) }
  }

  function onInputChange(e) {
    const val = e.target.value
    setInputValue(val)
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
    const q = inputValue.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    runSearch(q)
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 16px 60px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/home" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Home</Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: 'var(--green-bright)', margin: 0 }}>
          {initialQuery ? `Results for "${initialQuery}"` : 'Search Projects'}
        </h1>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={onInputChange}
            placeholder="Search by name, country, ID or methodology…"
            autoComplete="off"
            style={{
              width: '100%', background: 'var(--input-bg)', border: '1px solid var(--card-border)',
              borderRadius: '8px', padding: '12px 16px', fontSize: '14px',
              color: 'var(--text-primary)', outline: 'none', fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(45,122,58,0.5)'; if (suggestions.length > 0) setShowSuggestions(true) }}
            onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
          />
          {suggLoading && (
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(45,122,58,0.2)', borderTopColor: 'var(--green-bright)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
            </div>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div ref={dropdownRef} style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              marginTop: '4px', background: '#ffffff', border: '1px solid var(--card-border)',
              borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            }}>
              {suggestions.map(s => (
                <button key={s.project_id} type="button"
                  onMouseDown={() => { setShowSuggestions(false); navigate(`/score/${encodeURIComponent(s.project_id)}`) }}
                  style={{
                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '12px', padding: '10px 14px',
                    background: 'transparent', border: 'none', borderBottom: '1px solid var(--card-border)',
                    cursor: 'pointer', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,122,58,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.country && <span>{s.country}</span>}
                      {s.methodology && <span style={{ color: 'var(--green-bright)', marginLeft: '8px' }}>{s.methodology}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>VCS {s.project_id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={!inputValue.trim()} className="canopy-btn">Search</button>
      </form>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid rgba(45,122,58,0.2)', borderTopColor: 'var(--green-bright)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
          Searching Verra VCS Registry…
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div style={{ background: '#ffffff', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🌿</div>
          <div style={{ fontFamily: "'Playfair Display', serif", color: 'var(--green-bright)', fontSize: '18px', marginBottom: '6px' }}>No results found</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Try a different name, country, or project ID</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {results.map(project => <ResultCard key={project.project_id} project={project}/>)}
          </div>
        </>
      )}

      {!searched && !loading && (
        <div style={{ background: '#ffffff', border: '1px dashed var(--card-border)', borderRadius: '12px', padding: '48px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Search carbon projects from the Verra VCS Registry
        </div>
      )}

      <p style={{
        position: 'fixed', bottom: '12px', right: '16px', fontSize: '11px',
        color: 'rgba(45,122,58,0.2)', fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.12em', pointerEvents: 'none', zIndex: 9999, userSelect: 'none', margin: 0,
      }}>
        crafted by Aravind.S &copy;
      </p>
    </div>
  )
}