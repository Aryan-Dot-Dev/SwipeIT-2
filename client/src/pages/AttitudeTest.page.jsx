import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { questions } from '@/store/questionStore'
import { updateAttitude } from '@/api/update.api'
import { updateAttitudeScore } from '@/api/onboarding.api'
import AttitudeRadar from '@/components/AttitudeRadar'

const TRAIT_COLORS = {
  Collaboration: 'bg-green-600',
  Adaptability: 'bg-indigo-600',
  Innovation: 'bg-green-700',
  'Risk Tolerance': 'bg-yellow-500',
  'Execution Speed': 'bg-indigo-500',
}

const STORAGE_KEY = 'swipeit:attitudeTestData'

const AttitudeTestPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') || 'candidate'

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [attitudeScores, setAttitudeScores] = useState(null)
  const [hasCompletedTest, setHasCompletedTest] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data && data.scores && data.role === role) {
          setHasCompletedTest(true)
          setAttitudeScores(data.scores)
          setShowResults(true)
        }
      }
    } catch (e) {
      console.error('Failed to load stored attitude test data:', e)
    }
  }, [role])

  const roleQuestions = questions[role] || []
  const currentQuestion = roleQuestions[currentQuestionIndex]

  const handleAnswer = (option) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < roleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const scores = { Collaboration: 0, Adaptability: 0, Innovation: 0, 'Risk Tolerance': 0, 'Execution Speed': 0 }

    roleQuestions.forEach(q => {
      const answer = answers[q.id]
      if (answer) {
        const option = q.options.find(o => o.option === answer)
        if (option) {
          q.trait.forEach((trait, index) => {
            scores[trait] += option.scores[index] || 0
          })
        }
      }
    })

    Object.keys(scores).forEach(trait => {
      scores[trait] = Math.round(scores[trait] / roleQuestions.length)
    })

    try {
      const testData = { scores, role, completedAt: new Date().toISOString(), answers }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))
    } catch (e) { console.error('Failed to store attitude test data:', e) }

    try {
      await updateAttitude(scores)
      const userStr = localStorage.getItem('user')
      let userId = null
      if (userStr) {
        try { const userData = JSON.parse(userStr); userId = userData?.id || userData?.user_id || null } catch { /* ignore */ }
      }
      if (userId) await updateAttitudeScore(scores, userId, role)
    } catch (error) { console.error('Failed to update attitude on backend:', error) }

    setAttitudeScores(scores)
    setShowResults(true)
    setHasCompletedTest(true)
    setIsSubmitting(false)
  }

  const handleRetest = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) { console.error(e) }
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setAttitudeScores(null)
    setHasCompletedTest(false)
  }

  const handleBack = () => navigate(-1)

  if (!roleQuestions || roleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg border border-gray-200">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-500 mb-6">No questions found for role: <span className="font-medium capitalize">{role}</span></p>
          <button onClick={handleBack} className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">Go Back</button>
        </div>
      </div>
    )
  }

  // ── Results View ──────────────────────────────────────────────────────────────
  if (showResults && attitudeScores) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  Your <span className="text-green-600">Attitude Profile</span>
                </h1>
                <p className="text-gray-500 mt-1 text-sm">Professional attitude assessment results</p>
              </div>
              <button
                onClick={handleRetest}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retest
              </button>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Attitude Assessment Radar</h2>
            <div className="flex justify-center">
              <AttitudeRadar data={attitudeScores} size={300} levels={5} maxValue={5} />
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(attitudeScores).map(([trait, score]) => (
                <div key={trait} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-700 text-sm">{trait}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-28 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-700 h-2 rounded-full transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-green-700 w-6 text-right text-sm">{score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center pb-4">
            <button onClick={handleBack} className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Already Completed ─────────────────────────────────────────────────────────
  if (hasCompletedTest && !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-100">
            <svg className="w-7 h-7 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Test Already Completed</h2>
          <p className="text-gray-500 text-sm mb-6">You've already completed the attitude test. View your results or retake the test.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowResults(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm">
              View Results
            </button>
            <button onClick={handleRetest} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
              Retest
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Questionnaire ─────────────────────────────────────────────────────────────
  const progress = ((currentQuestionIndex + 1) / roleQuestions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-semibold text-green-700 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Attitude Assessment
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {currentQuestion && `Question ${currentQuestionIndex + 1} of ${roleQuestions.length}`}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">Role: {role}</p>
          </div>
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-xl w-9 h-9 flex items-center justify-center hover:bg-gray-100 focus:outline-none"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-500 to-green-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-5">
          <p className="text-base md:text-lg font-semibold text-gray-800 leading-relaxed">
            {currentQuestion?.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-7">
          {currentQuestion?.options.map(option => {
            const selected = answers[currentQuestion.id] === option.option
            return (
              <label
                key={option.option}
                className={`flex items-start cursor-pointer p-4 border-2 rounded-xl transition-all duration-150 ${selected
                    ? 'bg-green-50 border-green-500 shadow-sm ring-2 ring-green-500/20'
                    : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.option}
                  checked={selected}
                  onChange={() => handleAnswer(option.option)}
                  className="mt-1 w-4 h-4 accent-green-600 focus:ring-0 border-gray-300"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-gray-900 text-sm mb-1">{option.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(option.mapping) ? (
                      option.mapping.map(trait => (
                        <span key={trait} className={`inline-block text-xs px-2 py-0.5 rounded-full text-white font-semibold ${TRAIT_COLORS[trait] || 'bg-gray-400'}`}>
                          {trait}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 italic">{option.mapping}</span>
                    )}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion?.id] || isSubmitting}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentQuestionIndex === roleQuestions.length - 1
              ? (isSubmitting ? 'Submitting...' : '✓ Submit')
              : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttitudeTestPage
