import React from 'react'
import { motion as Motion } from 'framer-motion'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') {
    // Extract string properties from objects to avoid rendering objects directly
    const str = v.name || v.company_name || v.company || v.title || v.location || ''
    return typeof str === 'string' ? str : ''
  }
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
  // Ensure we extract company name properly, never pass the whole company object
  const company_name = safeText(
    raw.company?.name || 
    raw.company_name || 
    (typeof raw.company === 'string' ? raw.company : null)
  ) || 'Company'
  const company_location = safeText(
    raw.company?.location || 
    raw.company_location || 
    raw.location
  )
  const description = safeText(
    raw.description || 
    raw.summary || 
    (typeof raw.company?.description === 'string' ? raw.company.description : null)
  ) || 'No description provided.'
  const similarity = Number(raw.similarity) || 0
  const job_type = safeText(raw.job_type || raw.type)
  const experience_min = raw.experience_min != null ? raw.experience_min : null
  const salary_range = formatSalary(raw.salary_min, raw.salary_max)

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
        className="select-none touch-action-none relative z-10 cursor-grab w-full glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white/20 bg-white/95 backdrop-blur-md min-h-[600px] sm:min-h-[550px]"
        drag="x"
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98, cursor: 'grabbing' }}
      >
        {/* Compact Header - All key info in 2-3 lines */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {/* Company Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
              {String(company_name || '').charAt(0) || 'C'}
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Job Title */}
              <h2 className="text-lg font-bold text-gray-900 break-words line-clamp-1">
                {title}
              </h2>

              {/* Row 2: Company, Location, Match */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-medium text-gray-700 break-words">
                  {company_name}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {company_location || 'Remote'}
                </span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm">
                  {similarityPercentage}% Match
                </span>
              </div>

              {/* Row 3: Meta info */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-600">
                {job_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium capitalize">
                    {job_type.replace('-', ' ')}
                  </span>
                )}
                {experience_min != null && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{experience_min}+ yrs exp</span>
                  </>
                )}
                <>
                  <span className="text-gray-400">•</span>
                  <span className={`font-medium ${salary_range ? 'text-green-600' : 'text-gray-500'}`}>
                    {salary_range || 'Unpaid'}
                  </span>
                </>
              </div>
            </div>
          </div>
        </div>

        {/* Description - Maximized Space */}
        <div className="p-4">
          <div className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-500">Job Description</div>
          <div className="h-64 sm:h-56 overflow-y-auto pr-2 text-sm leading-relaxed custom-scrollbar p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-700">
            {description || 'No description provided.'}
          </div>
        </div>

        {/* Premium Action Buttons */}
        <div className="grid grid-cols-2 gap-3 p-4 pt-0">
          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="py-2.5 px-4 rounded-lg text-sm font-semibold text-red-600 bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 shadow-sm transition-all duration-200"
            onClick={() => onReject && onReject(jobData)}
            aria-label="reject"
          >
            ✗ Reject
          </Motion.button>

          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="py-2.5 px-4 rounded-lg text-sm font-semibold text-green-600 bg-white border-2 border-green-200 hover:border-green-300 hover:bg-green-50 shadow-sm transition-all duration-200"
            onClick={() => onLike && onLike(jobData)}
            aria-label="like"
          >
            ✓ Like
          </Motion.button>
        </div>
  </Motion.div>
    </div>
  )
}

export default JobCard
