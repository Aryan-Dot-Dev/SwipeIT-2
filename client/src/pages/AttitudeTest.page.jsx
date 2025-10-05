import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { questions } from '@/store/questionStore'
import { updateAttitude } from '@/api/update.api'
import { updateAttitudeScore } from '@/api/onboarding.api'
import AttitudeRadar from '@/components/AttitudeRadar'

const TRAIT_COLORS = {
  Collaboration: 'bg-fuchsia-500',
  Adaptability: 'bg-[color:var(--primary)]',
  Innovation: 'bg-purple-500',
  'Risk Tolerance': 'bg-yellow-500',
  'Execution Speed': 'bg-[color:var(--primary)]',
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

  // Check if user has already completed the test
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
    
    // Calculate scores
    const scores = { 
      Collaboration: 0, 
      Adaptability: 0, 
      Innovation: 0, 
      'Risk Tolerance': 0, 
      'Execution Speed': 0 
    }
    
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
    
    // Normalize scores
    Object.keys(scores).forEach(trait => {
      scores[trait] = Math.round(scores[trait] / roleQuestions.length)
    })

    // Store in localStorage
    try {
      const testData = {
        scores,
        role,
        completedAt: new Date().toISOString(),
        answers
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData))
    } catch (e) {
      console.error('Failed to store attitude test data:', e)
    }

    // Call backend APIs
    try {
      await updateAttitude(scores)
      
      // Try to get user ID from session/storage
      const userStr = localStorage.getItem('user')
      let userId = null
      if (userStr) {
        try {
          const userData = JSON.parse(userStr)
          userId = userData?.id || userData?.user_id || null
        } catch { /* ignore */ }
      }
      
      if (userId) {
        await updateAttitudeScore(scores, userId, role)
      }
    } catch (error) {
      console.error('Failed to update attitude on backend:', error)
    }

    setAttitudeScores(scores)
    setShowResults(true)
    setHasCompletedTest(true)
    setIsSubmitting(false)
  }

  const handleRetest = () => {
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Failed to remove stored attitude test data:', e)
    }
    
    // Reset state
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowResults(false)
    setAttitudeScores(null)
    setHasCompletedTest(false)
  }

  const handleBack = () => {
    navigate(-1)
  }

  if (!roleQuestions || roleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-6">No questions found for role: {role}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show results view if test is completed
  if (showResults && attitudeScores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Your Attitude Profile
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's your professional attitude assessment
                </p>
              </div>
              <button
                onClick={handleRetest}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                title="Retake the test"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Retest
              </button>
            </div>
          </div>

          {/* Spider Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Attitude Assessment Results
            </h2>
            <div className="flex justify-center">
              <AttitudeRadar data={attitudeScores} size={300} levels={5} maxValue={5} />
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Score Breakdown</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(attitudeScores).map(([trait, score]) => (
                <div key={trait} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{trait}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-purple-600 w-8 text-right">{score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleBack}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show warning if user has already completed the test
  if (hasCompletedTest && !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Already Completed</h2>
          <p className="text-gray-600 mb-6">
            You've already completed the attitude test. Click "View Results" to see your scores or "Retest" to take the test again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowResults(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Results
            </button>
            <button
              onClick={handleRetest}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Retest
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show the questionnaire
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center py-8 px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Attitude Assessment
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Role: <span className="font-medium capitalize">{role}</span>
            </p>
          </div>
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-full w-10 h-10 flex items-center justify-center focus:outline-none focus:ring focus:ring-purple-500/20"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center mb-6">
          <div className="flex-1">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / roleQuestions.length) * 100}%`
                }}
              />
            </div>
          </div>
          <span className="ml-3 text-sm text-gray-500 font-medium">
            {currentQuestionIndex + 1} / {roleQuestions.length}
          </span>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
            Question {currentQuestionIndex + 1}
          </h2>
          <p className="text-base md:text-lg text-gray-600">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-8">
          {currentQuestion.options.map(option => (
            <label
              key={option.option}
              className={`group flex items-start cursor-pointer p-4 border-2 rounded-xl transition-all duration-200
                ${answers[currentQuestion.id] === option.option
                  ? "bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-500/20"
                  : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"}
              `}
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.option}
                checked={answers[currentQuestion.id] === option.option}
                onChange={() => handleAnswer(option.option)}
                className="mt-1 accent-purple-600 focus:ring-0 border-gray-300 w-4 h-4"
              />
              <div className="ml-4 flex-1">
                <div className="font-semibold text-gray-900 mb-1">{option.description}</div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(option.mapping) ? (
                    option.mapping.map(trait => (
                      <span
                        key={trait}
                        className={`inline-block text-xs px-2 py-0.5 rounded-full text-white font-semibold ${TRAIT_COLORS[trait] || "bg-gray-400"}`}
                      >
                        {trait}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">{option.mapping}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="flex-1 px-5 py-3 rounded-lg border-2 border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || isSubmitting}
            className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentQuestionIndex === roleQuestions.length - 1
              ? isSubmitting ? 'Submitting...' : 'Submit'
              : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AttitudeTestPage
