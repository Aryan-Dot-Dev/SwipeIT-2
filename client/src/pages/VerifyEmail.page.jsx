import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { verifyOtp, sendOtp } from '@/api/auth.api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email] = useState(searchParams.get('email') || '')
  const [role]  = useState(searchParams.get('role')  || '')
  const [name]  = useState(searchParams.get('name')  || '')

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [status, setStatus] = useState(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) return setStatus({ ok: false, message: 'Enter the 6-digit code from your email' })
    setLoading(true)
    setStatus(null)
    try {
      // Use custom Edge Function OTP verification (type='signup')
      const data = await verifyOtp(email, otp, 'signup')
      // Cookies are set inside verifyOtp()
      setStatus({ ok: true, message: 'Email verified! Redirecting...' })
      // Persist role/name for onboarding
      try {
        if (role) localStorage.setItem('onboarding_role', role)
        if (name) localStorage.setItem('signup_name', name)
        if (email) localStorage.setItem('signup_email', email)
      } catch { /* ignore */ }
      setTimeout(() => navigate('/onboarding'), 1200)
    } catch (err) {
      setStatus({ ok: false, message: err?.message || 'Invalid or expired code. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return
    setResending(true)
    setStatus(null)
    try {
      await sendOtp(email, 'signup')
      setStatus({ ok: true, message: 'New code sent! Check your inbox.' })
      setCountdown(60)
    } catch (err) {
      setStatus({ ok: false, message: err?.message || 'Failed to resend. Try again.' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#9A8CF2,#6ED7A5)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Verify your email</h1>
          <p className="text-center text-gray-500 text-sm mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-center font-semibold text-gray-800 mb-6 text-sm">{email}</p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-[0.5em] font-bold mt-1"
                autoFocus
                disabled={loading}
              />
            </div>

            {status && (
              <div className={`text-sm p-3 rounded-lg ${status.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {status.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              style={{ background: 'linear-gradient(135deg,#9A8CF2,#6ED7A5)' }}
              disabled={loading || otp.length !== 6}
            >
              {loading
                ? <span className="flex items-center gap-2 justify-center"><LoadingSpinner size="sm" text="" /> Verifying...</span>
                : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: '#9A8CF2' }}
            >
              {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>

          <p className="mt-4 text-xs text-center text-gray-400">
            Make sure to check your spam folder too.
          </p>
        </div>
      </div>
    </div>
  )
}
