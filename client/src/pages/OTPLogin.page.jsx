import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { sendOtp, verifyOtp } from '@/api/auth.api'
import OTPInput from '@/components/OTPInput'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const OTPLoginPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState('email') // 'email' | 'otp' | 'success'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Start countdown timer for resend
  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await sendOtp(email)
      setStep('otp')
      startResendTimer()
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (otpValue) => {
    setError('')
    setLoading(true)

    try {
      const result = await verifyOtp(email, otpValue)
      
      if (result?.session) {
        setStep('success')
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } else {
        setError('Invalid OTP. Please try again.')
        setOtp('')
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setError('')
    setLoading(true)
    try {
      await sendOtp(email)
      startResendTimer()
      setOtp('')
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5]">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          {step !== 'success' && (
            <button
              onClick={() => step === 'otp' ? setStep('email') : navigate('/login')}
              className="flex items-center gap-2 text-[#6E6B86] hover:text-[#9A8CF2] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#E4DFF5] p-8">
            {/* Email Step */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#1C1A2E] mb-2">
                    Sign in with OTP
                  </h1>
                  <p className="text-[#6E6B86] text-sm">
                    Enter your email to receive a one-time password
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#1C1A2E] mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-[#E4DFF5] rounded-xl focus:border-[#6ED7A5] focus:ring-4 focus:ring-[#6ED7A5]/20 transition-all duration-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-[#6E6B86]">
                  Prefer password?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[#9A8CF2] hover:text-[#6ED7A5] font-medium underline underline-offset-2 transition-colors"
                  >
                    Sign in with password
                  </button>
                </div>
              </>
            )}

            {/* OTP Verification Step */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-[#1C1A2E] mb-2">
                    Enter OTP
                  </h1>
                  <p className="text-[#6E6B86] text-sm">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-[#1C1A2E] font-medium text-sm mt-1">
                    {email}
                  </p>
                </div>

                <div className="space-y-6">
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                      {error}
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-[#6E6B86] text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-[#6E6B86] mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendOTP}
                      disabled={resendTimer > 0 || loading}
                      className="text-[#9A8CF2] hover:text-[#6ED7A5] font-medium text-sm underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                    >
                      {resendTimer > 0 
                        ? `Resend in ${resendTimer}s` 
                        : 'Resend OTP'
                      }
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#1C1A2E] mb-2">
                  Success!
                </h1>
                <p className="text-[#6E6B86]">
                  Redirecting to your dashboard...
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {step === 'email' && (
            <p className="mt-6 text-center text-xs text-[#6E6B86]">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-[#9A8CF2] hover:text-[#6ED7A5] underline underline-offset-2">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[#9A8CF2] hover:text-[#6ED7A5] underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OTPLoginPage
