import { Link } from 'react-router-dom'

function clamp0to100(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function scoreLabel(s) {
  if (s >= 75) return { text: 'High Integrity', color: '#4caf50' }
  if (s >= 55) return { text: 'Moderate Integrity', color: '#f59e0b' }
  if (s >= 35) return { text: 'Low Integrity', color: '#ef4444' }
  return { text: 'High Risk', color: '#dc2626' }
}

function getRiskFlagBadgeColor(count) {
  if (count === 0) return { bg: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)', color: '#81c784' }
  if (count <= 2) return { bg: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24' }
  return { bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }
}

function ProgressRow({ label, value, testId }) {
  const v = clamp0to100(value)
  return (
    <div style={{ marginBottom: '16px' }} data-testid={testId}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>{label}</span>
        <span style={{ fontSize: '13px', color: 'var(--gold)', fontFamily: 'monospace' }}>{Math.round(v)}</span>
      </div>
      <div style={{ height: '4px', background: '#0a1f0e', borderRadius: '2px', overflow: 'hidden', border: '1px solid #c9a84c20' }}>
        <div style={{
          height: '100%',
          width: `${v}%`,
          background: v < 41 ? '#ef4444' : v <= 70 ? '#f59e0b' : 'var(--gold)',
          borderRadius: '2px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function LeafBullet() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}>
      <path d="M12 2C8 2 4 6 4 11c0 2.5 1 4.5 3 6l5-7 5 7c2-1.5 3-3.5 3-6 0-5-4-9-8-9z" fill="#c9a84c" opacity="0.7" />
    </svg>
  )
}

export default function ScoreCard({ score }) {
  const overall = clamp0to100(score?.overall ?? score?.overall_score ?? 0)
  const label = scoreLabel(overall)

  const r = 52
  const stroke = 10
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - overall / 100)

  const riskFlags = Array.isArray(score?.risk_flags) ? score.risk_flags : []
  const evidenceSources = Array.isArray(score?.evidence_sources) ? score.evidence_sources : []

  return (
    <section style={{
      background: 'var(--green-mid)',
      border: '1px solid #c9a84c40',
      borderRadius: '16px',
      padding: '28px',
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', width: '128px', height: '128px', flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
              <circle cx="60" cy="60" r={r} fill="#0a1f0e" stroke="#1a4023" strokeWidth={stroke} />
              <circle
                cx="60" cy="60" r={r}
                fill="none"
                stroke="var(--gold)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', color: 'var(--gold)', fontWeight: 700, lineHeight: 1 }}>
                {Math.round(overall)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: '4px' }}>OVERALL</div>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--gold)', fontWeight: 600 }}>
              Green Score
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: label.color, marginTop: '4px' }}>
              {label.text}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>0–100 composite score</div>
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '260px', maxWidth: '480px' }}>
          <ProgressRow label="Authenticity"      value={score?.authenticity}      testId="sub-authenticity" />
          <ProgressRow label="Carbon Efficiency" value={score?.carbon_efficiency} testId="sub-carbon-efficiency" />
          <ProgressRow label="Biodiversity"      value={score?.biodiversity}      testId="sub-biodiversity" />
          <ProgressRow label="Transparency"      value={score?.transparency}      testId="sub-transparency" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid #c9a84c20', marginTop: '24px', paddingTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em' }}>
            RISK FLAGS
          </div>
          {riskFlags.length > 0 && (
            <div style={{
              ...getRiskFlagBadgeColor(riskFlags.length),
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
              {riskFlags.length} {riskFlags.length === 1 ? 'flag' : 'flags'}
            </div>
          )}
        </div>
        {riskFlags.length === 0 ? (
          <div style={{ 
            fontSize: '13px', 
            color: '#81c784',
            background: 'rgba(76, 175, 80, 0.08)',
            border: '1px solid rgba(76, 175, 80, 0.2)',
            borderRadius: '6px',
            padding: '10px 12px'
          }}>
            ✓ No risk flags detected
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {riskFlags.map(flag => (
              <span key={flag} style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderLeft: '3px solid #ef4444',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#fca5a5',
                letterSpacing: '0.04em',
              }}>
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #c9a84c20', marginTop: '24px', paddingTop: '24px' }}>
        <details>
          <summary style={{
            cursor: 'pointer',
            listStyle: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.05em' }}>
                EVIDENCE SOURCES
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Every output is traceable to a URL and fetch timestamp.
              </div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {evidenceSources.length} source{evidenceSources.length !== 1 ? 's' : ''} ▼
            </span>
          </summary>

          <div style={{ marginTop: '16px', borderRadius: '8px', border: '1px solid #c9a84c20', overflow: 'hidden' }}>
            {evidenceSources.length === 0 ? (
              <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>No evidence sources.</div>
            ) : (
              evidenceSources.map((src, idx) => (
                <div key={`${src?.name ?? 'source'}-${idx}`} style={{
                  padding: '14px 16px',
                  borderTop: idx === 0 ? 'none' : '1px solid #c9a84c15',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}>
                  <LeafBullet />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{src?.name ?? 'Source'}</div>
                    {src?.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer" style={{
                        fontSize: '12px',
                        color: 'var(--green-glow)',
                        wordBreak: 'break-all',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}>
                        {src.url}
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No URL</span>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Fetched: {src?.fetched_at ?? '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
      </div>

      <div style={{ borderTop: '1px solid #c9a84c20', marginTop: '24px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Powered by Verra Registry + Sentinel-2 + Hansen GFC
        </span>
        <Link to="/methodology" style={{
          fontSize: '12px',
          color: 'var(--gold)',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}>
          Scoring Methodology →
        </Link>
      </div>
    </section>
  )
}
