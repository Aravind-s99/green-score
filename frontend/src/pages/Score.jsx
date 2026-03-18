import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ScoreCard from '../components/ScoreCard.jsx'
import LeafLoader from '../components/LeafLoader.jsx'

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
  const times = sources.map(s => typeof s?.fetched_at === 'string' ? s.fetched_at : null).filter(Boolean)
  return times.length === 0 ? null : times.slice().sort().at(-1) ?? null
}

export default function Score() {
  const { projectId } = useParams()
  const [score, setScore] = useState(null)
  const [error, setError] = useState(null)

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
    return () => { cancelled = true }
  }, [projectId])

  const lastUpdated = latestFetchedAt(score)

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 16px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/home" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back
        </Link>
        <div style={{ marginTop: '12px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: 'var(--gold)', margin: '0 0 4px' }}>
            Project Score
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Verra Registry · Sentinel-2 · Hansen Forest Change
          </div>
          {lastUpdated && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Last updated: {lastUpdated}
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '13px',
          color: '#fca5a5',
        }}>
          {error}
        </div>
      ) : score ? (
        <ScoreCard score={score} />
      ) : (
        <div style={{
          background: 'var(--green-mid)',
          border: '1px solid #c9a84c40',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <LeafLoader />
        </div>
      )}
    </main>
  )
}
