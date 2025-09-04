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

  // Expecting { session, profile } from the Edge function
  if (data.session) {
    // persist tokens in cookies for cross-tab/session persistence
    try {
      document.cookie = `access_token=${encodeURIComponent(data.session.access_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
      if (data.session.refresh_token) document.cookie = `refresh_token=${encodeURIComponent(data.session.refresh_token)}; path=/; max-age=${60 * 60 * 24 * 30}`
    } catch { /* ignore */ }
  }

  return { session: data.session || null, profile: data.profile || null };
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
            Promise.resolve(listenToNotifications(user?.id)).then((sub) => { window.__notifications_unsub = sub }).catch(() => {})
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
        Promise.resolve(listenToNotifications(user?.id)).then((sub) => { window.__notifications_unsub = sub }).catch(() => {})
      } catch { /* ignore */ }
    } catch {
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: data.session.access_token } }))
    }

  return data;
}

async function logout() {
  const getCookie = (name) => { try { const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null } catch { return null } }
  const access_token = getCookie('access_token')
  if (!access_token) return;

  const res = await fetch(`${REMOTE_FUNCTIONS_URL}/logout`, {
    method: "POST",
    // headers: buildJsonHeaders(),
    body: JSON.stringify({ access_token }),
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  const data = await res.json();

  if (data.success) {
  try { document.cookie = 'access_token=; path=/; max-age=0' } catch { /* ignore */ }
  try { document.cookie = 'refresh_token=; path=/; max-age=0' } catch { /* ignore */ }
    try {
      // also clear supabase client session
      try { await supabase.auth.signOut() } catch { /* ignore */ }
    } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent('auth:changed', { detail: { token: null, user: null } })) } catch { /* ignore */ }
    // Unsubscribe notifications on logout
    try {
      const unsub = window.__notifications_unsub
      if (unsub) {
        try { if (typeof unsub === 'function') unsub(); else if (unsub.unsubscribe) unsub.unsubscribe(); } catch { /* ignore */ }
        window.__notifications_unsub = null
      }
    } catch { /* ignore */ }
    window.location.href = "/";
  } else {
    console.error("Logout failed:", data.error);
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
  const response = await supabase.rpc('get_current_user', {},{
    headers: {Authorization: `Bearer ${access_token}`}
  });
  return response;
}

export { login, signup, restoreSession, logout, myProfile, updateCProfile };

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
            if (!done) { done = true; try { window.removeEventListener('auth:changed', handler) } catch { /* ignore */ } ; resolve(true) }
          }
        } catch { /* ignore */ }
      }

      try { window.addEventListener('auth:changed', handler) } catch { /* ignore */ }
      const _T = setTimeout(() => {
        if (!done) { done = true; try { window.removeEventListener('auth:changed', handler) } catch { /* ignore */ } ; resolve(readToken() !== initial) }
      }, Number(timeout) || 2500)
    } catch {
      resolve(false)
    }
  })
}