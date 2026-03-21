import { useState, useEffect, useRef } from 'react'
import { saveBreathingSession, type BreathingSession } from '../lib/storage'

type ExerciseType = 'box' | '478' | 'calm'

interface Exercise {
  id: ExerciseType
  name: string
  description: string
  phases: { label: string; duration: number; color: string }[]
  cycles: number
}

const EXERCISES: Exercise[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'Used by Navy SEALs to stay calm under pressure',
    cycles: 4,
    phases: [
      { label: 'Inhale', duration: 4, color: '#5b7fa6' },
      { label: 'Hold', duration: 4, color: '#8aafc8' },
      { label: 'Exhale', duration: 4, color: '#4a6741' },
      { label: 'Hold', duration: 4, color: '#6a9160' },
    ],
  },
  {
    id: '478',
    name: '4-7-8 Breathing',
    description: 'Dr. Weil\'s relaxation technique for anxiety relief',
    cycles: 4,
    phases: [
      { label: 'Inhale', duration: 4, color: '#5b7fa6' },
      { label: 'Hold', duration: 7, color: '#8aafc8' },
      { label: 'Exhale', duration: 8, color: '#4a6741' },
    ],
  },
  {
    id: 'calm',
    name: 'Calm Breathing',
    description: 'Simple extended exhale for quick stress relief',
    cycles: 6,
    phases: [
      { label: 'Inhale', duration: 4, color: '#5b7fa6' },
      { label: 'Exhale', duration: 6, color: '#4a6741' },
    ],
  },
]

export default function BreathingExercise() {
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [sessions, setSessions] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    const raw = localStorage.getItem('serenova_breathing')
    if (raw) {
      try {
        const arr = JSON.parse(raw) as BreathingSession[]
        setSessions(arr.length)
      } catch { }
    }
  }, [])

  function startExercise(ex: Exercise) {
    setSelected(ex)
    setRunning(false)
    setPhaseIndex(0)
    setCycle(0)
    setProgress(0)
    setDone(false)
  }

  function begin() {
    setRunning(true)
    startTimeRef.current = Date.now()
    runPhase(0, 0, selected!)
  }

  function runPhase(pi: number, cy: number, ex: Exercise) {
    setPhaseIndex(pi)
    setProgress(0)
    const phaseDur = ex.phases[pi].duration * 1000
    const start = Date.now()

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      const frac = Math.min(elapsed / phaseDur, 1)
      setProgress(frac)

      if (frac >= 1) {
        clearInterval(timerRef.current!)
        const nextPi = pi + 1
        if (nextPi >= ex.phases.length) {
          const nextCy = cy + 1
          if (nextCy >= ex.cycles) {
            // Done!
            setRunning(false)
            setDone(true)
            const totalSecs = Math.round((Date.now() - startTimeRef.current) / 1000)
            const session: BreathingSession = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              durationSeconds: totalSecs,
              type: ex.id,
            }
            saveBreathingSession(session)
            setSessions(s => s + 1)
          } else {
            setCycle(nextCy)
            runPhase(0, nextCy, ex)
          }
        } else {
          runPhase(nextPi, cy, ex)
        }
      }
    }, 30)
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    setSelected(null)
    setDone(false)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  if (done && selected) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.5s ease both',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Well done
        </h3>
        <p style={{ color: 'var(--ink-muted)', marginBottom: '2rem' }}>
          You completed {selected.cycles} cycles of {selected.name}.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => startExercise(selected)}
            style={{
              padding: '0.7rem 1.4rem',
              background: 'var(--ink)',
              color: 'var(--parchment)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
            }}
          >
            Again
          </button>
          <button
            onClick={() => { setSelected(null); setDone(false) }}
            style={{
              padding: '0.7rem 1.4rem',
              background: 'var(--parchment-mid)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  if (selected && !running) {
    const totalSecs = selected.phases.reduce((s, p) => s + p.duration, 0) * selected.cycles
    return (
      <div style={{ animation: 'fadeIn 0.4s ease both' }}>
        <button onClick={() => setSelected(null)} style={{
          background: 'none',
          color: 'var(--ink-muted)',
          fontSize: '0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
        }}>
          ← Back
        </button>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-soft)',
          marginBottom: '1.25rem',
        }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', marginBottom: '0.3rem' }}>
            {selected.name}
          </h3>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            {selected.description}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {selected.phases.map((p, i) => (
              <div key={i} style={{ flex: p.duration, textAlign: 'center' }}>
                <div style={{ height: 6, background: p.color, borderRadius: 3, marginBottom: '0.3rem', opacity: 0.7 }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 500 }}>{p.duration}s</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            {selected.cycles} cycles · ~{Math.ceil(totalSecs / 60)} minutes
          </p>
        </div>
        <button
          onClick={begin}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: 'var(--ink)',
            color: 'var(--parchment)',
            borderRadius: 'var(--radius-md)',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Begin
        </button>
      </div>
    )
  }

  if (running && selected) {
    const phase = selected.phases[phaseIndex]
    const orbSize = 160
    const circumference = 2 * Math.PI * 68
    const dashOffset = circumference * (1 - progress)
    const orbScale = phase.label === 'Inhale'
      ? 0.85 + progress * 0.2
      : phase.label === 'Exhale'
        ? 1.05 - progress * 0.2
        : 1

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem 0',
        animation: 'fadeIn 0.4s ease both',
      }}>
        <div style={{ position: 'relative', width: orbSize + 40, height: orbSize + 40, marginBottom: '1.5rem' }}>
          {/* Background circle */}
          <svg
            width={orbSize + 40}
            height={orbSize + 40}
            viewBox={`0 0 ${orbSize + 40} ${orbSize + 40}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <circle
              cx={(orbSize + 40) / 2}
              cy={(orbSize + 40) / 2}
              r={68}
              fill="none"
              stroke="var(--parchment-mid)"
              strokeWidth="6"
            />
            <circle
              cx={(orbSize + 40) / 2}
              cy={(orbSize + 40) / 2}
              r={68}
              fill="none"
              stroke={phase.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke 0.4s ease' }}
            />
          </svg>

          {/* Orb */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${orbScale})`,
            width: orbSize * 0.72,
            height: orbSize * 0.72,
            borderRadius: '50%',
            background: phase.color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s ease, background 0.4s ease',
          }}>
            <div style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              {phase.label}
            </div>
            <div style={{ fontSize: '1.8rem', color: 'white', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
              {Math.ceil((1 - progress) * phase.duration)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: selected.cycles }, (_, i) => (
            <div key={i} style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: i < cycle ? 'var(--moss)' : i === cycle ? phase.color : 'var(--parchment-mid)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Cycle {cycle + 1} of {selected.cycles}
        </p>

        <button
          onClick={stop}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--parchment-mid)',
            color: 'var(--ink-soft)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
          }}
        >
          Stop
        </button>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease both' }}>
      {sessions > 0 && (
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
          🌿 You've completed {sessions} breathing session{sessions !== 1 ? 's' : ''}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {EXERCISES.map(ex => (
          <button
            key={ex.id}
            onClick={() => startExercise(ex)}
            style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: '1.1rem 1.25rem',
              textAlign: 'left',
              boxShadow: 'var(--shadow-soft)',
              border: '1px solid transparent',
              transition: 'all var(--transition)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--parchment-mid)'
                ; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                ; (e.currentTarget as HTMLButtonElement).style.transform = ''
            }}
          >
            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: 'var(--parchment)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                {ex.phases.map((p, i) => (
                  <div key={i} style={{
                    width: 4,
                    height: 8 + (p.duration / 2),
                    background: p.color,
                    borderRadius: 2,
                    opacity: 0.8,
                  }} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.95rem' }}>{ex.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.1rem' }}>{ex.description}</div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'var(--ink-muted)', fontSize: '1.1rem' }}>›</div>
          </button>
        ))}
      </div>
    </div>
  )
}