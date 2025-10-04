import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createEmbedding } from '@/api/embeddings.api'
import { createOrUpdateCompany, upsertRecruiterProfile } from '@/api/onboarding.api'
import { createJobPosting } from '@/api/recruiter.api'
import { getCurrentUser } from '@/utils/supabaseInstance'

const initialData = {
  company_name: '', company_website: '', logo_url: '', contact_name: '', contact_email: '', contact_phone: '',
  company_size: '', industry: '', office_location: '', hiring_roles: [], hiring_budget_min: '', hiring_budget_max: '',
  active_openings: '', team_members: [], company_description: '', remote_friendly: true,
  job_title: '', job_description: '', job_required_skills: [], job_min_experience: 0, job_location: '', job_salary_range: '',
}

export default function RecruiterOnboarding() {
  const navigate = useNavigate()
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('recruiter_onboarding_data')
      return raw ? { ...initialData, ...JSON.parse(raw) } : initialData
    } catch {
      return initialData
    }
  })
  const [step, setStep] = useState(0)
  const [teamInput, setTeamInput] = useState('')
  const [jobSkillInput, setJobSkillInput] = useState('')
  const [saving, setSaving] = useState(false)

  const formRef = useRef(null)

  useEffect(() => { localStorage.setItem('recruiter_onboarding_data', JSON.stringify(data)) }, [data])

  function next() { setStep(s => Math.min(5, s + 1)) }
  function prev() { setStep(s => Math.max(0, s - 1)) }

  // Per-step validation for recruiter onboarding
  function canProceedRecruiter(s) {
    try {
      if (s === 1) {
        if (!data.company_name || !String(data.company_name).trim()) return { ok: false, msg: 'Please enter your company name before continuing.' }
      }
      if (s === 2) {
        // require a contact email before moving on
        if (!data.contact_email || !String(data.contact_email).trim()) return { ok: false, msg: 'Please provide a contact email before continuing.' }
      }
      if (s === 3) {
        // when creating a job opening, require a title if any job-related fields are filled
        const anyJobField = (data.job_title || data.job_description || (data.job_required_skills && data.job_required_skills.length))
        if (anyJobField && (!data.job_title || !String(data.job_title).trim())) return { ok: false, msg: 'Please provide a job title for the job opening before continuing.' }
      }
      return { ok: true }
    } catch {
      return { ok: true }
    }
  }

  // hiring_roles removed in favor of explicit job creation UI
  function addJobSkill() { const v = (jobSkillInput || '').trim(); if (!v) return; const skills = data.job_required_skills || []; if (!skills.includes(v)) setData({ ...data, job_required_skills: [...skills, v] }); setJobSkillInput('') }
  function removeJobSkill(r) { const skills = data.job_required_skills || []; setData({ ...data, job_required_skills: skills.filter(x => x !== r) }) }

  function addTeamMember() { const v = (teamInput || '').trim(); if (!v) return; setData({ ...data, team_members: [...data.team_members, v] }); setTeamInput('') }
  function removeTeamMember(idx) { setData({ ...data, team_members: data.team_members.filter((_, i) => i !== idx) }) }

  function assemblePayload() {
    return {
      company: {
        name: data.company_name, website: data.company_website, logo: data.logo_url, industry: data.industry,
        location: data.office_location,
      },
      contact: {
        name: data.contact_name, email: data.contact_email, phone: data.contact_phone,
      },
      hiring: {
        // keep active_openings for backward compatibility, include structured job_openings
        roles: data.hiring_roles || [], active_openings: data.active_openings || '', budget_min: data.hiring_budget_min || null, budget_max: data.hiring_budget_max || null,
        job_openings: data.job_title ? [{
          title: data.job_title,
          description: data.job_description || null,
          required_skills: data.job_required_skills || null,
          min_experience: data.job_min_experience ?? 0,
          location: data.job_location || null,
          salary_range: data.job_salary_range || null,
        }] : [],
      },
      team: data.team_members || [],
      description: data.company_description || '',
    }
  }

  // Parse a freeform salary range string into numeric min/max and currency
  function parseSalaryRange(range) {
    if (!range) return { salary_min: null, salary_max: null, currency: null }
    try {
      let s = String(range).trim()
      // normalize
      s = s.replace(/\s+/g, ' ')
      // capture currency prefix (e.g. $, INR, £)
      let currency = null
      const curMatch = s.match(/^([A-Za-z₨$£€¥]+)\s*/)
      if (curMatch) {
        currency = curMatch[1]
        s = s.slice(curMatch[0].length).trim()
      }
      // remove common suffixes like LPA, per year
      s = s.replace(/(lpa|per year|per annum|pa|annum)/ig, '').trim()
      // normalize dashes
      s = s.replace(/[–—]/g, '-')
      // split on hyphen or ' to '
      const parts = s.split(/\s*-\s*|\s+to\s+/i).map(p => p.trim()).filter(Boolean)

      const parseNum = (str) => {
        if (!str) return null
  const m = str.match(/([\d,.]+)\s*([kKmMlL]?)/)
        if (!m) return null
        let n = parseFloat(m[1].replace(/,/g, ''))
        const suffix = (m[2] || '').toLowerCase()
        if (suffix === 'k') n *= 1e3
        if (suffix === 'm') n *= 1e6
        if (suffix === 'l') n *= 1e5 // lakh
        return Math.round(n)
      }

      let min = null, max = null
      if (parts.length === 0) {
        return { salary_min: null, salary_max: null, currency }
      } else if (parts.length === 1) {
        min = parseNum(parts[0])
        max = min
      } else {
        min = parseNum(parts[0])
        max = parseNum(parts[1])
      }
      return { salary_min: min, salary_max: max, currency }
    } catch {
      return { salary_min: null, salary_max: null, currency: null }
    }
  }

  async function copyPayloadToClipboard() { try { const payload = assemblePayload(); await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); alert('Copied payload to clipboard') } catch (e) { console.error('copy failed', e) } }

  async function submitProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true)
    try {
      const payload = assemblePayload()

      // persist recruiter payload separately (raw)
      localStorage.setItem('recruiter_onboarding_payload', JSON.stringify(payload, null, 2))

      // 1) Create embedding from job title + description (if present)
      const jobText = `${data.job_title || ''}\n\n${data.job_description || ''}`.trim()
      let embedding = null
      if (jobText) {
        const embResp = await createEmbedding({ text: jobText })
        // try common response shapes
        if (embResp && Array.isArray(embResp.data) && embResp.data[0]?.embedding) {
          embedding = embResp.data[0].embedding
        } else if (embResp && embResp.data?.[0]?.vector) {
          embedding = embResp.data[0].vector
        } else if (embResp && embResp.embedding) {
          embedding = embResp.embedding
        }
      }

      // 2) Determine current user id and session info (try supabase then localStorage fallback)
      let user_id = null
      let sessionEmail = null
      let sessionName = null
      try {
        const u = await getCurrentUser()
        user_id = u?.id || null
        sessionEmail = u?.email || null
        sessionName = u?.user_metadata?.name || u?.user_metadata?.full_name || null
      } catch { /* ignore */ }
      if (!user_id) {
        try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); if (m) { /* access token present, but user id unknown */ } } catch { /* ignore */ }
      }
  // 3) Create or update company first (server returns company id)
      let companyResp = null
      try {
        const companyPayload = payload.company || {}
        companyResp = await createOrUpdateCompany(companyPayload)
      } catch (err) {
        console.error('createOrUpdateCompany failed', err)
      }

      const company_id = companyResp?.company?.id || companyResp?.id || null

      // 4) Upsert recruiter profile (attach company info)
  let recruiterResp = null
      try {
        // Prefer the name/email the user entered at signup, then supabase session, then contact
        let signupName = null
        let signupEmail = null
        try {
          signupName = localStorage.getItem('signup_name') || null
          signupEmail = localStorage.getItem('signup_email') || null
        } catch { /* ignore */ }

        const effectiveName = signupName || sessionName || payload.contact?.name || ''
        const nameParts = (effectiveName || '').trim().split(' ').filter(Boolean)
        const first_name = nameParts.shift() || null
        const last_name = nameParts.join(' ') || null

        const effectiveEmail = signupEmail || sessionEmail || payload.contact?.email || null
        if (!effectiveEmail) {
          // prevent sending null email to backend; require an email
          throw new Error('Email not available: please provide an email on signup or in contact details before saving.')
        }

  const recruiterData = {
          phone: payload.contact?.phone || null,
          designation: '',
          company: payload.company || {},
          company_id: company_id || null,
          first_name,
          last_name,
          email: effectiveEmail,
        }

  // Log recruiter_profile payload for debugging
  console.debug('recruiter_profile payload ->', recruiterData)

  recruiterResp = await upsertRecruiterProfile(user_id, recruiterData)
      } catch (err) {
        console.error('upsertRecruiterProfile failed', err)
      }

      // 5) Create job postings with embedding and returned company_id
      const jobOpenings = payload.hiring.job_openings || []
      const jobResp = []
      for (const job of jobOpenings) {
        const { salary_min, salary_max, currency } = parseSalaryRange(job.salary_range)
        const jobData = {
          recruiter_id: user_id,
          title: job.title || null,
          description: job.description || null,
          required_skills: job.required_skills || null,
          experience_min: job.min_experience ?? 0,
          location: job.location || null,
          salary_min: salary_min,
          salary_max: salary_max,
          currency: currency,
          job_type: job.job_type || 'full-time', // Default to full-time if not specified
          status: job.status || 'active', // Default to active if not specified
          application_deadline: job.application_deadline || null,
          education_level: job.education_level || null,
          embedding: embedding || null,
        }

        try {
          const r = await createJobPosting(jobData)
          jobResp.push(r)
        } catch (err) {
          console.error('createJobPosting failed for', job.title, err)
          jobResp.push(null)
        }
      }

      // Save server responses alongside the payload for debugging/inspection
  const storedPayload = { payload, server: { company: companyResp, recruiter: recruiterResp, jobs: jobResp } }
      localStorage.setItem('recruiter_onboarding_payload', JSON.stringify(storedPayload, null, 2))

      alert('Recruiter profile saved')
      navigate('/dashboard')
      return storedPayload
    } catch (err) {
      console.error('submitProfile error', err)
      alert('Failed to save recruiter profile locally')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen relative p-0 overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #e6f3ff 0%, #d7e8ff 40%, #ffffff 100%)', ['--primary']: '#0077B5', ['--secondary']: '#005885', ['--primary-foreground']: '#ffffff' }}>
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full max-w-5xl h-full sm:h-[92vh] md:h-[90vh] lg:h-[85vh] overflow-hidden rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px) saturate(110%)' }}>
            <header className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 overflow-hidden">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">Recruiter Onboarding</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">Set up your company profile and hiring preferences so we can recommend the right candidates.</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 self-start sm:self-auto flex-shrink-0 mt-1 sm:mt-0">Step {step + 1} of 6</div>
            </header>

            <div className="mb-4 sm:mb-6">
              <div className="h-2 bg-gray-200 rounded overflow-hidden"><div className={`h-2 rounded`} style={{ width: `${((step + 1) / 6) * 100}%`, background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} /></div>
            </div>

            <form ref={formRef} onSubmit={submitProfile} className="space-y-4 sm:space-y-6 flex-1 overflow-auto">
              {step === 0 && (
                <section className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
                  <div className="flex-1 max-w-2xl">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 sm:mb-4">Hire faster. Hire smarter.</h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4 sm:mb-6">Create a compelling company profile and your first job opening — we'll surface the best-fit candidates and reduce your time-to-hire.</p>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <div className="text-xs sm:text-sm font-medium">Quality matches</div>
                          <div className="text-xs text-gray-500">Intelligent recommendations based on your job and company profile.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <div className="text-xs sm:text-sm font-medium">Faster process</div>
                          <div className="text-xs text-gray-500">Reduce manual screening with embeddings-powered ranking and easy shortlist tools.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <div className="text-xs sm:text-sm font-medium">Structured workflow</div>
                          <div className="text-xs text-gray-500">Set up job requirements and hiring preferences in one guided flow.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <div>
                          <div className="text-xs sm:text-sm font-medium">Transparent pricing</div>
                          <div className="text-xs text-gray-500">No surprises — pay for hires you make, not views.</div>
                        </div>
                      </li>
                    </ul>

                    {/* CTA removed to reduce distraction on welcome */}
                  </div>

                  <div className="w-full max-w-sm hidden md:block">
                        <div className="rounded-xl shadow p-3 sm:p-4" style={{ border: '2px solid rgba(124,58,237,0.08)', background: 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(255,73,160,0.03) 40%, #ffffff 100%)' }}>
                      {/* inner white panel for clear contrast */}
                      <div className="rounded-lg bg-white p-3 sm:p-4 shadow-sm">
                        <div className="mb-2 sm:mb-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">Example job</div>
                          <div className="mt-2">
                            <div className="text-base sm:text-lg font-semibold text-gray-900">Senior Frontend Engineer</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-xs text-gray-500">Remote</div>
                              <div className="ml-auto text-sm font-medium bg-slate-100 text-slate-800 px-2 py-1 rounded">$90k–120k</div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Build great user experiences using React and modern web tooling. Collaborate with product and design to ship fast.</p>

                        <div className="flex gap-2">
                          <div className="flex-1 inline-flex flex-col items-start" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.08)', padding: '0.5rem', borderRadius: '0.375rem' }}>
                            <div className="text-xs" style={{ color: 'var(--primary)', fontWeight: 600 }}>Avg. time to hire</div>
                            <div className="text-xs sm:text-sm text-gray-900">14 days</div>
                          </div>
                          <div className="flex-1 inline-flex flex-col items-start" style={{ background: 'rgba(255,73,160,0.04)', border: '1px solid rgba(255,73,160,0.06)', padding: '0.5rem', borderRadius: '0.375rem' }}>
                            <div className="text-xs" style={{ color: 'var(--secondary)', fontWeight: 600 }}>Candidates matched</div>
                            <div className="text-xs sm:text-sm text-gray-900">84%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Company basics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Company name</Label>
                      <Input value={data.company_name} onChange={(e) => setData({ ...data, company_name: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm">Website</Label>
                      <Input value={data.company_website} onChange={(e) => setData({ ...data, company_website: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm">Industry</Label>
                      <Input value={data.industry} onChange={(e) => setData({ ...data, industry: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm">Company size</Label>
                      <Input value={data.company_size} onChange={(e) => setData({ ...data, company_size: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm">Office location</Label>
                      <Input value={data.office_location} onChange={(e) => setData({ ...data, office_location: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm">Logo URL</Label>
                      <Input value={data.logo_url} onChange={(e) => setData({ ...data, logo_url: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Contact & Team</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div>
                      <Label className="text-sm sm:text-base">Contact name</Label>
                      <Input value={data.contact_name} onChange={(e) => setData({ ...data, contact_name: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Contact email</Label>
                      <Input value={data.contact_email} onChange={(e) => setData({ ...data, contact_email: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Contact phone</Label>
                      <Input value={data.contact_phone} onChange={(e) => setData({ ...data, contact_phone: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Team members</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={teamInput} onChange={(e) => setTeamInput(e.target.value)} placeholder="Add team member" className="flex-1 border border-gray-200 bg-white text-sm sm:text-base" />
                        <Button type="button" onClick={addTeamMember} className="bg-black text-white px-3 sm:px-4 py-2 text-sm sm:text-base">Add</Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(data.team_members || []).map((t, i) => (
                          <span key={`${t}-${i}`} className="inline-flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            {t}
                            <button onClick={() => removeTeamMember(i)} className="ml-2 text-gray-400 hover:text-gray-600">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Hiring budget min</Label>
                      <Input value={data.hiring_budget_min} onChange={(e) => setData({ ...data, hiring_budget_min: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                    <div>
                      <Label className="text-sm sm:text-base">Hiring budget max</Label>
                      <Input value={data.hiring_budget_max} onChange={(e) => setData({ ...data, hiring_budget_max: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                    </div>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Hiring preferences</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    <div className="col-span-1 sm:col-span-2">
                      <h3 className="text-sm sm:text-base font-medium mb-2">Create a job opening</h3>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-sm sm:text-base">Job title</Label>
                          <Input value={data.job_title} onChange={(e) => setData({ ...data, job_title: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label className="text-sm sm:text-base">Job description</Label>
                          <textarea value={data.job_description} onChange={(e) => setData({ ...data, job_description: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white rounded-md p-2 sm:p-3 min-h-[100px] sm:min-h-[120px] text-sm sm:text-base" />
                        </div>
                        <div>
                          <Label className="text-sm sm:text-base">Required skills</Label>
                          <div className="flex gap-2 mt-1">
                            <Input value={jobSkillInput} onChange={(e) => setJobSkillInput(e.target.value)} placeholder="e.g. React, Node.js" className="flex-1 border border-gray-200 bg-white text-sm sm:text-base" />
                            <Button type="button" onClick={addJobSkill} className="bg-black text-white px-3 sm:px-4 py-2 text-sm sm:text-base">Add</Button>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">{(data.job_required_skills || []).map(s => (<span key={s} className="inline-flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">{s}<button onClick={() => removeJobSkill(s)} className="ml-2 text-gray-400 hover:text-gray-600">×</button></span>))}</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <Label className="text-sm sm:text-base">Min experience (years)</Label>
                            <Input type="number" value={data.job_min_experience} onChange={(e) => setData({ ...data, job_min_experience: Number(e.target.value) })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                          </div>
                          <div>
                            <Label className="text-sm sm:text-base">Location</Label>
                            <Input value={data.job_location} onChange={(e) => setData({ ...data, job_location: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm sm:text-base">Salary range</Label>
                          <Input value={data.job_salary_range} onChange={(e) => setData({ ...data, job_salary_range: e.target.value })} className="mt-1 w-full border border-gray-200 bg-white text-sm sm:text-base" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-sm sm:text-base">Remote friendly</Label>
                      <div className="mt-1">
                        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={data.remote_friendly} onChange={(e) => setData({ ...data, remote_friendly: e.target.checked })} className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="text-sm sm:text-base">Open to remote candidates</span></label>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 4 && (
                <section className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Company description</h2>
                  <textarea rows={8} sm:rows={10} placeholder="Describe your company, mission, and ideal candidates..." value={data.company_description} onChange={(e) => setData({ ...data, company_description: e.target.value })} className="w-full rounded-md border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 mt-1 bg-white min-h-[150px] sm:min-h-[200px] resize-vertical text-sm sm:text-base" />
                </section>
              )}

              {step === 5 && (
                <section className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">Review & save</h2>
                  {(() => {
                    const payload = assemblePayload()
                    const company = payload.company || {}
                    const contact = payload.contact || {}
                    const hiring = payload.hiring || {}
                    const jobs = hiring.job_openings || []
                    const team = payload.team || []
                    const formatBudget = (v) => {
                      if (v === null || v === undefined) return '—'
                      const s = String(v).trim()
                      return s.length ? `₹${s}` : '—'
                    }
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white rounded-md border p-4">
                            <div className="flex items-start gap-3">
                              {company.logo ? (<img src={company.logo} alt="logo" className="w-16 h-16 object-cover rounded" />) : (<div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">Logo</div>)}
                              <div className="flex-1">
                                <div className="text-sm text-gray-500">Company</div>
                                <div className="text-base font-semibold text-gray-900">{company.name || '—'}</div>
                                {company.website ? (<a className="text-xs" style={{ color: 'var(--primary)' }} href={company.website} target="_blank" rel="noreferrer">{company.website}</a>) : null}
                                <div className="text-xs text-gray-500 mt-1">{company.industry || ''}{company.location ? ` • ${company.location}` : ''}</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-md border p-4">
                            <div className="text-sm text-gray-500">Primary contact</div>
                            <div className="mt-1">
                              <div className="text-base font-semibold">{contact.name || '—'}</div>
                              <div className="text-sm text-gray-600">{contact.email || '—'}</div>
                              <div className="text-sm text-gray-600">{contact.phone || '—'}</div>
                            </div>
                            <div className="mt-3">
                              <div className="text-sm text-gray-500">Team members</div>
                              <div className="mt-2 flex flex-wrap gap-2">{team.length ? team.map((t,i)=>(<span key={i} className="inline-flex items-center gap-2 bg-gray-50 px-2 py-1 rounded text-xs">{t}</span>)) : <div className="text-xs text-gray-400">No team members added</div>}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-md border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Hiring overview</div>
                              <div className="text-base font-semibold">Openings: {jobs.length || 0}</div>
                            </div>
                            <div className="text-sm text-gray-500">Budget: {formatBudget(hiring.budget_min)} — {formatBudget(hiring.budget_max)}</div>
                          </div>

                          <div className="mt-3 space-y-3">
                            {jobs.length ? jobs.map((job, idx) => (
                              <div key={idx} className="border rounded-md p-3 bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm text-gray-500">{job.title || 'Untitled role'}</div>
                                    <div className="text-sm text-gray-700 mt-1">{job.description ? job.description.slice(0, 220) : 'No description provided'}</div>
                                    <div className="mt-2 text-xs text-gray-500">Location: {job.location || '—'} • Experience: {job.min_experience ?? '—'}</div>
                                  </div>
                                  <div className="text-sm font-medium text-gray-800">{job.salary_range || '—'}</div>
                                </div>
                                {job.required_skills && job.required_skills.length ? (<div className="mt-3 flex flex-wrap gap-2">{job.required_skills.map((s,i)=>(<span key={i} className="inline-flex items-center gap-2 bg-white border px-2 py-1 rounded text-xs">{s}</span>))}</div>) : null}
                              </div>
                            )) : (<div className="text-sm text-gray-500">No job openings added yet.</div>)}
                          </div>
                        </div>

                        <div className="bg-white rounded-md border p-4">
                          <div className="text-sm text-gray-500">Company description</div>
                          <div className="mt-2 text-sm text-gray-700">{payload.description || <span className="text-xs text-gray-400">No company description provided</span>}</div>
                        </div>
                      </div>
                    )
                  })()}
                </section>
              )}

            </form>

            <div className="mt-4 sm:mt-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex justify-start">
                  {step === 0 ? (<Button type="button" onClick={() => navigate('/dashboard')} className="bg-white border text-black hover:text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-auto">Skip</Button>) : (<Button type="button" onClick={prev} className="bg-white border text-black hover:text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-auto">Back</Button>)}
                </div>
                <div className="flex justify-end">
                  {step < 5 ? (<Button type="button" onClick={() => { if (step === 0) { next(); return } const allowed = canProceedRecruiter(step); if (!allowed.ok) { alert(allowed.msg); return } next() }} className="text-white shadow-md text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-3 w-full sm:w-auto" style={{ background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }}>Next</Button>) : (<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"><Button type="button" onClick={copyPayloadToClipboard} className="bg-white border text-black text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 order-2 sm:order-1">Copy JSON</Button><Button type="button" onClick={submitProfile} className="text-white shadow-md text-sm sm:text-base font-medium px-3 sm:px-4 py-2 sm:py-3 order-1 sm:order-2" style={{ background: 'linear-gradient(90deg, var(--secondary), var(--primary))' }} disabled={saving}>{saving ? 'Saving...' : 'Save and go to dashboard'}</Button></div>)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
