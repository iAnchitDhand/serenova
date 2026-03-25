import { useState, useCallback, useEffect, useRef } from 'react'
import SetupScreen from './components/SetupScreen'
import VoiceCompanion from './components/VoiceCompanion'
import MoodHistory from './components/MoodHistory'
import BreathingExercise from './components/BreathingExercise'
import ResourcesPanel from './components/ResourcesPanel'
import BubbleCanvas from './components/BubbleCanvas'
import SoundscapePlayer from './components/SoundscapePlayer'
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
  talk: 'Talk with Sera',
  breathe: 'Breathe',
  bubbles: 'Bubble Pop',
  sounds: 'Soundscapes',
  games: 'Calm Games',
  mood: 'Your Journal',
  resources: 'Support',
}

function RotatingMandala({ delay = 0, opacity = 0.05, duration = 60 }: { delay?: number; opacity?: number; duration?: number }) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '140vh',
      height: '140vh',
      opacity,
      animation: `mandalaRotate ${duration}s linear ${delay}s infinite`,
      pointerEvents: 'none',
    }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
        <defs>
          <pattern id={`mandala-pattern-${delay}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="2" fill="currentColor" opacity="0.3" />
          </pattern>
        </defs>
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 45} 100 100)`}>
            <circle cx="100" cy="40" r="3" fill="currentColor" opacity="0.4" />
            <ellipse cx="100" cy="50" rx="8" ry="20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <path d={`M100,70 Q120,80 100,90 Q80,80 100,70`} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="100" cy="30" r="1.5" fill="currentColor" opacity="0.5" />
          </g>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <g key={`outer-${i}`} transform={`rotate(${i * 30} 100 100)`}>
            <line x1="100" y1="20" x2="100" y2="35" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
            <circle cx="100" cy="20" r="1" fill="currentColor" opacity="0.4" />
          </g>
        ))}
        <circle cx="100" cy="100" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <circle cx="100" cy="100" r="25" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.2" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      </svg>
    </div>
  )
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
  const [currentSection, setCurrentSection] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const ripple = useRipple('rgba(200,168,130,0.35)')

  const scrollToSection = useCallback((index: number) => {
    if (isScrolling || index < 0 || index >= TABS.length) return
    
    setIsScrolling(true)
    setCurrentSection(index)
    
    setTimeout(() => setIsScrolling(false), 1000)
  }, [isScrolling])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if we're scrolling within a scrollable section
      const target = e.target as HTMLElement
      const scrollableParent = target.closest('[style*="overflowY"]')
      
      // Only prevent default if not inside a scrollable section or at scroll boundaries
      if (!scrollableParent || 
          (e.deltaY > 0 && scrollableParent.scrollTop + scrollableParent.clientHeight >= scrollableParent.scrollHeight - 5) ||
          (e.deltaY < 0 && scrollableParent.scrollTop <= 5)) {
        e.preventDefault()
        
        if (isScrolling) return
        
        if (e.deltaY > 30) {
          scrollToSection(currentSection + 1)
        } else if (e.deltaY < -30) {
          scrollToSection(currentSection - 1)
        }
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToSection(currentSection + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToSection(currentSection - 1)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY
      const diff = touchStartY.current - touchEndY
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          scrollToSection(currentSection + 1)
        } else {
          scrollToSection(currentSection - 1)
        }
      }
    }

    // Attach to window for immediate capture on load
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentSection, scrollToSection, isScrolling])

  if (!ready) return <SetupScreen onReady={() => setReady(true)} />

  const activeColor = TABS[currentSection]?.color ?? '#c8a882'
  const activeTab = TABS[currentSection]

  return (
    <div ref={containerRef} style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--parchment)',
    }}>
      {/* Rotating Mandalas Background */}
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 0, 
        overflow: 'hidden',
        color: activeColor,
        transition: 'color 1s ease',
      }}>
        <RotatingMandala delay={0} opacity={0.03} duration={80} />
        <RotatingMandala delay={5} opacity={0.02} duration={100} />
        <RotatingMandala delay={10} opacity={0.025} duration={120} />
      </div>

      <AmbientParticles />

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: `radial-gradient(ellipse 100% 50% at 50% 0%, ${activeColor}18 0%, transparent 70%)`,
        transition: 'background 0.9s ease',
      }} />

      {/* Floating Header */}
      <header style={{
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.7rem 1.5rem',
        background: 'rgba(245,240,232,0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--ink)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'float 5s ease-in-out infinite',
        }}>
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5 1 3 3.5 3 6C3 11 8 14 8 14C8 14 13 11 13 6C13 3.5 11 1 8 1Z" fill="var(--sand)" opacity="0.9" />
            <circle cx="8" cy="5.5" r="1.8" fill="var(--parchment)" />
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--ink)' }}>Serenova</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(74,103,65,0.12)', borderRadius: 'var(--radius-xl)',
          padding: '0.2rem 0.65rem', marginLeft: '0.5rem',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--moss)', animation: 'pulse 2.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--moss)', fontWeight: 500 }}>On-device</span>
        </div>
      </header>

      {/* Section Title */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '4rem',
        transform: 'translateY(-50%)',
        zIndex: 50,
        fontFamily: 'var(--font-serif)',
        fontSize: '3rem',
        color: activeColor,
        opacity: 0.15,
        transition: 'color 0.8s ease, opacity 0.5s ease',
        pointerEvents: 'none',
      }}>
        {TAB_TITLES[activeTab.id]}
      </div>

      {/* Sections Container */}
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        transform: `translateY(-${currentSection * 100}vh)`,
        transition: 'transform 1s cubic-bezier(0.65, 0, 0.35, 1)',
      }}>
        {TABS.map((tab, index) => (
          <section key={tab.id} style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6rem 4rem 4rem',
            position: 'relative',
          }}>
            <div style={{
              width: '100%',
              maxWidth: tab.id === 'talk' ? '900px' : '1200px',
              height: 'calc(100% - 10rem)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              opacity: currentSection === index ? 1 : 0.3,
              transform: currentSection === index ? 'scale(1)' : 'scale(0.9)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              pointerEvents: currentSection === index ? 'auto' : 'none',
            }}>
              {tab.id === 'talk' && <VoiceCompanion />}
              {tab.id === 'mood' && <MoodHistory />}
              {tab.id === 'breathe' && <BreathingExercise />}
              {tab.id === 'bubbles' && <BubbleCanvas />}
              {tab.id === 'sounds' && <SoundscapePlayer />}
              {tab.id === 'games' && <RelaxingGames />}
              {tab.id === 'resources' && <ResourcesPanel />}
            </div>
          </section>
        ))}
      </div>

      {/* Navigation Dots */}
      <nav style={{
        position: 'fixed',
        right: '2rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        zIndex: 100,
      }}>
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            onClick={(e) => {
              ripple(e)
              scrollToSection(index)
            }}
            style={{
              width: currentSection === index ? 14 : 10,
              height: currentSection === index ? 14 : 10,
              borderRadius: '50%',
              border: `2px solid ${tab.color}`,
              background: currentSection === index ? tab.color : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
            title={tab.label}
          >
            {currentSection === index && (
              <div style={{
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                border: `1px solid ${tab.color}`,
                opacity: 0.3,
              }} />
            )}
          </button>
        ))}
      </nav>

      {/* Scroll Hint */}
      {currentSection < TABS.length - 1 && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--ink-muted)',
          fontSize: '0.75rem',
          animation: 'float 3s ease-in-out infinite',
        }}>
          <span>Scroll or use arrow keys</span>
          <div style={{
            width: 24,
            height: 36,
            border: '2px solid currentColor',
            borderRadius: '12px',
            position: 'relative',
            opacity: 0.5,
          }}>
            <div style={{
              width: 4,
              height: 8,
              background: 'currentColor',
              borderRadius: '2px',
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              animation: 'scrollHint 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}