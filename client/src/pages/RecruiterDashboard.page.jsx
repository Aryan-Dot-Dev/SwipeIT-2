import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getCandidateDetails, getRecruiterShortlisted } from '@/api/recommendations.api'
import CandidateStack from '@/components/CandidateStack'
import CandidateFilters from '@/components/CandidateFilters'
import AttitudeRadar from '@/components/AttitudeRadar'
import { getRecruiterData } from '@/api/details.api'
import Footer from '@/components/Footer'

import { startConversation, checkConversationExists } from '@/api/chatting.api'
import { getAllMyJobs, deleteJob } from '@/api/recruiter.api.js'
import { swipeRecruiter, addAnonymousCandidate, updateJobStatus, getAnonymousUserIds } from '@/api/swiping.api'

const ChatButton = ({ candidate }) => {
  const [conversationExists, setConversationExists] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const checkExistingConversation = async () => {
      const applicationId = candidate?.match_id
      if (!applicationId) return

      setChecking(true)
      try {
        const exists = await checkConversationExists(applicationId)
        setConversationExists(exists)
      } catch (err) {
        console.error('Failed to check conversation existence:', err)
      } finally {
        setChecking(false)
      }
    }

    checkExistingConversation()
  }, [candidate?.match_id])

  const handleChatClick = async () => {
    try {
      const applicationId = candidate?.match_id
      console.log('RecruiterDashboard: Chat button clicked', candidate)
      console.log('RecruiterDashboard: resolved applicationId', applicationId)
      if (!applicationId) return

      if (conversationExists) {
        // Conversation exists, just open the chat
        const canonicalName = candidate.candidate_name || candidate.name
        window.dispatchEvent(new CustomEvent('app:openChat', {
          detail: { matchId: applicationId, name: canonicalName }
        }))
        console.log('RecruiterDashboard: opened existing chat', { matchId: applicationId, name: canonicalName })
        return
      }

      // Start new conversation
      console.log('candidate', candidate)
      const res = await startConversation(applicationId, `Hi ${candidate.candidate_name || candidate.name || 'there'}, I'd like to chat about a role.`)
      console.log('RecruiterDashboard: startConversation result', res)

      // Attempt to extract canonical match id and name from RPC result
      const returned = res?.data || res || null
      let canonicalMatchId = applicationId
      let canonicalName = candidate.candidate_name || candidate.name
      if (returned) {
        // supabase.rpc may return an array or an object depending on RPC
        const first = Array.isArray(returned) ? returned[0] : returned
        if (first) {
          canonicalMatchId = first.match_id || first.application_id || first.p_match_id || canonicalMatchId
          canonicalName = first.candidate_name || first.name || canonicalName
        }
      }

      // tell app to open the chat UI for this match
      window.dispatchEvent(new CustomEvent('app:openChat', { detail: { matchId: canonicalMatchId, name: canonicalName } }))
      console.log('RecruiterDashboard: dispatched app:openChat', { matchId: canonicalMatchId, name: canonicalName })

      // Update state to reflect that conversation now exists
      setConversationExists(true)
    } catch (err) {
      console.error('RecruiterDashboard: chat action failed', err)
    }
  }

  return (
    <button
      className="btn-primary px-3 py-2 md:py-1 text-sm min-h-[40px] md:min-h-[32px]"
      onClick={handleChatClick}
      disabled={checking}
    >
      {checking ? 'Checking...' : (conversationExists ? 'Chat' : 'Start chat')}
    </button>
  )
}

const RecruiterDashboard = ({ view = 'candidates', onFilterButtonClick }) => {
  const [candidates, setCandidates] = useState([])
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedQuery, setSavedQuery] = useState('')
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [anonymousUserIds, setAnonymousUserIds] = useState([])
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsSearchQuery, setJobsSearchQuery] = useState('')
  const [expandedJobs, setExpandedJobs] = useState(new Set())
  const [candidateFilters, setCandidateFilters] = useState({})
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [recruiterAttitudes, setRecruiterAttitudes] = useState({})
  const [showSwipeHelper, setShowSwipeHelper] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Expose filter modal control to parent
  React.useEffect(() => {
    if (onFilterButtonClick) {
      // Wrap in a function to prevent React from calling it immediately
      onFilterButtonClick(() => () => setShowMobileFilters(true))
    }
  }, [onFilterButtonClick])

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const data = await getCandidateDetails()
          if (mounted) {
            console.log('#sym:getCandidateDetails', data)
            setCandidates(Array.isArray(data) ? data : [])
          }
        } catch {
          console.error('#sym:getCandidateDetails failed')
        }
      })()
    return () => { mounted = false }
  }, [])

  // load saved list when entering saved view
  useEffect(() => {
    if (view !== 'saved') return
    let mounted = true
    setSaved([])
      ; (async () => {
        try {
          setSavedLoading(true)
          const resp = await getRecruiterShortlisted()
          if (!mounted) return
          setSaved(Array.isArray(resp) ? resp : [])
          
          // Fetch anonymous user IDs
          try {
            const anonymousIds = await getAnonymousUserIds()
            if (!mounted) return
            setAnonymousUserIds(Array.isArray(anonymousIds) ? anonymousIds.map(item => item.user_id) : [])
          } catch (err) {
            console.error('Failed to fetch anonymous user IDs:', err)
            setAnonymousUserIds([])
          }
        } catch (err) {
          console.error('#sym:getRecruiterShortlisted failed', err)
        } finally { if (mounted) setSavedLoading(false) }
      })()
    return () => { mounted = false }
  }, [view])

  // load jobs for dashboard view
  useEffect(() => {
    if (view !== 'dashboard') return
    let mounted = true
    setJobs([])
      ; (async () => {
        try {
          setJobsLoading(true)
          const resp = await getAllMyJobs()
          if (!mounted) return
          setJobs(Array.isArray(resp) ? resp : [])
        } catch (err) {
          console.error('#sym:getAllMyJobs failed', err)
        } finally { if (mounted) setJobsLoading(false) }
      })()
    return () => { mounted = false }
  }, [view])

  // Filter candidates based on filters
  useEffect(() => {
    // Start with all candidates
    let filtered = [...candidates]

    // Apply individual filters
    if (candidateFilters.skills && candidateFilters.skills.length > 0) {
      filtered = filtered.filter(candidate => {
        const candidateSkills = candidate.candidate_profile?.skills || []
        return candidateFilters.skills.some(skill => candidateSkills.includes(skill))
      })
    }

    if (candidateFilters.experienceMin || candidateFilters.experienceMax) {
      filtered = filtered.filter(candidate => {
        const experience = candidate.candidate_profile?.experience_years || 0
        const min = candidateFilters.experienceMin ? parseInt(candidateFilters.experienceMin) : 0
        const max = candidateFilters.experienceMax ? parseInt(candidateFilters.experienceMax) : Infinity
        return experience >= min && experience <= max
      })
    }

    if (candidateFilters.location) {
      filtered = filtered.filter(candidate => {
        const city = candidate.candidate_profile?.city || ''
        const state = candidate.candidate_profile?.state || ''
        const country = candidate.candidate_profile?.country || ''
        const fullLocation = [city, state, country].filter(Boolean).join(', ')
        return fullLocation.toLowerCase().includes(candidateFilters.location.toLowerCase())
      })
    }

    if (candidateFilters.jobTitle) {
      filtered = filtered.filter(candidate => {
        const jobTitle = candidate.job_title || ''
        return jobTitle.toLowerCase().includes(candidateFilters.jobTitle.toLowerCase())
      })
    }

    // Apply match percentage filter using candidate_profile.similarity
    if (candidateFilters.minMatchPercentage && candidateFilters.minMatchPercentage > 0) {
      filtered = filtered.filter(candidate => {
        // Get similarity from candidate_profile.similarity
        const similarity = candidate.candidate_profile?.similarity

        // If no similarity score available, include the candidate (don't filter out)
        if (similarity === null || similarity === undefined) {
          return true // Include candidates without scores
        }

        // Convert similarity to percentage (assuming it's 0-1 or 0-100)
        const matchPercentage = similarity > 1 ? similarity : similarity * 100

        return matchPercentage >= candidateFilters.minMatchPercentage
      })
    }

    // Log filtering results for debugging
    if (candidateFilters.minMatchPercentage && candidateFilters.minMatchPercentage > 0) {
      console.log(`Filtering: ${candidates.length} candidates -> ${filtered.length} after applying ${candidateFilters.minMatchPercentage}% minimum match`)
    }

    setFilteredCandidates(filtered)
  }, [candidates, candidateFilters])

  // Toggle job details expansion
  const toggleJobDetails = (jobId) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  // Status change handler
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus)
      // Update local state
      setJobs(prevJobs => prevJobs.map(job => 
        job.job_id === jobId ? { ...job, status: newStatus } : job
      ))
      console.log(`Job ${jobId} status updated to: ${newStatus}`)
    } catch (err) {
      console.error('Failed to update job status:', err)
      alert('Failed to update job status. Please try again.')
    }
  }

  // Delete job handler
  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"?\n\nThis will permanently delete:\n• The job posting\n• All applications\n• All matches\n• All related messages\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteJob(jobId);
      // Remove the job from the local state
      setJobs(prevJobs => prevJobs.filter(j => j.job_id !== jobId));
      // Remove from expanded set if it was expanded
      setExpandedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
      alert('Job deleted successfully!');
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  // When job details are expanded, fetch the recruiter's attitude score (if available) and cache it
  useEffect(() => {
    if (!jobs || jobs.length === 0) return
    const toFetch = []
    Array.from(expandedJobs).forEach(jobId => {
      const job = jobs.find(j => j.job_id === jobId)
      if (!job) return
      const rid = job.recruiter_id || job.recruiter?.user_id || job.recruiter_user_id || job.posted_by || job.posted_by_user_id || null
      if (!rid) return
      if (recruiterAttitudes[rid] !== undefined) return
      toFetch.push({ rid, jobId })
    })

    if (toFetch.length === 0) return

    toFetch.forEach(async ({ rid }) => {
      try {
        const rec = await getRecruiterData(rid)
        const attitude = rec?.attitude_score || rec?.user_metadata?.attitude_score || rec?.attitude || null
        setRecruiterAttitudes(prev => ({ ...prev, [rid]: attitude }))
      } catch (err) {
        console.error('Failed to fetch recruiter data for', rid, err)
        setRecruiterAttitudes(prev => ({ ...prev, [rid]: null }))
      }
    })
  }, [expandedJobs, jobs, recruiterAttitudes])

  // Handle candidate filter changes
  const handleCandidateFiltersChange = (filters) => {
    setCandidateFilters(filters)
  };

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => {
    if (!jobsSearchQuery) return true;
    const query = jobsSearchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query) ||
      job.required_skills?.some(skill => skill.toLowerCase().includes(query))
    );
  });

  // (no pagination — RPC returns full saved list)
  // if chat or settings is active, let the central Dashboard render them and avoid rendering
  // the RecruiterDashboard spacer (which adds mt-6 and causes a gap)
  if (view === 'chat' || view === 'settings') return null

  return (
    <div
      className="px-3 md:px-6 lg:px-8 w-full min-h-screen flex flex-col bg-gradient-to-b from-white via-[#f7f2ff] to-white"
      style={{ '--primary': '#7C3AED', '--secondary': '#FF49A0', '--primary-foreground': '#ffffff' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]">Recruiter workspace</p>
          <h1 className="text-xl md:text-2xl font-semibold text-[color:var(--foreground)]">Find, shortlist, and chat faster</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/70 border border-[color:var(--border)]">Live</span>
        </div>
      </div>

      {view === 'candidates' && (
        <div className="flex-1 flex md:flex-row flex-col relative">
          {/* Mobile top bar */}
          <div className="lg:hidden mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between bg-white/85 backdrop-blur border border-[color:var(--border)] rounded-2xl p-3 shadow-sm">
              <div>
                <p className="text-xs text-[color:var(--muted-foreground)]">Candidates</p>
                <p className="text-lg font-semibold text-[color:var(--foreground)]">{filteredCandidates.length} matches</p>
              </div>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white text-sm font-semibold shadow-[0_10px_30px_-14px_rgba(124,58,237,0.65)] active:scale-95 transition"
              >
                Filters
              </button>
            </div>
            {showSwipeHelper && filteredCandidates.length > 0 && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/90 border border-[color:var(--border)] rounded-full text-xs text-[color:var(--foreground)] shadow-sm">
                  <span className="text-red-500 font-semibold">← Left reject</span>
                  <span className="text-[color:var(--muted-foreground)]">|</span>
                  <span className="text-green-600 font-semibold">Right shortlist →</span>
                  <button onClick={() => setShowSwipeHelper(false)} className="ml-1 text-[color:var(--muted-foreground)]" aria-label="Dismiss helper">×</button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:flex lg:flex-col flex-shrink-0 overflow-y-auto relative p-[2px] rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500" style={{ width: '344px', height: 'calc(100vh - 120px)' }}>
            <div className="bg-white rounded-2xl flex-1 overflow-y-auto">
              <div className="p-5">
                <CandidateFilters
                  candidates={candidates}
                  onFiltersChange={handleCandidateFiltersChange}
                  anonymousMode={anonymousMode}
                  onAnonymousModeChange={setAnonymousMode}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white/85 backdrop-blur border border-[color:var(--border)] rounded-3xl shadow-[0_16px_60px_-28px_rgba(111,59,216,0.45)]">
            {/* Swipe Helper Instruction - Integrated at the top */}
            {showSwipeHelper && filteredCandidates.length > 0 && (
              <div className="hidden md:flex justify-center pt-4 pb-2 px-4">
                <div className="inline-flex items-center gap-3 px-4 md:px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full shadow-md border-2 border-purple-200 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-red-600">Swipe left to reject</span>
                  </div>
                  <div className="h-8 w-px bg-gradient-to-b from-purple-300 to-pink-300"></div>
                  <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                    <span className="text-green-600">Swipe right to accept</span>
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setShowSwipeHelper(false)}
                    className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/50 transition-all duration-200 flex-shrink-0"
                    aria-label="Dismiss helper"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Stack */}
            <div className="flex-1 relative pt-2 pb-20 md:pb-2">
              <CandidateStack
                initialCandidates={filteredCandidates}
                onShortlist={async (c) => {
                  try {
                    console.log('shortlist', c)
                    // Shortlist the candidate using the swipe API
                    const applicationId = c.application_id || c.applicationId || c.match_id
                    if (applicationId) {
                      await swipeRecruiter(applicationId, true)
                      console.log('Candidate shortlisted:', applicationId)
                      
                      // If anonymous mode is on, add to anonymous_candidates table
                      if (anonymousMode) {
                        const candidateId = c.user_id || c.candidate_id || c.id
                        if (candidateId) {
                          try {
                            await addAnonymousCandidate(candidateId)
                            console.log('Candidate added to anonymous list:', candidateId)
                          } catch (err) {
                            console.error('Failed to add anonymous candidate:', err)
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.error('Failed to shortlist candidate:', err)
                  }
                }}
                onReject={async (c) => {
                  try {
                    console.log('reject', c)
                    const applicationId = c.application_id || c.applicationId || c.match_id
                    if (applicationId) {
                      await swipeRecruiter(applicationId, false)
                      console.log('Candidate rejected:', applicationId)
                    }
                  } catch (err) {
                    console.error('Failed to reject candidate:', err)
                  }
                }}
                onView={(c) => console.log('view', c)}
                anonymousMode={anonymousMode}
              />
            </div>
          </div>

          {/* Mobile Filters Modal - Rendered via Portal */}
          {showMobileFilters && createPortal(
            <div className="fixed inset-0 z-[999999] lg:hidden">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowMobileFilters(false)}
              />
              
              {/* Modal Content */}
              <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="text-lg font-semibold text-gray-900">Filter Candidates</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                    aria-label="Close filters"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Scrollable Filters */}
                <div className="flex-1 overflow-y-auto p-4">
                  <CandidateFilters
                    candidates={candidates}
                    onFiltersChange={handleCandidateFiltersChange}
                    anonymousMode={anonymousMode}
                    onAnonymousModeChange={setAnonymousMode}
                  />
                </div>
                
                {/* Apply Button */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {view === 'saved' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <input value={savedQuery} onChange={(e) => setSavedQuery(e.target.value)} placeholder="Search saved candidates, job, company" className="px-3 py-2 border rounded w-full" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {saved.length === 0 && !savedLoading && <div className="text-sm text-gray-500">No shortlisted candidates yet.</div>}
            {saved.map((s) => {
              const candidateUserId = s.user_id || s.candidate_id || s.id
              const isAnonymous = anonymousUserIds.includes(candidateUserId)
              
              return (
                <div key={s.application_id || s.id || JSON.stringify(s)} className="p-3 bg-white rounded shadow-sm border">
                  <div className="flex items-center gap-3">
                    <img src={s.candidate_profile_img || s.profile_img} alt={s.candidate_name || s.name} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold">{s.candidate_name || s.name || 'Candidate'}</div>
                        {isAnonymous && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            Shortlisted Anonymously
                          </span>
                        )}
                        {s.candidate_profile?.similarity !== null && s.candidate_profile?.similarity !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {Math.round(s.candidate_profile.similarity > 1 ? s.candidate_profile.similarity : s.candidate_profile.similarity * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{s.job_title || s.position || ''} {s.company_name ? `• ${s.company_name}` : ''}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <ChatButton candidate={s} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {savedLoading && <div className="text-sm text-gray-500 mt-2">Loading…</div>}
        </div>
      )}

      {view === 'dashboard' && (
        <div className="space-y-6">
          {/* Overview Metrics - show 2x2 on mobile/tablet, 4 on large */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Jobs Card */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_14px_50px_-28px_rgba(111,59,216,0.4)] border border-[color:var(--border)] recruiter-glass">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-lg recruiter-cta flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Jobs</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{jobs.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Applications Card */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_14px_50px_-28px_rgba(111,59,216,0.4)] border border-[color:var(--border)] recruiter-glass">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-lg recruiter-cta flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Applications</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {jobs.reduce((sum, job) => sum + (job.application_counts?.applied || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shortlisted Card */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_14px_50px_-28px_rgba(111,59,216,0.4)] border border-[color:var(--border)] recruiter-glass">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-lg recruiter-cta flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Shortlisted</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {jobs.reduce((sum, job) => sum + (job.application_counts?.shortlisted || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Likes Card */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_14px_50px_-28px_rgba(111,59,216,0.4)] border border-[color:var(--border)] recruiter-glass">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-2 sm:p-3 rounded-lg recruiter-cta flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Likes</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      {jobs.reduce((sum, job) => sum + (job.swipe_stats?.likes || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Application Status Pie Chart */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_16px_50px_-30px_rgba(111,59,216,0.45)] border border-[color:var(--border)]">
              <h3 className="text-lg font-semibold mb-4">Application Status Overview</h3>
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600">
                  Applied: {jobs.reduce((sum, job) => sum + (job.application_counts?.applied || 0), 0)} |
                  Shortlisted: {jobs.reduce((sum, job) => sum + (job.application_counts?.shortlisted || 0), 0)} |
                  Rejected: {jobs.reduce((sum, job) => sum + (job.application_counts?.rejected || 0), 0)}
                </div>
              </div>
              <div className="flex items-center justify-center">
                {(() => {
                  const totalApplied = jobs.reduce((sum, job) => sum + (job.application_counts?.applied || 0), 0);
                  const totalShortlisted = jobs.reduce((sum, job) => sum + (job.application_counts?.shortlisted || 0), 0);
                  const totalRejected = jobs.reduce((sum, job) => sum + (job.application_counts?.rejected || 0), 0);
                  const total = totalApplied + totalShortlisted + totalRejected;

                  if (total === 0) {
                    return <div className="text-center text-gray-500 py-8">No application data yet</div>;
                  }

                  // Simple approach: use divs with background colors and widths
                  const appliedPercent = (totalApplied / total) * 100;
                  const shortlistedPercent = (totalShortlisted / total) * 100;
                  const rejectedPercent = (totalRejected / total) * 100;

                  return (
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-gray-200">
                      <div className="flex h-full">
                        {totalApplied > 0 && (
                          <div
                            className="bg-[color:var(--primary)] flex items-center justify-center text-white text-xs font-bold"
                            style={{ width: `${appliedPercent}%` }}
                          >
                            {appliedPercent > 10 ? `${Math.round(appliedPercent)}%` : ''}
                          </div>
                        )}
                        {totalShortlisted > 0 && (
                          <div
                            className="bg-[color:var(--secondary)] flex items-center justify-center text-white text-xs font-bold"
                            style={{ width: `${shortlistedPercent}%` }}
                          >
                            {shortlistedPercent > 10 ? `${Math.round(shortlistedPercent)}%` : ''}
                          </div>
                        )}
                        {totalRejected > 0 && (
                          <div
                            className="bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                            style={{ width: `${rejectedPercent}%` }}
                          >
                            {rejectedPercent > 10 ? `${Math.round(rejectedPercent)}%` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex justify-center mt-4 space-x-4">
                {(() => {
                  const totalApplied = jobs.reduce((sum, job) => sum + (job.application_counts?.applied || 0), 0);
                  const totalShortlisted = jobs.reduce((sum, job) => sum + (job.application_counts?.shortlisted || 0), 0);
                  const totalRejected = jobs.reduce((sum, job) => sum + (job.application_counts?.rejected || 0), 0);
                  const total = totalApplied + totalShortlisted + totalRejected;
                  return (
                    <>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[color:var(--primary)] rounded-full mr-2"></div>
                        <span className="text-sm">Applied ({total > 0 ? ((totalApplied / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-[color:var(--secondary)] rounded-full mr-2"></div>
                        <span className="text-sm">Shortlisted ({total > 0 ? ((totalShortlisted / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm">Rejected ({total > 0 ? ((totalRejected / total) * 100).toFixed(1) : 0}%)</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Jobs Performance Bar Chart */}
            <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_16px_50px_-30px_rgba(111,59,216,0.45)] border border-[color:var(--border)]">
              <h3 className="text-lg font-semibold mb-4">Shortlisted per Job</h3>
              <div className="space-y-2">
                {jobs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No jobs data</div>
                ) : (
                  jobs.slice(0, 5).map((job) => {
                    const maxShortlisted = Math.max(...jobs.map(j => j.application_counts?.shortlisted || 0));
                    const width = maxShortlisted > 0 ? ((job.application_counts?.shortlisted || 0) / maxShortlisted) * 100 : 0;
                    return (
                      <div key={job.job_id} className="flex items-center">
                        <div className="w-28 md:w-32 text-sm truncate mr-4">{job.title}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-[color:var(--secondary)] h-4 rounded-full"
                            style={{ width: `${width}%` }}
                          ></div>
                        </div>
                        <div className="ml-2 text-sm font-medium">{job.application_counts?.shortlisted || 0}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Applicants */}
          <div className="bg-white/85 backdrop-blur p-4 sm:p-5 rounded-2xl shadow-[0_16px_50px_-30px_rgba(111,59,216,0.45)] border border-[color:var(--border)]">
            <h3 className="text-lg font-semibold mb-4">Recent Applicants</h3>
            {(() => {
              const allApplicants = jobs.flatMap(job =>
                (job.applicants || []).map(applicant => ({ ...applicant, jobTitle: job.title }))
              ).sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at)).slice(0, 10);

              return allApplicants.length === 0 ? (
                <div className="text-sm text-gray-500">No recent applicants.</div>
              ) : (
                <div className="space-y-3">
                  {allApplicants.map((applicant) => (
                    <div key={applicant.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <img src={applicant.profile_img} alt={applicant.name} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <div className="font-medium">{applicant.name}</div>
                          <div className="text-sm text-gray-600">{applicant.jobTitle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{new Date(applicant.applied_at).toLocaleDateString()}</div>
                        <span className={`px-2 py-1 rounded-full text-xs ${applicant.status === 'applied' ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : applicant.status === 'shortlisted' ? 'bg-[color:var(--secondary)]/10 text-[color:var(--secondary)]' : 'bg-red-100 text-red-800'}`}>
                          {applicant.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Jobs List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">All Jobs ({filteredJobs.length})</h3>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search jobs by title, location, or skills..."
                  value={jobsSearchQuery}
                  onChange={(e) => setJobsSearchQuery(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[color:var(--border)] bg-white/85 backdrop-blur shadow-sm focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>
            {jobsLoading && <div className="text-sm text-gray-500">Loading jobs…</div>}
            {!jobsLoading && filteredJobs.length === 0 && jobsSearchQuery && <div className="text-sm text-gray-500">No jobs match your search.</div>}
            {!jobsLoading && filteredJobs.length === 0 && !jobsSearchQuery && <div className="text-sm text-gray-500">No jobs found.</div>}
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <div key={job.job_id} className="p-4 sm:p-5 bg-white/90 backdrop-blur rounded-2xl shadow-[0_16px_46px_-32px_rgba(111,59,216,0.45)] border border-[color:var(--border)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-[color:var(--foreground)] truncate">{job.title}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/70 border border-[color:var(--border)] text-[color:var(--muted-foreground)]">{job.job_type || 'Full-time'}</span>
                        </div>
                        <p className="text-sm text-[color:var(--muted-foreground)] truncate">{job.location || 'Remote / Flexible'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.job_id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] ${
                            job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            job.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            job.status === 'closed' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                          title="Change job status"
                        >
                          <option value="active">🟢 Active</option>
                          <option value="paused">🟡 Paused</option>
                          <option value="closed">🔴 Closed</option>
                          <option value="filled">🔵 Filled</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleJobDetails(job.job_id)}
                            className="px-3 py-1 text-xs font-semibold text-white rounded-full whitespace-nowrap transition-colors hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #8a2be2, #ff69b4)' }}
                          >
                            {expandedJobs.has(job.job_id) ? 'Hide' : 'Details'}
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.job_id, job.title)}
                            className="p-2 text-white rounded-full transition-colors hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #dc143c, #ff6b6b)' }}
                            title="Delete job posting"
                            aria-label="Delete job"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[color:var(--border)] shadow-sm">
                        <span className="font-semibold text-[color:var(--foreground)]">Swipes</span>
                        <span className="text-green-600">{job.swipe_stats.likes} likes</span>
                        <span className="text-gray-500">{job.swipe_stats.dislikes} dislikes</span>
                      </div>
                      <div className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">
                        Created: {new Date(job.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {/* Expanded Details Section */}
                  {expandedJobs.has(job.job_id) && (
                    <div className="border-t pt-4 mt-4">
                      {/* Move description, salary, skills and stats into expanded details for mobile/tablet */}
                      {job.description && (
                        <div className="mb-4 text-sm text-gray-700">
                          <h4 className="text-md font-medium mb-2">Job description</h4>
                          <div className="text-sm leading-relaxed">{job.description}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="text-md font-medium mb-3">Application Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total Applications:</span>
                              <span className="text-sm font-medium">{job.application_counts?.applied || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Shortlisted:</span>
                              <span className="text-sm font-medium text-yellow-600">{job.application_counts?.shortlisted || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rejected:</span>
                              <span className="text-sm font-medium text-red-600">{job.application_counts?.rejected || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Conversion Rate:</span>
                              <span className="text-sm font-medium">
                                {job.application_counts?.applied > 0
                                  ? ((job.application_counts?.shortlisted / job.application_counts?.applied) * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-md font-medium mb-3">Job details & stats</h4>
                          <div className="space-y-2">
                            {job.salary_min && job.salary_max && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Salary:</span> {job.salary_min} - {job.salary_max} {job.currency}
                              </div>
                            )}
                            {job.required_skills && job.required_skills.length > 0 && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Skills:</span> {job.required_skills.join(', ')}
                              </div>
                            )}
                            <div className="mt-2">
                              <div className="text-sm text-gray-600">Likes: <span className="font-medium text-[color:var(--primary)]">{job.swipe_stats?.likes || 0}</span></div>
                              <div className="text-sm text-gray-600">Dislikes: <span className="font-medium text-red-600">{job.swipe_stats?.dislikes || 0}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Recruiter profile / Attitude chart (if available) */}
                        <div>
                          <h4 className="text-md font-medium mb-3">Recruiter profile</h4>
                          <div className="text-sm text-gray-600">
                            {(() => {
                              const rid = job.recruiter_id || job.recruiter?.user_id || job.recruiter_user_id || job.posted_by || job.posted_by_user_id || null
                              const att = rid ? recruiterAttitudes[rid] : null
                              if (!rid) return <div className="text-sm text-gray-500">No recruiter data available.</div>
                              if (!att) return <div className="text-sm text-gray-500">No attitude data for this recruiter.</div>
                              return (
                                <div className="flex items-center gap-4">
                                  <div><AttitudeRadar data={att} size={160} levels={4} /></div>
                                  <div className="text-sm text-[color:var(--foreground)]">
                                    <div className="font-semibold">Recruiter</div>
                                    <div className="text-xs text-gray-500">Attitude profile</div>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* All Applicants */}
                      <div>
                        <h4 className="text-md font-medium mb-3">All Applicants ({job.applicants?.length || 0})</h4>
                        {!job.applicants || job.applicants.length === 0 ? (
                          <div className="text-sm text-gray-500">No applicants yet.</div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {job.applicants.map((applicant) => (
                              <div key={applicant.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <img src={applicant.profile_img} alt={applicant.name} className="w-10 h-10 rounded-full object-cover" />
                                  <div>
                                    <div className="font-medium">{applicant.name}</div>
                                    <div className="text-sm text-gray-600">{applicant.email}</div>
                                    <div className="text-xs text-gray-500">{applicant.experience_years} years experience</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500 mb-1">
                                    Applied: {new Date(applicant.applied_at).toLocaleDateString()}
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${applicant.status === 'applied' ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' :
                                      applicant.status === 'shortlisted' ? 'bg-[color:var(--secondary)]/10 text-[color:var(--secondary)]' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {applicant.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Basic Applicants Preview (when collapsed) */}
                  {!expandedJobs.has(job.job_id) && job.applicants && job.applicants.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium mb-2">Recent Applicants</h4>
                      <div className="space-y-2">
                        {job.applicants.slice(0, 3).map((applicant) => (
                          <div key={applicant.application_id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <img src={applicant.profile_img} alt={applicant.name} className="w-8 h-8 rounded-full object-cover" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{applicant.name}</div>
                              <div className="text-xs text-gray-500">{applicant.email}</div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {applicant.experience_years} yrs exp
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${applicant.status === 'applied' ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : applicant.status === 'shortlisted' ? 'bg-[color:var(--secondary)]/10 text-[color:var(--secondary)]' : 'bg-red-100 text-red-800'}`}>
                              {applicant.status}
                            </span>
                          </div>
                        ))}
                        {job.applicants.length > 3 && (
                          <div className="text-sm text-gray-500 text-center">
                            +{job.applicants.length - 3} more applicants • Click "Show Details" to view all
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat is rendered centrally by Dashboard to avoid duplicates */}

      {/* Footer - Sticks to bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}

export default RecruiterDashboard
