import { useState, useEffect } from 'react'

const AFFIRMATIONS = [
  "You are enough, exactly as you are.",
  "This feeling is temporary. You have survived hard days before.",
  "Your struggles do not define your worth.",
  "It's okay to not be okay. Healing isn't linear.",
  "You deserve kindness — especially from yourself.",
  "Taking one small step today is enough.",
  "Your feelings are valid and worth acknowledging.",
  "Rest is not giving up. Rest is part of healing.",
  "You are braver than you believe.",
  "Progress, not perfection.",
  "You are allowed to take up space.",
  "Your vulnerability is a form of courage.",
  "You matter more than you know.",
  "Even the darkest night will end, and the sun will rise.",
  "Be patient with yourself. Growth takes time.",
  "Like the lotus, you can rise through muddy waters and bloom.",
  "Your inner strength is like a banyan tree - deep and resilient.",
  "This too shall pass, as the seasons change.",
  "You carry the wisdom of generations within you.",
  "Your breath is your anchor in this moment.",
]

const GROUNDING = [
  { name: '5-4-3-2-1 Grounding', steps: ['Name 5 things you can see', 'Name 4 things you can physically feel', 'Name 3 things you can hear', 'Name 2 things you can smell', 'Name 1 thing you can taste'] },
  { name: 'Safe place visualization', steps: ['Close your eyes and breathe slowly', 'Imagine a place where you feel safe and calm', 'Notice the colors, sounds, and sensations', 'Spend a few minutes in this place', 'Gently return your awareness to the room'] },
  { name: 'Cold water technique', steps: ['Get a glass of cold water or ice', 'Hold it in your hands', 'Focus on the physical sensation of cold', 'Let it bring you into the present moment', 'Breathe slowly while holding it'] },
]

const RESOURCES = [
  { name: 'iCall (TISS)', detail: '1800-209-4366 · 24/7 mental health helpline', urgent: true },
  { name: 'Vandrevala Foundation', detail: '1860-266-2345 · Free, confidential counseling', urgent: true },
  { name: 'Snehi Foundation', detail: '91-98216-27774 · Emotional support helpline', urgent: false },
  { name: 'Parivarthan', detail: '7676602600 · Counseling and support services', urgent: false },
  { name: 'NIMHANS Helpline', detail: '080-26993201 · Premier mental health institute', urgent: false },
  { name: 'Fortis Stress Helpline', detail: '91-8376804102 · Mental health support', urgent: false },
  { name: 'YourDOST', detail: 'yourdost.com · Online counseling platform', urgent: false },
  { name: 'Mpower', detail: 'mpowerminds.com · Mental health awareness & support', urgent: false },
]

export default function ResourcesPanel() {
  const [affirmation, setAffirmation] = useState('')
  const [affIdx, setAffIdx] = useState(0)
  const [groundingOpen, setGroundingOpen] = useState<number | null>(null)
  const [tab, setTab] = useState<'affirm' | 'ground' | 'help'>('affirm')

  useEffect(() => {
    const idx = Math.floor(Math.random() * AFFIRMATIONS.length)
    setAffIdx(idx)
    setAffirmation(AFFIRMATIONS[idx])
  }, [])

  function nextAffirmation() {
    const next = (affIdx + 1) % AFFIRMATIONS.length
    setAffIdx(next)
    setAffirmation(AFFIRMATIONS[next])
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease both' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        background: 'var(--parchment-mid)',
        padding: '0.25rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.25rem',
      }}>
        {([['affirm', 'Affirmations'], ['ground', 'Grounding'], ['help', 'Get Help']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: tab === id ? 'white' : 'transparent',
              color: tab === id ? 'var(--ink)' : 'var(--ink-muted)',
              fontSize: '0.82rem',
              fontWeight: tab === id ? 500 : 400,
              boxShadow: tab === id ? 'var(--shadow-soft)' : 'none',
              transition: 'all var(--transition)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'affirm' && (
        <div>
          <div style={{
            background: 'var(--ink)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem 1.5rem',
            marginBottom: '1rem',
            textAlign: 'center',
            minHeight: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.2rem',
              color: 'var(--parchment)',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
            }}>
              "{affirmation}"
            </p>
            <button
              onClick={nextAffirmation}
              style={{
                padding: '0.45rem 1rem',
                background: 'rgba(245,240,232,0.12)',
                color: 'var(--parchment)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                border: '1px solid rgba(245,240,232,0.2)',
                cursor: 'pointer',
              }}
            >
              Next ↻
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textAlign: 'center' }}>
            Tap "Next" for a new affirmation. Try reading it aloud to yourself.
          </p>
        </div>
      )}

      {tab === 'ground' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '0.25rem' }}>
            Grounding techniques help bring you back to the present moment when feeling overwhelmed.
          </p>
          {GROUNDING.map((technique, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-soft)',
            }}>
              <button
                onClick={() => setGroundingOpen(groundingOpen === i ? null : i)}
                style={{
                  width: '100%',
                  padding: '1rem 1.1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.92rem' }}>
                  {technique.name}
                </span>
                <span style={{
                  color: 'var(--ink-muted)',
                  transition: 'transform var(--transition)',
                  transform: groundingOpen === i ? 'rotate(90deg)' : 'none',
                  fontSize: '1.1rem',
                }}>
                  ›
                </span>
              </button>
              {groundingOpen === i && (
                <div style={{
                  padding: '0 1.1rem 1rem',
                  animation: 'fadeIn 0.2s ease both',
                }}>
                  {technique.steps.map((step, j) => (
                    <div key={j} style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.4rem 0',
                      borderTop: j > 0 ? '1px solid var(--parchment-dark)' : 'none',
                    }}>
                      <div style={{
                        width: 22, height: 22,
                        borderRadius: '50%',
                        background: 'var(--parchment)',
                        color: 'var(--ink-soft)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {j + 1}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.5, flex: 1, paddingTop: '0.15rem' }}>
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'help' && (
        <div>
          <div style={{
            background: '#fdf0ef',
            border: '1px solid #f0c0bc',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: 'var(--ink-soft)',
          }}>
            <strong>⚕️ Important:</strong> Serenova is a supportive companion, not a mental health provider. If you're in crisis or need clinical support, please reach out to one of the trusted Indian mental health resources below. These services are confidential and many are available 24/7.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {RESOURCES.map((r, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem 1rem',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                borderLeft: r.urgent ? '3px solid var(--blush)' : '3px solid var(--parchment-mid)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '0.15rem' }}>
                    {r.urgent && <span style={{ color: 'var(--blush)', marginRight: '0.3rem' }}>🆘</span>}
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}