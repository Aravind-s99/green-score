import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function clamp0to100(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function scoreColor(score) {
  const s = clamp0to100(score)
  if (s < 40) return 'bg-red-50 text-red-700 ring-red-200'
  if (s <= 70) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
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
  const suggTimer = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const normalizedQuery = useMemo(() => query.trim(), [query])

  useEffect(() => {
    let cancelled = false
    async function loadFeatured() {
      try {
        setLoadingFeatured(true)
        const featured = await apiJson('/api/projects/featured')
        const ids = featured?.project_ids ?? []
        if (!cancelled) setFeaturedIds(ids)

        // Fetch score + registry detail (for name/country if present in score provenance).
        const cardPromises = ids.map(async (id) => {
          let score = null
          try {
            score = await apiJson(`/api/score/${encodeURIComponent(id)}?registry=verra`)
          } catch {
            // Score can fail if pipeline can’t run (coords missing, creds, etc.).
          }

          // Best-effort display fields
          const overall = clamp0to100(score?.overall)
          const name = score?.project_name ?? score?.name ?? null
          const country = score?.country ?? null

          return { id, name, country, overall, score }
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
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onClickOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function onQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(suggTimer.current)
    if (val.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSuggLoading(true)
    suggTimer.current = setTimeout(async () => {
      try {
        const data = await apiJson(`/api/search?q=${encodeURIComponent(val.trim())}&registry=verra`)
        setSuggestions(Array.isArray(data) ? data.slice(0, 8) : [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setSuggLoading(false)
      }
    }, 300)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!normalizedQuery) return
    setShowSuggestions(false)
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`)
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Green Score — AI-powered verification for carbon projects
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
            Every score is backed by satellite data, public registries, and transparent AI analysis
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={query}
                onChange={onQueryChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search project name, ID, country, methodology…"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              {suggLoading && (
                <div className="absolute right-3 top-3.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                </div>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.project_id}
                      type="button"
                      onMouseDown={() => {
                        setShowSuggestions(false)
                        navigate(`/score/${encodeURIComponent(s.project_id)}`)
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                        <div className="flex gap-2 mt-0.5">
                          {s.country && <span className="text-xs text-slate-500">{s.country}</span>}
                          {s.methodology && <span className="text-xs text-emerald-600 truncate max-w-[160px]">{s.methodology}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">VCS {s.project_id}</span>
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 text-center transition border-t border-slate-100"
                  >
                    See all results for "{query}" →
                  </button>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!normalizedQuery}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Featured Projects</h2>
            <p className="mt-1 text-sm text-slate-600">Real Verra projects for quick evaluation.</p>
          </div>
          <Link
            to="/search"
            className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 hover:decoration-slate-400"
          >
            Browse search
          </Link>
        </div>

        {featuredError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {featuredError}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(loadingFeatured ? featuredIds : cards).map((item, idx) => {
              const card = typeof item === 'string' ? { id: item } : item
              const overall = clamp0to100(card?.overall ?? 0)
              const badge = scoreColor(overall)
              return (
                <Link
                  key={card.id ?? idx}
                  to={`/score/${encodeURIComponent(card.id)}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">VCS {card.id}</div>
                      <div className="mt-1 truncate text-sm text-slate-600">
                        {card.name ?? '\u00A0'}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {card.country ?? '\u00A0'}
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${badge}`}
                      title="Overall score (0–100)"
                    >
                      {loadingFeatured ? '—' : Math.round(overall)}
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-slate-900/70"
                      style={{ width: `${loadingFeatured ? 0 : overall}%` }}
                    />
                  </div>
                  <div className="mt-3 text-xs font-semibold text-slate-600 group-hover:text-slate-800">
                    View score →
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

