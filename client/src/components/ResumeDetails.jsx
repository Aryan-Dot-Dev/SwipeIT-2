import React, { useEffect, useMemo, useState } from 'react'
import { rescanResume } from '@/api/storage.api'
import { getCurrentUser } from '@/utils/supabaseInstance'

// Enhanced resume details viewer with modern design
export default function ResumeDetails({ resume, candidateId }) {
  const [aiReportState, setAiReportState] = useState(resume?.ai_report || resume?.aiReport || resume?.ai || null)
  const [rescanLoading, setRescanLoading] = useState(false)
  const [rescanError, setRescanError] = useState('')
  const [effectiveCandidateId, setEffectiveCandidateId] = useState(
    candidateId || resume?.candidate_id || resume?.user_id || resume?.candidateId || null
  )

  // Keep local AI report in sync if the parent passes an updated resume record
  useEffect(() => {
    setAiReportState(resume?.ai_report || resume?.aiReport || resume?.ai || null)
  }, [resume?.ai_report, resume?.aiReport, resume?.ai])

  useEffect(() => {
    setEffectiveCandidateId(candidateId || resume?.candidate_id || resume?.user_id || resume?.candidateId || null)
  }, [candidateId, resume?.candidate_id, resume?.user_id, resume?.candidateId])

  useEffect(() => {
    if (!effectiveCandidateId) {
      getCurrentUser()
        .then(u => {
          if (u?.id) setEffectiveCandidateId(u.id)
        })
        .catch(() => {})
    }
  }, [effectiveCandidateId])

  const filename = resume?.filename || resume?.name || resume?.file_name || resume?.originalName || 'resume'
  const publicUrl = resume?.publicUrl || resume?.publicURL || resume?.url || resume?.public_url || resume?.file_url || null

  const aiReport = aiReportState
  const { parsedAi, analysisTimestamp, extractedTextLength } = useMemo(() => {
    if (!aiReport) return { parsedAi: null, analysisTimestamp: null, extractedTextLength: null }
    try {
      const report = typeof aiReport === 'string' ? JSON.parse(aiReport) : aiReport
      let parsed = report.raw_response || report.rawResponse || report.raw || report.structured_data || report.structuredData || report
      const ts = report.analysis_timestamp || report.analysisTimestamp || report.timestamp || null
      const len = report.extracted_text_length || report.extractedTextLength || report.extracted_length || null
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed) } catch { /* ignore */ }
      }
      return { parsedAi: parsed, analysisTimestamp: ts, extractedTextLength: len }
    } catch {
      return { parsedAi: null, analysisTimestamp: null, extractedTextLength: null }
    }
  }, [aiReport])

  if (!resume) {
    return (
      <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-[color:var(--muted)] rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)] mb-2">No Resume Available</h3>
          <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">Upload your resume to get AI-powered insights and analysis</p>
        </div>
      </div>
    )
  }

  const handleRescan = async () => {
    if (!effectiveCandidateId) {
      setRescanError('Missing candidate id; please re-login and retry.')
      return
    }
    if (!resume?.file_url && !resume?.publicUrl && !resume?.public_url) return
    setRescanLoading(true)
    setRescanError('')
    try {
      const url = resume.file_url || resume.publicUrl || resume.public_url
      const report = await rescanResume({ candidateId: effectiveCandidateId, resumeUrl: url, resumeId: resume.id || resume.resume_id || null })
      setAiReportState(report)
    } catch (err) {
      setRescanError(err.message || 'Rescan failed')
    } finally {
      setRescanLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Header Section */}
      <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[color:var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-[color:var(--primary-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">Resume Analysis</h3>
              <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] truncate">{filename}</p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0 space-y-1 text-xs text-[color:var(--muted-foreground)]">
            {analysisTimestamp && <div>Analyzed {new Date(analysisTimestamp).toLocaleDateString()}</div>}
            {extractedTextLength && <div>{extractedTextLength} characters extracted</div>}
          </div>
        </div>

        {publicUrl && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[color:var(--muted)] rounded-lg gap-2 text-sm">
            <span className="font-medium text-[color:var(--foreground)]">Resume File</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium flex items-center space-x-1"
            >
              <span>View Original</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      {parsedAi ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {parsedAi.strengths_and_highlights && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-3 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">Strengths & Highlights</h4>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {parsedAi.strengths_and_highlights.map((strength, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[color:var(--foreground)]">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.scope_of_improvement && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-3 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[color:var(--primary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">Areas for Improvement</h4>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {parsedAi.scope_of_improvement.map((improvement, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--primary)' }}></div>
                    <span className="text-[color:var(--foreground)]">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.what_makes_others_stand_out && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-3 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[color:var(--secondary)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[color:var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">Competitive Advantages</h4>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {parsedAi.what_makes_others_stand_out.map((advantage, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[color:var(--foreground)]">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.what_makes_this_candidate_the_best && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-3 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h4 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">Your Unique Value</h4>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {parsedAi.what_makes_this_candidate_the_best.map((value, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-[color:var(--foreground)]">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-[color:var(--muted)] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm sm:text-lg font-semibold text-[color:var(--foreground)]">AI Analysis Pending</h4>
              <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">Tap rescan to refresh the analysis now.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={handleRescan}
                disabled={rescanLoading}
                className="px-4 py-2 bg-[color:var(--primary)] text-white rounded-lg text-sm font-semibold hover:bg-[color:var(--primary)]/90 disabled:opacity-60"
              >
                {rescanLoading ? 'Rescanning…' : 'Rescan now'}
              </button>
              {rescanError && <span className="text-xs text-red-600">{rescanError}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
