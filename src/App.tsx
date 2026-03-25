import { useState, useCallback, useEffect, useRef } from 'react'
import SetupScreen from './components/SetupScreen'
import VoiceCompanion from './components/VoiceCompanion'
import MoodHistory from './components/MoodHistory'
import BreathingExercise from './components/BreathingExercise'
import ResourcesPanel from './components/ResourcesPanel'
import BubbleCanvas from './components/BubbleCanvas'
import SoundscapePlayer from './components/SoundScapePlayer.tsx'
import RelaxingGames from './components/RelaxingGames'
import { useRipple } from './hooks/useRipple'

type Tab = 'talk' | 'mood' | 'breathe' | 'bubbles' | 'sounds' | 'games' | 'resources'

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: 'talk', label: 'Talk', icon: '🎙', color: '#c8a882' },
  { id: 'breathe', label: 'Breathe', icon: '🌿', color: '#4a6741' },
  { id: 'bubbles', label: 'Bubbles', icon: '🫧', color: '#5b7fa6' },
  { id: 'sounds', label: 'Sounds', icon: '🎵', color: '#8b7ec8' },
  { id: 'games', label: 'Games', icon: '🎮', color: '#d4a53a' },
  { id: 'mood', label: 'Journal', icon: '📔', color: '#c4736a' },
  { id: 'resources', label: 'Support', icon: '💛', color: '#6a9160' },
]

const TAB_TITLES: Record<Tab, string> = {
  talk: '',
  breathe: 'Breathe',
  bubbles: 'Bubble Pop',
  sounds: 'Soundscapes',
  games: 'Calm Games',
  mood: 'Your Journal',
  resources: 'Support',
}

function AmbientParticles() {
  const particles = Array.from({ length: 10 }, (_, i) => ({
    size: 4 + i * 0.8,
    left: (i * 13.7) % 100,
    top: (i * 17.3) % 100,
    dur: 8 + i * 1.4,
    delay: i * 0.6,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: `rgba(200,168,130,0.1)`,
          left: `${p.left}%`,
          top: `${p.top}%`,
          animation: `floatSlow ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('talk')
  const [transitioning, setTransitioning] = useState(false)
  const ripple = useRipple('rgba(200,168,130,0.35)')

  const switchTab = useCallback((newTab: Tab, e?: React.MouseEvent) => {
    if (newTab === tab) return
    if (e) ripple(e)
    setTransitioning(true)
    setTimeout(() => {
      setTab(newTab)
      setTransitioning(false)
    }, 180)
  }, [tab, ripple])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const glow = document.getElementById('cursor-glow')
      if (glow) {
        glow.style.left = `${e.clientX}px`
        glow.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  if (!ready) return <SetupScreen onReady={() => setReady(true)} />

  const activeColor = TABS.find(t => t.id === tab)?.color ?? '#c8a882'

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--parchment)', maxWidth: 560, margin: '0 auto',
      position: 'relative', overflow: 'hidden',
    }}>
      <div id="cursor-glow" style={{
        position: 'fixed', width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,168,130,0.06) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0,
        transition: 'left 0.12s ease, top 0.12s ease',
      }} />

      <AmbientParticles />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 100% 50% at 50% 0%, ${activeColor}1a 0%, transparent 65%)`,
        transition: 'background 0.9s ease',
      }} />

      {/* Header */}
      <header style={{
        padding: '0.85rem 1.25rem 0.7rem',
        borderBottom: '1px solid var(--parchment-mid)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 10,
        background: 'rgba(245,240,232,0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, background: 'var(--ink)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'float 5s ease-in-out infinite',
            boxShadow: '0 2px 12px rgba(28,26,23,0.2)',
          }}>
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C5 1 3 3.5 3 6C3 11 8 14 8 14C8 14 13 11 13 6C13 3.5 11 1 8 1Z" fill="var(--sand)" opacity="0.9" />
              <circle cx="8" cy="5.5" r="1.8" fill="var(--parchment)" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--ink)' }}>Serenova</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(74,103,65,0.12)', borderRadius: 'var(--radius-xl)',
          padding: '0.2rem 0.65rem', cursor: 'default',
          transition: 'box-shadow 0.3s ease',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-glow-moss)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)', animation: 'pulse 2.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--moss)', fontWeight: 500 }}>On-device</span>
        </div>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        padding: '0 1.25rem', position: 'relative', zIndex: 1,
      }}>
        {TAB_TITLES[tab] && (
          <div style={{ paddingTop: '0.9rem', paddingBottom: '0.4rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--ink)',
              animation: 'slideUp 0.3s ease both',
            }}>{TAB_TITLES[tab]}</h2>
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: (tab === 'talk' || tab === 'bubbles' || tab === 'games') ? 'hidden' : 'auto',
          display: tab === 'talk' ? 'flex' : 'block',
          flexDirection: 'column',
          paddingBottom: '0.5rem',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px) scale(0.985)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}>
          {tab === 'talk' && <VoiceCompanion />}
          {tab === 'mood' && <MoodHistory />}
          {tab === 'breathe' && <BreathingExercise />}
          {tab === 'bubbles' && <BubbleCanvas />}
          {tab === 'sounds' && <SoundscapePlayer />}
          {tab === 'games' && <RelaxingGames />}
          {tab === 'resources' && <ResourcesPanel />}
        </div>
      </main>

      {/* Bottom nav */}
      <nav style={{
        borderTop: '1px solid var(--parchment-mid)',
        background: 'rgba(245,240,232,0.95)',
        backdropFilter: 'blur(12px)',
        padding: '0.35rem 0.1rem calc(0.35rem + env(safe-area-inset-bottom))',
        display: 'flex',
        position: 'relative', zIndex: 10,
        overflowX: 'auto',
      }}
        // hide scrollbar
        className="hide-scroll"
      >
        <style>{`.hide-scroll::-webkit-scrollbar{display:none}`}</style>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={(e) => switchTab(t.id, e)}
            className="ripple-host"
            style={{
              flex: '0 0 auto',
              minWidth: 56,
              padding: '0.28rem 0.15rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.12rem',
              background: 'none', border: 'none', cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (tab !== t.id) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.05)'
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
          >
            <div style={{
              width: tab === t.id ? 38 : 30,
              height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: tab === t.id ? 'var(--radius-md)' : '50%',
              background: tab === t.id ? t.color + '28' : 'transparent',
              border: `1.5px solid ${tab === t.id ? t.color + '55' : 'transparent'}`,
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: tab === t.id ? `0 2px 10px ${t.color}33` : 'none',
            }}>
              <span style={{
                fontSize: '0.88rem',
                transform: tab === t.id ? 'scale(1.18)' : 'scale(1)',
                transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                display: 'block',
              }}>{t.icon}</span>
            </div>
            <span style={{
              fontSize: '0.6rem',
              color: tab === t.id ? 'var(--ink)' : 'var(--ink-muted)',
              fontWeight: tab === t.id ? 600 : 400,
              letterSpacing: '0.01em',
              transition: 'color 0.2s ease',
            }}>{t.label}</span>
            {tab === t.id && (
              <div style={{
                position: 'absolute', bottom: -2,
                width: 4, height: 4, borderRadius: '50%',
                background: t.color,
                animation: 'fadeInScale 0.3s ease both',
              }} />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}