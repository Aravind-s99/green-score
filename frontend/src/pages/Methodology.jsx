import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function SubScore({ name, weight, inputs, flags, description }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-slate-800">{name}</span>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{weight} weight</span>
      </div>
      <p className="text-sm text-slate-600 mb-2">{description}</p>
      <div className="text-xs text-slate-500 space-y-1">
        <div><span className="font-medium text-slate-700">Inputs: </span>{inputs.join(', ')}</div>
        <div>
          <span className="font-medium text-slate-700">Risk flags: </span>
          {flags.map(f => (
            <span key={f} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-semibold">{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <div>
          <Link to="/" className="text-sm text-blue-600 hover:underline">&larr; Back to home</Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Scoring Methodology</h1>
          <p className="mt-2 text-slate-600">
            The Green Score is a 0–100 composite designed to be fully auditable — every score traces back
            to a concrete source URL and a fetch timestamp.
          </p>
        </div>

        <Section title="Sub-scores">
          <div className="space-y-4">
            <SubScore
              name="Authenticity"
              weight="30%"
              description="Measures whether the project's claimed location is consistent with independent satellite-derived evidence."
              inputs={['Registry-reported coordinates', 'Satellite-verified location data']}
              flags={['missing_coordinates', 'coordinates_mismatch_moderate', 'coordinates_mismatch_severe']}
            />
            <SubScore
              name="Carbon Efficiency"
              weight="30%"
              description="Checks whether credited reductions are plausible relative to the project's reported annual reductions."
              inputs={['Issued credits total', 'Estimated annual emission reductions']}
              flags={['missing_carbon_inputs', 'carbon_ratio_borderline', 'carbon_ratio_suspicious', 'carbon_ratio_high_risk']}
            />
            <SubScore
              name="Biodiversity"
              weight="20%"
              description="Uses vegetation and forest integrity indicators around the project area from satellite imagery."
              inputs={['NDVI trend (Sentinel-2, multi-year)', 'Intact forest percentage (Hansen dataset)', 'Tree cover loss (ha)']}
              flags={['missing_intact_forest_pct', 'recent_tree_cover_loss']}
            />
            <SubScore
              name="Transparency"
              weight="20%"
              description="Measures how easy it is for an external reviewer to validate the project's claims."
              inputs={['Number of publicly accessible documents', 'Presence of validation/verification body']}
              flags={['no_public_documents', 'missing_validation_body']}
            />
          </div>
        </Section>

        <Section title="Overall Score">
          <p className="text-sm text-slate-600">
            The overall Green Score is a weighted average of the four sub-scores:
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Authenticity', pct: '30%' },
              { label: 'Carbon Efficiency', pct: '30%' },
              { label: 'Biodiversity', pct: '20%' },
              { label: 'Transparency', pct: '20%' },
            ].map(({ label, pct }) => (
              <div key={label} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <div className="text-xl font-bold text-slate-800">{pct}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Data Sources">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <span className="text-slate-400 mt-0.5">▸</span>
              <div><span className="font-medium">Verra Registry (VCS)</span> — project metadata, estimated reductions, validation details</div>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 mt-0.5">▸</span>
              <div><span className="font-medium">Google Earth Engine / Sentinel-2 SR</span> — annual NDVI time series (2018–present)</div>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-400 mt-0.5">▸</span>
              <div><span className="font-medium">Hansen Global Forest Change v1.10</span> — tree cover loss and intact forest percentage</div>
            </div>
          </div>
        </Section>

        <Section title="Evidence & Auditability">
          <p className="text-sm text-slate-600">
            Every score response includes an <code className="bg-slate-100 px-1 rounded text-slate-800">evidence_sources</code> list.
            Each entry contains a dataset name, a direct URL, and the exact timestamp the data was fetched —
            so any score can be independently verified.
          </p>
        </Section>
      </div>
    </div>
  )
}
