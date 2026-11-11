import { useRef, useState, useCallback } from 'react'
import { AudioCapture } from '@runanywhere/web'

export type RecordingState = 'idle' | 'recording' | 'processing'

interface UseVoiceRecorderResult {
  state: RecordingState
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Float32Array | null>
  audioLevel: number
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<RecordingState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const captureRef = useRef<AudioCapture | null>(null)
  const chunksRef = useRef<Float32Array[]>([])
  const stoppingRef = useRef(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastMeterUpdateRef = useRef(0)
  const lastReportedLevelRef = useRef(0)

  const startLevelMonitor = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128 // Reduced from 256 for better performance
    analyser.smoothingTimeConstant = 0.7 // Add smoothing
    analyserRef.current = analyser
    const src = ctx.createMediaStreamSource(stream)
    src.connect(analyser)

    const buf = new Uint8Array(analyser.frequencyBinCount)
    const tick = (now: number) => {
      analyser.getByteFrequencyData(buf)
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length
      const nextLevel = Math.min(avg / 80, 1)

      // Update the UI meter at ~20fps and skip tiny deltas to avoid full-tree rerenders.
      if (now - lastMeterUpdateRef.current >= 50 && Math.abs(nextLevel - lastReportedLevelRef.current) >= 0.03) {
        lastMeterUpdateRef.current = now
        lastReportedLevelRef.current = nextLevel
        setAudioLevel(nextLevel)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      stoppingRef.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      lastMeterUpdateRef.current = 0
      lastReportedLevelRef.current = 0
      startLevelMonitor(stream)

      const capture = new AudioCapture({ sampleRate: 16000 })
      captureRef.current = capture
      chunksRef.current = []

      await capture.start((chunk: Float32Array) => {
        if (stoppingRef.current) return
        chunksRef.current.push(chunk.slice())
      })

      setState('recording')
    } catch (err) {
      console.error('Failed to start recording:', err)
      setState('idle')
    }
  }, [startLevelMonitor])

  const stopRecording = useCallback(async (): Promise<Float32Array | null> => {
    stoppingRef.current = true
    setState('processing')

    // Clean up animation frame first
    cancelAnimationFrame(animFrameRef.current)
    setAudioLevel(0)
    lastMeterUpdateRef.current = 0
    lastReportedLevelRef.current = 0

    // Stop the audio capture first
    if (captureRef.current) {
      try {
        await captureRef.current.stop()
      } catch (e) {
        console.warn('Error stopping capture:', e)
      }
      captureRef.current = null
    }

    // Then clean up audio analysis nodes
    if (analyserRef.current) {
      try { analyserRef.current.disconnect() } catch { }
      analyserRef.current = null
    }
    if (audioCtxRef.current) {
      try { await audioCtxRef.current.close() } catch { }
      audioCtxRef.current = null
    }

    // Finally stop the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    const chunks = chunksRef.current
    chunksRef.current = []

    if (chunks.length === 0) {
      setState('idle')
      return null
    }

    const total = chunks.reduce((s, c) => s + c.length, 0)
    const combined = new Float32Array(total)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    // Return to idle immediately - VoiceCompanion manages pipeline state
    setState('idle')
    return combined
  }, [])

  return { state, startRecording, stopRecording, audioLevel }
}