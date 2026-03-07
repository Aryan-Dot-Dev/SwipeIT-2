import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance";
import { listenToNotifications } from "./notifications.api";

const REMOTE_FUNCTIONS_URL = "https://guzggqrlaexecpzyesxm.supabase.co/functions/v1"

async function signup(email, password, role, name, phone) {
  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/signup`, {
    method: "POST",
    // headers: buildJsonHeaders(),
    body: JSON.stringify({ email, password, role, name, phone }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || data?.message || `Signup failed (${res.status})`;
    console.error("Signup failed:", message);
    return { error: message, status: res.status };
  }

  // Do NOT set cookies here — session is pre-verification.
  // Cookies will be set after OTP verification in VerifyEmail page.
  return { session: data.session || null, user: data.user || null, profile: data.profile || null };
}


async function login(email, password) {
  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/login`, {
    method: "POST",
    // headers: buildJsonHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("Login failed:", data.error);
    return null;
  }

  // Save session tokens in cookies
  try {
    document.cookie = `access_token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
    if (data.session.refresh_token) document.cookie = `refresh_token=${encodeURIComponent(data.session.refresh_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
  } catch { /* ignore */ }
  // Ensure supabase client initializes the session right away so subsequent RPCs/readers see the new user
  try {
    await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  } catch (err) {
    // non-fatal
    console.warn('supabase.setSession failed', err)
  }
  try {
    // try to get current user from supabase client and include in event detail
    try {
      const userResp = await supabase.auth.getUser()
      const user = userResp?.data?.user || null
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: data.session.access_token, user } }))
      // start notifications for this user (clear previous if present)
      try {
        const clearPrev = window.__notifications_unsub
        if (clearPrev) {
          try { if (typeof clearPrev === 'function') clearPrev(); else if (clearPrev.unsubscribe) clearPrev.unsubscribe(); } catch { /* ignore */ }
          window.__notifications_unsub = null
        }
        // listenToNotifications may return a promise or a channel object; normalize via Promise.resolve
        Promise.resolve(listenToNotifications(user?.id)).then((sub) => { window.__notifications_unsub = sub }).catch(() => { })
      } catch { /* ignore */ }
    } catch {
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: data.session.access_token } }))
    }
  } catch { /* ignore */ }

  // listenToNotifications(session.user.id)
  return data;
}

async function restoreSession() {
  // Read refresh token from cookie
  const getCookie = (name) => {
    try { const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null } catch { return null }
  }
  const refresh_token = getCookie('refresh_token')
  if (!refresh_token) return null;

  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/refresh-session`, {
    method: "POST",
    // headers: buildJsonHeaders(),
    body: JSON.stringify({ refresh_token }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("Session refresh failed:", data.error);
    try { document.cookie = 'access_token=; path=/; max-age=0' } catch { /* ignore */ }
    try { document.cookie = 'refresh_token=; path=/; max-age=0' } catch { /* ignore */ }
    return null;
  }

  // replace cookies
  try {
    document.cookie = `access_token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
    if (data.session.refresh_token) document.cookie = `refresh_token=${encodeURIComponent(data.session.refresh_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
  } catch { /* ignore */ }
  try {
    await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  } catch (err) {
    console.warn('supabase.setSession failed', err)
  }
  try {
    const userResp = await supabase.auth.getUser()
    const user = userResp?.data?.user || null
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: data.session.access_token, user } }))
    try {
      const clearPrev = window.__notifications_unsub
      if (clearPrev) {
        try { if (typeof clearPrev === 'function') clearPrev(); else if (clearPrev.unsubscribe) clearPrev.unsubscribe(); } catch { /* ignore */ }
        window.__notifications_unsub = null
      }
      Promise.resolve(listenToNotifications(user?.id)).then((sub) => { window.__notifications_unsub = sub }).catch(() => { })
    } catch { /* ignore */ }
  } catch {
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: data.session.access_token } }))
  }

  return data;
}

async function logout() {
  // Client-side logout: clear cookies, sign out from Supabase, and redirect
  // No server call needed - Supabase handles session invalidation
  try {
    // Clear cookies
    try { document.cookie = 'access_token=; path=/; max-age=0' } catch { /* ignore */ }
    try { document.cookie = 'refresh_token=; path=/; max-age=0' } catch { /* ignore */ }
    
    // Sign out from Supabase (invalidates session server-side)
    try { await supabase.auth.signOut() } catch (err) { console.warn('supabase.auth.signOut failed', err) }
    
    // Notify app of auth change
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: null, user: null } })) } catch { /* ignore */ }
    
    // Unsubscribe from notifications
    try {
      const unsub = window.__notifications_unsub
      if (unsub) {
        try { if (typeof unsub === 'function') unsub(); else if (unsub.unsubscribe) unsub.unsubscribe(); } catch { /* ignore */ }
        window.__notifications_unsub = null
      }
    } catch { /* ignore */ }
    
    // Redirect to home
    window.location.href = "/";
  } catch (err) {
    console.error("Logout error:", err);
    // Even if there's an error, try to redirect
    window.location.href = "/";
  }
}

async function updateCProfile(profileData) {
  const access_token = getAccessToken()
  const { user_id, ...profileDetails } = profileData;
  const response = await supabase.rpc('update_candidate_profile', {
    p_payload: {
      user_id: user_id,
      profileData: profileDetails
    }
  }, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  return response;
}

async function myProfile() {
  const access_token = getAccessToken()
  // console.log(access_token)
  const response = await supabase.rpc('get_current_user', {}, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  return response;
}

// ─── Custom OTP Auth (via Brevo Edge Functions) ───────────────
async function sendOtp(email, type = 'login') {
  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Failed to send OTP')
  return true
}

async function verifyOtp(email, code, type = 'login') {
  // Step 1 — verify OTP against our custom table via Edge Function
  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, type }),
  })
  const result = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(result?.error || 'Invalid or expired code')

  const { hashed_token } = result
  if (!hashed_token) throw new Error('No token returned from verify-otp')

  // Step 2 — exchange hashed_token for a real Supabase session
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: hashed_token,
    type: 'magiclink',
  })
  if (error) throw new Error(error.message)

  const session = data?.session
  if (!session) throw new Error('No session returned')

  // Persist tokens in cookies
  try {
    document.cookie = `access_token=${encodeURIComponent(session.access_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
    if (session.refresh_token) document.cookie = `refresh_token=${encodeURIComponent(session.refresh_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
  } catch { /* ignore */ }

  // Set supabase client session
  try { await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }) } catch { /* ignore */ }

  // Notify app
  try {
    const user = data?.user || null
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: session.access_token, user } }))
    try {
      Promise.resolve(listenToNotifications(user?.id)).then((sub) => { window.__notifications_unsub = sub }).catch(() => { })
    } catch { /* ignore */ }
  } catch { /* ignore */ }

  return data
}

export { login, signup, restoreSession, logout, myProfile, updateCProfile, sendOtp, verifyOtp };


// Wait for auth token to appear or for auth:changed event (used by UI to delay navigation until cookies are set)
export async function waitForAuthChange(prevToken = undefined, timeout = 2500) {
  return new Promise((resolve) => {
    try {
      const readToken = () => getAccessToken() || null
      const initial = prevToken !== undefined ? prevToken : readToken()

      // If token already differs from initial, resolve immediately
      if (readToken() !== initial) return resolve(true)

      let done = false
      const handler = () => {
        try {
          const t = readToken()
          if (t !== initial) {
            if (!done) { done = true; try { window.removeEventListener('auth:changed', handler) } catch { /* ignore */ }; resolve(true) }
          }
        } catch { /* ignore */ }
      }

      try { window.addEventListener('auth:changed', handler) } catch { /* ignore */ }
      const _T = setTimeout(() => {
        if (!done) { done = true; try { window.removeEventListener('auth:changed', handler) } catch { /* ignore */ }; resolve(readToken() !== initial) }
      }, Number(timeout) || 2500)
    } catch {
      resolve(false)
    }
  })
}