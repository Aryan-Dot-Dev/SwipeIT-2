import React, { useState } from 'react'

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
      {icon && <span className="text-gray-400">{icon}</span>}
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
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
      {icon}
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
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
                icon="📋"
              />

              <div className="mt-6 space-y-6">
                <InputField label="Job Title" error={errors.title} required icon="💼">
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

                <InputField label="Job Description" error={errors.description} required icon="📝">
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
                  <InputField label="Location" icon="📍">
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="e.g. New York, NY / Remote"
                    />
                  </InputField>

                  <InputField label="Job Type" icon="⏰">
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
                icon="💰"
              />

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Minimum Salary" error={errors.salary_min} icon="📈">
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

                  <InputField label="Maximum Salary" error={errors.salary_max} icon="📊">
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

                  <InputField label="Currency" icon="💱">
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
                icon="🎯"
              />

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Minimum Experience (years)" error={errors.experience_min} icon="📅">
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

                  <InputField label="Education Level" icon="🎓">
                    <input
                      type="text"
                      value={form.education_level}
                      onChange={(e) => update('education_level', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="e.g. Bachelor's Degree"
                    />
                  </InputField>
                </div>

                <InputField label="Required Skills" icon="🛠️">
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
                icon="⚙️"
              />

              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Application Deadline" icon="📅">
                    <input
                      type="date"
                      value={form.application_deadline}
                      onChange={(e) => update('application_deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 bg-white hover:border-gray-300"
                    />
                  </InputField>

                  <InputField label="Status" icon="📊">
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
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
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
