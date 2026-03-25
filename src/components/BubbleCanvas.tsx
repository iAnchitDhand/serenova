import { useEffect, useRef, useCallback, useState } from 'react'

interface Bubble {
    id: number
    x: number
    y: number
    r: number
    color: string
    vx: number
    vy: number
    opacity: number
    popping: boolean
    popProgress: number
    wobble: number
    wobbleSpeed: number
    createdAt: number
    shimmer: number
}

const BUBBLE_COLORS = [
    'rgba(91,127,166,',
    'rgba(74,103,65,',
    'rgba(200,168,130,',
    'rgba(139,126,200,',
    'rgba(212,137,58,',
    'rgba(196,115,106,',
    'rgba(107,174,160,',
]

let bubbleIdCounter = 0

function createBubbleSound(ctx: AudioContext, radius: number) {
    // Gentle pop sound — higher pitch for smaller bubbles
    const freq = 800 + (1 - radius / 60) * 1200
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    filter.type = 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = 8

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * 1.4, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
}

export default function BubbleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const bubblesRef = useRef<Bubble[]>([])
    const rafRef = useRef<number>(0)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const lastSpawnRef = useRef(0)
    const [poppedCount, setPoppedCount] = useState(0)
    const [showHint, setShowHint] = useState(true)

    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext()
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume()
        }
        return audioCtxRef.current
    }, [])

    const spawnBubble = useCallback((x?: number, y?: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const r = 14 + Math.random() * 42
        const colorBase = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
        bubblesRef.current.push({
            id: bubbleIdCounter++,
            x: x ?? (r + Math.random() * (canvas.width - r * 2)),
            y: y ?? canvas.height + r,
            r,
            color: colorBase,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -(0.4 + Math.random() * 0.8),
            opacity: 0.55 + Math.random() * 0.35,
            popping: false,
            popProgress: 0,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            createdAt: Date.now(),
            shimmer: Math.random() * Math.PI * 2,
        })
    }, [])

    const popBubble = useCallback((bubble: Bubble) => {
        if (bubble.popping) return
        bubble.popping = true
        createBubbleSound(getAudioCtx(), bubble.r)
        setPoppedCount(c => c + 1)
        setShowHint(false)
    }, [getAudioCtx])

    // Canvas click handler
    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const cx = (e.clientX - rect.left) * scaleX
        const cy = (e.clientY - rect.top) * scaleY

        let popped = false
        // Pop bubble under cursor (topmost first)
        for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
            const b = bubblesRef.current[i]
            if (b.popping) continue
            const dist = Math.hypot(cx - b.x, cy - b.y)
            if (dist < b.r + 4) {
                popBubble(b)
                popped = true
                break
            }
        }
        // If missed, spawn a new one at click spot
        if (!popped) {
            spawnBubble(cx, cy - 20)
        }
    }, [popBubble, spawnBubble])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!

        const resize = () => {
            canvas.width = canvas.offsetWidth * devicePixelRatio
            canvas.height = canvas.offsetHeight * devicePixelRatio
            ctx.scale(devicePixelRatio, devicePixelRatio)
        }
        resize()
        window.addEventListener('resize', resize)

        // Seed initial bubbles
        for (let i = 0; i < 12; i++) {
            setTimeout(() => spawnBubble(), i * 180)
        }

        const draw = (ts: number) => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            ctx.clearRect(0, 0, w, h)

            // Spawn new bubbles periodically
            if (ts - lastSpawnRef.current > 1400 && bubblesRef.current.length < 30) {
                spawnBubble()
                lastSpawnRef.current = ts
            }

            const toRemove: number[] = []

            bubblesRef.current.forEach((b, i) => {
                if (b.popping) {
                    b.popProgress += 0.08
                    if (b.popProgress >= 1) { toRemove.push(i); return }

                    // Pop ring burst
                    const popR = b.r * (1 + b.popProgress * 1.8)
                    const popAlpha = 1 - b.popProgress
                    ctx.save()
                    ctx.globalAlpha = popAlpha * b.opacity
                    ctx.strokeStyle = b.color + '0.8)'
                    ctx.lineWidth = 2.5
                    ctx.beginPath()
                    ctx.arc(b.x, b.y, popR, 0, Math.PI * 2)
                    ctx.stroke()

                    // Mini droplets flying out
                    for (let d = 0; d < 6; d++) {
                        const angle = (d / 6) * Math.PI * 2
                        const dist = b.r * (0.5 + b.popProgress * 2.5)
                        const dx = b.x + Math.cos(angle) * dist
                        const dy = b.y + Math.sin(angle) * dist
                        ctx.globalAlpha = popAlpha * 0.7
                        ctx.fillStyle = b.color + '0.9)'
                        ctx.beginPath()
                        ctx.arc(dx, dy, Math.max(1, b.r * 0.12 * (1 - b.popProgress)), 0, Math.PI * 2)
                        ctx.fill()
                    }
                    ctx.restore()
                    return
                }

                // Move
                b.wobble += b.wobbleSpeed
                b.shimmer += 0.04
                b.x += b.vx + Math.sin(b.wobble) * 0.3
                b.y += b.vy
                // Gentle wall bounce
                if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) }
                if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) }
                // Remove when offscreen top
                if (b.y + b.r < -10) { toRemove.push(i); return }

                // Draw bubble
                ctx.save()
                ctx.globalAlpha = b.opacity

                // Outer glow
                const grd = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05, b.x, b.y, b.r)
                grd.addColorStop(0, b.color + '0.15)')
                grd.addColorStop(0.7, b.color + '0.08)')
                grd.addColorStop(1, b.color + '0.22)')
                ctx.fillStyle = grd
                ctx.beginPath()
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
                ctx.fill()

                // Bubble rim
                ctx.strokeStyle = b.color + `${0.5 + 0.2 * Math.sin(b.shimmer)})`
                ctx.lineWidth = 1.5
                ctx.beginPath()
                ctx.arc(b.x, b.y, b.r - 0.75, 0, Math.PI * 2)
                ctx.stroke()

                // Inner shine highlight (top-left)
                const shineGrd = ctx.createRadialGradient(
                    b.x - b.r * 0.35, b.y - b.r * 0.38, b.r * 0.04,
                    b.x - b.r * 0.25, b.y - b.r * 0.28, b.r * 0.5
                )
                shineGrd.addColorStop(0, 'rgba(255,255,255,0.55)')
                shineGrd.addColorStop(1, 'rgba(255,255,255,0)')
                ctx.fillStyle = shineGrd
                ctx.beginPath()
                ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2)
                ctx.fill()

                // Small sparkle dot
                ctx.globalAlpha = b.opacity * (0.5 + 0.5 * Math.abs(Math.sin(b.shimmer * 2)))
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.beginPath()
                ctx.arc(b.x - b.r * 0.38, b.y - b.r * 0.38, b.r * 0.1, 0, Math.PI * 2)
                ctx.fill()

                ctx.restore()
            })

            // Remove in reverse order
            for (let i = toRemove.length - 1; i >= 0; i--) {
                bubblesRef.current.splice(toRemove[i], 1)
            }

            rafRef.current = requestAnimationFrame(draw)
        }

        rafRef.current = requestAnimationFrame(draw)
        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', resize)
        }
    }, [spawnBubble])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '0.75rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                        Tap bubbles to pop them ✨
                    </p>
                </div>
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.35rem 0.8rem',
                    boxShadow: 'var(--shadow-soft)',
                    fontSize: '0.82rem',
                    color: 'var(--ink-soft)',
                    fontWeight: 500,
                }}>
                    🫧 {poppedCount} popped
                </div>
            </div>

            <div style={{
                flex: 1,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(180deg, #e8f4f8 0%, #f0ece4 100%)',
                boxShadow: 'var(--shadow-soft)',
                minHeight: 320,
            }}>
                <canvas
                    ref={canvasRef}
                    onClick={handleClick}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        cursor: 'crosshair',
                    }}
                />

                {showHint && (
                    <div style={{
                        position: 'absolute',
                        bottom: '1.25rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(28,26,23,0.55)',
                        color: 'white',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.78rem',
                        whiteSpace: 'nowrap',
                        animation: 'fadeIn 1s ease 1.5s both',
                        backdropFilter: 'blur(8px)',
                    }}>
                        Tap any bubble to pop it 🫧
                    </div>
                )}
            </div>
        </div>
    )
}