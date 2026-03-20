import { useEffect, useRef } from 'react'

const AnimatedTreeSVG = () => {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return
    const trunk = svgRef.current.querySelector('#trunk')
    const branches = svgRef.current.querySelector('#branches')
    const leaves = svgRef.current.querySelectorAll('circle.leaf')

    if (trunk) {
      trunk.style.strokeDasharray = '100'
      trunk.style.strokeDashoffset = '100'
      trunk.style.animation = 'draw-path 2s ease-in-out forwards'
    }

    if (branches) {
      branches.style.opacity = '0'
      setTimeout(() => {
        branches.style.transition = 'opacity 0.6s ease-in-out'
        branches.style.opacity = '1'
      }, 2000)
    }

    leaves.forEach((leaf, idx) => {
      leaf.style.opacity = '0'
      leaf.style.transform = 'scale(0)'
      setTimeout(() => {
        leaf.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        leaf.style.opacity = '1'
        leaf.style.transform = 'scale(1)'
      }, 2300 + idx * 80)
    })
  }, [])

  return (
    <svg width="200" height="240" viewBox="0 0 200 240" fill="none" ref={svgRef} style={{ display: 'block', margin: '0 auto' }}>
      {/* Trunk */}
      <line id="trunk" x1="100" y1="80" x2="100" y2="160" stroke="#c9a84c" strokeWidth="6" strokeLinecap="round" />

      {/* Branches */}
      <g id="branches" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M 100 100 L 70 70" />
        <path d="M 100 100 L 130 70" />
        <path d="M 100 120 L 60 90" />
        <path d="M 100 120 L 140 90" />
        <path d="M 100 140 L 75 110" />
        <path d="M 100 140 L 125 110" />
      </g>

      {/* Leaf bloom circles */}
      <circle class="leaf" cx="100" cy="50" r="8" fill="#c9a84c" opacity="0.7" />
      <circle class="leaf" cx="70" cy="70" r="7" fill="#c9a84c" opacity="0.6" />
      <circle class="leaf" cx="130" cy="70" r="7" fill="#c9a84c" opacity="0.6" />
      <circle class="leaf" cx="50" cy="95" r="6" fill="#c9a84c" opacity="0.5" />
      <circle class="leaf" cx="150" cy="95" r="6" fill="#c9a84c" opacity="0.5" />
    </svg>
  )
}

const MagnifyingGlassIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const SatelliteDishIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6c7.732 0 12 4.268 12 12" />
    <path d="M9 9c5.196 0 9 3.804 9 9" />
    <path d="M12 12c2.828 0 6 3.172 6 6" />
    <circle cx="12" cy="12" r="1" fill="#c9a84c" />
  </svg>
)

const BrainIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c5 0 8 3 8 8v2H4v-2c0-5 3-8 8-8z" />
    <path d="M6 18c-1 0-2 1-2 2v1h16v-1c0-1-1-2-2-2" />
    <circle cx="8" cy="12" r="1" fill="#c9a84c" />
    <circle cx="16" cy="12" r="1" fill="#c9a84c" />
    <circle cx="12" cy="14" r="1" fill="#c9a84c" />
  </svg>
)

const TreelineSVG = () => (
  <svg width="100%" height="120" viewBox="0 0 1200 120" fill="none" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#2d7a3a', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#1a4023', stopOpacity: 1 }} />
      </linearGradient>
    </defs>

    {/* Tree shapes */}
    <polygon points="100,20 60,80 140,80" fill="url(#treeGradient)" />
    <polygon points="250,40 200,90 300,90" fill="url(#treeGradient)" />
    <polygon points="400,10 350,70 450,70" fill="url(#treeGradient)" />
    <polygon points="550,35 500,85 600,85" fill="url(#treeGradient)" />
    <polygon points="700,25 650,75 750,75" fill="url(#treeGradient)" />
    <polygon points="850,45 800,95 900,95" fill="url(#treeGradient)" />
    <polygon points="1000,15 950,65 1050,65" fill="url(#treeGradient)" />
    <polygon points="1100,40 1050,90 1150,90" fill="url(#treeGradient)" />

    {/* Base line */}
    <line x1="0" y1="100" x2="1200" y2="100" stroke="#c9a84c20" strokeWidth="2" />
  </svg>
)

export default function About() {
  return (
    <main style={{ background: 'var(--green-deep)', minHeight: '100vh', paddingTop: '80px' }}>
      {/* Hero Section */}
      <section style={{
        padding: '80px 16px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <AnimatedTreeSVG />
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(36px, 5vw, 56px)',
          color: 'var(--gold)',
          margin: '32px 0 16px',
          fontWeight: 700,
        }}>
          About CanopyScore
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-muted)',
          maxWidth: '520px',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Built to bring transparency to the carbon markets
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #c9a84c30', margin: '60px 0' }} />

      {/* What We Do Section */}
      <section style={{
        padding: '0 16px 80px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
        }}>
          {/* The Problem */}
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '24px',
              color: 'var(--gold)',
              margin: '0 0 16px',
            }}>
              The Problem
            </h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              margin: 0,
            }}>
              The global carbon credit market is worth billions — but investors, banks, and corporations have no reliable way to verify whether a project is actually doing what it claims. Greenwashing is rampant. A forest protection project can claim carbon reductions that satellite data flatly contradicts.
            </p>
          </div>

          {/* Our Solution */}
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '24px',
              color: 'var(--gold)',
              margin: '0 0 16px',
            }}>
              Our Solution
            </h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--text-primary)',
              lineHeight: 1.8,
              margin: 0,
            }}>
              CanopyScore uses AI to cross-examine every carbon project against multiple independent data sources — public registries, satellite imagery, and verified field reports. Every score is explainable, every data point is traceable back to its source.
            </p>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #c9a84c30', margin: '60px 0' }} />

      {/* How It Works - 3 Cards */}
      <section style={{
        padding: '0 16px 80px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '28px',
          color: 'var(--gold)',
          textAlign: 'center',
          margin: '0 0 48px',
        }}>
          How It Works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {/* Card 1 */}
          <div style={{
            background: '#1a4023',
            border: '1px solid #c9a84c40',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <MagnifyingGlassIcon />
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              color: 'var(--gold)',
              margin: '0 0 12px',
            }}>
              Registry Scan
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              We pull real-time data from the Verra VCS Registry — the world's leading carbon credit registry — fetching project documents, coordinates, methodologies, and credit issuance history.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: '#1a4023',
            border: '1px solid #c9a84c40',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <SatelliteDishIcon />
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              color: 'var(--gold)',
              margin: '0 0 12px',
            }}>
              Satellite Verification
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              Using ESA Sentinel-2 imagery and Hansen Global Forest Watch data, we check whether the land actually looks like what the project claims — tracking NDVI vegetation index over time and flagging deforestation events.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: '#1a4023',
            border: '1px solid #c9a84c40',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <BrainIcon />
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              color: 'var(--gold)',
              margin: '0 0 12px',
            }}>
              AI Scoring
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              Our scoring engine weighs four dimensions: authenticity, carbon efficiency, biodiversity impact, and transparency. Every sub-score has a clear rule — nothing is a black box.
            </p>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #c9a84c30', margin: '60px 0' }} />

      {/* Score Breakdown */}
      <section style={{
        padding: '0 16px 80px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '28px',
          color: 'var(--gold)',
          textAlign: 'center',
          margin: '0 0 48px',
        }}>
          How Scores Are Calculated
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              title: 'Authenticity',
              weight: '35%',
              desc: 'Do coordinates exist? Does satellite data confirm the project location and land cover?',
            },
            {
              title: 'Carbon Efficiency',
              weight: '25%',
              desc: 'Are issued credits proportional to estimated reductions? Is a validation body listed?',
            },
            {
              title: 'Biodiversity',
              weight: '25%',
              desc: 'What is the NDVI trend? What percentage of intact forest remains?',
            },
            {
              title: 'Transparency',
              weight: '15%',
              desc: 'How many public documents exist? Is the methodology listed? Is the project status verified?',
            },
          ].map((item, idx) => (
            <div key={idx} style={{
              background: '#1a4023',
              border: '1px solid #c9a84c30',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '20px',
            }}>
              <div>
                <h3 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 8px',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {item.desc}
                </p>
              </div>
              <div style={{
                flexShrink: 0,
                background: '#c9a84c15',
                border: '1px solid #c9a84c40',
                borderRadius: '6px',
                padding: '8px 12px',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  fontFamily: 'monospace',
                }}>
                  {item.weight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #c9a84c30', margin: '60px 0' }} />

      {/* Nature Graphic */}
      <section style={{ overflow: 'hidden' }}>
        <TreelineSVG />
        <div style={{
          textAlign: 'center',
          padding: '32px 16px',
          background: 'var(--green-deep)',
        }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--gold)',
            letterSpacing: '0.1em',
            margin: 0,
            fontStyle: 'italic',
          }}>
            Every tree matters. Every score counts.
          </p>
        </div>
      </section>

      {/* Built By */}
      <section style={{
        padding: '80px 16px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
          lineHeight: 1.8,
          maxWidth: '520px',
          margin: '0 auto 32px',
        }}>
          CanopyScore was designed and built as an independent portfolio project exploring the intersection of AI, environmental data, and financial transparency.
        </p>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '18px',
          color: 'var(--gold)',
          fontStyle: 'italic',
          margin: 0,
        }}>
          
        </p>
      </section>
    </main>
  )
}
