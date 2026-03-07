import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { getJobRecommendations } from '@/api/recommendations.api'
import { swipeRightCandidate } from '@/api/swiping.api'
import { fetchAppliedJobs } from '@/api/candidate.api'
import JobStack from '@/components/JobStack'
import SavedJobsComponent from '@/components/SavedJobs'
import SavedJobsPage from '@/components/SavedJobsPage'
import ResumeDetails from '@/components/ResumeDetails'
import { getResume } from '@/api/candidate.api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Footer from '@/components/Footer'

// small helper to read cookies (used to pass access_token into API calls when available)
function readCookie(name) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

// Helper to safely extract text from values that might be objects
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

const CandidateDashboard = ({ userId, currentUser, savedJobs, setSavedJobs, onOpenSaved = () => {}, initialTab = 'jobs', filters, setFilters }) => {
  const [resumeObj, setResumeObj] = useState(null)
  const [activeTab, setActiveTab] = useState('jobs') // 'jobs' or 'resume'
  const [initialTabSet, setInitialTabSet] = useState(false)
  const [showSavedJobsModal, setShowSavedJobsModal] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [showSwipeHelper, setShowSwipeHelper] = useState(true)

  // Set initial tab based on prop
  React.useEffect(() => {
    if (initialTab && !initialTabSet) {
      console.log('Setting initial tab to:', initialTab)
      setActiveTab(initialTab)
      setInitialTabSet(true)
    }
  }, [initialTab, initialTabSet])

  useEffect(() => {
    if (!userId) return
    let mounted = true
    // Determine if current user looks like a recruiter; if so, do not fetch resume
    const isRecruiter = Boolean(
      currentUser?.role === 'recruiter' ||
      String(currentUser?.user_metadata?.role || '').toLowerCase().includes('recruit') ||
      Boolean(currentUser?.user_metadata?.company)
    )

    if (!isRecruiter) {
      // Fetch resume via RPC for this candidate
      ;(async () => {
        try {
          const r = await getResume(userId)
          if (mounted) setResumeObj(r)
        } catch (err) {
          console.error('getResume failed', err)
        }
      })()
    }

    getJobRecommendations(userId)
      .then(data => {
        let normalized = []
        if (Array.isArray(data)) normalized = data
        else if (Array.isArray(data?.recommendations)) normalized = data.recommendations
        else if (Array.isArray(data?.data)) normalized = data.data
        else if (Array.isArray(data?.results)) normalized = data.results
        else {
          const firstArray = Object.values(data || {}).find(v => Array.isArray(v))
          if (Array.isArray(firstArray)) normalized = firstArray
        }

        if (mounted) setJobs(normalized)
      })
      .catch(err => { console.error('Error fetching recommendations', err) })

    return () => { mounted = false }
  }, [userId, currentUser])

  // Ensure recruiters cannot have the resume tab active
  useEffect(() => {
    const isRecruiter = Boolean(
      currentUser?.role === 'recruiter' ||
      String(currentUser?.user_metadata?.role || '').toLowerCase().includes('recruit') ||
      Boolean(currentUser?.user_metadata?.company)
    )
    if (isRecruiter && activeTab === 'resume') setActiveTab('jobs')
  }, [currentUser, activeTab])

  // Listen for global request to open filters modal
  React.useEffect(() => {
    const handleOpenFilters = () => {
      // Filters modal is now handled at Dashboard level
    };
    
    const element = document.querySelector('[data-candidate-dashboard]');
    if (element) {
      element.addEventListener('openFilters', handleOpenFilters);
      return () => element.removeEventListener('openFilters', handleOpenFilters);
    }
  }, []);

  // Listen for global request to open resume tab (dispatched from header)
  const currentUserRef = React.useRef(currentUser)
  React.useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  React.useEffect(() => {
    const handler = () => {
      const user = currentUserRef.current
      const isRecruiter = Boolean(
        user?.role === 'recruiter' ||
        String(user?.user_metadata?.role || '').toLowerCase().includes('recruit') ||
        Boolean(user?.user_metadata?.company)
      )
      console.log('app:openResume event received, user:', user, 'isRecruiter:', isRecruiter)
      if (!isRecruiter) {
        console.log('Received app:openResume event, switching to resume tab')
        setActiveTab('resume')
      } else {
        console.log('User detected as recruiter, not switching to resume tab')
      }
    }
    try { 
      console.log('Setting up app:openResume event listener')
      window.addEventListener('app:openResume', handler) 
    } catch { /* ignore */ }
    return () => { 
      try { 
        console.log('Removing app:openResume event listener')
        window.removeEventListener('app:openResume', handler) 
      } catch { /* ignore */ } 
    }
  }, []) // Empty dependency array - handler uses ref for currentUser

  // Apply client-side filters
  useEffect(() => {
    const kw = (filters.keyword || '').trim().toLowerCase()
    const loc = (filters.location || '').trim().toLowerCase()
    const ind = (filters.industry || '').trim().toLowerCase()
    const employmentType = (filters.employmentType || '').trim().toLowerCase()
    const workMode = (filters.workMode || '').trim().toLowerCase()
    const minSim = Number(filters.minSimilarity) || 0

    const out = (jobs || []).filter(j => {
      if (j.similarity != null && Number(j.similarity) * 100 < minSim) return false
      if (kw) {
        const hay = `${j.title} ${j.description} ${j.company_name}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      if (loc && j.company_location && !j.company_location.toLowerCase().includes(loc)) return false
      if (ind && j.company_industry && !j.company_industry.toLowerCase().includes(ind)) return false
      if (employmentType && j.job_type && !j.job_type.toLowerCase().includes(employmentType)) return false
      if (workMode && j.job_type && !j.job_type.toLowerCase().includes(workMode)) return false
      return true
    })

    setFilteredJobs(out)
  }, [jobs, filters])

  return (
    <div className="w-full overflow-x-hidden flex flex-col min-h-screen" data-candidate-dashboard>
      {/* Main Content Area - Full screen like Tinder */}
      <main className="flex-1 relative md:flex-col flex flex-col pb-2 md:pb-4 lg:pb-6">
        {activeTab === 'jobs' ? (
          /* Desktop: Three-column layout | Mobile: Single-column with fixed filter button */
          <div className="flex-1 flex md:flex-row flex-col relative">
            {/* Desktop Filters Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0 bg-white border-r border-[color:var(--border)] p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Header with icon */}
                <div className="flex items-center gap-3 pb-2 border-b border-[color:var(--border)]">
                  <div className="w-8 h-8 rounded-lg bg-[color:var(--primary)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Refine Your Search</h3>
                </div>
                
                {/* Keywords */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Keywords
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. React, Python, Manager"
                      value={filters.keyword}
                      onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. New York, Remote"
                      value={filters.location}
                      onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Industry
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Technology, Finance"
                      value={filters.industry}
                      onChange={(e) => setFilters(f => ({ ...f, industry: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Employment Type */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4" />
                    </svg>
                    Employment Type
                  </label>
                  <div className="relative">
                    <select
                      value={filters.employmentType}
                      onChange={(e) => setFilters(f => ({ ...f, employmentType: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">All Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="internship">Internship</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Work Mode */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Work Mode
                  </label>
                  <div className="relative">
                    <select
                      value={filters.workMode}
                      onChange={(e) => setFilters(f => ({ ...f, workMode: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">All Modes</option>
                      <option value="remote">Remote</option>
                      <option value="onsite">Onsite</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Min Match % */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Minimum Match
                  </label>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.minSimilarity}
                      onChange={(e) => setFilters(f => ({ ...f, minSimilarity: e.target.value }))}
                      className="w-full h-2 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span className="font-medium">0%</span>
                      <span className="font-semibold text-[color:var(--primary)] bg-[color:var(--primary)]/10 px-2 py-1 rounded-full">{filters.minSimilarity}%</span>
                      <span className="font-medium">100%</span>
                    </div>
                  </div>
                </div>

                {/* Clear All Button */}
                <button
                  onClick={() => {
                    setFilters({ keyword: '', location: '', industry: '', employmentType: '', workMode: '', minSimilarity: 0 })
                  }}
                  className="btn-secondary w-full py-3 px-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Filters
                  </div>
                </button>
              </div>
            </div>

            {/* Job Cards Container - Center column */}
            <div className="flex-1 relative md:px-6 px-2 overflow-hidden flex flex-col">
              {/* Swipe Helper Instruction - Integrated at the top */}
              {showSwipeHelper && filteredJobs.length > 0 && (
                <div className="flex justify-center pt-2 pb-1 sm:pt-3 sm:pb-2 md:pt-4 md:pb-2 px-2">
                  <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full shadow-md border-2 border-purple-200 animate-fade-in">
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
              
              {/* Job Stack with proper spacing */}
              <div className="flex-1 pt-1 sm:pt-2">
                <JobStack
                initialJobs={filteredJobs}
                onLike={async (job) => {
                  setSavedJobs(s => [job, ...s])
                  let resumeId = null
                  try {
                    const metaResumes = currentUser?.user_metadata?.resumes || currentUser?.resumes || null
                    if (Array.isArray(metaResumes) && metaResumes.length > 0) resumeId = metaResumes[0]?.id ?? metaResumes[0]?.resume_id ?? null
                  } catch { /* ignore */ }

                  if (!resumeId) {
                    try {
                      const raw = localStorage.getItem('candidate_onboarding_payload') || localStorage.getItem('onboarding_data')
                      if (raw) {
                        const parsed = JSON.parse(raw)
                        const resumes = parsed?.resumes || parsed?.candidate?.resumes || []
                        if (Array.isArray(resumes) && resumes.length > 0) resumeId = resumes[0]?.id ?? resumes[0]?.resume_id ?? null
                      }
                    } catch { /* ignore malformed local data */ }
                  }

                  const cover = null

                  try {
                    if (userId) await swipeRightCandidate(userId, job?.id ?? job?.job_id ?? null, cover, resumeId)
                  } catch (err) {
                    console.error('swipeRightCandidate failed', err)
                  }

                  try {
                    const applied = await fetchAppliedJobs(userId, readCookie('access_token'))
                    if (Array.isArray(applied)) setSavedJobs(applied)
                  } catch (err) {
                    console.error('fetchAppliedJobs failed', err)
                  }
                }}
                onReject={async () => {
                  try {
                    const applied = await fetchAppliedJobs(userId, readCookie('access_token'))
                    if (Array.isArray(applied)) setSavedJobs(applied)
                  } catch (err) {
                    console.error('fetchAppliedJobs failed', err)
                  }
                }}
                onDislike={(job) => console.log('dislike', job)}
              />
              </div>
            </div>

            {/* Desktop Saved Jobs Sidebar */}
            <div className="hidden lg:flex w-80 flex-shrink-0 bg-white border-l border-[color:var(--border)] p-6 overflow-hidden flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto">
                {/* Header with icon */}
                <div className="flex items-center gap-3 pb-2 border-b border-[color:var(--border)]">
                  <div className="w-8 h-8 rounded-lg bg-[color:var(--primary)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
                  {savedJobs.length > 0 && (
                    <span className="ml-auto bg-[color:var(--primary)] text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                      {savedJobs.length}
                    </span>
                  )}
                </div>

                {savedJobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">No saved jobs yet</p>
                    <p className="text-xs text-gray-400">Swipe right on jobs you like to save them here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedJobs.slice(0, 5).map((job, idx) => (
                      <div
                        key={job.id || job.job_id || job.application_id || `saved-${idx}`}
                        className="group p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-[color:var(--border)] hover:border-[color:var(--primary)] hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                        onClick={() => onOpenSaved(job)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[color:var(--primary)] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white font-bold text-sm">
                              {String(job.company_name || '').charAt(0) || 'C'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 truncate group-hover:text-[color:var(--primary)] transition-colors">
                              {safeText(job.job_title || job.title)}
                            </div>
                            <div className="text-xs text-gray-600 truncate mt-1">
                              {safeText(job.company_name || job.company?.name || (typeof job.company === 'string' ? job.company : null)) || 'Company'}
                            </div>
                            {(job.company_location || job.company?.location) && (
                              <div className="flex items-center gap-1 mt-2">
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs text-gray-500 truncate">{safeText(job.company_location || job.company?.location)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[color:var(--primary)]"></div>
                            <span className="text-xs text-gray-500">Saved</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[color:var(--primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    {savedJobs.length > 5 && (
                      <button
                        onClick={() => setShowSavedJobsModal(true)}
                        className="btn-primary w-full py-3 px-4"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          View all {savedJobs.length} saved jobs
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Centered resume | Mobile: Full-width resume */
          <div className="flex-1 md:px-6 px-4 py-4 overflow-auto">
            <div className="md:max-w-4xl md:mx-auto h-full">
              <div className="bg-white rounded-2xl shadow-lg p-6 min-h-full overflow-y-auto">
                <ResumeDetails resume={resumeObj} candidateId={currentUser?.id} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Menu Modal */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMenuModal(false)}
          />
          {/* Menu */}
          <div className="absolute top-16 right-4 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowMenuModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 touch-manipulation"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo in menu */}
            <div className="flex items-center justify-center p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white font-bold text-lg">
                  SI
                </div>
                <div className="text-lg font-semibold bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] bg-clip-text text-transparent">
                  SwipeIT
                </div>
              </div>
            </div>

            {/* User Info Section */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[color:var(--primary)]/10 to-[color:var(--secondary)]/10">
              <div className="flex items-center gap-4">
                {currentUser?.user_metadata?.avatar_url ? (
                  <img src={currentUser.user_metadata.avatar_url} alt={currentUser.user_metadata.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {(currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-sm text-gray-600">Candidate</div>
                </div>
              </div>
            </div>

            <nav className="flex flex-col py-4">
              <a href="/dashboard" className="text-base py-4 px-6 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 touch-manipulation block">
                Dashboard
              </a>
              <a href="/profile" className="text-base py-4 px-6 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 touch-manipulation block">
                Profile
              </a>
              <a href="/saved-jobs" className="text-base py-4 px-6 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 touch-manipulation block relative">
                Saved Jobs
                {savedJobs.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {savedJobs.length}
                  </span>
                )}
              </a>
              <a href="/settings" className="text-base py-4 px-6 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 touch-manipulation block">
                Settings
              </a>
              <div className="border-t border-gray-200 mt-4 pt-4 px-6">
                <button
                  onClick={() => {
                    // Handle logout
                    setShowMenuModal(false)
                  }}
                  className="w-full text-left text-base py-3 px-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 touch-manipulation rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    // Filters modal is now handled at Dashboard level
                  }}
                  className="btn-secondary flex flex-col items-center gap-2 p-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-xs font-medium">Filters</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenuModal(false);
                    setShowSavedJobsModal(true);
                  }}
                  className="btn-primary flex flex-col items-center gap-2 p-3 relative"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span className="text-xs font-medium">Saved</span>
                  {savedJobs.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{savedJobs.length}</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Jobs Modal */}
      <SavedJobsModal
        isOpen={showSavedJobsModal}
        onClose={() => setShowSavedJobsModal(false)}
        saved={savedJobs}
        onRemove={(jobId) => {
          setSavedJobs(prev => prev.filter(job => (job.id || job.job_id) !== jobId))
        }}
        onClear={() => setSavedJobs([])}
        onOpen={(job) => {
          // Handle opening job details
          console.log('Open job details:', job)
        }}
      />

      {/* Footer - Sticks to bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  )
}

// Modal component for saved jobs on mobile/tablet
const SavedJobsModal = ({ isOpen, onClose, saved, onRemove, onClear, onOpen }) => {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100000]">
  {/* Backdrop */}
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]" onClick={onClose} />

  {/* Modal */}
  <div className="fixed inset-3 sm:inset-4 md:inset-8 left-3 right-3 sm:left-6 sm:right-6 h-fit bg-white rounded-2xl shadow-2xl z-[100000] flex flex-col overflow-hidden max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center h-fit justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Saved Jobs</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {saved.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p>No saved jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map((job, idx) => (
                <div
                  key={job.id || job.job_id || job.application_id || `saved-${idx}`}
                  className="p-3 rounded-lg bg-gray-50 border hover:bg-gray-100 transition-colors"
                  onClick={() => onOpen(job)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: 'var(--primary)' }}>
                      {String(job.company_name || '').charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{safeText(job.job_title || job.title)}</div>
                      <div className="text-xs text-gray-600 truncate">{safeText(job.company_name || job.company?.name || (typeof job.company === 'string' ? job.company : null)) || 'Company'}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(job.id)
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {saved.length > 0 && (
          <div className="p-4 border-t">
            <Button
              onClick={onClear}
              variant="outline"
              className="w-full"
            >
              Clear All Saved Jobs
            </Button>
          </div>
        )}
      </div>
    </div>, document.body
  )
}

export default CandidateDashboard
