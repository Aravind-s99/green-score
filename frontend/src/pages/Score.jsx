import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard.jsx'

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

function latestFetchedAt(score) {
  const sources = Array.isArray(score?.evidence_sources) ? score.evidence_sources : []
  const times = sources
    .map((s) => (typeof s?.fetched_at === 'string' ? s.fetched_at : null))
    .filter(Boolean)
  if (times.length === 0) return null
  // ISO timestamps sort lexicographically if consistent
  return times.slice().sort().at(-1) ?? null
}

export default function Score() {
  const { projectId } = useParams()
  const [score, setScore] = useState(null)
  const [error, setError] = useState(null)
  const [phaseIdx, setPhaseIdx] = useState(0)

  const phases = useMemo(
    () => ['Fetching registry data...', 'Checking satellite imagery...', 'Running AI analysis...'],
    [],
  )

  useEffect(() => {
    const t = setInterval(() => setPhaseIdx((i) => (i + 1) % phases.length), 1300)
    return () => clearInterval(t)
  }, [phases.length])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setError(null)
      setScore(null)
      try {
        const body = { project_id: String(projectId ?? ''), registry: 'verra' }
        const data = await apiJson('/api/score', { method: 'POST', body: JSON.stringify(body) })
        if (!cancelled) setScore(data)
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to score project.')
      }
    }
    if (projectId) run()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const lastUpdated = latestFetchedAt(score)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 space-y-1">
        <div className="text-sm font-semibold text-slate-900">Project score</div>
        <div className="text-sm text-slate-600">
          Data from: <span className="font-medium">Verra Registry</span> +{' '}
          <span className="font-medium">Sentinel-2</span> + <span className="font-medium">Hansen Forest</span>
        </div>
        <div className="text-xs text-slate-500">
          Last updated: <span className="tabular-nums">{lastUpdated ?? '—'}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : score ? (
        <ScoreCard score={score} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">{phases[phaseIdx]}</div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full w-1/3 bg-slate-900/70 transition-all"
              style={{ marginLeft: `${(phaseIdx * 33) % 67}%` }}
            />
          </div>
        </div>
      )}
    </main>
  )
}

