import React, { useState } from 'react'

// Icon mapping function
const getIcon = (name) => {
  const icons = {
    briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" /></svg>,
    tag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
    document: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    location: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    currency: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    chart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
    clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    academic: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>,
    tool: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    cog: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  };
  return icons[name] || name;
};

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' }
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' }
]

const CURRENCIES = [
  { value: 'INR', label: '₹ INR' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' }
]

// Small stable InputField component moved to module scope to avoid remounting on each render
const InputField = ({ label, error, required = false, children, icon }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {icon && <span className="text-gray-400">{getIcon(icon)}</span>}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600 flex items-center gap-1">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </p>}
  </div>
)

const SectionHeader = ({ title, description, icon }) => (
  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white text-sm">
      {getIcon(icon)}
    </div>
    <div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      {description && <p className="text-sm text-gray-600">{description}</p>}
    </div>
  </div>
)

const JobPostingForm = ({ recruiterId = null, onClose = () => {}, onSubmit = () => {} }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    recruiter_id: recruiterId || '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    currency: 'INR',
    experience_min: '',
    education_level: '',
    status: 'active',
    application_deadline: '',
    required_skills: ''
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const update = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }))
    // Clear error when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'
    if (form.salary_min && form.salary_max && Number(form.salary_min) > Number(form.salary_max)) {
      newErrors.salary_max = 'Maximum salary must be greater than minimum'
    }
    if (form.experience_min && Number(form.experience_min) < 0) {
      newErrors.experience_min = 'Experience cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSubmitting(true)
    
    const payload = {
      title: String(form.title).trim(),
      description: String(form.description).trim(),
      recruiter_id: form.recruiter_id || null,
      location: form.location || null,
      job_type: form.job_type || null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      currency: form.currency || 'INR',
      experience_min: form.experience_min ? Number(form.experience_min) : null,
      education_level: form.education_level || null,
      status: form.status || 'active',
      application_deadline: form.application_deadline || null,
      required_skills: form.required_skills ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean) : null
    }

    try {
      console.log('createJobPosting payload:', payload)
      await onSubmit(payload)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-5xl max-h-[95vh] overflow-hidden z-20">
        {/* Header */}
  <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-[color:var(--primary)]/10 to-[color:var(--secondary)]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Create Job Posting</h3>
              <p className="text-sm text-gray-600 mt-0.5">Fill in the details to attract the best candidates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form id="job-posting-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-200px)] pb-32">
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <SectionHeader
                title="Basic Information"
                description="Tell candidates about the role and what they'll be doing"
                icon="briefcase"
              />

              <div className="mt-6 space-y-6">
                <InputField label="Job Title" error={errors.title} required icon="tag">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white ${
                      errors.title ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </InputField>

                <InputField label="Job Description" error={errors.description} required icon="document">
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={6}
                    className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 resize-none bg-white ${
                      errors.description ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  />
                </InputField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Location" icon="location">
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="e.g. New York, NY / Remote"
                    />
                  </InputField>

                  <InputField label="Job Type" icon="clock">
                    <select
                      value={form.job_type}
                      onChange={(e) => update('job_type', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                      {JOB_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </InputField>
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <SectionHeader
                title="Compensation"
                description="Set competitive salary ranges to attract top talent"
                icon="currency"
              />

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Minimum Salary" error={errors.salary_min} icon="chart">
                    <input
                      type="number"
                      min="0"
                      value={form.salary_min}
                      onChange={(e) => update('salary_min', e.target.value)}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white ${
                        errors.salary_min ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="50000"
                    />
                  </InputField>

                  <InputField label="Maximum Salary" error={errors.salary_max} icon="chart">
                    <input
                      type="number"
                      min="0"
                      value={form.salary_max}
                      onChange={(e) => update('salary_max', e.target.value)}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white ${
                        errors.salary_max ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="80000"
                    />
                  </InputField>

                  <InputField label="Currency" icon="currency">
                    <select
                      value={form.currency}
                      onChange={(e) => update('currency', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                      {CURRENCIES.map(currency => (
                        <option key={currency.value} value={currency.value}>{currency.label}</option>
                      ))}
                    </select>
                  </InputField>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <SectionHeader
                title="Requirements"
                description="Specify what skills and experience candidates need"
                icon="clipboard"
              />

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Minimum Experience (years)" error={errors.experience_min} icon="calendar">
                    <input
                      type="number"
                      min="0"
                      value={form.experience_min}
                      onChange={(e) => update('experience_min', e.target.value)}
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white ${
                        errors.experience_min ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="2"
                    />
                  </InputField>

                  <InputField label="Education Level" icon="academic">
                    <input
                      type="text"
                      value={form.education_level}
                      onChange={(e) => update('education_level', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="e.g. Bachelor's Degree"
                    />
                  </InputField>
                </div>

                <InputField label="Required Skills" icon="tool">
                  <input
                    type="text"
                    value={form.required_skills}
                    onChange={(e) => update('required_skills', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    placeholder="React, Node.js, TypeScript, AWS"
                  />
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Separate skills with commas
                  </p>
                </InputField>
              </div>
            </div>

            {/* Administrative */}
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <SectionHeader
                title="Administrative"
                description="Set posting details and deadlines"
                icon="cog"
              />

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Application Deadline" icon="calendar">
                    <input
                      type="date"
                      value={form.application_deadline}
                      onChange={(e) => update('application_deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    />
                  </InputField>

                  <InputField label="Status" icon="chart">
                    <select
                      value={form.status}
                      onChange={(e) => update('status', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                      {STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </InputField>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between p-6 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="job-posting-form"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white rounded-xl hover:from-[color:var(--primary)]/90 hover:to-[color:var(--secondary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? 'Creating Job...' : 'Create Job Posting'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobPostingForm
