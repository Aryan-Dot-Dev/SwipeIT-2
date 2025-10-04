import React, { useEffect, useState } from 'react'
import { getCandidateDetails, getRecruiterShortlisted } from '@/api/recommendations.api'
import CandidateStack from '@/components/CandidateStack'
import CandidateFilters from '@/components/CandidateFilters'
import AttitudeRadar from '@/components/AttitudeRadar'
import { getRecruiterData } from '@/api/details.api'

import { startConversation, checkConversationExists } from '@/api/chatting.api'
import { getAllMyJobs } from '@/api/recruiter.api.js'

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

const RecruiterDashboard = ({ view = 'dashboard' }) => {
  const [candidates, setCandidates] = useState([])
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [savedQuery, setSavedQuery] = useState('')
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsSearchQuery, setJobsSearchQuery] = useState('')
  const [expandedJobs, setExpandedJobs] = useState(new Set())
  const [candidateFilters, setCandidateFilters] = useState({})
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [recruiterAttitudes, setRecruiterAttitudes] = useState({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
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
    ;(async () => {
      try {
        setSavedLoading(true)
        const resp = await getRecruiterShortlisted()
        if (!mounted) return
        setSaved(Array.isArray(resp) ? resp : [])
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
    ;(async () => {
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
  // if chat is active, let the central Dashboard render Chat and avoid rendering
  // the RecruiterDashboard spacer (which adds mt-6 and causes a gap)
  if (view === 'chat') return null

  return (
  <div className="px-3 md:px-6 lg:px-8 w-full" style={{ '--primary': '#7C3AED', '--secondary': '#FF49A0', '--primary-foreground': '#ffffff' }}>
      <div className="mb-4 flex items-center justify-between">
        <div></div>
      </div>

      {view === 'candidates' && (
        <div className="flex-1 flex md:flex-row flex-col relative">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-96 flex-shrink-0 bg-white border-r border-gray-200 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <CandidateFilters
              candidates={candidates}
              onFiltersChange={handleCandidateFiltersChange}
              anonymousMode={anonymousMode}
              onAnonymousModeChange={setAnonymousMode}
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Filter Toggle - could be added later if needed */}
            
            {/* Candidate Stack */}
            <div className="flex-1">
              <CandidateStack 
                initialCandidates={filteredCandidates} 
                onShortlist={(c) => console.log('shortlist', c)} 
                onReject={(c) => console.log('reject', c)} 
                onView={(c) => console.log('view', c)} 
                anonymousMode={anonymousMode} 
              />
            </div>
          </div>
        </div>
      )}

            {view === 'saved' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <input value={savedQuery} onChange={(e) => setSavedQuery(e.target.value)} placeholder="Search saved candidates, job, company" className="px-3 py-2 border rounded w-full" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {saved.length === 0 && !savedLoading && <div className="text-sm text-gray-500">No shortlisted candidates yet.</div>}
            {saved.map((s) => (
              <div key={s.application_id || s.id || JSON.stringify(s)} className="p-3 bg-white rounded shadow-sm border">
                <div className="flex items-center gap-3">
                  <img src={s.candidate_profile_img || s.profile_img} alt={s.candidate_name || s.name} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{s.candidate_name || s.name || 'Candidate'}</div>
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
            ))}
          </div>

          {savedLoading && <div className="text-sm text-gray-500 mt-2">Loading…</div>}
        </div>
      )}

      {view === 'dashboard' && (
        <div>          
          {/* Overview Metrics - show 2x2 on mobile/tablet, 4 on large */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border recruiter-glass">
              <div className="flex items-center">
                <div className="p-2 rounded-lg recruiter-cta">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border recruiter-glass">
              <div className="flex items-center">
                <div className="p-2 rounded-lg recruiter-cta">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.reduce((sum, job) => sum + (job.application_counts?.applied || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border recruiter-glass">
              <div className="flex items-center">
                <div className="p-2 rounded-lg recruiter-cta">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.reduce((sum, job) => sum + (job.application_counts?.shortlisted || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border recruiter-glass">
              <div className="flex items-center">
                <div className="p-2 rounded-lg recruiter-cta">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.reduce((sum, job) => sum + (job.swipe_stats?.likes || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Application Status Pie Chart */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
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
            <div className="bg-white p-4 rounded-lg shadow-sm border">
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
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
            {jobsLoading && <div className="text-sm text-gray-500">Loading jobs…</div>}
            {!jobsLoading && filteredJobs.length === 0 && jobsSearchQuery && <div className="text-sm text-gray-500">No jobs match your search.</div>}
            {!jobsLoading && filteredJobs.length === 0 && !jobsSearchQuery && <div className="text-sm text-gray-500">No jobs found.</div>}
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <div key={job.job_id} className="p-4 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.location} • {job.job_type || 'Full-time'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'active' ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                      </span>
                      <button
                        onClick={() => toggleJobDetails(job.job_id)}
                        className="btn-secondary px-3 py-1 text-sm"
                      >
                        {expandedJobs.has(job.job_id) ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                  </div>
                  {/* On mobile/tablet show minimal info; full details are in the expanded section */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3 md:gap-0">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Swipes:</span> {job.swipe_stats.likes} likes, {job.swipe_stats.dislikes} dislikes
                    </div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(job.created_at).toLocaleDateString()}
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    applicant.status === 'applied' ? 'bg-[color:var(--primary)]/10 text-[color:var(--primary)]' : 
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
    </div>
  )
}

export default RecruiterDashboard
