import { getMoodEntries, MOOD_COLORS, MOOD_LABELS, MOOD_EMOJIS, formatDate, formatTime, getWeeklyMoodAverage, type MoodEntry } from '../lib/storage'
import { useState, useEffect } from 'react'

export default function MoodHistory() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [selected, setSelected] = useState<MoodEntry | null>(null)

  useEffect(() => {
    setEntries(getMoodEntries())
  }, [])

  const avgMood = getWeeklyMoodAverage(entries)
  const recentEntries = entries.slice(0, 30)

  if (entries.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        color: 'var(--ink-muted)',
        animation: 'fadeIn 0.5s ease both',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
          Your story starts here
        </p>
        <p style={{ fontSize: '0.88rem' }}>
          Use the voice companion to log your first check-in. Your mood history will appear here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease both' }}>
      {/* Weekly summary */}
      {avgMood > 0 && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{
            width: 52, height: 52,
            background: 'var(--parchment)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>
            {MOOD_EMOJIS[Math.round(avgMood) as 1 | 2 | 3 | 4 | 5]}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: '0.2rem' }}>
              7-day average
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--ink)' }}>
              {MOOD_LABELS[Math.round(avgMood) as 1 | 2 | 3 | 4 | 5]}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <MoodSparkline entries={entries.slice(0, 14).reverse()} />
          </div>
        </div>
      )}

      {/* Dot chart */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '0.75rem' }}>
          Recent check-ins
        </p>
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}>
          {recentEntries.map(entry => (
            <button
              key={entry.id}
              onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
              title={`${MOOD_LABELS[entry.mood]} — ${formatDate(entry.timestamp)}`}
              style={{
                width: 12,
                height: 12 + (entry.mood - 1) * 6,
                background: MOOD_COLORS[entry.mood],
                borderRadius: 3,
                border: selected?.id === entry.id ? '2px solid var(--ink)' : 'none',
                cursor: 'pointer',
                transition: 'transform var(--transition)',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scaleY(1.2)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}
            />
          ))}
        </div>
      </div>

      {/* Selected entry detail */}
      {selected && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1rem',
          boxShadow: 'var(--shadow-soft)',
          animation: 'fadeIn 0.3s ease both',
          borderLeft: `4px solid ${MOOD_COLORS[selected.mood]}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: MOOD_COLORS[selected.mood] + '22',
                color: MOOD_COLORS[selected.mood],
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.4rem',
              }}>
                {MOOD_EMOJIS[selected.mood]} {MOOD_LABELS[selected.mood]}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                {formatDate(selected.timestamp)} at {formatTime(selected.timestamp)}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none',
                color: 'var(--ink-muted)',
                fontSize: '1.1rem',
                padding: '0.2rem',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {selected.transcript && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                You said
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{selected.transcript}"
              </p>
            </div>
          )}

          {selected.aiResponse && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sera responded
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {selected.aiResponse}
              </p>
            </div>
          )}
        </div>
      )}

      {/* All entries list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {entries.slice(0, 20).map(entry => (
          <button
            key={entry.id}
            onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
            style={{
              background: selected?.id === entry.id ? 'white' : 'rgba(255,255,255,0.5)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'left',
              border: `1px solid ${selected?.id === entry.id ? 'var(--parchment-mid)' : 'transparent'}`,
              boxShadow: selected?.id === entry.id ? 'var(--shadow-soft)' : 'none',
              transition: 'all var(--transition)',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 36, height: 36,
              background: MOOD_COLORS[entry.mood] + '22',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}>
              {MOOD_EMOJIS[entry.mood]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>
                  {MOOD_LABELS[entry.mood]}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  {formatDate(entry.timestamp)}
                </span>
              </div>
              {entry.transcript && (
                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--ink-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '0.1rem',
                }}>
                  {entry.transcript}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MoodSparkline({ entries }: { entries: MoodEntry[] }) {
  const w = 80, h = 32
  if (entries.length < 2) return null

  const points = entries.map((e, i) => {
    const x = (i / (entries.length - 1)) * w
    const y = h - ((e.mood - 1) / 4) * h
    return `${x},${y}`
  })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="var(--sand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {entries.map((e, i) => {
        const x = (i / (entries.length - 1)) * w
        const y = h - ((e.mood - 1) / 4) * h
        return (
          <circle key={i} cx={x} cy={y} r={i === entries.length - 1 ? 3 : 2}
            fill={MOOD_COLORS[e.mood]} />
        )
      })}
    </svg>
  )
}