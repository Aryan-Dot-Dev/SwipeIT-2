import React, { useRef, useState } from 'react'
import { callGemini } from '@/utils/geminiInstance'
import { motion as Motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import AttitudeRadar from './AttitudeRadar'

const safe = v => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  if (typeof v === 'object') {
    // Extract string properties from objects to avoid rendering objects directly
    const str = v.name || v.title || v.company_name || v.location || ''
    return typeof str === 'string' ? str : ''
  }
  return String(v)
}

const CandidateCard = ({ candidate, onShortlist, onReject, onView, onGemini, anonymous = false }) => {
  const c = candidate || {}
  const name = safe(c.candidate_profile.name || c.name || c.full_name)
  // const email = safe(c.candidate_profile.email)
  const avatar = safe(c.candidate_profile_img)
  const notes = safe(c.candidate_profile.bio);
  const jobTitle = safe(c.job_title || c.title);
  const skills = Array.isArray(c?.candidate_profile?.skills)
    ? c.candidate_profile.skills
    : Array.isArray(c?.skills)
      ? c.skills
      : []
  // const attitudeScore = safe(c.candidate_profile.attitude_score)
  const company = safe(c.company_name || (c.company?.name) || (typeof c.company === 'string' ? c.company : null)) || 'Company'
  const status = safe(c.application_status)
  // const notes = safe(c.profile_summary || c.summary || c.bio)
  const fmt = d => {
    try { return d ? new Date(d).toLocaleDateString() : '' } catch { return '' }
  }
  const appliedAt = fmt(c.applied_at || c.appliedAt)
  const email = safe(c.candidate_profile.email || c.email)

  // helper to find a usable resume URL (first match)
  const findResumeUrl = (candidateRecord) => {
    const r = candidateRecord?.candidate_profile?.resume ||  null
    if (!r) return null
    if (typeof r === 'string' && r.length > 5) return r
    if (Array.isArray(r)) {
      for (const item of r) {
        if (!item) continue
        if (typeof item === 'string' && item.length > 5) return item
        if (item.url) return item.url
        if (item.file_url) return item.file_url
        if (item.public_url) return item.public_url
        if (item.path && typeof item.path === 'string' && item.path.startsWith('http')) return item.path
      }
      return null
    }
    if (typeof r === 'object') {
      return r.url || r.file_url || r.public_url || (typeof r.path === 'string' && r.path.startsWith('http') ? r.path : null)
    }
    return null
  }

  const resumeUrl = findResumeUrl(c)

  // drag / swipe behavior
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-12, 12])
  const cardRef = useRef(null)
  const controls = useAnimation()
  const [isSwiped, setIsSwiped] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiSummary, setGeminiSummary] = useState(null)
  const [showGeminiModal, setShowGeminiModal] = useState(false)

  // reset swipe state when candidate changes
  React.useEffect(() => {
    setIsSwiped(false)
    try { controls.set({ x: 0, rotate: 0, opacity: 1 }) } catch { /* ignore */ }
  }, [candidate, controls])

  const handleDragEnd = async (e, info) => {
    const offset = info.offset.x || 0
    // threshold for swipe (distance only)
    const likeThreshold = 120

    // If user moved past threshold horizontally, animate off-screen immediately
    if (offset > likeThreshold && !isSwiped) {
      setIsSwiped(true)
      await controls.start({ x: 1000, rotate: 30, opacity: 0, transition: { duration: 0.28 } })
      onShortlist && onShortlist(c)
      return
    }

    if (offset < -likeThreshold && !isSwiped) {
      setIsSwiped(true)
      await controls.start({ x: -1000, rotate: -30, opacity: 0, transition: { duration: 0.28 } })
      onReject && onReject(c)
      return
    }

    // not past threshold: spring back to center
    await controls.start({ x: 0, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } })
  }

  return (
    <div className="flex justify-center px-2">
      <Motion.div
        ref={cardRef}
        animate={controls}
        style={{ x, rotate }}
        drag={isSwiped ? false : "x"}
        onDragEnd={handleDragEnd}
        className="w-full max-w-[380px] md:max-w-[460px] lg:max-w-[520px] cursor-grab"
      >
        <div className="relative z-10 glass-panel overflow-hidden">
          {/* Premium compact header */}
          <div className="relative bg-gradient-to-br from-[color:var(--primary)]/20 via-[color:var(--primary)]/10 to-transparent backdrop-blur-sm border-b border-white/10">
            <div className="px-5 py-4">
              {/* Top row: Avatar and Info */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-white/10 overflow-hidden border border-white/20 shadow-lg backdrop-blur-sm">
                  {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-2xl font-bold text-[color:var(--primary-foreground)]">
                      {String(name || 'U').charAt(0)}
                    </div>
                  )}
                </div>

                {/* Compact Info - Full width on mobile */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-base sm:text-lg font-semibold text-[color:var(--primary-foreground)] break-words">
                    {anonymous ? 'Anonymous candidate' : name}
                  </h3>
                  <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5 break-words">
                    {!anonymous ? email : 'Profile summary only'}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                    {c.candidate_profile?.similarity !== null && c.candidate_profile?.similarity !== undefined && (
                      <>
                        <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--primary)]">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {Math.round(c.candidate_profile.similarity > 1 ? c.candidate_profile.similarity : c.candidate_profile.similarity * 100)}% Match
                        </span>
                        <span className="h-3 w-px bg-white/30" />
                      </>
                    )}
                    <span className="text-[color:var(--muted-foreground)]">
                      {status || 'New'}
                    </span>
                    {appliedAt && (
                      <>
                        <span className="h-3 w-px bg-white/30" />
                        <span className="text-[color:var(--muted-foreground)]">{appliedAt}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons - Hidden on mobile, shown on md and larger screens */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {/* View Details Icon */}
                  <button
                    onClick={() => { setShowDetails(true); onView && onView(c) }}
                    className="w-9 h-9 rounded-lg bg-white hover:bg-white/90 border border-white/30 flex items-center justify-center transition-all hover:scale-105 shadow-md group"
                    aria-label="View details"
                    title="View full details"
                  >
                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  {/* Gemini AI button */}
                  <button
                    aria-label="Ask AI"
                    title="Get AI insights"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (geminiLoading) return
                      try {
                        setGeminiLoading(true)
                        try {
                          window.dispatchEvent(new CustomEvent('#sym:openGemini', { detail: { candidate: c } }))
                        } catch { /* ignore */ }
                        onGemini && onGemini(c)
                        const summary = await callGemini('summarize_profile', c)
                        setGeminiSummary(summary)
                        setShowGeminiModal(true)
                      } catch (err) {
                        console.error('Gemini summary failed', err)
                        setGeminiSummary('AI summary failed. Please try again.')
                        setShowGeminiModal(true)
                      } finally {
                        setGeminiLoading(false)
                      }
                    }}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 p-2 flex items-center justify-center border border-white/20 shadow-sm hover:scale-105 transition-all backdrop-blur-sm"
                  >
                    <img src="/help.png" alt="AI" className="w-full h-full object-contain" loading="lazy" />
                  </button>
                </div>
              </div>

              {/* Mobile action buttons row - Only shown on mobile and small tablets */}
              <div className="flex md:hidden items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => { setShowDetails(true); onView && onView(c) }}
                  className="w-9 h-9 rounded-lg bg-white hover:bg-white/90 border border-white/30 flex items-center justify-center transition-all hover:scale-105 shadow-md"
                  aria-label="View details"
                  title="View full details"
                >
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                <button
                  aria-label="Ask AI"
                  title="Get AI insights"
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (geminiLoading) return
                    try {
                      setGeminiLoading(true)
                      try {
                        window.dispatchEvent(new CustomEvent('#sym:openGemini', { detail: { candidate: c } }))
                      } catch { /* ignore */ }
                      onGemini && onGemini(c)
                      const summary = await callGemini('summarize_profile', c)
                      setGeminiSummary(summary)
                      setShowGeminiModal(true)
                    } catch (err) {
                      console.error('Gemini summary failed', err)
                      setGeminiSummary('AI summary failed. Please try again.')
                      setShowGeminiModal(true)
                    } finally {
                      setGeminiLoading(false)
                    }
                  }}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 p-2 flex items-center justify-center border border-white/20 shadow-sm hover:scale-105 transition-all backdrop-blur-sm"
                >
                  <img src="/help.png" alt="AI" className="w-full h-full object-contain" loading="lazy" />
                </button>
              </div>
            </div>

            {/* Remove the absolute positioned AI button that was causing overlap */}
            <div className="absolute top-4 right-5 z-20 hidden">
              <button
                aria-label="Ask AI"
                title="Get AI insights"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (geminiLoading) return
                  try {
                    setGeminiLoading(true)
                    try {
                      window.dispatchEvent(new CustomEvent('#sym:openGemini', { detail: { candidate: c } }))
                    } catch { /* ignore */ }
                    onGemini && onGemini(c)
                    const summary = await callGemini('summarize_profile', c)
                    setGeminiSummary(summary)
                    setShowGeminiModal(true)
                  } catch (err) {
                    console.error('Gemini summary failed', err)
                    setGeminiSummary('AI summary failed. Please try again.')
                    setShowGeminiModal(true)
                  } finally {
                    setGeminiLoading(false)
                  }
                }}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 p-2 flex items-center justify-center border border-white/20 shadow-sm hover:scale-105 transition-all backdrop-blur-sm"
              >
                <img src="/help.png" alt="AI" className="w-full h-full object-contain" loading="lazy" />
              </button>
            </div>
          </div>

          {/* Body: Description focus */}
          <div className="px-5 py-5">
            <div className="text-xs text-[color:var(--muted-foreground)] mb-3">
              <strong className="text-[color:var(--foreground)]">{jobTitle}</strong> at <strong className="text-[color:var(--foreground)]">{company}</strong>
            </div>

            {/* Large description area */}
            <div className="text-sm leading-relaxed text-[color:var(--foreground)] h-40 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap break-words">
              {notes || 'No profile summary available.'}
            </div>

            {/* Skills */}
            {skills && skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-[color:var(--primary)]/8 text-[color:var(--primary)] px-2.5 py-1 rounded-lg border border-[color:var(--primary)]/15 text-xs font-medium"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium action buttons */}
          <div className="px-5 pb-5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-center gap-3">
              {/* Reject Button */}
              <button
                onClick={() => onReject && onReject(c)}
                className="flex-1 max-w-[140px] px-4 py-2.5 rounded-xl bg-gradient-to-br from-red-500/90 to-red-600/90 hover:from-red-500 hover:to-red-600 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border border-red-400/20"
                aria-label="Reject"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </span>
              </button>

              {/* Resume Button */}
              <button
                onClick={() => {
                  if (!resumeUrl) return
                  try { window.open(resumeUrl, '_blank', 'noopener,noreferrer') } catch { window.location.href = resumeUrl }
                }}
                disabled={!resumeUrl}
                title={resumeUrl ? 'View resume' : 'No resume available'}
                className={`flex-1 max-w-[140px] px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg transition-all border ${
                  resumeUrl
                    ? 'bg-white hover:bg-white/90 text-black border-white/20 hover:scale-105 active:scale-95'
                    : 'bg-white/20 text-gray-400 border-white/10 cursor-not-allowed'
                }`}
                aria-label="View resume"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume
                </span>
              </button>

              {/* Shortlist Button */}
              <button
                onClick={() => onShortlist && onShortlist(c)}
                className="flex-1 max-w-[140px] px-4 py-2.5 rounded-xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] hover:from-purple-500 hover:to-pink-500 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 border border-white/20"
                aria-label="Shortlist"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Shortlist
                </span>
              </button>
            </div>
          </div>

        </div>
      </Motion.div>
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative glass-panel max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">{safe(c.candidate_profile?.name || name)}</h3>
              <button onClick={() => setShowDetails(false)} className="text-white hover:text-gray-300">×</button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-[color:var(--foreground)]">
              {c.candidate_profile ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-[color:var(--muted-foreground)]">{safe(c.candidate_profile.email)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-[color:var(--muted-foreground)]">{safe(c.candidate_profile.phone)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-[color:var(--muted-foreground)]">{safe(c.candidate_profile.city)}, {safe(c.candidate_profile.state)}, {safe(c.candidate_profile.country)}</div>
                  </div>
                  <div>
                    <div className="font-medium">Experience</div>
                    <div className="text-[color:var(--muted-foreground)]">{safe(c.candidate_profile.experience_years)} years</div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium">Bio</div>
                    <div className="text-[color:var(--muted-foreground)]">{safe(c.candidate_profile.bio)}</div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium">Skills</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(Array.isArray(c.candidate_profile.skills) ? c.candidate_profile.skills : []).map((s, i) => (
                        <div key={i} className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-sm">{s}</div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="font-medium">Attitude Score</div>
                    <div className="mt-3">
                      {c.candidate_profile.attitude_score ? (
                        <div className="flex items-center gap-4">
                          <AttitudeRadar data={c.candidate_profile.attitude_score} size={220} levels={4} />
                          <div className="flex-1">
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(c.candidate_profile.attitude_score).map(([trait, val]) => (
                                <div key={trait} className="flex items-center justify-between px-3 py-2 bg-white/10 rounded backdrop-blur-sm">
                                  <span className="text-xs text-[color:var(--muted-foreground)]">{trait}</span>
                                  <span className="font-medium">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No attitude data</div>
                      )}
                    </div>
                  </div>

                  {c.candidate_profile.resumes && (
                    <div className="col-span-2">
                      <div className="font-medium">Resumes</div>
                      <pre className="text-xs text-[color:var(--muted-foreground)] overflow-x-auto bg-white/10 p-2 rounded mt-1 backdrop-blur-sm">{JSON.stringify(c.candidate_profile.resumes, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[color:var(--muted-foreground)]">No profile details available.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {showGeminiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !geminiLoading && setShowGeminiModal(false)} />
          <div className="relative glass-panel max-w-md w-full p-4">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">AI Summary</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowGeminiModal(false)} className="text-white hover:text-gray-300" disabled={geminiLoading}>×</button>
              </div>
            </div>
            <div className="mt-3 text-sm text-[color:var(--foreground)] max-h-48 overflow-y-auto">
              {geminiLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="loading-bar w-full h-2 rounded"></div>
                  <p className="text-[color:var(--muted-foreground)] text-xs">AI is analyzing the candidate profile...</p>
                </div>
              ) : geminiSummary ? (
                <div className="whitespace-pre-wrap">{geminiSummary}</div>
              ) : (
                <div className="text-[color:var(--muted-foreground)]">No summary available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateCard
