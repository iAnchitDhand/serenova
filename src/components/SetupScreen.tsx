import { useEffect, useState } from 'react'
import { initSDK, downloadAndLoadAllModels, VOICE_MODELS, type DownloadProgress } from '../lib/runanywhere'

interface Props {
  onReady: () => void
}

interface ModelStatus {
  id: string
  name: string
  progress: number
  done: boolean
}

export default function SetupScreen({ onReady }: Props) {
  const [phase, setPhase] = useState<'init' | 'downloading' | 'ready' | 'error'>('init')
  const [models, setModels] = useState<ModelStatus[]>(
    VOICE_MODELS.map(m => ({ id: m.id, name: m.name, progress: 0, done: false }))
  )
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)

  const totalMB = 425 // approx total download size

  async function handleStart() {
    if (started) return
    setStarted(true)
    setPhase('downloading')
    try {
      await initSDK()
      await downloadAndLoadAllModels((p: DownloadProgress) => {
        setModels(prev => prev.map(m =>
          m.id === p.modelId
            ? { ...m, progress: p.progress, done: p.progress >= 1 }
            : m
        ))
      })
      setModels(prev => prev.map(m => ({ ...m, done: true, progress: 1 })))
      setPhase('ready')
      setTimeout(onReady, 350)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI models')
      setPhase('error')
    }
  }

  const overallProgress = models.reduce((sum, m) => sum + m.progress, 0) / models.length

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--parchment)',
      padding: '2rem',
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,168,130,0.15) 0%, transparent 70%)',
      }} />

      <div style={{
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
        animation: 'fadeIn 0.8s ease both',
      }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72,
          background: 'var(--ink)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: phase === 'downloading' ? 'breathe 3s ease-in-out infinite' : 'float 4s ease-in-out infinite',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 4C11 4 6 9.5 6 16C6 26 18 32 18 32C18 32 30 26 30 16C30 9.5 25 4 18 4Z"
              fill="var(--sand)" opacity="0.9" />
            <circle cx="18" cy="15" r="4" fill="var(--parchment)" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>
          Serenova
        </h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: 300 }}>
          Your private mental health companion
        </p>

        {phase === 'init' && (
          <div style={{ animation: 'fadeIn 0.5s ease both' }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-soft)',
              textAlign: 'left',
            }}>
              <p style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                Before we begin
              </p>
              {[
                ['🔒', 'Entirely private', 'All AI runs on your device. Nothing ever leaves.'],
                ['📶', 'One-time download', `~${totalMB}MB of AI models, then works offline.`],
                ['💙', 'Supportive, not clinical', 'A companion to talk to, not a replacement for therapy.'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--ink)' }}>{title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{
              fontSize: '0.78rem',
              color: 'var(--ink-muted)',
              marginBottom: '1.25rem',
              lineHeight: 1.5,
            }}>
              ⚕️ <strong>Disclaimer:</strong> Serenova is not a medical device or licensed therapist. If you're in crisis, please contact the 988 Suicide & Crisis Lifeline or your local emergency services.
            </p>

            <button
              onClick={handleStart}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: 'var(--ink)',
                color: 'var(--parchment)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
                transition: 'transform var(--transition), box-shadow var(--transition)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'
                  ; (e.target as HTMLButtonElement).style.boxShadow = 'var(--shadow-card)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.transform = ''
                  ; (e.target as HTMLButtonElement).style.boxShadow = ''
              }}
            >
              Load AI Models & Begin
            </button>
          </div>
        )}

        {phase === 'downloading' && (
          <div style={{ animation: 'fadeIn 0.4s ease both' }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-soft)',
              marginBottom: '1rem',
            }}>
              <p style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                Loading AI models…
              </p>

              {models.map(m => (
                <div key={m.id} style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.82rem', marginBottom: '0.3rem',
                  }}>
                    <span style={{ color: m.done ? 'var(--moss)' : 'var(--ink-soft)', fontWeight: m.done ? 500 : 400 }}>
                      {m.done ? '✓ ' : ''}{m.name}
                    </span>
                    <span style={{ color: 'var(--ink-muted)' }}>
                      {m.done ? 'Ready' : m.progress > 0 ? `${Math.round(m.progress * 100)}%` : 'Waiting…'}
                    </span>
                  </div>
                  <div style={{
                    height: 4, background: 'var(--parchment-mid)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${m.progress * 100}%`,
                      background: m.done ? 'var(--moss)' : 'var(--sand)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Models are stored on your device and won't need to be downloaded again.
            </p>
          </div>
        )}

        {phase === 'ready' && (
          <div style={{ animation: 'fadeIn 0.5s ease both' }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--moss)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
            }}>
              ✓
            </div>
            <p style={{ color: 'var(--moss)', fontWeight: 500, fontSize: '1.1rem' }}>
              All ready. Welcome to Serenova.
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ animation: 'fadeIn 0.4s ease both' }}>
            <div style={{
              background: '#fdf0ef',
              border: '1px solid #f0c0bc',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1rem',
            }}>
              <p style={{ color: 'var(--blush)', fontWeight: 500, marginBottom: '0.5rem' }}>Something went wrong</p>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{error}</p>
            </div>
            <button
              onClick={() => { setPhase('init'); setStarted(false); setModels(VOICE_MODELS.map(m => ({ id: m.id, name: m.name, progress: 0, done: false }))) }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--ink)',
                color: 'var(--parchment)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}