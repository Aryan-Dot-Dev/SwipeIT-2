import React, { useState } from 'react'
import { questions } from '@/store/questionStore'
import { updateAttitude } from '@/api/update.api'

const TRAIT_COLORS = {
  Collaboration: 'bg-fuchsia-500',
  Adaptability: 'bg-[color:var(--primary)]',
  Innovation: 'bg-purple-500',
  'Risk Tolerance': 'bg-yellow-500',
  'Execution Speed': 'bg-[color:var(--primary)]',
}

const AttitudeForm = ({ role, onSubmit, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      await updateAttitude(scores)
      await onSubmit(scores)
    } catch (error) {
      console.error('Failed to update attitude:', error)
      // Optionally show an error message to the user
    }
    setIsSubmitting(false)
    onClose()
  }

  if (!currentQuestion) {
    return <div>No questions available for this role.</div>
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-[color:var(--primary)]/10 to-[color:var(--secondary)]/10 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 relative animate-in fade-in">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 transition-colors rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring focus:ring-[color:var(--primary)]/20"
          aria-label="Close"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center mb-4">
          <div className="flex-1">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-[color:var(--primary)] h-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / roleQuestions.length) * 100}%`
                }}
              />
            </div>
          </div>
          <span className="ml-3 text-xs text-gray-500 font-medium">
            {currentQuestionIndex + 1} / {roleQuestions.length}
          </span>
        </div>

        <div className="mb-3">
          <h2 className="text-2xl font-semibold mb-1 text-gray-800 tracking-tight">
            Attitude Assessment
          </h2>
          <p className="text-sm text-gray-500">
            {currentQuestion.question}
          </p>
        </div>

        <div className="grid gap-3 mb-7 mt-5">
          {currentQuestion.options.map(option => (
            <label
              key={option.option}
              className={`group flex items-start cursor-pointer p-4 border rounded-lg transition-all duration-200
                  ${answers[currentQuestion.id] === option.option
                    ? "bg-[color:var(--card)] border-[color:var(--border)] shadow-sm ring-2 ring-[color:var(--primary)]/10"
                    : "bg-white border-gray-200 hover:border-[color:var(--primary)]/30"}
                `}
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.option}
                checked={answers[currentQuestion.id] === option.option}
                onChange={() => handleAnswer(option.option)}
                  className="mt-1 accent-[color:var(--primary)] focus:ring-0 border-gray-300"
              />
              <div className="ml-4">
                <div className="font-semibold text-gray-900">{option.description}</div>
                <div className="flex gap-1 mt-1">
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
                    <span className="text-xs text-gray-500">{option.mapping}</span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex w-full gap-4 mt-2">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id] || isSubmitting}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-[color:var(--primary)] hover:bg-[color:var(--primary)]/90 shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AttitudeForm
