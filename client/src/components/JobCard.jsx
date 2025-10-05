import React from 'react'
import { motion as Motion } from 'framer-motion'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') return v.name || v.company || v.company_name || v.title || JSON.stringify(v)
  return String(v)
}

const formatSalary = (min, max) => {
  if (!min && !max) return null
  const formatNum = (num) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
    return num.toString()
  }
  if (min && max) return `₹${formatNum(min)} - ${formatNum(max)}`
  if (min) return `₹${formatNum(min)}+`
  return `Up to ₹${formatNum(max)}`
}

// Futuristic JobCard with glassmorphism and neon gradients
const JobCard = ({ jobData, onLike, onReject }) => {
  const raw = jobData || {}
  const title = safeText(raw.title)
  const company_name = safeText(raw.company?.name || raw.company_name || raw.company)
  const company_location = safeText(raw.company?.location || raw.company_location || raw.location)
  const description = safeText(raw.description || raw.summary || raw.company?.description)
  const similarity = Number(raw.similarity) || 0
  const company_industry = safeText(raw.company?.industry || raw.company_industry)
  const job_type = safeText(raw.job_type || raw.type)
  const experience_min = raw.experience_min != null ? raw.experience_min : null
  const salary_range = formatSalary(raw.salary_min, raw.salary_max)
  const company_website = raw.company?.website

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
        className="select-none touch-action-none relative z-10 cursor-grab font-mono w-full glass-panel rounded-xl shadow-glass overflow-hidden border border-white/20"
        drag="x"
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      >
  {/* Header */}
  <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--secondary)]/20 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-white/90 to-white/70 rounded-lg border border-white/30 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold shadow-lg" style={{ color: 'var(--foreground)' }}>
              {String(company_name || '').charAt(0) || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>{company_name}</h3>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--muted-foreground)' }}>{company_location || 'Remote'}</p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-xs text-white/70">Match</div>
            <div className="mt-1 inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-[color:var(--secondary)] to-[color:var(--primary)] text-white shadow-lg">
              {similarityPercentage}%
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 text-center bg-white/5 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate" style={{ color: 'var(--foreground)' }}>{title}</h2>
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm uppercase font-medium" style={{ color: 'var(--muted-foreground)' }}>{company_industry || 'General'}</span>
            {job_type && (
              <>
                <span className="text-gray-400">•</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                  {job_type.replace('-', ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col">
            {/* First row: Experience and Location side by side */}
            <div className="grid grid-cols-2">
              {experience_min != null && (
                <div className="p-2 sm:p-3 rounded-lg glass-panel text-center shadow-glass border border-white/20">
                  <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Experience</div>
                  <div className="font-bold mt-1 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>{experience_min}+ years</div>
                </div>
              )}
              
              <div className={`p-2 sm:p-3 rounded-lg glass-panel text-center shadow-glass border border-white/20 ${experience_min == null ? 'col-span-2' : ''}`}>
                <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Location</div>
                <div className="font-bold mt-1 text-sm sm:text-base truncate" style={{ color: 'var(--foreground)' }}>{company_location || 'Remote'}</div>
              </div>
            </div>
            
            {/* Second row: Salary full width if available */}
            {salary_range && (
              <div className="p-2 sm:p-3 rounded-lg glass-panel text-center shadow-glass border border-white/20">
                <div className="text-xs uppercase" style={{ color: 'var(--muted-foreground)' }}>Salary Range</div>
                <div className="font-bold mt-1 text-sm sm:text-base" style={{ color: 'var(--foreground)' }}>{salary_range}</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-3 sm:px-4 pt-2 pb-3 sm:pb-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="h-24 sm:h-32 md:h-36 overflow-y-auto pr-2 text-xs sm:text-sm leading-relaxed font-sans custom-scrollbar" style={{ color: 'var(--foreground)' }}>
            {description || 'No description provided.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-around p-3 sm:p-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
            <Motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full btn-secondary font-bold text-lg sm:text-xl shadow-lg"
              onClick={() => onReject && onReject(jobData)}
              aria-label="reject"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </Motion.button>

          <Motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full btn-primary font-bold text-lg sm:text-xl shadow-lg"
            onClick={() => onLike && onLike(jobData)}
            aria-label="like"
          >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </Motion.button>
        </div>
  </Motion.div>
    </div>
  )
}

export default JobCard
