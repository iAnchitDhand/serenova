import { memo, useState, useRef, useCallback, useMemo } from 'react'
import { VoicePipeline } from '@runanywhere/web'
import { AudioPlayback } from '@runanywhere/web'
import VoiceOrb from './VoiceOrb'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { SYSTEM_PROMPT } from '../lib/prompts'
import { saveMoodEntry, inferMoodFromText, MOOD_LABELS, MOOD_COLORS, MOOD_EMOJIS, type MoodLevel } from '../lib/storage'

interface Message {
  id: string
  role: 'user' | 'sera'
  text: string
  mood?: MoodLevel
  timestamp: number
}

export default function VoiceCompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'sera',
      text: 'Hello, I\'m Sera. This is a private space, just for you. How are you feeling today?',
      timestamp: Date.now(),
    }
  ])
  const [pipelineState, setPipelineState] = useState('idle')
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pipelineRef = useRef<VoicePipeline | null>(null)
  const audioPlayerRef = useRef<AudioPlayback | null>(null)
  const streamingTimeoutRef = useRef<number>()
  const lastStreamUpdateRef = useRef(0)

  const { state: recordState, startRecording, stopRecording, audioLevel } = useVoiceRecorder()

  // Debounce streaming text updates to reduce re-renders
  const updateStreamingText = useCallback((text: string) => {
    const now = Date.now()
    // Throttle updates to max 20 times per second
    if (now - lastStreamUpdateRef.current < 50) {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current)
      }
      streamingTimeoutRef.current = window.setTimeout(() => {
        setStreamingText(text)
        lastStreamUpdateRef.current = Date.now()
      }, 50)
    } else {
      setStreamingText(text)
      lastStreamUpdateRef.current = now
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame for smoother scrolling and better timing
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        })
      }
    })
  }, [])

  const handlePress = useCallback(async () => {
    if (recordState === 'recording') {
      // Immediately update UI state - don't wait for cleanup
      setError('')
      setPipelineState('processingSTT')
      setStreamingText('')

      // Stop recording in the background
      stopRecording().then(async (audio) => {
        if (!audio) {
          setPipelineState('idle')
          return
        }

        try {
          if (!pipelineRef.current) {
            pipelineRef.current = new VoicePipeline()
          }

          let userTranscript = ''
          let aiResponse = ''

          await pipelineRef.current.processTurn(
            audio,
            {
              systemPrompt: SYSTEM_PROMPT,
              maxTokens: 120,
              temperature: 0.72,
              ttsSpeed: 0.95,
              sampleRate: 16000,
            },
            {
              onStateChange: (s) => setPipelineState(s),

              onTranscription: (text) => {
                userTranscript = text
                if (text.trim()) {
                  const userMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'user',
                    text,
                    timestamp: Date.now(),
                  }
                  setMessages(prev => [...prev, userMsg])
                  scrollToBottom()
                }
              },

              onResponseToken: (_token, accumulated) => {
                aiResponse = accumulated
                updateStreamingText(accumulated)
              },

              onResponseComplete: (text) => {
                aiResponse = text
                setStreamingText('')
                const mood = inferMoodFromText(userTranscript)
                const seraMsg: Message = {
                  id: crypto.randomUUID(),
                  role: 'sera',
                  text,
                  mood,
                  timestamp: Date.now(),
                }
                setMessages(prev => [...prev, seraMsg])
                scrollToBottom()

                // Save to mood history
                if (userTranscript.trim()) {
                  saveMoodEntry({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    mood,
                    transcript: userTranscript,
                    aiResponse: text,
                    moodLabel: MOOD_LABELS[mood],
                  })
                }
              },

              onSynthesisComplete: async (audioData, sampleRate) => {
                try {
                  // Reuse audio player instance for better performance
                  if (!audioPlayerRef.current) {
                    audioPlayerRef.current = new AudioPlayback({ sampleRate })
                  }
                  await audioPlayerRef.current.play(audioData, sampleRate)
                } catch (e) {
                  console.warn('TTS playback failed:', e)
                }
              },
            }
          )
        } catch (err) {
          console.error('Pipeline error:', err)
          setError('Something went wrong. Please try again.')
          setStreamingText('')
        } finally {
          setPipelineState('idle')
        }
      }).catch((err) => {
        console.error('Recording stop error:', err)
        setPipelineState('idle')
      })
    } else if (recordState === 'idle' && pipelineState === 'idle') {
      await startRecording()
    }
  }, [recordState, pipelineState, startRecording, stopRecording, scrollToBottom, updateStreamingText])

  const isActive = recordState !== 'idle' || pipelineState !== 'idle'

  // Memoize expensive renders
  const messagesContent = useMemo(() => (
    messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
  ), [messages])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {messagesContent}

        {/* Streaming text */}
        {streamingText && (
          <div style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            animation: 'fadeIn 0.2s ease both',
          }}>
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              borderBottomLeftRadius: 4,
              padding: '0.85rem 1rem',
              boxShadow: 'var(--shadow-soft)',
              fontSize: '0.92rem',
              color: 'var(--ink)',
              lineHeight: 1.6,
            }}>
              {streamingText}
              <span style={{
                display: 'inline-block',
                width: 2, height: '1em',
                background: 'var(--sand)',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'pulse 0.8s ease-in-out infinite',
              }} />
            </div>
          </div>
        )}

        {/* Processing state indicators */}
        {pipelineState === 'processingSTT' && !streamingText && (
          <div style={{ alignSelf: 'center', animation: 'fadeIn 0.3s ease both' }}>
            <TypingDots label="Listening…" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.6rem 1rem',
          background: '#fdf0ef',
          borderRadius: 'var(--radius-md)',
          color: 'var(--blush)',
          fontSize: '0.82rem',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', color: 'var(--blush)', fontWeight: 500 }}>×</button>
        </div>
      )}

      {/* Voice control area */}
      <div style={{
        padding: '1.5rem 0 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: '1px solid var(--parchment-mid)',
        marginTop: '0.5rem',
      }}>
        <VoiceOrb
          state={recordState}
          audioLevel={audioLevel}
          pipelineState={pipelineState}
          onPress={handlePress}
          disabled={false}
        />

        <p style={{
          fontSize: '0.75rem',
          color: 'var(--ink-muted)',
          marginTop: '0.75rem',
          textAlign: 'center',
        }}>
          🔒 Your voice never leaves this device
        </p>
      </div>
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'slideUp 0.3s ease both',
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28,
          background: 'var(--ink)',
          borderRadius: '50%',
          flexShrink: 0,
          marginRight: '0.5rem',
          marginTop: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C4 1 2 3.5 2 6C2 10 7 13 7 13C7 13 12 10 12 6C12 3.5 10 1 7 1Z"
              fill="var(--sand)" opacity="0.9" />
            <circle cx="7" cy="5.5" r="1.5" fill="var(--parchment)" />
          </svg>
        </div>
      )}

      <div style={{ maxWidth: '80%' }}>
        <div style={{
          background: isUser ? 'var(--ink)' : 'white',
          color: isUser ? 'var(--parchment)' : 'var(--ink)',
          borderRadius: 'var(--radius-lg)',
          borderBottomRightRadius: isUser ? 4 : 'var(--radius-lg)',
          borderBottomLeftRadius: isUser ? 'var(--radius-lg)' : 4,
          padding: '0.85rem 1rem',
          boxShadow: 'var(--shadow-soft)',
          fontSize: '0.92rem',
          lineHeight: 1.6,
        }}>
          {message.text}
        </div>
        {message.mood && !isUser && (
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--ink-muted)',
            marginTop: '0.25rem',
            marginLeft: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <span style={{ fontSize: '0.85rem' }}>{MOOD_EMOJIS[message.mood]}</span>
            <span style={{ color: MOOD_COLORS[message.mood] }}>
              {MOOD_LABELS[message.mood]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

function TypingDots({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'var(--ink-muted)',
      fontSize: '0.82rem',
    }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: 'var(--sand)',
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      {label}
    </div>
  )
}