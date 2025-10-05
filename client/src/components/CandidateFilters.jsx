import React, { useState, useEffect } from 'react'

const CandidateFilters = ({ candidates = [], onFiltersChange, anonymousMode = false, onAnonymousModeChange }) => {
  const [filters, setFilters] = useState({
    skills: [],
    experienceMin: '',
    experienceMax: '',
    location: '',
    jobTitle: '',
    minMatchPercentage: 0
  })

  const [availableSkills, setAvailableSkills] = useState([])
  const [availableLocations, setAvailableLocations] = useState([])
  const [availableJobTitles, setAvailableJobTitles] = useState([])

  // Extract unique values from candidates for filter options
  useEffect(() => {
    if (!candidates || candidates.length === 0) return

    const skills = new Set()
    const locations = new Set()
    const jobTitles = new Set()

    candidates.forEach(candidate => {
      // Skills
      if (candidate.candidate_profile?.skills && Array.isArray(candidate.candidate_profile.skills)) {
        candidate.candidate_profile.skills.forEach(skill => skills.add(skill))
      }

      // Location
      const city = candidate.candidate_profile?.city
      const state = candidate.candidate_profile?.state
      const country = candidate.candidate_profile?.country
      if (city || state || country) {
        const location = [city, state, country].filter(Boolean).join(', ')
        if (location) locations.add(location)
      }

      // Job title
      if (candidate.job_title) {
        jobTitles.add(candidate.job_title)
      }
    })

    setAvailableSkills(Array.from(skills).sort())
    setAvailableLocations(Array.from(locations).sort())
    setAvailableJobTitles(Array.from(jobTitles).sort())
  }, [candidates])

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange && onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addSkill = (skill) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
  }

  const removeSkill = (skill) => {
    setFilters(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const clearAllFilters = () => {
    setFilters({
      skills: [],
      experienceMin: '',
      experienceMax: '',
      location: '',
      jobTitle: '',
      minMatchPercentage: 0
    })
  }

  const hasActiveFilters = Object.values(filters).some(value =>
    Array.isArray(value) ? value.length > 0 : value !== ''
  )

  return (
    <div className="space-y-6">
      {/* Header with icon */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 sm:gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[color:var(--primary)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Filter Candidates</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
          {onAnonymousModeChange && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-700">Anonymous</div>
              <button
                role="switch"
                aria-checked={anonymousMode}
                aria-label="Toggle anonymous mode"
                onClick={() => onAnonymousModeChange(!anonymousMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${anonymousMode ? 'bg-[color:var(--primary)]' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${anonymousMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          )}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Skills Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Skills
          </label>
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addSkill(e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Add a skill...</option>
              {availableSkills.filter(skill => !filters.skills.includes(skill)).map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          {filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.skills.map(skill => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-[color:var(--primary)] hover:text-[color:var(--primary)]/80"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience Range */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Experience (years)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Min"
                value={filters.experienceMin}
                onChange={(e) => updateFilter('experienceMin', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                min="0"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="Max"
                value={filters.experienceMax}
                onChange={(e) => updateFilter('experienceMax', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                min="0"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location
          </label>
          <div className="relative">
            <select
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Any location</option>
              {availableLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Job Title Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4" />
            </svg>
            Job Title
          </label>
          <div className="relative">
            <select
              value={filters.jobTitle}
              onChange={(e) => updateFilter('jobTitle', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Any job title</option>
              {availableJobTitles.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Minimum Match Percentage */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <svg className="w-4 h-4 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Minimum Match %
          </label>
          <p className="text-xs text-gray-500 -mt-1">Filter candidates by compatibility score (if available)</p>
          <div className="px-2">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minMatchPercentage}
              onChange={(e) => updateFilter('minMatchPercentage', parseInt(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-[color:var(--primary)]/20 to-[color:var(--primary)] rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${filters.minMatchPercentage}%, #e5e7eb ${filters.minMatchPercentage}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="font-medium">0%</span>
              <span className="font-semibold text-[color:var(--primary)] bg-[color:var(--primary)]/10 px-2 py-1 rounded-full">{filters.minMatchPercentage}%</span>
              <span className="font-medium">100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            {filters.skills.length > 0 && (
              <span className="ml-2">Skills: {filters.skills.join(', ')}</span>
            )}
            {(filters.experienceMin || filters.experienceMax) && (
              <span className="ml-2">
                Experience: {filters.experienceMin || '0'}-{filters.experienceMax || '∞'} years
              </span>
            )}
            {filters.location && (
              <span className="ml-2">Location: {filters.location}</span>
            )}
            {filters.jobTitle && (
              <span className="ml-2">Job: {filters.jobTitle}</span>
            )}
            {filters.minMatchPercentage > 0 && (
              <span className="ml-2">Min Match: {filters.minMatchPercentage}%</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateFilters