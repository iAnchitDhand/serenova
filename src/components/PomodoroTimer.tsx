import { useCallback, useEffect, useRef, useState } from 'react'
import { useRipple } from '../hooks/useRipple'
import { getPomodoroSessions, savePomodoroSession, type PomodoroSession } from '../lib/storage'

type Phase = 'work' | 'shortBreak' | 'longBreak'

interface Preset {
  id: string
  name: string
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cycles: number
  accent: string
}

const PRESETS: Preset[] = [
  {
    id: 'classic',
    name: 'Classic',
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cycles: 4,
    accent: '#c8a882',
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    workMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    cycles: 4,
    accent: '#5b7fa6',
  },
  {
    id: 'gentle-sprint',
    name: 'Gentle Sprint',
    workMinutes: 15,
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
    cycles: 4,
    accent: '#4a6741',
  },
]

function minutesToSeconds(minutes: number) {
  return minutes * 60
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function getPhaseLabel(phase: Phase) {
  if (phase === 'work') return 'Focus'
  if (phase === 'shortBreak') return 'Short Break'
  return 'Long Break'
}

export default function PomodoroTimer() {
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const preset = PRESETS.find(p => p.id === presetId) ?? PRESETS[0]
  const [phase, setPhase] = useState<Phase>('work')
  const [timeLeft, setTimeLeft] = useState(minutesToSeconds(preset.workMinutes))
  const [running, setRunning] = useState(false)
  const [completedBlocks, setCompletedBlocks] = useState(0)
  const [savedBlocks, setSavedBlocks] = useState(0)
  const [savedMinutes, setSavedMinutes] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeLeftRef = useRef(timeLeft)
  const phaseRef = useRef<Phase>(phase)
  const completedBlocksRef = useRef(completedBlocks)
  const presetRef = useRef(preset)
  const ripple = useRipple('rgba(255,255,255,0.22)')

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    completedBlocksRef.current = completedBlocks
  }, [completedBlocks])

  useEffect(() => {
    presetRef.current = preset
  }, [preset])

  useEffect(() => {
    const sessions = getPomodoroSessions()
    setSavedBlocks(sessions.length)
    setSavedMinutes(sessions.reduce((sum, session) => sum + session.workMinutes, 0))
  }, [])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetTimer = useCallback((pause = true) => {
    stopInterval()
    if (pause) {
      setRunning(false)
    }
    setPhase('work')
    phaseRef.current = 'work'
    const nextTime = minutesToSeconds(presetRef.current.workMinutes)
    setTimeLeft(nextTime)
    timeLeftRef.current = nextTime
  }, [stopInterval])

  const completePhase = useCallback(() => {
    const currentPreset = presetRef.current

    if (phaseRef.current === 'work') {
      const nextBlocks = completedBlocksRef.current + 1
      completedBlocksRef.current = nextBlocks
      setCompletedBlocks(nextBlocks)
      savePomodoroSession({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        workMinutes: currentPreset.workMinutes,
        breakMinutes: currentPreset.shortBreakMinutes,
        cycleCount: nextBlocks,
      })
      setSavedBlocks(count => count + 1)
      setSavedMinutes(total => total + currentPreset.workMinutes)

      const nextPhase: Phase = nextBlocks % currentPreset.cycles === 0 ? 'longBreak' : 'shortBreak'
      phaseRef.current = nextPhase
      setPhase(nextPhase)
      const nextTime = minutesToSeconds(nextPhase === 'longBreak' ? currentPreset.longBreakMinutes : currentPreset.shortBreakMinutes)
      setTimeLeft(nextTime)
      timeLeftRef.current = nextTime
      return
    }

    phaseRef.current = 'work'
    setPhase('work')
    const nextTime = minutesToSeconds(currentPreset.workMinutes)
    setTimeLeft(nextTime)
    timeLeftRef.current = nextTime
  }, [])

  const startTimer = useCallback(() => {
    if (running) return
    setRunning(true)
    stopInterval()
    intervalRef.current = setInterval(() => {
      const remaining = timeLeftRef.current
      if (remaining <= 1) {
        completePhase()
        return
      }

      const nextTime = remaining - 1
      timeLeftRef.current = nextTime
      setTimeLeft(nextTime)
    }, 1000)
  }, [completePhase, running, stopInterval])

  const toggleRunning = useCallback(() => {
    if (running) {
      stopInterval()
      setRunning(false)
      return
    }

    startTimer()
  }, [running, startTimer, stopInterval])

  const selectPreset = useCallback((id: string) => {
    setPresetId(id)
    stopInterval()
    setRunning(false)
    completedBlocksRef.current = 0
    setCompletedBlocks(0)
    setPhase('work')
    phaseRef.current = 'work'
    const nextPreset = PRESETS.find(p => p.id === id) ?? PRESETS[0]
    presetRef.current = nextPreset
    const nextTime = minutesToSeconds(nextPreset.workMinutes)
    setTimeLeft(nextTime)
    timeLeftRef.current = nextTime
  }, [stopInterval])

  useEffect(() => () => stopInterval(), [stopInterval])

  const activePreset = presetRef.current
  const totalActiveSeconds = phase === 'work'
    ? minutesToSeconds(activePreset.workMinutes)
    : phase === 'shortBreak'
      ? minutesToSeconds(activePreset.shortBreakMinutes)
      : minutesToSeconds(activePreset.longBreakMinutes)
  const progress = totalActiveSeconds > 0 ? 1 - (timeLeft / totalActiveSeconds) : 0
  const circumference = 2 * Math.PI * 76
  const dashOffset = circumference * (1 - Math.min(Math.max(progress, 0), 1))
  const completedCycles = Math.floor(completedBlocks / activePreset.cycles)
  const cycleRemainder = completedBlocks % activePreset.cycles

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      height: '100%',
      padding: '0.5rem 0',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginBottom: '0.25rem' }}>Work in focused intervals, then rest on purpose.</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Completed blocks are saved locally on this device.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRESETS.map(item => (
            <button
              key={item.id}
              onClick={(e) => {
                ripple(e)
                selectPreset(item.id)
              }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '999px',
                border: `1px solid ${presetId === item.id ? item.accent : 'rgba(0,0,0,0.08)'}`,
                background: presetId === item.id ? `${item.accent}18` : 'rgba(255,255,255,0.7)',
                color: presetId === item.id ? item.accent : 'var(--ink-soft)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 1fr) minmax(240px, 0.82fr)',
        gap: '1rem',
        flex: 1,
        alignItems: 'stretch',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.75)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: 420,
        }}>
          <div style={{ position: 'relative', width: 240, height: 240, marginBottom: '1rem' }}>
            <svg width={240} height={240} viewBox="0 0 240 240" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="120" cy="120" r="76" fill="none" stroke="var(--parchment-mid)" strokeWidth="10" />
              <circle
                cx="120"
                cy="120"
                r="76"
                fill="none"
                stroke={activePreset.accent}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '120px 120px', transition: 'stroke 0.4s ease, stroke-dashoffset 0.35s linear' }}
              />
            </svg>

            <div style={{
              position: 'absolute',
              inset: 24,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${activePreset.accent}22 0%, rgba(255,255,255,0.88) 45%, rgba(255,255,255,0.72) 100%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
            }}>
              <div style={{ fontSize: '0.86rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: activePreset.accent, fontWeight: 700 }}>
                {getPhaseLabel(phase)}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--ink)', lineHeight: 1, marginTop: '0.2rem' }}>
                {formatTime(timeLeft)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '0.35rem' }}>
                {phase === 'work' ? `Session ${cycleRemainder + 1} of ${activePreset.cycles}` : 'Take the next breath, then return.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ padding: '0.55rem 0.85rem', borderRadius: '999px', background: 'rgba(74,103,65,0.12)', color: 'var(--moss)', fontSize: '0.8rem', fontWeight: 500 }}>
              {completedBlocks} blocks completed
            </div>
            <div style={{ padding: '0.55rem 0.85rem', borderRadius: '999px', background: 'rgba(91,127,166,0.12)', color: 'var(--sky)', fontSize: '0.8rem', fontWeight: 500 }}>
              {completedCycles} full cycles
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={(e) => {
                ripple(e)
                toggleRunning()
              }}
              className="ripple-host"
              style={{
                padding: '0.85rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                background: activePreset.accent,
                color: 'white',
                fontWeight: 600,
                minWidth: 140,
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={(e) => {
                ripple(e)
                resetTimer()
              }}
              className="ripple-host"
              style={{
                padding: '0.85rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245,240,232,0.9)',
                color: 'var(--ink-soft)',
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.78)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.8rem' }}>Current preset</p>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Work</span>
                <strong>{preset.workMinutes} min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Short break</span>
                <strong>{preset.shortBreakMinutes} min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Long break</span>
                <strong>{preset.longBreakMinutes} min</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Cycle length</span>
                <strong>{preset.cycles} blocks</strong>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.78)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.8rem' }}>Saved locally</p>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Completed blocks</span>
                <strong>{savedBlocks}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                <span>Focused minutes</span>
                <strong>{savedMinutes}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginTop: '0.25rem' }}>
                Keeping the break honest matters as much as the focus block.
              </div>
            </div>
          </div>

          <div style={{
            background: `linear-gradient(135deg, ${activePreset.accent}12 0%, rgba(255,255,255,0.88) 100%)`,
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '0.7rem' }}>Focus cue</p>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-soft)', lineHeight: 1.65 }}>
              Pick one task, silence the rest, and let the timer hold the structure for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}