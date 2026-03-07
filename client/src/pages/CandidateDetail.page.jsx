import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Mail, Phone, Briefcase, Share2, ArrowLeft, Award, Calendar } from 'lucide-react'
import supabase from '@/utils/supabaseInstance'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AttitudeRadar from '@/components/AttitudeRadar'
import { useAuthStatus } from '@/hooks/useAuthStatus'

const CandidateDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareToast, setShareToast] = useState(false)
  const { isAuthenticated, user, userType } = useAuthStatus()

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('user_id', id)
          .single()

        if (error) throw error
        
        setCandidate(data)
        
        // Update meta tags for SEO
        if (data) {
          document.title = `${data.name || 'Candidate'} | SwipeIT`
          
          const ogTitle = document.querySelector('meta[property="og:title"]')
          if (ogTitle) ogTitle.content = `${data.name || 'Candidate Profile'} | SwipeIT`
          
          const ogDescription = document.querySelector('meta[property="og:description"]')
          if (ogDescription) ogDescription.content = data.bio?.substring(0, 160) || 'View this candidate profile on SwipeIT'
        }
      } catch (err) {
        console.error('Error fetching candidate:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchCandidate()
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    const shareData = {
      title: `${candidate?.name || 'Candidate'} on SwipeIT`,
      text: `Check out this candidate profile on SwipeIT`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5]">
        <LoadingSpinner size="lg" text="Loading candidate profile..." />
      </div>
    )
  }

  if (error || !candidate) {
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
            <h2 className="text-2xl font-bold text-[#1C1A2E] mb-3">Profile Not Found</h2>
            <p className="text-[#6E6B86] mb-6">
              This candidate profile may be private or the link is incorrect.
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

  const location = [candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ')

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

          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#E4DFF5] overflow-hidden">
            {/* Header Section */}
            <div className="p-6 sm:p-8 border-b border-[#E4DFF5] bg-gradient-to-r from-[#F6F5FA] to-white">
              <div className="flex items-start gap-4">
                {/* Profile Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {candidate.profile_img ? (
                    <img src={candidate.profile_img} alt={candidate.name} className="w-full h-full object-cover" />
                  ) : (
                    candidate.name?.charAt(0).toUpperCase() || 'C'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1A2E] mb-2 leading-tight">
                    {candidate.name}
                  </h1>
                  {location && (
                    <div className="flex items-center gap-2 text-[#6E6B86] mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{location}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {candidate.experience_years != null && (
                      <span className="px-3 py-1 rounded-full bg-[#E4DFF5] text-[#9A8CF2] text-sm font-medium border border-[#9A8CF2]/20 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {candidate.experience_years} years exp.
                      </span>
                    )}
                  </div>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-3 rounded-xl bg-white border-2 border-[#E4DFF5] hover:border-[#9A8CF2] hover:bg-[#F6F5FA] transition-all duration-200 flex-shrink-0"
                  title="Share profile"
                >
                  <Share2 className="w-5 h-5 text-[#9A8CF2]" />
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidate.email && (
                  <div className="flex items-center gap-3 p-4 bg-[#F6F5FA] rounded-xl border border-[#E4DFF5]">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#9A8CF2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#6E6B86] mb-0.5">Email</div>
                      <div className="text-sm font-medium text-[#1C1A2E] truncate">{candidate.email}</div>
                    </div>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-3 p-4 bg-[#F6F5FA] rounded-xl border border-[#E4DFF5]">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#9A8CF2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-[#6E6B86] mb-0.5">Phone</div>
                      <div className="text-sm font-medium text-[#1C1A2E]">{candidate.phone}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {candidate.bio && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1A2E] mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-[#9A8CF2] to-[#6ED7A5] rounded-full"></span>
                    About
                  </h2>
                  <div className="prose prose-sm max-w-none text-[#6E6B86] leading-relaxed whitespace-pre-wrap">
                    {candidate.bio}
                  </div>
                </div>
              )}

              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1A2E] mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-[#9A8CF2] to-[#6ED7A5] rounded-full"></span>
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
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

              {/* Attitude Score */}
              {candidate.attitude_score && (
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1A2E] mb-3 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-[#9A8CF2] to-[#6ED7A5] rounded-full"></span>
                    Attitude Profile
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#F6F5FA] rounded-2xl border border-[#E4DFF5]">
                    <div className="flex-shrink-0">
                      <AttitudeRadar data={candidate.attitude_score} size={200} levels={4} />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                      {Object.entries(candidate.attitude_score).map(([trait, value]) => (
                        <div key={trait} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-[#E4DFF5]">
                          <span className="text-sm text-[#6E6B86] capitalize">{trait}</span>
                          <span className="font-semibold text-[#1C1A2E]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  Sign up to Connect
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-[#6E6B86]">
            <p>
              Profile created on {new Date(candidate.created_at).toLocaleDateString('en-US', { 
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

export default CandidateDetailPage;
