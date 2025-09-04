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
  const skills = (c.candidate_profile.skills);
  // const attitudeScore = safe(c.candidate_profile.attitude_score)
  const company = safe(c.company_name || (c.company && c.company.name))
  const status = safe(c.application_status)
  // const notes = safe(c.profile_summary || c.summary || c.bio)
  const fmt = d => {
    try { return d ? new Date(d).toLocaleDateString() : '' } catch { return '' }
  }
  const appliedAt = fmt(c.applied_at || c.appliedAt)
  const email = safe(c.candidate_profile.email || c.email)

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
        className="w-full max-w-[420px] md:max-w-[520px] lg:max-w-[620px] cursor-grab"
      >
        <div className="relative z-10 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
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
              className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border border-gray-100 shadow-sm hover:scale-105 transition-transform"
            >
              {/* Use the public help.png icon instead of inline SVG */}
              <img src="/help.png" alt="Assistant" className="w-6 h-6 object-contain" loading="lazy" />
            </button>
          </div>
          {/* Compact header: centered avatar, name, email, status */}
          <div className="flex flex-col items-center gap-3 p-5" style={{ background: 'linear-gradient(180deg,var(--primary),transparent)' }}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center bg-white overflow-hidden border-2">
              {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : <div className="text-3xl font-bold text-[color:var(--primary)]">{String(name || 'U').charAt(0)}</div>}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold" style={{ color: 'var(--primary-foreground)' }}>{anonymous ? 'Anonymous candidate' : name}</h3>
              {!anonymous && <div className="text-xs mt-1 text-[color:var(--muted-foreground)] truncate max-w-[360px]">{email}</div>}
              {anonymous && <div className="text-xs mt-1 text-[color:var(--muted-foreground)] truncate max-w-[360px]">Profile summary only</div>}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs px-3 py-1 rounded-full font-medium bg-gray-800 text-white border border-gray-700 shadow-sm">
                {status || 'New'}
              </div>
              <span className="h-5 w-px bg-gray-200 rounded mx-1" />
              <div className="text-sm text-gray-600">
                Applied: <span className="font-semibold text-gray-900">{appliedAt}</span>
              </div>
            </div>

          </div>

          {/* Body: job/company and summary */}
          <div className="px-4 py-4">
            <div className="text-sm text-[color:var(--muted-foreground)] mb-2 text-center">Applied for <strong className="text-[color:var(--foreground)]">{jobTitle}</strong> at <strong className="text-[color:var(--foreground)]">{company}</strong></div>

            <div className="text-sm leading-relaxed text-[color:var(--foreground)] h-28 overflow-y-auto pr-2 custom-scrollbar px-2">
              {notes || 'No profile summary available.'}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 px-2">
              {skills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-white text-slate-700 px-3 py-1.5 rounded-full border border-slate-300 text-xs font-medium shadow-sm hover:bg-slate-50 hover:shadow hover:border-slate-400 transition-all"
                >
                  {skill}
                </div>
              ))}
            </div>

          </div>

          {/* Actions: horizontal, centered */}
    <div className="px-4 pb-4">
  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 mt-2">
    {/* View Button */}
    <button
      onClick={() => { setShowDetails(true); onView && onView(c) }}
      className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200 active:scale-[0.98] transition-all shadow group font-semibold"
      aria-label="View details"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="h-4 w-4 text-blue-500 group-hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-.77 2.593-2.947 4.858-6.122 6.25" />
        </svg>
        View
      </span>
    </button>

    {/* Shortlist Button */}
    <button
      onClick={() => onShortlist && onShortlist(c)}
      className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200 active:scale-[0.98] transition-all shadow-md group"
      aria-label="Shortlist"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="h-4 w-4 text-white group-hover:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
        Shortlist
      </span>
    </button>

    {/* Reject Button */}
    <button
      onClick={() => onReject && onReject(c)}
      className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 active:scale-[0.98] transition-all shadow-md group"
      aria-label="Reject"
    >
      <span className="inline-flex items-center gap-2">
        <svg className="h-4 w-4 text-white group-hover:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="absolute inset-0 bg-opacity-40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative bg-white backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold">{safe(c.candidate_profile?.name || name)}</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">×</button>
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
                        <div key={i} className="text-xs px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{s}</div>
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
                                <div key={trait} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded">
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
                      <pre className="text-xs text-[color:var(--muted-foreground)] overflow-x-auto bg-gray-50 p-2 rounded mt-1">{JSON.stringify(c.candidate_profile.resumes, null, 2)}</pre>
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
          <div className="relative bg-white border border-white/10 rounded-lg shadow-xl max-w-md w-full p-4">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">AI Summary</h4>
              <div className="flex items-center gap-2">
                {geminiLoading && <div className="text-sm text-gray-500">Thinking…</div>}
                <button onClick={() => setShowGeminiModal(false)} className="text-gray-500 hover:text-gray-700">×</button>
              </div>
            </div>
            <div className="mt-3 text-sm text-[color:var(--foreground)] max-h-48 overflow-y-auto">
              {geminiSummary ? (
                <div className="whitespace-pre-wrap">{geminiSummary}</div>
              ) : (
                <div className="text-gray-500">No summary available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateCard
