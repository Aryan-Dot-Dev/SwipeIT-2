import React, { useRef, useEffect } from 'react'

const OTPInput = ({ length = 6, value, onChange, onComplete, disabled = false }) => {
  const inputRefs = useRef([])

  useEffect(() => {
    // Auto-focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    // Check if OTP is complete
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index, digit) => {
    // Only allow digits
    if (!/^\d*$/.test(digit)) return

    const newValue = value.split('')
    newValue[index] = digit
    const updatedValue = newValue.join('')

    onChange(updatedValue)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault()
      
      if (value[index]) {
        // Clear current digit
        const newValue = value.split('')
        newValue[index] = ''
        onChange(newValue.join(''))
      } else if (index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus()
        const newValue = value.split('')
        newValue[index - 1] = ''
        onChange(newValue.join(''))
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    
    // Only allow digits
    if (!/^\d+$/.test(pastedData)) return

    onChange(pastedData)

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-12 h-14 sm:w-14 sm:h-16 
            text-center text-2xl font-bold 
            border-2 rounded-xl
            transition-all duration-200
            ${value[index] 
              ? 'border-[#6ED7A5] bg-[#6ED7A5]/5' 
              : 'border-[#E4DFF5] bg-white'
            }
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:border-[#9A8CF2] focus:border-[#6ED7A5] focus:ring-4 focus:ring-[#6ED7A5]/20'
            }
            focus:outline-none
            text-[#1C1A2E]
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

export default OTPInput
