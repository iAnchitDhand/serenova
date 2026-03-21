import { useRef, useState, useCallback } from 'react'
import { AudioCapture } from '@runanywhere/web-onnx'

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
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const startLevelMonitor = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser
    const src = ctx.createMediaStreamSource(stream)
    src.connect(analyser)

    const buf = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(buf)
      const avg = buf.reduce((s, v) => s + v, 0) / buf.length
      setAudioLevel(Math.min(avg / 80, 1))
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startLevelMonitor(stream)

      const capture = new AudioCapture({ sampleRate: 16000 })
      captureRef.current = capture
      chunksRef.current = []

      await capture.start((chunk: Float32Array) => {
        chunksRef.current.push(chunk.slice())
      })

      setState('recording')
    } catch (err) {
      console.error('Failed to start recording:', err)
      setState('idle')
    }
  }, [startLevelMonitor])

  const stopRecording = useCallback(async (): Promise<Float32Array | null> => {
    setState('processing')
    cancelAnimationFrame(animFrameRef.current)
    setAudioLevel(0)

    if (analyserRef.current) {
      try { analyserRef.current.disconnect() } catch { }
      analyserRef.current = null
    }
    if (audioCtxRef.current) {
      try { await audioCtxRef.current.close() } catch { }
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (captureRef.current) {
      try {
        await captureRef.current.stop()
      } catch { }
      captureRef.current = null
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

    return combined
  }, [])

  return { state, startRecording, stopRecording, audioLevel }
}