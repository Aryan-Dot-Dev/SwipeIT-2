import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { Button } from './ui/button'
import { getJobDetails } from '@/api/recommendations.api'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') {
    if (typeof v.name === 'string') return v.name
    if (typeof v.first_name === 'string') return v.first_name
    if (typeof v.company_name === 'string') return v.company_name
    if (typeof v.title === 'string') return v.title
    if (typeof v.designation === 'string') return v.designation
    if (v.company) {
      if (typeof v.company === 'string') return v.company
      if (typeof v.company.name === 'string') return v.company.name
      if (typeof v.company.company_name === 'string') return v.company.company_name
    }
    return JSON.stringify(v)
  }
  return String(v)
}

function DetailsModal({ job, onClose }) {
  const [descExpanded, setDescExpanded] = useState(false)
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    const prev = document.activeElement
    if (modalRef.current) modalRef.current.focus()
    const onKey = e => { if (e.key === 'Escape') onClose && onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus() }
  }, [onClose])

  if (!job) return null

  const chips = [job.job_type, (job.salary_min || job.salary_max) ? `${job.currency || 'INR'} ${job.salary_min || 0}-${job.salary_max || 0}` : null, job.applied_at ? `Applied ${new Date(job.applied_at).toLocaleDateString()}` : null].filter(Boolean)

  return ReactDOM.createPortal(
    (
      <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />

        {/* Mobile: simplified sheet */}
        <section className="block md:hidden" aria-hidden={false}>
          <section role="dialog" aria-modal="true" ref={modalRef} tabIndex={-1} className="relative w-full sm:max-w-2xl mx-0 sm:mx-auto bg-[color:var(--card)] border rounded-t-lg sm:rounded-lg overflow-hidden shadow-lg" style={{ borderColor: 'var(--border)', maxHeight: '92vh' }}>
            <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b bg-[color:var(--card)]">
              <div className="flex items-center gap-3 min-w-0">
                {job.company_logo ? (
                  <img src={job.company_logo} alt={job.company_name} className="w-9 h-9 object-cover rounded-md flex-shrink-0" loading="lazy" />
                ) : (
                  <div className="w-9 h-9 rounded-md flex items-center justify-center font-semibold text-base flex-shrink-0" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>{String(job.company_name || '').charAt(0) || 'C'}</div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{safeText(job.job_title)}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)] truncate">{safeText(job.company_name)} • {safeText(job.company_location)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${job.status==='applied'?'bg-blue-100 text-blue-800':job.status==='shortlisted'?'bg-yellow-100 text-yellow-800':job.status==='rejected'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>{safeText(job.status) || 'Applied'}</span>
                <button onClick={onClose} aria-label="Close" className="p-2 rounded-md text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/30">✕</button>
              </div>
            </header>

            <main className="overflow-auto p-4" style={{ maxHeight: 'calc(92vh - 64px)' }}>
              <div className="flex gap-2 overflow-x-auto pb-3 -mx-1">
                {chips.map((c, i) => (
                  <div key={i} className="ml-1"><span className="inline-flex items-center text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>{c}</span></div>
                ))}
              </div>

              <div className="mb-3">
                {!descExpanded ? (
                  <>
                    <p className="text-sm line-clamp-2">{safeText(job.description || job.summary) || 'No description available.'}</p>
                    {(job.description || job.summary) && <button onClick={() => setDescExpanded(true)} className="mt-2 text-xs text-[color:var(--primary)]">Read more</button>}
                  </>
                ) : (
                  <div>
                    <p className="text-sm whitespace-pre-line">{safeText(job.description || job.summary)}</p>
                    <button onClick={() => setDescExpanded(false)} className="mt-2 text-xs text-[color:var(--muted-foreground)]">Show less</button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Skills</h4>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {(job.required_skills || job.tags || job.skills || []).slice(0,6).map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>{String(s)}</span>
                  ))}
                  {(job.required_skills || job.tags || job.skills || []).length > 6 && (
                    <button onClick={() => { /* optional: expand inline */ }} className="text-xs text-[color:var(--primary)]">See all</button>
                  )}
                </div>
              </div>

              {job.company_website && (
                <div className="mb-3">
                  <a href={job.company_website} target="_blank" rel="noreferrer" className="text-sm text-[color:var(--primary)]">Visit company website</a>
                </div>
              )}
            </main>

            <div className="sm:hidden sticky bottom-0 z-30 bg-[color:var(--card)] border-t p-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                {job.company_website && <a href={job.company_website} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 rounded-md text-sm font-medium" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>Visit</a>}
                {job.recruiter_email && <a href={`mailto:${job.recruiter_email}`} className="flex-1 text-center px-3 py-2 rounded-md text-sm font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Email</a>}
                <button onClick={onClose} className="px-3 py-2 rounded-md text-sm font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Close</button>
              </div>
            </div>
          </section>
        </section>

        {/* Desktop: original two-column modal */}
        <section className="hidden md:flex items-center justify-center w-full">
          <div className="relative z-30 bg-[color:var(--card)] rounded-lg shadow-2xl w-full max-w-5xl p-0 overflow-hidden" style={{ border: '1px solid var(--border)', maxHeight: '80vh', height: '80vh' }}>
            <div className="flex h-full min-h-0">
              {/* Left summary */}
              <div className="w-1/3 p-6 flex flex-col gap-4 min-h-0" style={{ borderRight: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
                {job.company_logo ? (
                  <img src={job.company_logo} alt={job.company_name} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-lg flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>{String(job.company_name || '').charAt(0) || 'C'}</div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--foreground)] leading-tight">{safeText(job.job_title)}</h3>
                  <p className="text-sm text-[color:var(--muted-foreground)] mt-1">{safeText(job.company_name)}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)] mt-1">{safeText(job.company_location)}</p>
                </div>

                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-[color:var(--foreground)]">Type:</span>
                    <span className="text-[color:var(--muted-foreground)] capitalize">{safeText(job.job_type)}</span>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <div className="flex justify-between">
                      <span className="font-medium text-[color:var(--foreground)]">Salary:</span>
                      <span className="text-[color:var(--muted-foreground)]">{job.currency || 'INR'} {job.salary_min || 0}-{job.salary_max || 0}</span>
                    </div>
                  )}
                  {job.application_deadline && (
                    <div className="flex justify-between">
                      <span className="font-medium text-[color:var(--foreground)]">Deadline:</span>
                      <span className="text-[color:var(--muted-foreground)]">{new Date(job.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {(job.tags || job.skills || []).slice(0,6).map((t,i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>{String(t)}</span>
                  ))}
                </div>

                <div className="mt-auto w-full">
                  {job.company_website && (
                    <a href={job.company_website} target="_blank" rel="noreferrer" className="inline-block w-full text-center px-3 py-2 rounded-md border text-sm font-medium" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--primary)' }}>Visit Company</a>
                  )}
                </div>
              </div>

              {/* Right details */}
              <div className="w-2/3 p-6 overflow-auto min-h-0" style={{ maxHeight: 'calc(80vh - 96px)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Job Details</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        job.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status || 'Applied'}
                      </span>
                      {job.applied_at && (
                        <span className="text-sm text-[color:var(--muted-foreground)]">Applied: {new Date(job.applied_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.recruiter_email && <a href={`mailto:${job.recruiter_email}`} className="inline-block px-3 py-1 rounded-md text-sm border" style={{ borderColor: 'var(--border)' }}>Email Recruiter</a>}
                    <button onClick={onClose} className="px-3 py-1 rounded-md text-sm font-medium border" style={{ borderColor: 'var(--border)' }}>Close</button>
                  </div>
                </div>

                <div className="mb-6 text-sm" style={{ color: 'var(--foreground)', maxHeight: '28rem', overflow: 'auto', paddingRight: '0.5rem' }}>
                  {safeText(job.description || job.summary) || 'No description available.'}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h5 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Company</h5>
                    <div className="mt-2 text-sm" style={{ color: 'var(--foreground)' }}>{safeText(job.company_name)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{safeText(job.company_location)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{safeText(job.company_industry)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{safeText(job.company_size)}</div>
                  </div>

                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h5 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Job Details</h5>
                    <div className="mt-2 text-sm" style={{ color: 'var(--foreground)' }}>Type: {safeText(job.job_type)}</div>
                    {(job.salary_min || job.salary_max) && (
                      <div className="text-sm" style={{ color: 'var(--foreground)' }}>Salary: {job.currency || 'INR'} {job.salary_min || 0} - {job.salary_max || 0}</div>
                    )}
                    <div className="text-sm" style={{ color: 'var(--foreground)' }}>Status: <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status==='applied'?'bg-blue-100 text-blue-800':job.status==='shortlisted'?'bg-yellow-100 text-yellow-800':job.status==='rejected'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-800'}`}>{job.status || 'Applied'}</span></div>
                    {job.applied_at && (<div className="text-sm" style={{ color: 'var(--foreground)' }}>Applied: {new Date(job.applied_at).toLocaleDateString()}</div>)}
                    {job.application_deadline && (<div className="text-sm" style={{ color: 'var(--foreground)' }}>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</div>)}
                  </div>

                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h5 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Recruiter</h5>
                    <div className="mt-2 text-sm" style={{ color: 'var(--foreground)' }}>{safeText(job.recruiter_name)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{safeText(job.recruiter_phone)}</div>
                    {job.recruiter_email && <div className="text-xs mt-2"><a href={`mailto:${job.recruiter_email}`} className="text-[color:var(--primary)]">{job.recruiter_email}</a></div>}
                  </div>

                  <div className="p-4 rounded" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                    <h5 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Required Skills</h5>
                    <div className="mt-2 flex flex-wrap gap-2">{(job.required_skills || job.tags || job.skills || []).map((skill,i) => (<span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>{String(skill)}</span>))}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    ), document.body)
}

const SavedJobsPage = ({ jobs = [], highlightId = null }) => {
  const [selected, setSelected] = useState(null)
  const [mergedJobs, setMergedJobs] = useState(jobs)
  const [loadingAll, setLoadingAll] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'applied', 'shortlisted', 'rejected'

  useEffect(() => {
    let mounted = true
    async function preload() {
      if (!jobs || jobs.length === 0) return
      setLoadingAll(true)
      try {
        const results = await Promise.all(jobs.map(async job => {
          try {
            const applicationId = job.application_id || job.applicationId || job.id || job.job_id
            const data = await getJobDetails(applicationId)
            return { ...job, ...(data || {}) }
          } catch (e) {
            console.warn('prefetch job details failed for', job, e)
            return job
          }
        }))
        if (mounted) setMergedJobs(results)
            console.log(results)
      } finally {
        if (mounted) setLoadingAll(false)
      }
    }
    preload()
    return () => { mounted = false }
  }, [jobs])

  const normalizeJob = job => ({
    ...job,
    job_title: safeText(job.job_title || job.title || (job.job && job.job.title)),
    company_name: safeText(job.company_name || job.company || (job.company && job.company.name)),
    description: safeText(job.description || job.summary || (job.job && job.job.description)),
    company_location: safeText(job.company_location || job.location || (job.company && job.company.location) || (job.job && job.job.location)),
    tags: (job.tags || job.skills || (job.job && job.job.required_skills) || []).map(t => String(t || '')),
    job_type: safeText(job.job_type || (job.job && job.job.job_type)),
    currency: safeText(job.currency || (job.job && job.job.currency)),
    salary_min: job.salary_min || (job.job && job.job.salary_min),
    salary_max: job.salary_max || (job.job && job.job.salary_max),
    application_deadline: job.application_deadline || (job.job && job.job.application_deadline),
    status: safeText(job.status), // application status
    applied_at: job.applied_at,
    // handle nested shapes returned by get_recruiter_details_by_application
    // example shape: { recruiter: { email, phone, company: { id, logo, name, website, industry, ... }, user_id, first_name, designation } }
    recruiter_meta: (typeof job.recruiter === 'object' ? job.recruiter : (typeof job.recruiter_meta === 'object' ? job.recruiter_meta : null)),
    company_meta: (typeof job.company === 'object' ? job.company : (job.recruiter && typeof job.recruiter === 'object' && typeof job.recruiter.company === 'object' ? job.recruiter.company : (typeof job.company_meta === 'object' ? job.company_meta : null))),
    company_logo: safeText((job.company && job.company.logo) || (job.company_meta && job.company_meta.logo) || job.company_logo),
    company_website: safeText((job.company && job.company.website) || (job.company_meta && job.company_meta.website) || job.company_website),
    company_industry: safeText((job.company && job.company.industry) || (job.company_meta && job.company_meta.industry) || job.company_industry),
    company_size: safeText((job.company && job.company.company_size) || (job.company_meta && job.company_meta.company_size) || job.company_size),
    recruiter_email: safeText((job.recruiter && job.recruiter.email) || (job.recruiter_meta && job.recruiter_meta.email) || job.recruiter_email),
    recruiter_phone: safeText((job.recruiter && job.recruiter.phone) || (job.recruiter_meta && job.recruiter_meta.phone) || job.recruiter_phone),
    recruiter_name: safeText((job.recruiter && (job.recruiter.first_name || job.recruiter.name)) || (job.recruiter_meta && (job.recruiter_meta.first_name || job.recruiter_meta.name)) || job.recruiter_name)
  })


  const displayedJobs = (mergedJobs || []).map(normalizeJob)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredJobs = (displayedJobs || []).filter(j => {
    // Status filter
    if (statusFilter !== 'all' && j.status !== statusFilter) return false
    
    // Search filter
    if (!searchTerm) return true
    const s = String(searchTerm).trim().toLowerCase()
    const hay = `${j.job_title} ${j.company_name} ${j.description} ${(j.tags||[]).join(' ')} ${j.job_type} ${j.company_location}`.toLowerCase()
    return hay.includes(s)
  })
  const [activeHighlightId, setActiveHighlightId] = useState(null)

  useEffect(() => {
    if (!highlightId) return
    const id = String(highlightId)
    const el = document.getElementById(`saved-job-${id}`) || document.getElementById(`saved-job-${highlightId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setActiveHighlightId(highlightId)
      const t = setTimeout(() => setActiveHighlightId(null), 3000)
      return () => clearTimeout(t)
    }
  }, [highlightId])

  return (
    <div className="p-3 sm:p-4 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>Applied Jobs</h2>
          <input
            type="search"
            placeholder="Search applied jobs…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-2 rounded-md border text-sm w-64"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
          />
        </div>
        <div className="flex items-center gap-4">
          {loadingAll && <div className="text-xs text-gray-500">Refreshing details…</div>}
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)]'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80'
          }`}
        >
          All ({displayedJobs.length})
        </button>
        <button
          onClick={() => setStatusFilter('applied')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'applied'
              ? 'bg-blue-500 text-white'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80'
          }`}
        >
          Applied ({displayedJobs.filter(j => j.status === 'applied').length})
        </button>
        <button
          onClick={() => setStatusFilter('shortlisted')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'shortlisted'
              ? 'bg-yellow-500 text-white'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80'
          }`}
        >
          Shortlisted ({displayedJobs.filter(j => j.status === 'shortlisted').length})
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'rejected'
              ? 'bg-red-500 text-white'
              : 'bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--muted)]/80'
          }`}
        >
          Rejected ({displayedJobs.filter(j => j.status === 'rejected').length})
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-sm text-gray-600">No applied jobs yet.</div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-sm text-gray-600">
          {statusFilter === 'all' 
            ? 'No jobs match your search criteria.' 
            : `No ${statusFilter} jobs found.`
          }
        </div>
      ) : (
  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredJobs.map(job => (
            <article
              id={`saved-job-${job.id || job.job_id}`}
              key={job.id || job.job_id}
              className={`bg-[color:var(--card)] rounded-lg shadow-md p-3 flex flex-col w-full min-w-0 hover:shadow-lg transition-shadow duration-200 ${activeHighlightId && (String(activeHighlightId) === String(job.id || job.job_id)) ? 'ring-4 ring-[color:var(--primary)]' : ''}`}
              style={{ border: '1px solid var(--border)' }}
            >
              {/* Header with status badge */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                      {String(job.company_name || '').charAt(0) || 'C'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)] truncate leading-tight">{safeText(job.job_title || job.title)}</h3>
                    <p className="text-xs text-[color:var(--muted-foreground)] truncate">{safeText(job.company_name || job.company)}</p>
                    <p className="text-xs text-[color:var(--muted-foreground)] truncate">{safeText(job.company_location || job.location)}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ml-2 flex-shrink-0 ${
                  job.status === 'applied' ? 'bg-blue-100 text-blue-800' :
                  job.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                  job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status || 'Applied'}
                </span>
              </div>

              {/* Key details in a compact grid */}
              <div className="grid grid-cols-2 gap-1 mb-2 text-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-[color:var(--foreground)]">Type</span>
                  <span className="text-[color:var(--muted-foreground)] capitalize truncate">{safeText(job.job_type) || '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[color:var(--foreground)]">Salary</span>
                  <span className="text-[color:var(--muted-foreground)] truncate">
                    {(job.salary_min || job.salary_max) ? `${job.currency || 'INR'} ${job.salary_min || 0}-${job.salary_max || 0}` : '—'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[color:var(--foreground)]">Applied</span>
                  <span className="text-[color:var(--muted-foreground)] truncate">
                    {job.applied_at ? new Date(job.applied_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-[color:var(--foreground)]">Deadline</span>
                  <span className="text-[color:var(--muted-foreground)] truncate">
                    {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[color:var(--foreground)] line-clamp-1 mb-2 leading-relaxed">
                {safeText(job.description || job.summary) || 'No description available.'}
              </p>

              {/* Skills */}
              <div className="flex items-center gap-1 flex-wrap mb-2">
                {(job.required_skills || job.tags || job.skills || []).slice(0, 3).map((skill, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                    {String(skill)}
                  </span>
                ))}
                {(job.required_skills || job.tags || job.skills || []).length > 3 && (
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    +{(job.required_skills || job.tags || job.skills || []).length - 3} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-xs text-[color:var(--muted-foreground)] truncate">
                  {safeText(job.recruiter_name || (job.recruiter && job.recruiter.first_name)) || '—'}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setSelected(normalizeJob(job))} 
                  className="text-white shrink-0 ml-2 h-7 text-xs px-3"
                  style={{ background: 'var(--primary)' }}
                >
                  View Details
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

  <DetailsModal job={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default SavedJobsPage
