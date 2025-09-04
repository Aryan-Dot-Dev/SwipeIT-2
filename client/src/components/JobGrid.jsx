import React from 'react'
import JobCard from './JobCard'
import SkeletonCard from './SkeletonCard'

const JobGrid = ({ jobs = [], onLike = () => {}, onReject = () => {}, loading = false, variant = 'light', columns = 3 }) => {
  // columns: 1, 2 or 3 — controls responsive grid behavior
  const gridClass = (() => {
    if (columns === 1) return 'grid-cols-1'
    if (columns === 2) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
    // default 3
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  })()

  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!jobs || jobs.length === 0) {
    return <div className="text-gray-600">No jobs match your filters.</div>
  }

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {jobs.map(job => (
        <JobCard key={job.id} jobData={job} onLike={() => onLike(job)} onReject={() => onReject(job)} variant={variant} />
      ))}
    </div>
  )
}

export default JobGrid
