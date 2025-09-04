import React from 'react'

// Enhanced resume details viewer with modern design
export default function ResumeDetails({ resume }) {
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

  const filename = resume.filename || resume.name || resume.file_name || resume.originalName || 'resume'
  const publicUrl = resume.publicUrl || resume.publicURL || resume.url || resume.public_url || resume.file_url || null

  const aiReport = resume.ai_report || resume.aiReport || resume.ai || null
  let rawResponse = null
  let parsedAi = null
  let analysisTimestamp = null
  let extractedTextLength = null
  if (aiReport) {
    try {
      const report = typeof aiReport === 'string' ? JSON.parse(aiReport) : aiReport
      rawResponse = report.raw_response || report.rawResponse || report.raw || null
      parsedAi = rawResponse || report.structured_data || report.structuredData || report
      analysisTimestamp = report.analysis_timestamp || report.analysisTimestamp || report.timestamp || null
      extractedTextLength = report.extracted_text_length || report.extractedTextLength || report.extracted_length || null
      if (typeof parsedAi === 'string') {
        try { parsedAi = JSON.parse(parsedAi) } catch { /* leave as string */ }
      }
    } catch {
      parsedAi = null
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[color:var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--primary-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)]">Resume Analysis</h3>
              <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] truncate">{filename}</p>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-xs text-[color:var(--muted-foreground)]">
              {analysisTimestamp && `Analyzed ${new Date(analysisTimestamp).toLocaleDateString()}`}
            </div>
            {extractedTextLength && (
              <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
                {extractedTextLength} characters extracted
              </div>
            )}
          </div>
        </div>

        {publicUrl && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[color:var(--muted)] rounded-lg gap-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Resume File</span>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[color:var(--primary)] hover:text-[color:var(--primary)]/80 font-medium flex items-center space-x-1"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {parsedAi.strengths_and_highlights && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)]">Strengths & Highlights</h4>
              </div>
              <ul className="space-y-2">
                {parsedAi.strengths_and_highlights.map((strength, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-[color:var(--foreground)]">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.scope_of_improvement && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)]">Areas for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {parsedAi.scope_of_improvement.map((improvement, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-[color:var(--foreground)]">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.what_makes_others_stand_out && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)]">Competitive Advantages</h4>
              </div>
              <ul className="space-y-2">
                {parsedAi.what_makes_others_stand_out.map((advantage, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-[color:var(--foreground)]">{advantage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parsedAi.what_makes_this_candidate_the_best && (
            <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)]">Your Unique Value</h4>
              </div>
              <ul className="space-y-2">
                {parsedAi.what_makes_this_candidate_the_best.map((value, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm text-[color:var(--foreground)]">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] p-4 sm:p-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 bg-[color:var(--muted)] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[color:var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-base sm:text-lg font-semibold text-[color:var(--foreground)] mb-2">AI Analysis Pending</h4>
            <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">Your resume is being analyzed. Check back soon for detailed insights.</p>
          </div>
        </div>
      )}
    </div>
  )
}
