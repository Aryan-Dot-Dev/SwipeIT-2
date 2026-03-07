import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Share2, ArrowLeft, Building2 } from 'lucide-react'
import supabase from '@/utils/supabaseInstance'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuthStatus } from '@/hooks/useAuthStatus'

const JobDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareToast, setShareToast] = useState(false)
  const { isAuthenticated, user, userType } = useAuthStatus()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true)
        
        // Fetch job using 'id' column (primary key)
        const { data: jobData, error: jobError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', id)
          .single()

        if (jobError) {
          console.error('Job fetch error:', jobError)
          throw jobError
        }
        
        if (!jobData) {
          throw new Error('Job not found')
        }
        
        // Fetch recruiter data separately if recruiter_id exists
        let recruiterData = null
        if (jobData.recruiter_id) {
          const { data: recData, error: recError } = await supabase
            .from('recruiters')
            .select('company_name, company_location, company_industry, user_id')
            .eq('user_id::uuid', jobData.recruiter_id)
            .maybeSingle()
          
          if (!recError && recData) {
            recruiterData = recData
          }
        }
        
        // Combine job and recruiter data
        const combinedData = {
          ...jobData,
          recruiter: recruiterData
        }
        
        setJob(combinedData)
        
        // Update meta tags for SEO
        if (combinedData) {
          document.title = `${combinedData.title} at ${recruiterData?.company_name || 'Company'} | SwipeIT`
          
          // Update Open Graph meta tags
          const ogTitle = document.querySelector('meta[property="og:title"]')
          if (ogTitle) ogTitle.content = `${combinedData.title} | SwipeIT`
          
          const ogDescription = document.querySelector('meta[property="og:description"]')
          if (ogDescription) ogDescription.content = combinedData.description?.substring(0, 160) || 'View this job opportunity on SwipeIT'
        }
      } catch (err) {
        console.error('Error fetching job:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchJob()
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    const shareData = {
      title: `${job?.title} at ${job?.recruiter?.company_name || 'Company'}`,
      text: `Check out this job on SwipeIT: ${job?.title}`,
      url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2500)
      }
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const formatSalary = (min, max, currency = 'INR') => {
    if (!min && !max) return null
    const formatNum = (num) => {
      if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
      return num.toString()
    }
    const symbol = currency === 'INR' ? '₹' : '$'
    if (min && max) return `${symbol}${formatNum(min)} – ${formatNum(max)}`
    if (min) return `${symbol}${formatNum(min)}+`
    return `Up to ${symbol}${formatNum(max)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5]">
        <LoadingSpinner size="lg" text="Loading job details..." />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header 
          userType={userType}
          userName={user?.user_metadata?.name || user?.email || ''}
          userAvatar={user?.user_metadata?.profile_img || user?.user_metadata?.avatar || null}
        />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5] p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E4DFF5] p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">😕</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1C1A2E] mb-3">Job Not Found</h2>
            <p className="text-[#6E6B86] mb-6">
              This job posting may have been removed or the link is incorrect.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary px-6 py-3"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const companyName = job.recruiter?.company_name || 'Company'
  const companyLocation = job.recruiter?.company_location || job.location || 'Location not specified'
  const salaryRange = formatSalary(job.salary_min, job.salary_max, job.currency)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5]">
      <Header 
        userType={userType}
        userName={user?.user_metadata?.name || user?.email || ''}
        userAvatar={user?.user_metadata?.profile_img || user?.user_metadata?.avatar || null}
      />
      
      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg animate-fade-in">
          Link copied to clipboard!
        </div>
      )}

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#6E6B86] hover:text-[#9A8CF2] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Job Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#E4DFF5] overflow-hidden">
            {/* Header Section */}
            <div className="p-6 sm:p-8 border-b border-[#E4DFF5] bg-gradient-to-r from-[#F6F5FA] to-white">
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0 shadow-lg">
                  {companyName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1A2E] mb-2 leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-[#6E6B86] mb-3">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">{companyName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#6E6B86]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{companyLocation}</span>
                    </div>
                    {job.job_type && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                      </div>
                    )}
                    {salaryRange && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-[#6ED7A5]">{salaryRange}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-3 rounded-xl bg-white border-2 border-[#E4DFF5] hover:border-[#9A8CF2] hover:bg-[#F6F5FA] transition-all duration-200 flex-shrink-0"
                  title="Share job"
                >
                  <Share2 className="w-5 h-5 text-[#9A8CF2]" />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Quick Info Tags */}
              <div className="flex flex-wrap gap-2">
                {job.experience_min != null && (
                  <span className="px-3 py-1.5 rounded-full bg-[#E4DFF5] text-[#9A8CF2] text-sm font-medium border border-[#9A8CF2]/20">
                    {job.experience_min}+ years experience
                  </span>
                )}
                {job.education_level && (
                  <span className="px-3 py-1.5 rounded-full bg-[#E4DFF5] text-[#9A8CF2] text-sm font-medium border border-[#9A8CF2]/20">
                    {job.education_level}
                  </span>
                )}
                {job.status && (
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                    job.status === 'active' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {job.status === 'active' ? '🟢 Actively Hiring' : 'Closed'}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-[#1C1A2E] mb-3 flex items-center gap-2">
                  <span className="w-1 h-6 bg-gradient-to-b from-[#9A8CF2] to-[#6ED7A5] rounded-full"></span>
                  Job Description
                </h2>
                <div className="prose prose-sm max-w-none text-[#6E6B86] leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>

              {/* Required Skills */}
              {job.required_skills && job.required_skills.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1A2E] mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-[#9A8CF2] to-[#6ED7A5] rounded-full"></span>
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-white border-2 border-[#E4DFF5] text-[#1C1A2E] text-sm font-medium hover:border-[#6ED7A5] transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Deadline */}
              {job.application_deadline && (
                <div className="flex items-center gap-2 p-4 bg-[#FFF4E6] border border-[#FFB84D] rounded-xl">
                  <Clock className="w-5 h-5 text-[#FF8C00]" />
                  <span className="text-sm font-medium text-[#1C1A2E]">
                    Application deadline: {new Date(job.application_deadline).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {job.apply_url ? (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Apply on Company Site
                  </a>
                ) : (
                  <button
                    onClick={() => navigate('/signup')}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Sign up to Apply
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="px-6 py-4 bg-white border-2 border-[#E4DFF5] text-[#1C1A2E] font-semibold rounded-xl hover:border-[#9A8CF2] hover:bg-[#F6F5FA] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Job
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-[#6E6B86]">
            <p>
              Posted on {new Date(job.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default JobDetailPage
