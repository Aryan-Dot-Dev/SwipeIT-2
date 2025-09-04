import React from 'react'
import { Button } from './ui/button'

const safeText = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return v
  if (typeof v === 'object') return v.name || v.company || v.company_name || v.first_name || v.title || JSON.stringify(v)
  return String(v)
}

const SavedJobs = ({ saved = [], onClear = () => {}, onOpen = () => {} }) => {
  return (
    <aside className="w-full max-w-sm mx-auto md:mx-0">
      <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 h-full flex flex-col shadow-sm border border-teal-100" style={{ border: '1px solid var(--border)' }}>
        {/* Header with icon */}
        <div className="flex items-center gap-3 pb-3 border-b border-teal-100 mb-4">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Saved Jobs</h3>
          {saved.length > 0 && (
            <span className="ml-auto bg-teal-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
              {saved.length}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs sm:text-sm px-2 sm:px-3 ml-auto hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </Button>
        </div>

        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-1">No saved jobs yet</p>
            <p className="text-xs text-gray-400">Jobs you save will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 overflow-y-auto custom-scrollbar flex-1 max-h-96 sm:max-h-[500px]">
            {saved.map((job, idx) => (
              <div
                key={job.id || job.job_id || job.application_id || `saved-${idx}`}
                className="group p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                style={{ borderColor: 'var(--border)', cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(job)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(job) }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {String(job.company_name || '').charAt(0) || 'C'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate group-hover:text-green-700 transition-colors">
                      {safeText(job.job_title || job.title)}
                    </div>
                    <div className="text-xs text-gray-600 truncate mt-1">
                      {safeText(job.company_name || job.company)}
                    </div>
                    {job.company_location && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-gray-500 truncate">{job.company_location}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-500">Saved</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

export default SavedJobs
