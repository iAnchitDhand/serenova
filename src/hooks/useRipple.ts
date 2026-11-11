import { useCallback } from 'react'

export function useRipple(color = 'rgba(200,168,130,0.4)') {
    const createRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height) * 1.5
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        const ripple = document.createElement('span')
        ripple.className = 'ripple-circle'
        ripple.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x}px; top:${y}px;
      background:${color};
    `
        el.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
    }, [color])

    return createRipple
}