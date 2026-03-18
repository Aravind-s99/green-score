import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--green-mid)', border: '1px solid #c9a84c40', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--gold)', margin: '0 0 16px' }}>{title}</h2>
      {children}
    </div>
  )
}

function SubScore({ name, weight, inputs, flags, description }) {
  return (
    <div style={{ borderTop: '1px solid #c9a84c15', paddingTop: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{name}</span>
        <span style={{ fontSize: '11px', color: 'var(--gold)', background: 'rgba(201,168,76,0.1)', border: '1px solid #c9a84c30', borderRadius: '4px', padding: '2px 8px', letterSpacing: '0.05em' }}>
          {weight} weight
        </span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.6 }}>{description}</p>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Inputs: </span>{inputs.join(', ')}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
        {flags.map(f => (
          <span key={f} style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontWeight: 600, letterSpacing: '0.03em',
          }}>{f}</span>
        ))}
      </div>
    </div>
  )
}

export default function Methodology() {
  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '80px 16px 60px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link to="/home" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to home</Link>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', color: 'var(--gold)', margin: '12px 0 8px' }}>Scoring Methodology</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
          The Green Score is a 0–100 composite designed to be fully auditable — every score traces back
          to a concrete source URL and a fetch timestamp.
        </p>
      </div>

      <Section title="Sub-scores">
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
          inputs={['NDVI trend (Sentinel-2)', 'Intact forest percentage (Hansen)', 'Tree cover loss (ha)']}
          flags={['missing_intact_forest_pct', 'recent_tree_cover_loss']}
        />
        <SubScore
          name="Transparency"
          weight="20%"
          description="Measures how easy it is for an external reviewer to validate the project's claims."
          inputs={['Methodology presence', 'Validation body', 'Registered status', 'Public documents', 'Estimated reductions']}
          flags={['no_public_documents', 'missing_validation_body']}
        />
      </Section>

      <Section title="Overall Score Weights">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {[['Authenticity', '30%'], ['Carbon Efficiency', '30%'], ['Biodiversity', '20%'], ['Transparency', '20%']].map(([label, pct]) => (
            <div key={label} style={{ background: '#0a1f0e', border: '1px solid #c9a84c25', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--gold)', fontWeight: 700 }}>{pct}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Data Sources">
        {[
          ['Verra Registry (VCS)', 'Project metadata, estimated reductions, validation details'],
          ['Google Earth Engine / Sentinel-2 SR', 'Annual NDVI time series (2018–present)'],
          ['Hansen Global Forest Change v1.10', 'Tree cover loss and intact forest percentage'],
        ].map(([name, desc]) => (
          <div key={name} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }}>▸</span>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}> — {desc}</span>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Evidence & Auditability">
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
          Every score response includes an <code style={{ background: '#0a1f0e', color: 'var(--green-glow)', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>evidence_sources</code> list.
          Each entry contains a dataset name, a direct URL, and the exact timestamp the data was fetched —
          so any score can be independently verified.
        </p>
      </Section>
    </div>
  )
}
