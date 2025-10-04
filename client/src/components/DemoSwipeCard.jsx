import React, { useState, useRef, useEffect } from 'react'

export default function DemoSwipeCard({ onSwipe = () => {} }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const startRef = useRef({ x: 0 })
  const elRef = useRef(null)


  const onPointerDown = (e) => {
    if (animating) return
    setIsDragging(true)
    startRef.current.x = e.clientX - pos.x
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    const x = e.clientX - startRef.current.x
    setPos({ x, y: 0 })
  }

  const endDrag = () => {
    setIsDragging(false)
    const threshold = 120
    if (pos.x > threshold) {
      // swipe right
      animateOff(1000, () => onSwipe('right'))
    } else if (pos.x < -threshold) {
      // swipe left
      animateOff(-1000, () => onSwipe('left'))
    } else {
      // snap back
      setPos({ x: 0, y: 0 })
    }
  }

  const animateOff = (toX, cb) => {
    setAnimating(true)
    setPos({ x: toX, y: 0 })
    setTimeout(() => {
      // reset after animation
      setPos({ x: 0, y: 0 })
      setAnimating(false)
      cb?.()
    }, 400)
  }

  // stabilize endDrag reference for the global pointerup listener
  const endDragRef = useRef(null)
  endDragRef.current = endDrag

  useEffect(() => {
    const handlePointerUp = () => {
      if (!isDragging) return
      endDragRef.current?.()
    }
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isDragging])

  const rotate = Math.max(Math.min(pos.x / 26, 8), -8)

  return (
    <div className="relative w-full">
      <div
        ref={elRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { /* handled on window */ }}
        onPointerCancel={() => { /* handled on window */ }}
        className={`w-full cursor-grab`}
        style={{
          transform: `translateX(${pos.x}px) rotate(${rotate}deg)`,
          transition: isDragging || animating ? 'transform 0.15s linear' : 'transform 0.3s cubic-bezier(.2,.8,.2,1)'
        }}
      >
  <div className="relative z-10 bg-[color:var(--card)] rounded-xl border border-[color:var(--border)] shadow-md overflow-hidden" style={{ backdropFilter: 'blur(6px)' }}>
          {/* Top-right helper icon (like CandidateCard) */}
          <div className="absolute top-3 right-3">
            <button
              aria-label="Demo assistant"
              title="Demo assistant"
              onClick={(e) => { e.stopPropagation(); console.log('Demo assistant clicked') }}
              className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center border border-gray-100 shadow-sm hover:scale-105 transition-transform"
            >
              <img src="/help.png" alt="Assistant" className="w-5 h-5 object-contain" loading="lazy" />
            </button>
          </div>

          {/* Header: avatar, name, email/status */}
          <div className="flex flex-col items-center gap-3 p-5" style={{ background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(255,73,160,0.06))' }}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center bg-[color:var(--card)] overflow-hidden border border-[color:var(--border)]/60">
              <div className="text-3xl font-bold text-[color:var(--primary)]">D</div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold" style={{ color: 'var(--primary-foreground)' }}>Demo Candidate</h3>
              <div className="text-xs mt-1 text-[color:var(--muted-foreground)]">demo@example.com</div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs px-3 py-1 rounded-full font-medium bg-[color:var(--primary)]/12 text-[color:var(--primary)] border border-[color:var(--primary)]/20 shadow-sm">New</div>
              <span className="h-5 w-px bg-gray-200 rounded mx-1" />
              <div className="text-sm text-gray-600">Applied: <span className="font-semibold text-gray-900">Today</span></div>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <div className="text-sm text-[color:var(--muted-foreground)] mb-2 text-center">Applied for <strong className="text-[color:var(--foreground)]">Frontend Engineer</strong> at <strong className="text-[color:var(--foreground)]">Acme</strong></div>

            <div className="text-sm leading-relaxed text-[color:var(--foreground)] h-24 overflow-y-auto pr-2 custom-scrollbar px-2">
              Passionate frontend engineer with experience building React apps and delightful UIs. Familiar with Node.js and cloud deployments.
            </div>

            <div className="mt-6 flex flex-wrap gap-2 px-2">
              {['React','Node','TypeScript'].map((skill, i) => (
                <div key={i} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--foreground)', border: '1px solid rgba(255,255,255,0.03)' }}>{skill}</div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mt-2">
              <button
                onClick={() => console.log('Demo view')}
                className="flex-1 px-3 py-2 rounded-lg text-sm border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--foreground)] hover:bg-[color:var(--card)]/95 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] active:scale-[0.98] transition-all group font-semibold"
              >
                View
              </button>
              <button
                onClick={() => animateOff(1000, () => onSwipe('right'))}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white recruiter-cta hover:scale-[1.01] focus:outline-none active:scale-[0.98] transition-all shadow-sm group"
              >
                Shortlist
              </button>
              <button
                onClick={() => animateOff(-1000, () => onSwipe('left'))}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-[0.98] transition-all shadow-md group"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
