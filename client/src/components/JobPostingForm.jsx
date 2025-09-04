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
const InputField = ({ label, error, required = false, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-900">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
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
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10" onClick={onClose} />
      
  <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden z-20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Create Job Posting</h3>
            <p className="text-sm text-gray-600 mt-1">Fill in the details to create a new job posting</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

  {/* Form */}
  <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] pb-28">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h4>
              
              <InputField label="Job Title" error={errors.title} required>
                <input 
                  type="text"
                  value={form.title} 
                  onChange={(e) => update('title', e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Senior Software Engineer"
                />
              </InputField>

              <InputField label="Job Description" error={errors.description} required>
                <textarea 
                  value={form.description} 
                  onChange={(e) => update('description', e.target.value)}
                  rows={6}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the role, responsibilities, and requirements..."
                />
              </InputField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Location">
                  <input 
                    type="text"
                    value={form.location} 
                    onChange={(e) => update('location', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g. New York, NY / Remote"
                  />
                </InputField>

                <InputField label="Job Type">
                  <select 
                    value={form.job_type} 
                    onChange={(e) => update('job_type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {JOB_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </InputField>
              </div>
            </div>

            {/* Compensation */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Compensation</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Minimum Salary" error={errors.salary_min}>
                  <input 
                    type="number"
                    min="0"
                    value={form.salary_min} 
                    onChange={(e) => update('salary_min', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.salary_min ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                  />
                </InputField>

                <InputField label="Maximum Salary" error={errors.salary_max}>
                  <input 
                    type="number"
                    min="0"
                    value={form.salary_max} 
                    onChange={(e) => update('salary_max', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.salary_max ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="80000"
                  />
                </InputField>

                <InputField label="Currency">
                  <select 
                    value={form.currency} 
                    onChange={(e) => update('currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.value} value={currency.value}>{currency.label}</option>
                    ))}
                  </select>
                </InputField>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Requirements</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Minimum Experience (years)" error={errors.experience_min}>
                  <input 
                    type="number"
                    min="0"
                    value={form.experience_min} 
                    onChange={(e) => update('experience_min', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.experience_min ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="2"
                  />
                </InputField>

                <InputField label="Education Level">
                  <input 
                    type="text"
                    value={form.education_level} 
                    onChange={(e) => update('education_level', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g. Bachelor's Degree"
                  />
                </InputField>
              </div>

              <InputField label="Required Skills">
                <input 
                  type="text"
                  value={form.required_skills} 
                  onChange={(e) => update('required_skills', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="React, Node.js, TypeScript, AWS"
                />
                <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
              </InputField>
            </div>

            {/* Administrative */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Administrative</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Application Deadline">
                  <input 
                    type="date"
                    value={form.application_deadline} 
                    onChange={(e) => update('application_deadline', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </InputField>

                {/* company_id intentionally removed from form - derived from recruiter/company context */}

                <InputField label="Status">
                  <select 
                    value={form.status} 
                    onChange={(e) => update('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </InputField>
              </div>
            </div>
          </div>
        </form>

  {/* Footer (fixed to bottom so actions remain visible while scrolling) */}
  <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </p>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="job-posting-form"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
