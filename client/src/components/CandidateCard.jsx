import React, { useRef, useState } from 'react'
import { callGemini } from '@/utils/geminiInstance'
import { motion as Motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import AttitudeRadar from './AttitudeRadar'

const safe = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') return v.name || v.title || v.company_name || JSON.stringify(v)
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
  const company = safe(c.company_name || (c.company && c.company.name))
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
    <div className="w-full flex justify-center px-2">
      <Motion.div
        ref={cardRef}
        animate={controls}
        style={{ x, rotate }}
        drag={isSwiped ? false : "x"}
        onDragEnd={handleDragEnd}
        className="w-full max-w-[380px] md:max-w-[460px] lg:max-w-[540px] cursor-grab"
      >
        <div className="relative z-10 glass-panel overflow-hidden">
          {/* Gemini icon badge (top-right) */}
          <div className="absolute top-3 right-3">
            <button
              aria-label="Open Gemini"
              title="Ask AI about him"
              onClick={async (e) => {
                e.stopPropagation()
                if (geminiLoading) return
                try {
                  setGeminiLoading(true)
                  try {
                    window.dispatchEvent(new CustomEvent('#sym:openGemini', { detail: { candidate: c } }))
                  } catch { /* ignore */ }
                  onGemini && onGemini(c)
                  // Call Gemini to summarize the profile (uses prompts.summarize_profile)
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
              className="w-10 h-10 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20 shadow-sm hover:scale-105 transition-all backdrop-blur-sm"
            >
              {/* Use the public help.png icon instead of inline SVG */}
              <img src="/help.png" alt="Assistant" className="w-6 h-6 object-contain" loading="lazy" />
            </button>
          </div>
          {/* Compact header: centered avatar, name, email, status */}
          <div className="flex flex-col items-center gap-3 p-5 recruiter-glass bg-gradient-to-b from-[color:var(--primary)]/30 to-[color:var(--secondary)]/12">
            {/* Match percentage badge - top left */}
            {c.candidate_profile?.similarity !== null && c.candidate_profile?.similarity !== undefined && (
              <div className="absolute top-3 left-3">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-[color:var(--primary)]/20">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-bold text-[color:var(--primary)]">
                      {Math.round(c.candidate_profile.similarity > 1 ? c.candidate_profile.similarity : c.candidate_profile.similarity * 100)}% Match
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center bg-white/10 overflow-hidden border border-white/10 backdrop-blur-sm">
              {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : <div className="text-3xl font-bold text-[color:var(--primary-foreground)]">{String(name || 'U').charAt(0)}</div>}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold truncate max-w-[320px]" style={{ color: 'var(--primary-foreground)' }}>{anonymous ? 'Anonymous candidate' : name}</h3>
              {!anonymous && <div className="text-xs mt-1 text-[color:var(--muted-foreground)] truncate max-w-[320px]">{email}</div>}
              {anonymous && <div className="text-xs mt-1 text-[color:var(--muted-foreground)] truncate max-w-[360px]">Profile summary only</div>}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs px-3 py-1 rounded-full font-medium bg-[color:var(--primary)]/8 text-[color:var(--primary)] border border-[color:var(--primary)]/14 backdrop-blur-sm">
                {status || 'New'}
              </div>
              <span className="h-5 w-px bg-white/30 rounded mx-1" />
              <div className="text-sm text-white/80">
                Applied: <span className="font-semibold text-white">{appliedAt}</span>
              </div>
            </div>

          </div>

          {/* Body: job/company and summary */}
          <div className="px-4 py-4">
            <div className="text-sm text-[color:var(--muted-foreground)] mb-2 text-center">Applied for <strong className="text-[color:var(--foreground)]">{jobTitle}</strong> at <strong className="text-[color:var(--foreground)]">{company}</strong></div>

            <div className="text-sm leading-relaxed text-[color:var(--foreground)] h-24 overflow-y-auto pr-2 custom-scrollbar px-2 whitespace-pre-wrap break-words">
              {notes || 'No profile summary available.'}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 px-2">
              {(skills || []).map((skill, index) => (
                <div
                  key={index}
                  className="bg-[color:var(--primary)]/6 text-[color:var(--primary)] px-3 py-1 rounded-full border border-[color:var(--primary)]/12 text-xs font-medium transition-all"
                >
                  {skill}
                </div>
              ))}
            </div>

          </div>

          {/* Actions: horizontal, centered */}
    <div className="px-4 pb-4">
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-2">
    {/* View Button */}
    <button
      onClick={() => { setShowDetails(true); onView && onView(c) }}
      className="btn-secondary w-full sm:w-auto"
      aria-label="View details"
    >
      <span className="inline-flex items-center gap-1">
        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-.77 2.593-2.947 4.858-6.122 6.25" />
        </svg>
        View Details
      </span>
    </button>

    {/* View Resume Button */}
    <button
      onClick={() => {
        if (!resumeUrl) return
        try { window.open(resumeUrl, '_blank', 'noopener,noreferrer') } catch { window.location.href = resumeUrl }
      }}
      disabled={!resumeUrl}
      title={resumeUrl ? 'Open resume in new tab' : 'No resume available'}
      className={`btn-secondary w-full sm:w-auto ${!resumeUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label="View resume"
    >
      <span className="inline-flex items-center gap-1">
        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
        </svg>
        Resume
      </span>
    </button>

    {/* Shortlist Button */}
    <button
      onClick={() => onShortlist && onShortlist(c)}
      className="btn-primary recruiter-cta w-full sm:w-auto"
      aria-label="Shortlist"
    >
      <span className="inline-flex items-center gap-1">
        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
        Shortlist
      </span>
    </button>

    {/* Reject Button */}
    <button
      onClick={() => onReject && onReject(c)}
      className="btn-primary recruiter-cta w-full sm:w-auto"
      aria-label="Reject"
    >
      <span className="inline-flex items-center gap-1">
        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Reject
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowGeminiModal(false)} />
          <div className="relative glass-panel max-w-md w-full p-4">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">AI Summary</h4>
              <div className="flex items-center gap-2">
                {geminiLoading && <div className="loading-bar w-16 h-2 rounded"></div>}
                <button onClick={() => setShowGeminiModal(false)} className="text-white hover:text-gray-300">×</button>
              </div>
            </div>
            <div className="mt-3 text-sm text-[color:var(--foreground)] max-h-48 overflow-y-auto">
              {geminiSummary ? (
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
