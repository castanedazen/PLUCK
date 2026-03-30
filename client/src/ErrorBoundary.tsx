import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected client error' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PLUCK ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(180deg, #f8fbff 0%, #edf3f8 100%)',
          padding: 24,
          fontFamily: 'Inter, Arial, sans-serif',
        }}>
          <div style={{
            maxWidth: 700,
            width: '100%',
            background: '#fff',
            border: '1px solid rgba(16,32,51,0.08)',
            borderRadius: 24,
            boxShadow: '0 18px 44px rgba(16,32,51,0.08)',
            padding: 28,
          }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#728195', fontWeight: 800 }}>
              PLUCK platform recovery
            </div>
            <h1 style={{ margin: '10px 0 8px', fontSize: 34, lineHeight: 1.04 }}>Something went wrong.</h1>
            <p style={{ color: '#556579', fontSize: 16, lineHeight: 1.5 }}>
              The page hit a rendering error. Refresh once. If it keeps happening, restart the frontend and backend.
            </p>
            <pre style={{
              marginTop: 14,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#f8fbff',
              borderRadius: 16,
              padding: 14,
              fontSize: 13,
              color: '#102033',
            }}>{this.state.message}</pre>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  border: 0,
                  borderRadius: 999,
                  padding: '12px 16px',
                  background: '#102033',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Refresh PLUCK
              </button>
              <button
                onClick={() => { window.location.href = '/' }}
                style={{
                  border: '1px solid rgba(16,32,51,0.1)',
                  borderRadius: 999,
                  padding: '12px 16px',
                  background: '#fff',
                  color: '#102033',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
