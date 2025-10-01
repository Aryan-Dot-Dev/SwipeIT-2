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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setLoading(true)
    try {
      // Ask Supabase to send a password recovery email. Provide redirectTo to route back to the app
  const redirectTo = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) {
        setStatus({ ok: false, message: error.message || 'Failed to send reset email' })
      } else {
        setStatus({ ok: true, message: 'If that email exists we sent a password reset link. Check your inbox.' })
      }
    } catch (err) {
      setStatus({ ok: false, message: err?.message || 'Failed to send reset email' })
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
              <p className="text-sm text-gray-500">Enter your email and we'll send a reset link.</p>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {status && (
              <div className={status.ok ? 'text-sm text-green-600' : 'text-sm text-red-600'}>{status.message}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
            <div className="text-center text-sm">
              <Link to="/login" className="underline">Back to login</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
