import React from 'react'
import { motion as Motion } from 'framer-motion'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') return v.name || v.company || v.company_name || v.title || JSON.stringify(v)
  return String(v)
}

// Neubrutalist JobCard — same layout, updated colors and button styles
const JobCard = ({ jobData, onLike, onReject }) => {
  const raw = jobData || {}
  const title = safeText(raw.title)
  const company_name = safeText(raw.company_name || raw.company)
  const company_location = safeText(raw.company_location || (raw.company && raw.company.location))
  const description = safeText(raw.description || raw.summary || raw.company?.description)
  const similarity = Number(raw.similarity) || 0
  const company_industry = safeText(raw.company_industry || (raw.company && raw.company.industry))

  const similarityPercentage = Number(similarity) ? Math.round(similarity * 100) : 0

  const cardVariants = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 95, damping: 18 } },
    like: { x: '250%', y: -180, rotate: 18, opacity: 0, transition: { duration: 0.42, ease: 'easeOut' } },
    reject: { x: '-250%', y: -180, rotate: -18, opacity: 0, transition: { duration: 0.42, ease: 'easeOut' } }
  }

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onLike && onLike(jobData)
    } else if (info.offset.x < -100) {
      onReject && onReject(jobData)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-0">
  <Motion.div
        key={jobData?.id}
        initial="initial"
        animate="animate"
        exit={(jobData?.id ?? 0) % 2 === 0 ? 'like' : 'reject'}
        variants={cardVariants}
        className="select-none touch-action-none relative z-10 cursor-grab font-mono w-full bg-white rounded-lg border-4 border-gray-300 shadow-pixel-sm overflow-hidden"
        drag="x"
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      >
  {/* Header */}
  <div className="flex items-center justify-between p-3 sm:p-4 md:p-5" style={{ background: 'var(--primary)' }}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-sm border-2 sm:border-4 border-white flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold shadow-pixel-xs" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(236,254,255,0.9))', color: 'var(--foreground)' }}>
              {String(company_name || '').charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight uppercase truncate" style={{ color: 'var(--primary-foreground)' }}>{company_name}</h3>
              <p className="text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>{company_location || 'Remote'}</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs text-white/90">Match</div>
            <div className="mt-1 inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold" style={{ background: 'linear-gradient(90deg, var(--accent), var(--chart-2))', color: 'var(--foreground)' }}>
              {similarityPercentage}%
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 text-center bg-white">
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <div className="mt-1 text-xs sm:text-sm uppercase font-medium" style={{ color: 'var(--muted-foreground)' }}>{company_industry || 'General'}</div>
        </div>

        {/* Meta grid */}
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-white border-2 sm:border-4 border-gray-300 text-center shadow-inner-pixel-sm">
                <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Experience</div>
              <div className="font-bold mt-1 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>5+ years</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-white border-2 sm:border-4 border-gray-300 text-center shadow-inner-pixel-sm">
              <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Location</div>
              <div className="font-bold mt-1 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>{company_location || 'Remote'}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 border-t-2 sm:border-t-4 border-gray-300 bg-white">
              <div className="h-24 sm:h-32 md:h-36 overflow-y-auto pr-2 text-xs sm:text-sm leading-relaxed font-sans custom-scrollbar" style={{ color: 'var(--foreground)' }}>
            {description || 'No description provided.'}
          </div>
        </div>

        {/* Actions - solid red and green buttons (no gradients) */}
        <div className="flex items-center justify-around p-3 sm:p-4 bg-white border-t-2 sm:border-t-4 border-gray-300">
            <Motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg sm:text-xl"
              onClick={() => onReject && onReject(jobData)}
              aria-label="reject"
              style={{ background: 'var(--destructive)', color: 'var(--primary-foreground)', borderColor: 'rgba(0,0,0,0.06)' }}
            >
              ✕
            </Motion.button>

          <Motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg sm:text-xl"
            onClick={() => onLike && onLike(jobData)}
            aria-label="like"
            style={{ background: 'var(--chart-2)', color: 'var(--primary-foreground)', borderColor: 'rgba(0,0,0,0.06)' }}
          >
            ✓
          </Motion.button>
        </div>
  </Motion.div>
    </div>
  )
}

export default JobCard
