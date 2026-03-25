import { useState, useRef, useEffect, useCallback } from 'react'
import { useRipple } from '../hooks/useRipple.ts'

type GameId = 'zen' | 'memory' | 'mandalas' | 'ripplepool'

interface Game {
    id: GameId
    name: string
    emoji: string
    tagline: string
    color: string
}

const GAMES: Game[] = [
    { id: 'zen', name: 'Zen Garden', emoji: '🪨', tagline: 'Draw lines in sand', color: '#c8a882' },
    { id: 'memory', name: 'Calm Pairs', emoji: '🍃', tagline: 'Gentle memory match', color: '#4a6741' },
    { id: 'mandalas', name: 'Color Mandalas', emoji: '🌸', tagline: 'Tap to bloom patterns', color: '#8b7ec8' },
    { id: 'ripplepool', name: 'Ripple Pool', emoji: '💧', tagline: 'Tap water for ripples', color: '#5b7fa6' },
]

// ── Zen Garden ────────────────────────────────
function ZenGarden() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const lastPos = useRef<{ x: number, y: number } | null>(null)
    const linesRef = useRef<{ pts: { x: number, y: number }[], color: string }[]>([])
    const currentLine = useRef<{ pts: { x: number, y: number }[], color: string } | null>(null)
    const textureCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const scratchNoiseRef = useRef<AudioBufferSourceNode | null>(null)
    const scratchGainRef = useRef<GainNode | null>(null)
    const scratchFilterRef = useRef<BiquadFilterNode | null>(null)
    const lastScratchAtRef = useRef(0)
    const colors = ['#c8a882', '#8b7ec8', '#4a6741', '#5b7fa6', '#c4736a', '#d4a53a']
    const colorIdx = useRef(0)

    const ensureScratchAudio = useCallback(async () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext()
        }
        const ctx = audioCtxRef.current
        if (ctx.state === 'suspended') {
            await ctx.resume()
        }
        if (!scratchNoiseRef.current || !scratchGainRef.current || !scratchFilterRef.current) {
            const bufLen = ctx.sampleRate * 2
            const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
            const data = buf.getChannelData(0)
            let brown = 0
            for (let i = 0; i < bufLen; i++) {
                const white = Math.random() * 2 - 1
                brown = (brown + 0.02 * white) / 1.02
                data[i] = brown * 1.8
            }

            const src = ctx.createBufferSource()
            src.buffer = buf
            src.loop = true

            const hp = ctx.createBiquadFilter()
            hp.type = 'highpass'
            hp.frequency.value = 260

            const bp = ctx.createBiquadFilter()
            bp.type = 'bandpass'
            bp.frequency.value = 1800
            bp.Q.value = 0.6

            const g = ctx.createGain()
            g.gain.value = 0

            src.connect(hp)
            hp.connect(bp)
            bp.connect(g)
            g.connect(ctx.destination)

            src.start()

            scratchNoiseRef.current = src
            scratchGainRef.current = g
            scratchFilterRef.current = bp
        }

        return {
            ctx,
            gain: scratchGainRef.current,
            filter: scratchFilterRef.current,
        }
    }, [])

    const setScratchIntensity = useCallback(async (speed: number) => {
        const chain = await ensureScratchAudio()
        if (!chain.gain || !chain.filter) return
        const now = chain.ctx.currentTime
        const vol = Math.min(0.09, 0.012 + speed * 0.0012)
        const freq = Math.min(2800, 900 + speed * 24)

        chain.gain.gain.cancelScheduledValues(now)
        chain.gain.gain.setTargetAtTime(vol, now, 0.018)

        chain.filter.frequency.cancelScheduledValues(now)
        chain.filter.frequency.setTargetAtTime(freq, now, 0.025)
    }, [ensureScratchAudio])

    const stopScratch = useCallback(() => {
        const ctx = audioCtxRef.current
        const gain = scratchGainRef.current
        if (!ctx || !gain) return
        const now = ctx.currentTime
        gain.gain.cancelScheduledValues(now)
        gain.gain.setTargetAtTime(0, now, 0.04)
    }, [])

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const src = 'touches' in e ? e.touches[0] : e
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY,
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const resize = () => {
            canvas.width = canvas.offsetWidth * devicePixelRatio
            canvas.height = canvas.offsetHeight * devicePixelRatio

            const tCanvas = document.createElement('canvas')
            tCanvas.width = canvas.width
            tCanvas.height = canvas.height
            const tctx = tCanvas.getContext('2d')!

            tctx.fillStyle = '#f0e8d4'
            tctx.fillRect(0, 0, tCanvas.width, tCanvas.height)

            // Dense grain for sandpaper look.
            for (let i = 0; i < 3200; i++) {
                const alpha = 0.03 + Math.random() * 0.06
                const warm = 120 + Math.floor(Math.random() * 30)
                tctx.fillStyle = `rgba(${warm},${95 + Math.floor(Math.random() * 25)},${60 + Math.floor(Math.random() * 20)},${alpha})`
                const x = Math.random() * tCanvas.width
                const y = Math.random() * tCanvas.height
                const s = 0.8 + Math.random() * 1.9
                tctx.fillRect(x, y, s, s)
            }

            // Directional micro-streaks to mimic abrasive paper fibers.
            tctx.strokeStyle = 'rgba(140,110,75,0.06)'
            tctx.lineWidth = 1
            for (let i = 0; i < 700; i++) {
                const x = Math.random() * tCanvas.width
                const y = Math.random() * tCanvas.height
                const len = 4 + Math.random() * 9
                const angle = (Math.random() - 0.5) * 0.9
                tctx.beginPath()
                tctx.moveTo(x, y)
                tctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
                tctx.stroke()
            }

            textureCanvasRef.current = tCanvas
        }
        resize()
        const redraw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (textureCanvasRef.current) {
                ctx.drawImage(textureCanvasRef.current, 0, 0)
            } else {
                ctx.fillStyle = '#f0e8d4'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            // Draw lines as raked sand grooves
            ;[...linesRef.current, ...(currentLine.current ? [currentLine.current] : [])].forEach(line => {
                if (line.pts.length < 2) return
                ctx.save()
                ctx.strokeStyle = line.color
                ctx.lineWidth = 7
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.globalAlpha = 0.5
                ctx.beginPath()
                ctx.moveTo(line.pts[0].x, line.pts[0].y)
                line.pts.forEach(p => ctx.lineTo(p.x, p.y))
                ctx.stroke()

                // Abrasive etched edge lines.
                ctx.lineWidth = 2
                ctx.globalAlpha = 0.26
                for (const off of [-8, 8]) {
                    ctx.beginPath()
                    const dx = 0, dy = off
                    ctx.moveTo(line.pts[0].x + dx, line.pts[0].y + dy)
                    line.pts.forEach(p => ctx.lineTo(p.x + dx, p.y + dy))
                    ctx.stroke()
                }

                // Sandpaper scratch marks based on local segment direction.
                ctx.strokeStyle = 'rgba(120,92,62,0.18)'
                ctx.lineWidth = 1
                ctx.globalAlpha = 0.35
                for (let i = 1; i < line.pts.length; i++) {
                    const a = line.pts[i - 1]
                    const b = line.pts[i]
                    const dx = b.x - a.x
                    const dy = b.y - a.y
                    const len = Math.hypot(dx, dy)
                    if (len < 6) continue
                    const nx = -dy / len
                    const ny = dx / len
                    const mx = (a.x + b.x) * 0.5
                    const my = (a.y + b.y) * 0.5
                    const half = 2 + Math.min(7, len * 0.25)

                    ctx.beginPath()
                    ctx.moveTo(mx - nx * half, my - ny * half)
                    ctx.lineTo(mx + nx * half, my + ny * half)
                    ctx.stroke()
                }
                ctx.restore()
            })
        }
        redraw()
        const obs = new MutationObserver(redraw)
        // Redraw whenever lines change — use a simple interval
        const intv = setInterval(redraw, 50)
        return () => {
            clearInterval(intv)
            stopScratch()
            if (scratchNoiseRef.current) {
                try { scratchNoiseRef.current.stop() } catch { }
                scratchNoiseRef.current.disconnect()
                scratchNoiseRef.current = null
            }
            if (scratchGainRef.current) {
                scratchGainRef.current.disconnect()
                scratchGainRef.current = null
            }
            if (scratchFilterRef.current) {
                scratchFilterRef.current.disconnect()
                scratchFilterRef.current = null
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => undefined)
                audioCtxRef.current = null
            }
        }
    }, [])

    const start = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!
        drawing.current = true
        const pos = getPos(e, canvas)
        colorIdx.current = (colorIdx.current + 1) % colors.length
        currentLine.current = { pts: [pos], color: colors[colorIdx.current] }
        lastPos.current = pos
        void ensureScratchAudio()
        void setScratchIntensity(14)
        lastScratchAtRef.current = performance.now()
    }
    const move = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawing.current || !currentLine.current) return
        e.preventDefault()
        const pos = getPos(e, canvasRef.current!)
        const prev = currentLine.current.pts[currentLine.current.pts.length - 1]
        currentLine.current.pts.push(pos)
        lastPos.current = pos

        const dist = Math.hypot(pos.x - prev.x, pos.y - prev.y)
        const now = performance.now()
        const dt = Math.max(8, now - lastScratchAtRef.current)
        lastScratchAtRef.current = now
        const speed = dist / (dt / 16.67)
        void setScratchIntensity(speed)
    }
    const end = () => {
        if (currentLine.current && currentLine.current.pts.length > 1) {
            linesRef.current.push(currentLine.current)
        }
        currentLine.current = null
        drawing.current = false
        stopScratch()
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Draw in the sand to calm your mind</p>
                <button
                    onClick={() => { linesRef.current = []; currentLine.current = null }}
                    style={{ padding: '0.3rem 0.75rem', background: 'var(--parchment-mid)', color: 'var(--ink-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', border: 'none', cursor: 'pointer' }}
                >Clear</button>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={start} onTouchMove={move} onTouchEnd={end}
                style={{ flex: 1, borderRadius: 'var(--radius-lg)', cursor: 'crosshair', touchAction: 'none', display: 'block', minHeight: 260, boxShadow: 'var(--shadow-soft)' }}
            />
        </div>
    )
}

// ── Calm Pairs Memory Game ─────────────────────
const CARD_EMOJIS = ['🌸', '🍃', '🌊', '🔮', '✨', '🌙', '🦋', '🌺']

interface MemCard { id: number; emoji: string; flipped: boolean; matched: boolean }

function CalmPairs() {
    const init = (): MemCard[] => {
        const pairs = [...CARD_EMOJIS, ...CARD_EMOJIS]
        return pairs.sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    }
    const [cards, setCards] = useState<MemCard[]>(init)
    const [selected, setSelected] = useState<number[]>([])
    const [moves, setMoves] = useState(0)
    const [locked, setLocked] = useState(false)
    const [won, setWon] = useState(false)
    const ripple = useRipple('rgba(255,255,255,0.3)')

    const flip = useCallback((e: React.MouseEvent<HTMLElement>, id: number) => {
        ripple(e)
        if (locked) return
        const card = cards.find(c => c.id === id)
        if (!card || card.flipped || card.matched) return
        const newSelected = [...selected, id]
        setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c))
        if (newSelected.length === 2) {
            setMoves(m => m + 1)
            setLocked(true)
            const [a, b] = newSelected.map(sid => cards.find(c => c.id === sid)!)
            if (a.emoji === b.emoji) {
                setTimeout(() => {
                    setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, matched: true } : c))
                    setSelected([])
                    setLocked(false)
                    setWon(prev => {
                        if (!prev) {
                            const allMatched = cards.every(c => newSelected.includes(c.id) || c.matched)
                            return allMatched
                        }
                        return prev
                    })
                }, 500)
            } else {
                setTimeout(() => {
                    setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c))
                    setSelected([])
                    setLocked(false)
                }, 900)
            }
            setSelected([])
        } else {
            setSelected(newSelected)
        }
    }, [cards, selected, locked, ripple])

    // Check win after state update
    useEffect(() => {
        if (cards.length > 0 && cards.every(c => c.matched)) setWon(true)
    }, [cards])

    if (won) return (
        <div style={{ textAlign: 'center', padding: '2rem', animation: 'fadeIn 0.5s ease both' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Beautifully done</p>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{moves} moves</p>
            <button onClick={() => { setCards(init()); setMoves(0); setWon(false); setSelected([]) }}
                className="ripple-host" style={{ padding: '0.7rem 1.5rem', background: 'var(--ink)', color: 'var(--parchment)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                Play again
            </button>
        </div>
    )

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Find the matching pairs</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Moves: {moves}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
                {cards.map(card => (
                    <button
                        key={card.id}
                        onClick={(e) => flip(e, card.id)}
                        className="ripple-host"
                        style={{
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${card.matched ? 'var(--moss)' : 'var(--parchment-mid)'}`,
                            background: card.flipped || card.matched ? 'white' : 'var(--ink)',
                            fontSize: card.flipped || card.matched ? '1.6rem' : '0',
                            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                            transform: card.matched ? 'scale(0.95)' : 'scale(1)',
                            boxShadow: card.matched ? 'none' : 'var(--shadow-soft)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {(card.flipped || card.matched) ? card.emoji : ''}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ── Color Mandalas ─────────────────────────────
function ColorMandalas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const patternsRef = useRef<{ x: number, y: number, r: number, color: string, age: number }[]>([])
    const rafRef = useRef<number>(0)
    const palette = ['#8b7ec8', '#c4736a', '#4a6741', '#5b7fa6', '#d4a53a', '#c8a882', '#d4899a']
    const colorIdxRef = useRef(0)

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY
        colorIdxRef.current = (colorIdxRef.current + 1) % palette.length
        patternsRef.current.push({ x, y, r: 0, color: palette[colorIdxRef.current], age: 0 })
    }, [palette])

    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const resize = () => { canvas.width = canvas.offsetWidth * devicePixelRatio; canvas.height = canvas.offsetHeight * devicePixelRatio }
        resize(); window.addEventListener('resize', resize)

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            // Soft bg
            ctx.fillStyle = '#faf5ed'; ctx.fillRect(0, 0, canvas.width, canvas.height)

            patternsRef.current = patternsRef.current.filter(p => p.age < 120)
            patternsRef.current.forEach(p => {
                p.age++; p.r = p.age * 3
                const alpha = Math.max(0, 1 - p.age / 120)
                const petals = 12
                for (let i = 0; i < petals; i++) {
                    const angle = (i / petals) * Math.PI * 2
                    const px = p.x + Math.cos(angle) * p.r * 0.4
                    const py = p.y + Math.sin(angle) * p.r * 0.4
                    ctx.save()
                    ctx.globalAlpha = alpha * 0.7
                    ctx.fillStyle = p.color
                    ctx.beginPath()
                    ctx.ellipse(px, py, p.r * 0.22 * (1 - p.age / 140), p.r * 0.13, angle, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }
                // Center circle
                ctx.save(); ctx.globalAlpha = alpha
                ctx.fillStyle = p.color
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.15, 0, Math.PI * 2); ctx.fill()
                ctx.restore()
                // Expanding ring
                ctx.save(); ctx.globalAlpha = alpha * 0.35
                ctx.strokeStyle = p.color; ctx.lineWidth = 2
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke()
                ctx.restore()
            })
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
    }, [])

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Tap anywhere to bloom a mandala</p>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                style={{ flex: 1, borderRadius: 'var(--radius-lg)', cursor: 'crosshair', display: 'block', minHeight: 260, boxShadow: 'var(--shadow-soft)' }}
            />
        </div>
    )
}

// ── Ripple Pool ────────────────────────────────
function RipplePool() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ripplesRef = useRef<{ x: number, y: number, r: number, maxR: number, color: string, alpha: number }[]>([])
    const rafRef = useRef<number>(0)
    const colors = ['#5b7fa6', '#8aafc8', '#3a7a9c', '#4a8898', '#6ab4c8']

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
        const x = (e.clientX - rect.left) * scaleX, y = (e.clientY - rect.top) * scaleY
        const maxR = 80 + Math.random() * 80
        // Spawn 3 concentric ripples
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                ripplesRef.current.push({ x, y, r: 0, maxR: maxR * (0.5 + i * 0.4), color: colors[Math.floor(Math.random() * colors.length)], alpha: 0.7 - i * 0.15 })
            }, i * 100)
        }
    }, [colors])

    useEffect(() => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        const resize = () => { canvas.width = canvas.offsetWidth * devicePixelRatio; canvas.height = canvas.offsetHeight * devicePixelRatio }
        resize(); window.addEventListener('resize', resize)

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            // Deep water bg
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
            grad.addColorStop(0, '#c8e8f4'); grad.addColorStop(1, '#7ab8d4')
            ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height)

            ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.01)
            ripplesRef.current.forEach(r => {
                r.r += 1.8; r.alpha *= 0.97
                if (r.r > r.maxR) r.alpha = 0
                ctx.save()
                ctx.globalAlpha = r.alpha
                ctx.strokeStyle = r.color
                ctx.lineWidth = 1.5
                ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.35, 0, 0, Math.PI * 2)
                ctx.stroke()
                ctx.restore()
            })
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
    }, [])

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Tap the water to create ripples</p>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                style={{ flex: 1, borderRadius: 'var(--radius-lg)', cursor: 'crosshair', display: 'block', minHeight: 260, boxShadow: 'var(--shadow-soft)' }}
            />
        </div>
    )
}

// ── Main Games Hub ────────────────────────────
export default function RelaxingGames() {
    const [activeGame, setActiveGame] = useState<GameId | null>(null)
    const ripple = useRipple()

    if (activeGame) {
        const game = GAMES.find(g => g.id === activeGame)!
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'pageEnter 0.35s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <button
                        onClick={() => setActiveGame(null)}
                        style={{ background: 'none', color: 'var(--ink-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
                    >
                        ← Back
                    </button>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--ink)' }}>
                        {game.emoji} {game.name}
                    </span>
                </div>
                <div style={{ flex: 1 }}>
                    {activeGame === 'zen' && <ZenGarden />}
                    {activeGame === 'memory' && <CalmPairs />}
                    {activeGame === 'mandalas' && <ColorMandalas />}
                    {activeGame === 'ripplepool' && <RipplePool />}
                </div>
            </div>
        )
    }

    return (
        <div style={{ animation: 'fadeIn 0.4s ease both' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
                Gentle interactive activities to quiet the mind
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {GAMES.map((game, i) => (
                    <button
                        key={game.id}
                        onClick={(e) => { ripple(e); setActiveGame(game.id) }}
                        className="ripple-host"
                        style={{
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.1rem 1.25rem',
                            textAlign: 'left',
                            boxShadow: 'var(--shadow-soft)',
                            border: '1px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                            cursor: 'pointer',
                            animation: `slideUp 0.4s ease ${i * 0.07}s both`,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-3px)'
                            e.currentTarget.style.borderColor = game.color + '66'
                            e.currentTarget.style.boxShadow = `0 8px 28px ${game.color}33`
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = ''
                            e.currentTarget.style.borderColor = 'transparent'
                            e.currentTarget.style.boxShadow = 'var(--shadow-soft)'
                        }}
                    >
                        <div style={{
                            width: 48, height: 48,
                            background: game.color + '18',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', flexShrink: 0,
                            transition: 'transform var(--transition)',
                        }}>
                            {game.emoji}
                        </div>
                        <div>
                            <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.95rem' }}>{game.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.1rem' }}>{game.tagline}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', color: `${game.color}`, fontSize: '1.3rem', transition: 'transform var(--transition)' }}>›</div>
                    </button>
                ))}
            </div>
        </div>
    )
}