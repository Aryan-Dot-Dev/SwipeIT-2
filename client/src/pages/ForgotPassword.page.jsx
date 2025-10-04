import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import supabase from '@/utils/supabaseInstance'
import { Link } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      // Use resetPasswordForEmail but Supabase will send OTP if configured in dashboard
      // To force OTP: Go to Supabase Dashboard -> Authentication -> Email Templates -> Change Password
      // and enable "Secure email change" which uses OTP instead of magic links
      console.log('ForgotPassword: Requesting password reset OTP for:', email)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined // Don't use redirect URL, force OTP mode
      })
      
      console.log('ForgotPassword: Reset password response:', { data, error })
      
      if (error) {
        console.error('ForgotPassword: Error sending reset request:', error)
        setStatus({ ok: false, message: error.message || 'Failed to send verification code' })
      } else {
        console.log('ForgotPassword: Reset request sent successfully')
        setOtpSent(true)
        setStatus({ ok: true, message: 'If that email exists, we sent a 6-digit verification code. Check your inbox.' })
        // Redirect to reset password page with email
        setTimeout(() => {
          window.location.href = `/reset-password?email=${encodeURIComponent(email)}`
        }, 2000)
      }
    } catch (err) {
      console.error('ForgotPassword: Unexpected error:', err)
      setStatus({ ok: false, message: err?.message || 'Failed to send verification code' })
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
              <h2 className="text-xl font-semibold">Forgot your password?</h2>
              <p className="text-sm text-gray-500">Enter your email and we'll send a verification code.</p>
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
                disabled={otpSent}
              />
            </div>
            {status && (
              <div className={status.ok ? 'text-sm text-green-600 p-3 bg-green-50 rounded-md' : 'text-sm text-red-600 p-3 bg-red-50 rounded-md'}>
                {status.message}
                {status.ok && otpSent && (
                  <div className="mt-2 text-xs">Redirecting to password reset page...</div>
                )}
              </div>
            )}
            <Button type="submit" className="w-full btn-primary" disabled={loading || !email || otpSent}>
              {loading ? 'Sending…' : otpSent ? 'Code Sent' : 'Send verification code'}
            </Button>
            <div className="text-center text-sm">
              <Link to="/login" className="underline">Back to login</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
