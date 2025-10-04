import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import supabase from '@/utils/supabaseInstance'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)

    // Validation
    if (!email) return setStatus({ ok: false, message: 'Email is required' })
    if (!otpCode || otpCode.length !== 6) return setStatus({ ok: false, message: 'Please enter a valid 6-digit code' })
    if (!password || password.length < 6) return setStatus({ ok: false, message: 'Password must be at least 6 characters' })
    if (password !== confirm) return setStatus({ ok: false, message: 'Passwords do not match' })

    setLoading(true)

    try {
      console.log('ResetPassword: Verifying recovery OTP for:', email)
      
      // Verify OTP with type 'recovery' for password reset
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'recovery' // Use 'recovery' type for password reset flow
      })

      console.log('ResetPassword: OTP verification response:', { data, error })

      if (error) {
        console.error('ResetPassword: OTP verification error:', error)
        return setStatus({ ok: false, message: error.message || 'Invalid or expired code' })
      }

      // OTP verified, now update the password
      console.log('ResetPassword: OTP verified, updating password')
      setOtpVerified(true)

      const { error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      })

      if (updateError) {
        console.error('ResetPassword: Password update error:', updateError)
        return setStatus({ ok: false, message: updateError.message || 'Failed to update password' })
      }

      console.log('ResetPassword: Password updated successfully')
      setStatus({ ok: true, message: 'Password reset successful! Redirecting to login...' })
      
      // Redirect to login after success
      setTimeout(() => navigate('/login'), 2000)
      
    } catch (err) {
      console.error('ResetPassword: Unexpected error:', err)
      setStatus({ ok: false, message: err?.message || 'Failed to reset password' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-sm sm:max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Reset your password</h2>
              <p className="text-sm text-gray-500">Enter the verification code sent to your email</p>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
                autoComplete="email"
                disabled={otpVerified}
              />
            </div>

            <div>
              <Label htmlFor="otp">Verification Code</Label>
              <Input 
                id="otp" 
                type="text" 
                value={otpCode} 
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="000000" 
                required 
                maxLength={6}
                className="text-center text-lg tracking-widest"
                disabled={otpVerified}
              />
              <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code from your email</p>
            </div>

            <div>
              <Label htmlFor="password">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
                minLength={6}
                disabled={otpVerified}
              />
            </div>

            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input 
                id="confirm" 
                type="password" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                placeholder="••••••••"
                required
                minLength={6}
                disabled={otpVerified}
              />
            </div>

            {status && (
              <div className={status.ok ? 'text-sm text-green-600 p-3 bg-green-50 rounded-md' : 'text-sm text-red-600 p-3 bg-red-50 rounded-md'}>
                {status.message}
              </div>
            )}

            <Button type="submit" className="w-full btn-primary" disabled={loading || otpVerified || !email || otpCode.length !== 6}>
              {loading ? 'Resetting…' : otpVerified ? 'Password Reset!' : 'Reset Password'}
            </Button>

            <div className="text-center text-sm space-y-2">
              <Link to="/forgot-password" className="block text-blue-600 hover:underline">
                Didn't receive a code? Resend
              </Link>
              <Link to="/login" className="block underline">Back to login</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

