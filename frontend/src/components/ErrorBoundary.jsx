import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f7f0',
          padding: '24px',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(220,38,38,0.2)',
            borderLeft: '4px solid #dc2626',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            {/* Icon */}
            <div style={{ marginBottom: '16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '22px',
              color: '#1a2e1a',
              margin: '0 0 8px',
              fontWeight: 600,
            }}>
              Something went wrong
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#4a6741',
              margin: '0 0 20px',
              lineHeight: 1.6,
            }}>
              An unexpected error occurred. Try refreshing the page or going back to home.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  border: '1px solid #2d7a3a',
                  color: '#2d7a3a',
                  background: 'transparent',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2d7a3a'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d7a3a' }}
              >
                Refresh page
              </button>
              <button
                onClick={() => window.location.href = '/home'}
                style={{
                  border: '1px solid rgba(45,122,58,0.3)',
                  color: '#4a6741',
                  background: 'transparent',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2d7a3a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(45,122,58,0.3)'}
              >
                Go home
              </button>
            </div>

            <details style={{ marginTop: '4px' }}>
              <summary style={{
                fontSize: '12px',
                color: '#4a6741',
                cursor: 'pointer',
                userSelect: 'none',
                letterSpacing: '0.05em',
              }}>
                Error details
              </summary>
              <pre style={{
                marginTop: '10px',
                fontSize: '11px',
                color: '#dc2626',
                background: 'rgba(220,38,38,0.04)',
                border: '1px solid rgba(220,38,38,0.15)',
                borderRadius: '6px',
                padding: '12px',
                overflow: 'auto',
                maxHeight: '200px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                lineHeight: 1.5,
              }}>
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary