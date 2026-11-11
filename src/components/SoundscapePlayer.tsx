import { useState, useRef, useCallback, useEffect } from 'react'
import { useRipple } from '../hooks/useRipple.ts'

interface SoundTrack {
    id: string
    name: string
    emoji: string
    description: string
    color: string
}

const TRACKS: SoundTrack[] = [
    { id: 'rain', name: 'Gentle Rain', emoji: '🌧', description: 'Soft rainfall on leaves', color: '#5b7fa6' },
    { id: 'forest', name: 'Forest Whisper', emoji: '🌲', description: 'Birds & rustling leaves', color: '#4a6741' },
    { id: 'ocean', name: 'Ocean Waves', emoji: '🌊', description: 'Slow rolling waves', color: '#3a7a9c' },
    { id: 'fire', name: 'Crackling Fire', emoji: '🔥', description: 'Warm hearth sounds', color: '#c4736a' },
    { id: 'wind', name: 'Mountain Wind', emoji: '🍃', description: 'Soft wind through grass', color: '#6a9160' },
    { id: 'crystal', name: 'Crystal Bowls', emoji: '🔮', description: 'Tibetan singing bowls', color: '#8b7ec8' },
    { id: 'lullaby', name: 'Dream Lullaby', emoji: '✨', description: 'Gentle tonal melody', color: '#d4899a' },
    { id: 'space', name: 'Deep Space', emoji: '🌌', description: 'Cosmic ambient drift', color: '#2a3a5c' },
]

class RelaxAudio {
    ctx: AudioContext
    master: GainNode
    nodes: AudioNode[] = []

    constructor() {
        this.ctx = new AudioContext()
        this.master = this.ctx.createGain()
        this.master.gain.value = 0
        this.master.connect(this.ctx.destination)
    }

    fadeIn(vol = 0.6, dur = 2) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime)
        this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime)
        this.master.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + dur)
    }

    fadeOut(dur = 1.5) {
        this.master.gain.cancelScheduledValues(this.ctx.currentTime)
        this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime)
        this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur)
    }

    noise(type: 'white' | 'brown' | 'pink' = 'brown', gain = 0.5): AudioBufferSourceNode {
        const bufLen = this.ctx.sampleRate * 3
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate)
        const data = buf.getChannelData(0)
        if (type === 'white') {
            for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
        } else if (type === 'brown') {
            let prev = 0
            for (let i = 0; i < bufLen; i++) {
                const white = Math.random() * 2 - 1
                data[i] = (prev + 0.02 * white) / 1.02
                prev = data[i]
                data[i] *= 3.5
            }
        } else {
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
            for (let i = 0; i < bufLen; i++) {
                const white = Math.random() * 2 - 1
                b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759
                b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856
                b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) / 7; b6 = white * 0.115926
            }
        }
        const src = this.ctx.createBufferSource()
        src.buffer = buf; src.loop = true
        const g = this.ctx.createGain(); g.gain.value = gain
        src.connect(g); g.connect(this.master)
        src.start()
        this.nodes.push(src, g)
        return src
    }

    tone(freq: number, type: OscillatorType = 'sine', gain = 0.1, detune = 0): OscillatorNode {
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        const lp = this.ctx.createBiquadFilter()
        osc.type = type; osc.frequency.value = freq; osc.detune.value = detune
        lp.type = 'lowpass'; lp.frequency.value = 800
        g.gain.value = gain
        osc.connect(lp); lp.connect(g); g.connect(this.master)
        osc.start(); this.nodes.push(osc, g, lp)
        return osc
    }

    lfo(target: AudioParam, rate: number, depth: number, center: number) {
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        osc.frequency.value = rate; g.gain.value = depth
        target.value = center
        osc.connect(g); g.connect(target)
        osc.start(); this.nodes.push(osc, g)
    }

    bowl(freq: number, gain = 0.12, attackTime = 0.6) {
        const osc = this.ctx.createOscillator()
        const g = this.ctx.createGain()
        const rev = this.createReverb(3)
        osc.type = 'sine'; osc.frequency.value = freq
        g.gain.setValueAtTime(0, this.ctx.currentTime)
        g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + attackTime)
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 8)
        osc.connect(g); g.connect(rev); rev.connect(this.master)
        osc.start(); osc.stop(this.ctx.currentTime + 9)
        this.nodes.push(osc, g)
    }

    createReverb(secs = 2): ConvolverNode {
        const conv = this.ctx.createConvolver()
        const len = this.ctx.sampleRate * secs
        const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate)
        for (let c = 0; c < 2; c++) {
            const d = buf.getChannelData(c)
            for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
        }
        conv.buffer = buf; this.nodes.push(conv)
        return conv
    }

    stop() {
        this.nodes.forEach(n => { try { (n as AudioBufferSourceNode).stop?.() } catch { } })
        this.nodes = []
    }

    dispose() {
        this.stop()
        try { this.ctx.close() } catch { }
    }
}

function buildTrack(audio: RelaxAudio, id: string) {
    switch (id) {
        case 'rain': {
            audio.noise('pink', 0.28)
            const lp = audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200
            audio.noise('white', 0.06)
            // Rhythmic rain droplet tones
            const scheduleDrops = () => {
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        const osc = audio.ctx.createOscillator(), g = audio.ctx.createGain()
                        osc.frequency.value = 1200 + Math.random() * 800; osc.type = 'sine'
                        g.gain.setValueAtTime(0, audio.ctx.currentTime)
                        g.gain.linearRampToValueAtTime(0.04, audio.ctx.currentTime + 0.01)
                        g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.12)
                        osc.connect(g); g.connect(audio.master)
                        osc.start(); osc.stop(audio.ctx.currentTime + 0.13)
                    }, i * 120 + Math.random() * 600)
                }
            }
            scheduleDrops()
            const intv = setInterval(scheduleDrops, 1200)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            break
        }
        case 'forest': {
            audio.noise('pink', 0.1)
            // Bird chirps at random intervals
            const chirp = () => {
                const freq = 1800 + Math.random() * 1400
                const osc = audio.ctx.createOscillator()
                const g = audio.ctx.createGain()
                osc.frequency.setValueAtTime(freq, audio.ctx.currentTime)
                osc.frequency.linearRampToValueAtTime(freq * 1.3, audio.ctx.currentTime + 0.08)
                osc.frequency.linearRampToValueAtTime(freq * 0.9, audio.ctx.currentTime + 0.18)
                g.gain.setValueAtTime(0, audio.ctx.currentTime)
                g.gain.linearRampToValueAtTime(0.06, audio.ctx.currentTime + 0.03)
                g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.22)
                osc.connect(g); g.connect(audio.master); osc.start(); osc.stop(audio.ctx.currentTime + 0.25)
            }
            const intv = setInterval(() => { if (Math.random() < 0.4) chirp() }, 800)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            // Wind undertone
            const w = audio.noise('brown', 0.08)
            const lfo = audio.ctx.createOscillator()
            const lg = audio.ctx.createGain(); lg.gain.value = 0.05
            lfo.frequency.value = 0.1
            // (simplified, just use noise)
            break
        }
        case 'ocean': {
            // Low rumble
            audio.noise('brown', 0.35)
            audio.noise('pink', 0.08)
            // Wave rhythm using gain LFO
            const waveOsc = audio.ctx.createOscillator()
            const waveG = audio.ctx.createGain()
            const noiseNode = audio.noise('brown', 0.2)
            const lfoG = audio.ctx.createGain()
            waveOsc.frequency.value = 0.12; waveOsc.type = 'sine'
            lfoG.gain.value = 0.15
            waveOsc.connect(lfoG); lfoG.connect(waveG.gain)
            waveOsc.start()
            audio.nodes.push(waveOsc, waveG, lfoG)
            break
        }
        case 'fire': {
            // Brown noise base + crackle transients
            audio.noise('brown', 0.22)
            const crackle = () => {
                const osc = audio.ctx.createOscillator()
                const g = audio.ctx.createGain()
                osc.type = 'sawtooth'; osc.frequency.value = 80 + Math.random() * 120
                g.gain.setValueAtTime(0, audio.ctx.currentTime)
                g.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.1, audio.ctx.currentTime + 0.01)
                g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.08)
                osc.connect(g); g.connect(audio.master); osc.start(); osc.stop(audio.ctx.currentTime + 0.1)
            }
            const intv = setInterval(() => { if (Math.random() < 0.5) crackle() }, 250)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            audio.tone(60, 'sine', 0.08)
            break
        }
        case 'wind': {
            audio.noise('pink', 0.18)
            const osc1 = audio.ctx.createOscillator(); const g1 = audio.ctx.createGain()
            osc1.type = 'sawtooth'; osc1.frequency.value = 120; g1.gain.value = 0.04
            osc1.connect(g1); g1.connect(audio.master); osc1.start()
            audio.nodes.push(osc1, g1)
            audio.noise('white', 0.06)
            break
        }
        case 'crystal': {
            // Tibetan bowl harmonics — pentatonic frequencies
            const freqs = [174, 285, 396, 528, 639, 741, 852]
            const play = () => {
                const f = freqs[Math.floor(Math.random() * freqs.length)]
                audio.bowl(f, 0.1, 0.8)
                // harmonics
                audio.bowl(f * 2, 0.04, 0.5)
                audio.bowl(f * 3, 0.02, 0.3)
            }
            play()
            const intv = setInterval(play, 4000 + Math.random() * 2000)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            // Subtle drone
            audio.tone(174, 'sine', 0.04)
            audio.tone(396, 'sine', 0.025, 5)
            break
        }
        case 'lullaby': {
            // Gentle pentatonic melody: C D E G A
            const notes = [261.6, 293.7, 329.6, 392, 440, 523.2]
            const rev = audio.createReverb(4)
            const playNote = (freq: number, when: number, dur: number) => {
                const osc = audio.ctx.createOscillator()
                const g = audio.ctx.createGain()
                osc.type = 'sine'; osc.frequency.value = freq
                g.gain.setValueAtTime(0, when)
                g.gain.linearRampToValueAtTime(0.09, when + 0.05)
                g.gain.exponentialRampToValueAtTime(0.001, when + dur)
                osc.connect(g); g.connect(rev); rev.connect(audio.master)
                osc.start(when); osc.stop(when + dur + 0.1)
                audio.nodes.push(osc, g)
            }
            const seq = [0, 2, 4, 3, 1, 4, 2, 0, 4, 3, 2, 1]
            const schedMelody = (startAt: number) => {
                seq.forEach((ni, i) => {
                    const t = startAt + i * 0.65
                    playNote(notes[ni], t, 0.8)
                    // gentle 3rd harmony
                    if (i % 3 === 0) playNote(notes[(ni + 2) % notes.length] * 0.5, t, 1.2)
                })
            }
            schedMelody(audio.ctx.currentTime + 0.5)
            const intv = setInterval(() => schedMelody(audio.ctx.currentTime + 0.2), seq.length * 650 + 200)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            audio.noise('brown', 0.04)
            break
        }
        case 'space': {
            // Deep space drone — detuned oscillators with very slow LFO
            const freqs = [55, 82.4, 110, 164.8]
            freqs.forEach((f, i) => {
                const o = audio.ctx.createOscillator(), g = audio.ctx.createGain()
                o.type = 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 8
                g.gain.value = 0.07
                const lfo = audio.ctx.createOscillator(), lg = audio.ctx.createGain()
                lfo.frequency.value = 0.04 + i * 0.01; lg.gain.value = 0.03
                lfo.connect(lg); lg.connect(g.gain)
                o.connect(g); g.connect(audio.master); o.start(); lfo.start()
                audio.nodes.push(o, g, lfo, lg)
            })
            audio.noise('brown', 0.05)
            // Distant chime
            const chime = () => audio.bowl(220 + Math.random() * 110, 0.05, 1.5)
            chime()
            const intv = setInterval(() => { if (Math.random() < 0.3) chime() }, 5000)
            audio.nodes.push({ disconnect: () => clearInterval(intv) } as unknown as AudioNode)
            break
        }
    }
}

export default function SoundscapePlayer() {
    const [active, setActive] = useState<string | null>(null)
    const [volume, setVolume] = useState(0.6)
    const [fading, setFading] = useState(false)
    const [audioInitialized, setAudioInitialized] = useState(false)
    const [audioSupported, setAudioSupported] = useState(true)
    const audioRef = useRef<RelaxAudio | null>(null)
    const disposeTimeoutRef = useRef<number | null>(null)
    const ripple = useRipple('rgba(255,255,255,0.25)')

    // Check browser support on mount
    useEffect(() => {
        if (typeof window === 'undefined' || !window.AudioContext) {
            setAudioSupported(false)
        }
    }, [])

    const play = useCallback(async (id: string) => {
        // Prevent multiple simultaneous plays
        if (fading) {
            return
        }

        // Initialize audio on first interaction
        if (!audioInitialized) {
            try {
                const tempAudio = new RelaxAudio()
                if (tempAudio.ctx.state === 'suspended') {
                    await tempAudio.ctx.resume()
                }
                tempAudio.dispose()
                setAudioInitialized(true)
            } catch (error) {
                console.error('Failed to initialize audio:', error)
                return
            }
        }

        // Clear existing timeouts
        if (disposeTimeoutRef.current !== null) {
            window.clearTimeout(disposeTimeoutRef.current)
            disposeTimeoutRef.current = null
        }

        // Toggle off currently active track.
        if (active === id) {
            const currentAudio = audioRef.current
            if (currentAudio) {
                currentAudio.fadeOut(1)
                disposeTimeoutRef.current = window.setTimeout(() => {
                    if (audioRef.current === currentAudio) {
                        audioRef.current.dispose()
                        audioRef.current = null
                    }
                }, 1200)
            }
            setActive(null)
            setFading(false)
            return
        }

        // Stop previous track
        const previousAudio = audioRef.current
        if (previousAudio) {
            previousAudio.fadeOut(1)
            disposeTimeoutRef.current = window.setTimeout(() => {
                if (audioRef.current === previousAudio) {
                    audioRef.current.dispose()
                    audioRef.current = null
                }
            }, 1200)
        }

        setFading(true)
        
        // Start new track immediately (no delay for simplicity)
        try {
            const audio = new RelaxAudio()
            
            // Handle AudioContext suspension
            if (audio.ctx.state === 'suspended') {
                await audio.ctx.resume()
            }
            
            // Build the actual track
            buildTrack(audio, id)
            
            // Start with a gentle fade in
            audio.fadeIn(volume)

            if (audioRef.current && audioRef.current !== previousAudio) {
                audioRef.current.dispose()
            }
            audioRef.current = audio
            setActive(id)
            setFading(false)
        } catch (error) {
            console.error('Error playing soundscape:', error)
            setFading(false)
        }
    }, [active, volume, audioInitialized, fading, audioSupported])

    // Volume change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.master.gain.cancelScheduledValues(audioRef.current.ctx.currentTime)
            audioRef.current.master.gain.setValueAtTime(volume, audioRef.current.ctx.currentTime)
        }
    }, [volume])

    useEffect(() => {
        return () => {
            if (disposeTimeoutRef.current !== null) {
                window.clearTimeout(disposeTimeoutRef.current)
            }
            audioRef.current?.dispose()
            audioRef.current = null
        }
    }, [])

    return (
        <div style={{ animation: 'fadeIn 0.4s ease both' }}>
            {/* Browser compatibility notice */}
            {!audioSupported && (
                <div style={{
                    background: '#fdf0ef',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: 'var(--blush)',
                    textAlign: 'center',
                }}>
                    <span>🔇</span>
                    <span style={{ marginLeft: '0.5rem' }}>
                        Web Audio API not supported in this browser. Please try a modern browser like Chrome, Firefox, or Safari.
                    </span>
                </div>
            )}

            {/* Audio initialization notice */}
            {audioSupported && !audioInitialized && (
                <div style={{
                    background: '#fdf0ef',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.82rem',
                    color: 'var(--blush)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                }}>
                    <span>🔊</span>
                    <span>Click any soundscape to enable audio</span>
                </div>
            )}

            {/* Volume control */}
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                opacity: audioSupported ? 1 : 0.5,
                pointerEvents: audioSupported ? 'auto' : 'none',
            }}>
                <span style={{ fontSize: '1.1rem' }}>🔊</span>
                <input
                    type="range" min={0} max={1} step={0.01} value={volume}
                    onChange={e => setVolume(+e.target.value)}
                    style={{ flex: 1, accentColor: 'var(--sand-deep)' }}
                    disabled={!audioSupported}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', minWidth: 28 }}>
                    {Math.round(volume * 100)}%
                </span>
            </div>

            {/* Now playing bar */}
            {active && (
                <div style={{
                    background: 'var(--ink)',
                    color: 'var(--parchment)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    animation: 'slideUp 0.35s ease both',
                }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} style={{
                                width: 3, height: 6 + i * 3,
                                background: 'var(--sand)',
                                borderRadius: 2,
                                animation: `wave 1s ease-in-out ${i * 0.15}s infinite`,
                            }} />
                        ))}
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                        {TRACKS.find(t => t.id === active)?.emoji} {TRACKS.find(t => t.id === active)?.name}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'rgba(245,240,232,0.6)' }}>
                        Playing
                    </span>
                </div>
            )}

            {/* Track grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.6rem',
            }}>
                {TRACKS.map(track => {
                    const isPlaying = active === track.id
                    return (
                        <button
                            key={track.id}
                            onClick={() => { 
                                play(track.id) 
                            }}
                            disabled={fading || !audioSupported}
                            className="ripple-host"
                            style={{
                                background: isPlaying ? track.color : 'white',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem',
                                textAlign: 'left',
                                boxShadow: isPlaying ? `0 4px 24px ${track.color}55` : 'var(--shadow-soft)',
                                border: `2px solid ${isPlaying ? track.color : 'transparent'}`,
                                transform: isPlaying ? 'scale(1.03)' : 'scale(1)',
                                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                                cursor: audioSupported ? 'pointer' : 'not-allowed',
                                opacity: (fading || !audioSupported) ? 0.7 : 1,
                            }}
                            onMouseEnter={e => {
                                if (!isPlaying && audioSupported) {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = `var(--shadow-card)`
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isPlaying) {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
                                }
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{track.emoji}</div>
                            <div style={{
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: isPlaying ? 'white' : 'var(--ink)',
                                marginBottom: '0.15rem',
                            }}>
                                {track.name}
                            </div>
                            <div style={{
                                fontSize: '0.72rem',
                                color: isPlaying ? 'rgba(255,255,255,0.75)' : 'var(--ink-muted)',
                                lineHeight: 1.3,
                            }}>
                                {track.description}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}