import { Link } from 'react-router-dom'

function clamp0to100(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function colorForScore(score) {
  const s = clamp0to100(score)
  if (s < 40) return { fg: 'text-red-600', ring: 'stroke-red-500', bar: 'bg-red-500' }
  if (s <= 70) return { fg: 'text-amber-600', ring: 'stroke-amber-500', bar: 'bg-amber-500' }
  return { fg: 'text-emerald-600', ring: 'stroke-emerald-500', bar: 'bg-emerald-500' }
}

function ProgressRow({ label, value, testId }) {
  const v = clamp0to100(value)
  const c = colorForScore(v)

  return (
    <div className="space-y-1" data-testid={testId}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className={`text-sm tabular-nums ${c.fg}`}>{Math.round(v)}</div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full ${c.bar}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

export default function ScoreCard({ score }) {
  const overall = clamp0to100(score?.overall ?? score?.overall_score ?? 0)
  const c = colorForScore(overall)

  const r = 52
  const stroke = 10
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - overall / 100)

  const riskFlags = Array.isArray(score?.risk_flags) ? score.risk_flags : []
  const evidenceSources = Array.isArray(score?.evidence_sources) ? score.evidence_sources : []

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 120 120" className="h-full w-full">
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                className="stroke-slate-200"
                strokeWidth={stroke}
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                className={c.ring}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className={`text-3xl font-semibold tabular-nums ${c.fg}`}>{Math.round(overall)}</div>
                <div className="text-xs font-medium tracking-wide text-slate-500">OVERALL</div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-900">Green Score</div>
            <div className="text-sm text-slate-600">0–100 composite score</div>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 md:max-w-lg md:grid-cols-2">
          <ProgressRow label="Authenticity" value={score?.authenticity} testId="sub-authenticity" />
          <ProgressRow
            label="Carbon efficiency"
            value={score?.carbon_efficiency}
            testId="sub-carbon-efficiency"
          />
          <ProgressRow label="Biodiversity" value={score?.biodiversity} testId="sub-biodiversity" />
          <ProgressRow label="Transparency" value={score?.transparency} testId="sub-transparency" />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="text-sm font-semibold text-slate-900">Risk Flags</div>
        {riskFlags.length === 0 ? (
          <div className="mt-2 text-sm text-slate-600">None</div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {riskFlags.map((flag) => (
              <span
                key={flag}
                className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
              >
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <details className="group rounded-xl border border-slate-200 bg-slate-50 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Evidence Sources</div>
              <div className="mt-1 text-xs text-slate-600">
                Every output is traceable to a URL and fetch timestamp.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">
                {evidenceSources.length} source{evidenceSources.length === 1 ? '' : 's'}
              </span>
              <span className="text-slate-500 transition-transform group-open:rotate-180" aria-hidden>
                ▼
              </span>
            </div>
          </summary>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="grid grid-cols-1 gap-0">
              {evidenceSources.length === 0 ? (
                <div className="p-4 text-sm text-slate-600">No evidence sources provided.</div>
              ) : (
                evidenceSources.map((src, idx) => (
                  <div
                    key={`${src?.name ?? 'source'}-${idx}`}
                    className={`p-4 ${idx === 0 ? '' : 'border-t border-slate-200'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-slate-900">{src?.name ?? 'Source'}</div>
                      {src?.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm font-medium text-blue-700 underline decoration-blue-200 underline-offset-2 hover:decoration-blue-400"
                        >
                          {src.url}
                        </a>
                      ) : (
                        <div className="text-sm text-slate-500">No URL</div>
                      )}
                      <div className="text-xs text-slate-500">
                        Fetched: <span className="tabular-nums">{src?.fetched_at ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </details>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to="/methodology"
          className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 hover:decoration-slate-400"
        >
          Scoring Methodology
        </Link>
      </div>
    </section>
  )
}

