import { type RecordingState } from '../hooks/useVoiceRecorder'
import { useRipple } from '../hooks/useRipple'
import { memo, useMemo } from 'react'

interface Props {
  state: RecordingState
  audioLevel: number
  pipelineState: string
  onPress: () => void
  disabled?: boolean
}

function VoiceOrb({ state, audioLevel, pipelineState, onPress, disabled }: Props) {
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing' || pipelineState !== 'idle'
  const ripple = useRipple('rgba(245,240,232,0.35)')

  const orbSize = 120
  const rippleScale = isRecording ? 1 + audioLevel * 0.5 : 1

  const orbColor = useMemo(() => {
    if (isRecording) return '#c4736a'
    if (pipelineState === 'generatingResponse') return '#4a6741'
    if (pipelineState === 'playingTTS') return '#5b7fa6'
    if (isProcessing) return '#8aafc8'
    return '#1c1a17'
  }, [isRecording, pipelineState, isProcessing])

  const stateLabel = useMemo(() => {
    if (isRecording) return 'Tap to stop'
    if (pipelineState === 'processingSTT') return 'Transcribing…'
    if (pipelineState === 'generatingResponse') return 'Thinking…'
    if (pipelineState === 'playingTTS') return 'Speaking…'
    if (state === 'processing') return 'Processing…'
    return 'Tap to speak'
  }, [isRecording, pipelineState, state])

  // Memoize audio level bars to prevent re-render on every audio level change
  const audioLevelBars = useMemo(() => {
    if (!isRecording) return null
    return (
      <div style={{
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        height: 30,
        animation: 'fadeIn 0.3s ease both',
      }}>
        {Array.from({ length: 9 }, (_, i) => {
          const center = 4
          const distance = Math.abs(i - center)
          const baseH = 6
          const maxAdd = audioLevel * 20
          const h = baseH + Math.max(0, maxAdd * (1 - distance / center))
          return (
            <div key={i} style={{
              width: 3,
              height: h,
              background: 'var(--blush)',
              borderRadius: 2,
              transition: 'height 0.12s ease',
              opacity: 0.7 + (1 - distance / center) * 0.3,
            }} />
          )
        })}
      </div>
    )
  }, [isRecording, audioLevel])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.25rem',
    }}>
      {/* Orb container with ripples */}
      <div style={{
        position: 'relative',
        width: orbSize + 80,
        height: orbSize + 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Ripple rings when recording */}
        {isRecording && (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute',
                width: orbSize,
                height: orbSize,
                borderRadius: '50%',
                border: '2px solid var(--blush)',
                opacity: 0,
                animation: `ripple 2s ease-out ${i * 0.65}s infinite`,
              }} />
            ))}
          </>
        )}

        {/* Processing pulse */}
        {isProcessing && !isRecording && (
          <div style={{
            position: 'absolute',
            width: orbSize,
            height: orbSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(91,127,166,0.12) 0%, transparent 70%)',
            animation: 'pulse 1.8s ease-in-out infinite',
          }} />
        )}

        {/* Main orb */}
        <button
          onClick={(e) => { ripple(e); onPress() }}
          disabled={disabled}
          className="ripple-host"
          style={{
            width: orbSize,
            height: orbSize,
            borderRadius: '50%',
            background: orbColor,
            color: 'var(--parchment)',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            transition: 'background 0.4s ease, transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease',
            transform: isRecording
              ? `scale(${0.95 + audioLevel * 0.12})`
              : 'scale(1)',
            boxShadow: isRecording
              ? `0 0 0 ${Math.round(audioLevel * 20)}px rgba(196,115,106,0.1), var(--shadow-card), 0 0 40px rgba(196,115,106,0.3)`
              : pipelineState === 'playingTTS'
                ? 'var(--shadow-glow-sky), var(--shadow-card)'
                : 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.2rem',
            position: 'relative',
            zIndex: 1,
          }}
          onMouseEnter={e => {
            if (!isRecording && !isProcessing) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'
                ; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-card), 0 0 28px rgba(200,168,130,0.3)'
            }
          }}
          onMouseLeave={e => {
            if (!isRecording) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
                ; (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-card)'
            }
          }}
          aria-label={stateLabel}
        >
          {/* Icon */}
          {isRecording ? (
            // Stop icon
            <div style={{
              width: 22, height: 22,
              background: 'var(--parchment)',
              borderRadius: 3,
            }} />
          ) : pipelineState === 'playingTTS' ? (
            // Sound wave icon
            <SoundwaveIcon />
          ) : pipelineState !== 'idle' ? (
            // Spinner
            <div style={{
              width: 24, height: 24,
              border: '2.5px solid rgba(245,240,232,0.3)',
              borderTopColor: 'var(--parchment)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            // Mic icon
            <MicIcon />
          )}
        </button>
      </div>

      {/* State label */}
      <p style={{
        fontSize: '0.88rem',
        color: isRecording ? 'var(--blush)' : 'var(--ink-muted)',
        fontWeight: isRecording ? 500 : 400,
        letterSpacing: '0.01em',
        transition: 'color 0.3s ease',
        minHeight: '1.4em',
      }}>
        {stateLabel}
      </p>

      {/* Audio level bars when recording */}
      {audioLevelBars}
    </div>
  )
}

export default memo(VoiceOrb)

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="10" y="3" width="8" height="14" rx="4" fill="rgba(245,240,232,0.95)" />
      <path d="M6 14C6 18.4 9.6 22 14 22C18.4 22 22 18.4 22 14" stroke="rgba(245,240,232,0.95)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="14" y1="22" x2="14" y2="26" stroke="rgba(245,240,232,0.95)" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="26" x2="18" y2="26" stroke="rgba(245,240,232,0.95)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SoundwaveIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
      {[3, 7, 11, 14, 17, 21, 25].map((x, i) => {
        const heights = [8, 14, 18, 20, 18, 14, 8]
        const h = heights[i]
        const y = (20 - h) / 2
        return (
          <rect key={x} x={x - 1.5} y={y} width="3" height={h} rx="1.5"
            fill="rgba(245,240,232,0.9)"
            style={{ animation: `wave 1s ease-in-out ${i * 0.1}s infinite` }}
          />
        )
      })}
    </svg>
  )
}