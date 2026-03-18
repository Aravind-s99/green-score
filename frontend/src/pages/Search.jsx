import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

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

async function apiJson(path) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

function ResultCard({ project }) {
  return (
    <Link
      to={`/score/${encodeURIComponent(project.project_id)}`}
      className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-slate-400">VCS {project.project_id}</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
            {project.name ?? 'Untitled Project'}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        {project.country && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
            {project.country}
          </span>
        )}
        {project.status && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {project.status}
          </span>
        )}
        {project.methodology && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 truncate max-w-[200px]">
            {project.methodology}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-500 group-hover:text-slate-700">
        View green score →
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

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery)
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

  async function runSearch(q) {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setSearched(true)
    setShowSuggestions(false)
    try {
      const data = await apiJson(`/api/search?q=${encodeURIComponent(q.trim())}&registry=verra`)
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function onInputChange(e) {
    const val = e.target.value
    setInputValue(val)
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
    const q = inputValue.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    runSearch(q)
  }

  function onSuggestionClick(project) {
    setShowSuggestions(false)
    navigate(`/score/${encodeURIComponent(project.project_id)}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-blue-600 hover:underline whitespace-nowrap">&larr; Home</Link>
          <h1 className="text-2xl font-bold text-slate-900 truncate">
            {initialQuery ? `Results for "${initialQuery}"` : 'Search Projects'}
          </h1>
        </div>

        <div className="relative">
          <form onSubmit={onSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={onInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search by name, country, ID or methodology…"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              {suggLoading && (
                <div className="absolute right-3 top-3.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Search
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            >
              {suggestions.map((s) => (
                <button
                  key={s.project_id}
                  onMouseDown={() => onSuggestionClick(s)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900 truncate">{s.name}</div>
                    <div className="flex gap-2 mt-0.5">
                      {s.country && <span className="text-xs text-slate-500">{s.country}</span>}
                      {s.methodology && <span className="text-xs text-emerald-600">{s.methodology}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">VCS {s.project_id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            Searching Verra registry…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="text-3xl mb-3">🔍</div>
            <div className="text-sm font-semibold text-slate-700">No results found</div>
            <div className="text-sm text-slate-500 mt-1">Try a different name, country, or project ID</div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="text-sm text-slate-500">{results.length} result{results.length !== 1 ? 's' : ''}</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((project) => (
                <ResultCard key={project.project_id} project={project} />
              ))}
            </div>
          </>
        )}

        {!searched && !loading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Type in the search bar to find Verra carbon projects
          </div>
        )}
      </div>
    </div>
  )
}
