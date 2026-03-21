import { useState } from 'react'
import SetupScreen from './components/SetupScreen'
import VoiceCompanion from './components/VoiceCompanion'
import MoodHistory from './components/MoodHistory'
import BreathingExercise from './components/BreathingExercise'
import ResourcesPanel from './components/ResourcesPanel'

type Tab = 'talk' | 'mood' | 'breathe' | 'resources'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'talk', label: 'Talk', icon: '🎙' },
  { id: 'mood', label: 'Journal', icon: '📔' },
  { id: 'breathe', label: 'Breathe', icon: '🌿' },
  { id: 'resources', label: 'Support', icon: '💛' },
]

export default function App() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('talk')

  if (!ready) {
    return <SetupScreen onReady={() => setReady(true)} />
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--parchment)',
      maxWidth: 560,
      margin: '0 auto',
      position: 'relative',
    }}>
      {/* Subtle background gradient */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse 100% 50% at 50% 0%, rgba(200,168,130,0.1) 0%, transparent 60%)',
        zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        padding: '1rem 1.25rem 0.75rem',
        borderBottom: '1px solid var(--parchment-mid)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1,
        background: 'var(--parchment)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--ink)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C5 1 3 3.5 3 6C3 11 8 14 8 14C8 14 13 11 13 6C13 3.5 11 1 8 1Z"
                fill="var(--sand)" opacity="0.9" />
              <circle cx="8" cy="5.5" r="1.8" fill="var(--parchment)" />
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.2rem',
            color: 'var(--ink)',
          }}>
            Serenova
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(74,103,65,0.1)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem 0.6rem',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--moss)', fontWeight: 500 }}>On-device</span>
        </div>
      </header>

      {/* Scrollable content area */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 1.25rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Tab title */}
        <div style={{ paddingTop: '1rem', paddingBottom: tab === 'talk' ? 0 : '0.5rem' }}>
          {tab !== 'talk' && (
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: 'var(--ink)',
              marginBottom: '0.25rem',
              animation: 'fadeIn 0.3s ease both',
            }}>
              {tab === 'mood' ? 'Your Journal' : tab === 'breathe' ? 'Breathe' : 'Support & Resources'}
            </h2>
          )}
        </div>

        {/* Tab content */}
        <div style={{
          flex: 1,
          overflowY: tab === 'talk' ? 'hidden' : 'auto',
          display: tab === 'talk' ? 'flex' : 'block',
          flexDirection: 'column',
          paddingBottom: '0.5rem',
        }}>
          {tab === 'talk' && <VoiceCompanion />}
          {tab === 'mood' && <MoodHistory />}
          {tab === 'breathe' && <BreathingExercise />}
          {tab === 'resources' && <ResourcesPanel />}
        </div>
      </main>

      {/* Bottom navigation */}
      <nav style={{
        borderTop: '1px solid var(--parchment-mid)',
        background: 'var(--parchment)',
        padding: '0.5rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom))',
        display: 'flex',
        position: 'relative',
        zIndex: 1,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '0.5rem 0.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={e => {
              if (tab !== t.id) (e.currentTarget as HTMLButtonElement).style.background = 'var(--parchment-mid)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none'
            }}
          >
            <div style={{
              width: 36, height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              background: tab === t.id ? 'var(--ink)' : 'transparent',
              transition: 'background var(--transition)',
            }}>
              <span style={{ fontSize: tab === t.id ? '0.95rem' : '1rem' }}>{t.icon}</span>
            </div>
            <span style={{
              fontSize: '0.68rem',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-muted)',
              fontWeight: tab === t.id ? 500 : 400,
              letterSpacing: '0.01em',
            }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}