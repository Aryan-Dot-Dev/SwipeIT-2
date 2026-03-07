import React, { useRef, useState } from 'react'
import { motion as Motion, useMotionValue, useTransform } from 'framer-motion'
import { XCircle, Heart, Share2, ExternalLink } from 'lucide-react'

const SHARE_BASE =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://swipe-it-2.vercel.app'
    : window?.location?.origin || 'http://localhost:5173'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') {
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
  if (min && max) return `₹${formatNum(min)} – ${formatNum(max)}`
  if (min) return `₹${formatNum(min)}+`
  return `Up to ₹${formatNum(max)}`
}

const JobCard = ({ jobData, onLike, onReject }) => {
  const raw = jobData || {}
  const title = safeText(raw.title)
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
  const apply_url = raw.apply_url || null
  const jobId = raw.id || raw.job_id || null
  console.log(raw.job_id);

  const similarityPercentage = Number(similarity) ? Math.round(similarity * 100) : 0

  // ── Swipe overlay ──────────────────────────────────────────────
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18])
  const likeOpacity = useTransform(x, [30, 120], [0, 1])
  const rejectOpacity = useTransform(x, [-120, -30], [1, 0])
  const cardScale = useTransform(x, [-200, 0, 200], [0.97, 1, 0.97])

  const [shareToast, setShareToast] = useState(false)

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onLike && onLike(jobData)
    } else if (info.offset.x < -100) {
      onReject && onReject(jobData)
    }
  }

  const handleShare = async (e) => {
    e.stopPropagation()
    const url = jobId ? `${SHARE_BASE}/job/${jobId}` : SHARE_BASE
    const shareData = {
      title: `${title} at ${company_name}`,
      text: `Check out this job on SwipeIt: ${title} at ${company_name}`,
      url,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2200)
      }
    } catch (_) {
      try {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2200)
      } catch (__) { }
    }
  }

  const cardVariants = {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 95, damping: 18 } },
    like: { x: '260%', y: -160, rotate: 20, opacity: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
    reject: { x: '-260%', y: -160, rotate: -20, opacity: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <div className="w-full mx-auto px-1 sm:px-2">
      <Motion.div
        key={jobData?.id}
        initial="initial"
        animate="animate"
        exit={(jobData?.id ?? 0) % 2 === 0 ? 'like' : 'reject'}
        variants={cardVariants}
        style={{ x, rotate, scale: cardScale }}
        className="select-none touch-none relative z-10 cursor-grab w-full rounded-2xl shadow-lg sm:shadow-xl border border-gray-200 bg-white h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] md:h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)] max-h-[520px] sm:max-h-[580px] md:max-h-[650px] flex flex-col overflow-hidden"
        drag="x"
        dragElastic={0.15}
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        {/* ── LIKE stamp overlay ── */}
        <Motion.div
          style={{ opacity: likeOpacity }}
          className="absolute inset-0 z-20 pointer-events-none rounded-2xl bg-green-500/10 flex items-center justify-center"
        >
          <div className="border-4 border-green-500 rounded-xl px-5 py-2 rotate-[-20deg] mt-4 ml-4">
            <span className="text-green-600 font-black text-3xl sm:text-4xl tracking-widest uppercase">Like</span>
          </div>
        </Motion.div>

        {/* ── NOPE stamp overlay ── */}
        <Motion.div
          style={{ opacity: rejectOpacity }}
          className="absolute inset-0 z-20 pointer-events-none rounded-2xl bg-red-500/10 flex items-center justify-center"
        >
          <div className="border-4 border-red-500 rounded-xl px-5 py-2 rotate-[20deg] mt-4 mr-4 self-start ml-auto">
            <span className="text-red-600 font-black text-3xl sm:text-4xl tracking-widest uppercase">Nope</span>
          </div>
        </Motion.div>

        {/* ── Share toast ── */}
        {shareToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg animate-fade-in">
            Link copied to clipboard!
          </div>
        )}

        {/* ── Card Header ── */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Company Avatar */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md flex-shrink-0">
              {String(company_name || '').charAt(0).toUpperCase() || 'C'}
            </div>

            <div className="flex-1 min-w-0">
              {/* Job Title + Share */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight line-clamp-1" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>
                  {title}
                </h2>
                <button
                  onClick={handleShare}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all active:scale-95"
                  title="Share job"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Company + Location + Match */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-gray-700">{company_name}</span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-xs sm:text-sm text-gray-500">{company_location || 'Remote'}</span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                  {similarityPercentage}% Match
                </span>
              </div>

              {/* Meta tags */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] sm:text-xs">
                {job_type && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium capitalize border border-indigo-100">
                    {job_type.replace('-', ' ')}
                  </span>
                )}
                {experience_min != null && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">{experience_min}+ yrs</span>
                  </>
                )}
                {salary_range && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-green-700 font-semibold">{salary_range}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-4 gap-1.5">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Job Description</div>
          <div className="flex-1 overflow-y-auto pr-1 text-xs sm:text-sm leading-relaxed custom-scrollbar p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-700">
            {description}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="p-3 sm:p-4 pt-1 flex-shrink-0 space-y-2">
          {/* Apply on Company Site (shown only if apply_url exists) */}
          {apply_url && (
            <a
              href={apply_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Apply on Company Site
            </a>
          )}

          {/* Like / Reject */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 hover:border-red-400 hover:bg-red-100 shadow-sm transition-all duration-200"
              onClick={() => onReject && onReject(jobData)}
              aria-label="reject"
            >
              <XCircle className="w-4 h-4" />
              Pass
            </Motion.button>

            <Motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold text-green-700 bg-green-50 border-2 border-green-300 hover:border-green-500 hover:bg-green-100 shadow-sm transition-all duration-200"
              onClick={() => onLike && onLike(jobData)}
              aria-label="like"
            >
              <Heart className="w-4 h-4" />
              Like
            </Motion.button>
          </div>
        </div>
      </Motion.div>
    </div>
  )
}

export default JobCard
