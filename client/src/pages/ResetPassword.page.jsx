import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import supabase, { SUPABASE_ANON_KEY } from '@/utils/supabaseInstance'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { login, waitForAuthChange } from '@/api/auth.api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualToken, setManualToken] = useState('')

  const rawQueryToken = searchParams.get('access_token') || searchParams.get('token') || null
  const emailParam = searchParams.get('email') || null

  // parse fragment token if present
  let tokenFromHash = null
  if (typeof window !== 'undefined') {
    try {
      const h = window.location.hash || ''
      if (h && h.length > 1) {
        const hp = new URLSearchParams(h.startsWith('#') ? h.slice(1) : h)
        tokenFromHash = hp.get('access_token') || hp.get('token') || null
      }
    } catch { /* ignore */ }
  }

  const token = rawQueryToken || tokenFromHash || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!password || password.length < 6) return setStatus({ ok: false, message: 'Password must be at least 6 characters' })
    if (password !== confirm) return setStatus({ ok: false, message: 'Passwords do not match' })

    setLoading(true)
    const effectiveToken = manualToken && manualToken.includes('access_token=') ? (new URLSearchParams(manualToken.split('#').slice(1).join('#'))).get('access_token') : (manualToken || token)

    try {
      if (effectiveToken) {
        const FUNC_URL = 'https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/reset-password'
        const resp = await fetch(FUNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}) },
          body: JSON.stringify({ recoveryToken: effectiveToken, newPassword: password, email: emailParam || undefined }),
        })
        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) return setStatus({ ok: false, message: body?.message || 'Failed to reset password via server' })
        setStatus({ ok: true, message: 'Password reset successful.' })
        if (emailParam) {
          try { await login(emailParam, password); await waitForAuthChange(undefined, 3000); navigate('/dashboard'); return } catch { /* ignore */ }
        }
        setTimeout(() => navigate('/login'), 1000)
        return
      }

      const { error } = await supabase.auth.updateUser({ password })
      if (error) return setStatus({ ok: false, message: error.message || 'Failed to reset password' })
      setStatus({ ok: true, message: 'Password reset successful. Please login.' })
      setTimeout(() => navigate('/login'), 1000)
    } catch (err) {
      setStatus({ ok: false, message: err?.message || 'Failed to reset password' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Reset password</h2>
        <div className="mb-3">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="mb-3">
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <div className="mb-3">
          <Label htmlFor="manual">Paste token or link (optional)</Label>
          <Input id="manual" value={manualToken} onChange={(e) => setManualToken(e.target.value)} />
        </div>
        {status && <div className={status.ok ? 'text-green-600' : 'text-red-600'}>{status.message}</div>}
        <div className="mt-4">
          <Button type="submit" disabled={loading}>{loading ? 'Working…' : 'Set new password'}</Button>
        </div>
        <div className="mt-3 text-center text-sm">
          <Link to="/login" className="underline">Back to login</Link>
        </div>
      </form>
    </div>
  )
}

