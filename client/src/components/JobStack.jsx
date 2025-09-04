import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import JobCard from './JobCard'

const JobStack = ({ initialJobs = [], onLike, onReject }) => {
  const [jobs, setJobs] = useState(initialJobs)

  // Keep internal state in sync with parent-provided jobs list.
  useEffect(() => {
    setJobs(Array.isArray(initialJobs) ? initialJobs : [])
  }, [initialJobs])

  const handleLike = (job) => {
    // notify parent then advance to next job by removing the first one
    try { onLike && onLike(job) } catch { /* ignore */ }
    setJobs(prev => prev.slice(1))
  }

  const handleReject = (job) => {
    try { onReject && onReject(job) } catch { /* ignore */ }
    setJobs(prev => prev.slice(1))
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full px-4">
        <div className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 bg-white rounded-lg border-2 sm:border-4 border-gray-300 shadow-pixel-sm text-center">
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900">No more jobs for now</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">We've shown everything we have — check back later or broaden your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full px-2 sm:px-0">
      <AnimatePresence>
        <JobCard jobData={jobs[0]} onLike={handleLike} onReject={handleReject} />
      </AnimatePresence>
    </div>
  )
}

export default JobStack
