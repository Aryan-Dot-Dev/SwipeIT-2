import { fetchAppliedJobs } from '@/api/candidate.api'
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getCurrentUser } from '@/utils/supabaseInstance'
import { getAccessToken } from '@/utils/cookieInstance'
import { myProfile, logout as apiLogout } from '@/api/auth.api'
import { listenToNotifications } from '@/api/notifications.api'
import SavedJobsPage from '@/components/SavedJobsPage'
import CandidateDashboard from './CandidateDashboard.page'
import RecruiterDashboard from './RecruiterDashboard.page'
// simple CSS-based transitions used instead of framer-motion swipe
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import SettingsPage from './Settings.page'
import Chat from '@/components/Chat'
import AttitudeForm from '@/components/AttitudeForm'
import JobPostingForm from '@/components/JobPostingForm'
import { updateAttitudeScore } from '@/api/onboarding.api'
import { generateJobEmbeddingText } from '@/lib/embeddings'
import { createEmbedding } from '@/api/embeddings.api.js'
import { createJobPosting_V2 as createJobPosting } from '@/api/recruiter.api.js'
// SimpleTransition: small wrapper that applies a CSS fade+slide when children change
const SimpleTransition = ({ children }) => {
  const ref = React.useRef(null)
  React.useEffect(() => {
    // ensure styles exist once
    if (typeof document === 'undefined') return
    if (!document.getElementById('simple-transition-styles')) {
      const style = document.createElement('style')
      style.id = 'simple-transition-styles'
      style.textContent = `
        .transition-panel { position: relative; }
        .transition-panel > * { transition: opacity 260ms ease, transform 260ms ease; }
        .transition-enter { opacity: 0; transform: translateY(6px); }
        .transition-enter-active { opacity: 1; transform: translateY(0); }
        .transition-exit { opacity: 1; transform: translateY(0); }
        .transition-exit-active { opacity: 0; transform: translateY(-6px); }
      `
      document.head.appendChild(style)
    }
  }, [])

  // simple enter transition on mount/update
  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    // apply enter class to immediate child
    const child = node.firstElementChild
    if (!child) return
    child.classList.add('transition-enter')
    requestAnimationFrame(() => {
      child.classList.add('transition-enter-active')
      child.classList.remove('transition-enter')
    })
    return () => {
      if (child && child.classList) child.classList.remove('transition-enter-active')
    }
  }, [children])

  return <div ref={ref} className="transition-panel">{children}</div>
}

function readCookie(name) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}

const Dashboard = ({ userId: propUserId }) => {
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(propUserId || null)
  const [currentUser, setCurrentUser] = useState(null)
  const [headerName, setHeaderName] = useState(null)
  const [userProfileImage, setUserProfileImage] = useState(null)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [attitudeFormOpen, setAttitudeFormOpen] = useState(false)
  const [savedJobs, setSavedJobs] = useState([])
  const [highlightSavedId, setHighlightSavedId] = useState(null)
  // Initialize current view from localStorage when possible so the user's last
  // active dashboard page survives a refresh. Fallback to 'candidate'.
  const getInitialView = () => {
    try {
      if (typeof window === 'undefined') return 'candidate'
      const v = localStorage.getItem('swipeit:dashboardView')
      return v || 'candidate'
    } catch {
      return 'candidate'
    }
  }
  const [currentView, setCurrentView] = useState(() => getInitialView())
  const [candidateInitialTab, setCandidateInitialTab] = useState('jobs')
  const [authToken, setAuthToken] = useState(() => getAccessToken() || readCookie('access_token'))
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [filters, setFilters] = useState({ keyword: '', location: '', industry: '', minSimilarity: 0 })

  // Helper: validate whether a particular view is allowed for the given role.
  // This prevents restoring a recruiter-only view for candidates (and vice versa).
  const isViewAllowedForRole = (view, role) => {
    if (!view) return false
    const recruiterOnly = new Set(['dashboard', 'candidates'])
    const candidateOnly = new Set(['candidate', 'resume'])
    if (!role) return true
    const looksLikeRecruiter = String(role).toLowerCase().includes('recruit') || role === 'recruiter'
    if (looksLikeRecruiter) {
      // recruiter may also access 'saved', 'chat', 'settings'
      return true // allow everything but enforce stricter mapping below if needed
    }
    // candidate: disallow recruiter-only views
    if (candidateOnly.has(view)) return true
    if (recruiterOnly.has(view)) return false
    return true
  }

  // Persist currentView to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && currentView) {
        localStorage.setItem('swipeit:dashboardView', currentView)
      }
    } catch {
      // ignore storage errors
    }
  }, [currentView])

  // When role becomes known, ensure the restored view is valid for the role.
  useEffect(() => {
    try {
      if (!role) return
      // if current view is invalid for this role, pick a sensible fallback
      if (!isViewAllowedForRole(currentView, role)) {
        if (String(role).toLowerCase().includes('recruit')) setCurrentView('dashboard')
        else setCurrentView('candidate')
      }
    } catch {
      /* ignore */
    }
  }, [role, currentView])

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      if (event.detail?.profileImage) {
        setUserProfileImage(event.detail.profileImage);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
      }
    };
  }, []);

  // On page load (or when userId becomes available) try to fetch applied/saved jobs
  useEffect(() => {
    let mounted = true
    // Only fetch after we know the user's role and only for candidates.
    if (!userId) return
    if (role !== 'candidate') return

      ; (async () => {
        try {
          const applied = await fetchAppliedJobs(userId, readCookie('access_token'))
          console.log('fetchAppliedJobs (on load) returned:', applied)
          if (mounted && Array.isArray(applied)) setSavedJobs(applied)
        } catch (err) {
          console.error('fetchAppliedJobs failed on load', err)
        }
      })()

    return () => { mounted = false }
  }, [userId, role])

  // Watch auth token (cookie or storage) so we re-resolve role/profile when user switches accounts
  useEffect(() => {
    let mounted = true

    const updateToken = async () => {
      try {
        let token = null
        if (typeof window !== 'undefined' && window.cookieStore && cookieStore.get) {
          try {
            const c = await cookieStore.get('access_token')
            token = c?.value || null
            if (token) document.cookie = `access_token=${encodeURIComponent(token)}; path=/`
          } catch {
            token = null
          }
        }
        if (!token) token = getAccessToken() || readCookie('access_token')
        if (!mounted) return
        setAuthToken(prev => (prev !== token ? token : prev))
      } catch {
        // ignore
      }
    }

    // initial read
    updateToken()

    // Prefer cookieStore change events when available, otherwise poll periodically.
    // Also listen for our custom window 'auth:changed' event to update immediately after login/logout.
    let iv = null
    const boundUpdate = updateToken
    if (typeof window !== 'undefined') {
      try { window.addEventListener('auth:changed', boundUpdate) } catch { /* ignore */ }
    }

    // Also listen for detailed auth change events so we can update role/user immediately
    const onAuthChanged = async (ev) => {
      try {
        const detail = ev?.detail || {}
        const token = detail?.token || null
        const user = detail?.user || null
        // update authToken state so other effects run
        setAuthToken(token)

        if (user) {
          // determine role quickly from provided user object
          const looksLikeRecruiter = !!(user?.recruiter || (user?.company && (user.company.id || user.company.name)))
          if (looksLikeRecruiter) {
            setRole('recruiter')
            setCurrentUser(user)
            setUserId(user.id || user.user_id || null)
            setSavedJobs([])
            return
          } else {
            setRole('candidate')
            setCurrentUser(user)
            const uid = user.id || user.user_id || null
            setUserId(uid)
            try {
              if (uid) {
                const applied = await fetchAppliedJobs(uid, readCookie('access_token'))
                if (Array.isArray(applied)) setSavedJobs(applied)
              }
            } catch (err) {
              console.error('fetchAppliedJobs failed (auth:changed)', err)
            }
            return
          }
        }
      } catch {
        /* ignore */
      }
    }
    try { if (typeof window !== 'undefined') window.addEventListener('auth:changed', onAuthChanged) } catch { /* ignore */ }

    if (typeof window !== 'undefined' && window.cookieStore && cookieStore.addEventListener) {
      try { cookieStore.addEventListener('change', updateToken) } catch { /* ignore */ }
    } else {
      iv = setInterval(updateToken, 1500)
    }

    return () => {
      mounted = false;
      if (iv) clearInterval(iv);
      try { if (typeof window !== 'undefined' && window.cookieStore && cookieStore.removeEventListener) cookieStore.removeEventListener('change', updateToken) } catch { /* ignore */ }
      try { if (typeof window !== 'undefined') window.removeEventListener('auth:changed', boundUpdate) } catch { /* ignore */ }
      try { if (typeof window !== 'undefined') window.removeEventListener('auth:changed', onAuthChanged) } catch { /* ignore */ }
    }
  }, [])

  // Open chat view when another component requests it
  useEffect(() => {
    // When an external component (e.g. RecruiterDashboard) fires `app:openChat` with detail
    // we must ensure the Dashboard switches to the chat view first so the Chat component
    // can mount and receive the same event. To guarantee delivery, capture the detail,
    // set the view, then re-dispatch the event shortly after. Also expose a global
    // fallback (`window.__pending_open_chat`) so other code can inspect it if needed.
    const open = (ev) => {
      try {
        const detail = ev?.detail || null
        // Ignore events that were forwarded by this Dashboard to avoid an event loop
        if (detail && detail._from_dashboard) {
          // small debug to confirm we correctly ignored a forwarded event
          // (kept at debug level to avoid noisy logs in normal flow)
          // console.debug('Dashboard: ignored forwarded app:openChat', detail)
          return
        }
        console.log('Dashboard: app:openChat received, detail=', detail)
        try { window.__pending_open_chat = detail } catch { /* ignore */ }
        setCurrentView('chat')
        // re-dispatch after a tick so Chat is mounted and its listener can handle it
        setTimeout(() => {
          try {
            if (detail) {
              const forwarded = { ...detail, _from_dashboard: true }
              window.dispatchEvent(new CustomEvent('app:openChat', { detail: forwarded }))
              console.log('Dashboard: re-dispatched app:openChat', forwarded)
            }
          } catch (err) { console.error('Dashboard: re-dispatch failed', err) }
        }, 40)
      } catch (err) {
        console.error('Dashboard: open handler failed', err)
      }
    }
    try { window.addEventListener('app:openChat', open) } catch { /* ignore */ }
    return () => { try { window.removeEventListener('app:openChat', open) } catch { /* ignore */ } }
  }, [])


  // Resolve profile & role whenever authToken changes (or on mount). Clearing role first avoids showing stale UI.
  useEffect(() => {
    let mounted = true

      ; (async () => {
        try {
          // clear previous role while we re-resolve to avoid showing previous user's dashboard
          setRole(null)
          setCurrentUser(null)
          setUserId(null)

          const resp = await myProfile().catch((e) => e || null)
          // If myProfile returned a 400-like error, redirect to landing page to avoid showing protected UI
          try {
            const errStatus = resp?.status || resp?.error?.status || (resp?.error && resp.error.code) || null
            const errMsg = String(resp?.error?.message || '').toLowerCase()
            if (errStatus === 400 || String(errStatus) === '400' || errMsg.includes('bad request')) {
              console.warn('Dashboard: myProfile returned 400/Bad Request, redirecting to /')
              window.location.href = '/'
              return
            }
          } catch { /* ignore */ }

          const payload = resp?.candidate || resp?.data?.candidate || resp?.data || resp || null

          if (payload) {
            const looksLikeRecruiter = !!(payload?.recruiter || (payload?.company && (payload.company.id || payload.company.name)))
            if (looksLikeRecruiter) {
              setRole('recruiter')
              setCurrentUser(payload)
              setUserId(payload.id || payload.user_id || null)
              // Ensure recruiter users default to the dashboard view unless the user already selected something else
              setCurrentView(prev => (prev == null || prev === 'candidate' ? 'dashboard' : prev))
            } else {
              setRole('candidate')
              setCurrentUser(payload)
              setUserId(payload.id || payload.user_id || null)
              try {
                const uid = payload.id || payload.user_id || null
                if (uid) {
                  const applied = await fetchAppliedJobs(uid, readCookie('access_token'))
                  if (mounted && Array.isArray(applied)) setSavedJobs(applied)
                }
              } catch (err) {
                console.error('fetchAppliedJobs failed', err)
              }
            }
            return
          }

          // Fallback: try getCurrentUser() if myProfile didn't return payload
          try {
            const user = await getCurrentUser()
            if (user) {
              setCurrentUser(user)
              const looksLikeRecruiter = !!(user?.recruiter || (user?.company && (user.company.id || user.company.name)))
              if (looksLikeRecruiter) {
                setRole('recruiter')
                setUserId(user.id || user.user_id || null)
              } else {
                setRole('candidate')
                setUserId(user.id || user.user_id || null)
                try {
                  const uid = user.id || user.user_id || null
                  if (uid) {
                    const applied = await fetchAppliedJobs(uid, readCookie('access_token'))
                    if (mounted && Array.isArray(applied)) setSavedJobs(applied)
                  }
                } catch (err) {
                  console.error('fetchAppliedJobs failed', err)
                }
              }
              return
            }
          } catch { /* ignore */ }

          // If we get here no profile/user was found — leave role null so UI shows loading or login state
        } catch (err) {
          console.warn('profile fetch failed', err)
        }

        return () => { mounted = false }
      })()

  }, [authToken])

  // Subscribe to realtime notifications when userId becomes available (and cleanup on unmount / logout)
  useEffect(() => {
    if (!userId) return
    let unsub = null
    try {
      // Clear any global previous subscription first
      try {
        const prev = window.__notifications_unsub
        if (prev) {
          try { if (typeof prev === 'function') prev(); else if (prev.unsubscribe) prev.unsubscribe(); } catch { /* ignore */ }
          window.__notifications_unsub = null
        }
      } catch { /* ignore */ }

      Promise.resolve(listenToNotifications(userId)).then((s) => {
        console.log('#sym:listenToNotifications:subscribed', userId, s)
        unsub = s
        window.__notifications_unsub = s
      }).catch((err) => console.warn('listenToNotifications failed', err))
    } catch (err) {
      console.warn('listenToNotifications threw', err)
    }

    return () => {
      try {
        if (unsub) {
          try { if (typeof unsub === 'function') unsub(); else if (unsub.unsubscribe) unsub.unsubscribe(); } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }
  }, [userId])

  // Global app notification -> toast handler
  useEffect(() => {
    const handler = (ev) => {
      try {
        const payload = ev?.detail || {}
        console.log('#sym:app:notification:received', payload)
        const id = ++toastId.current
        setToasts(prev => [...prev, { id, payload }])
        console.log('#sym:toast:added', id, payload)
        // auto-dismiss
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
        // DOM-level debug marker so we can visually confirm the event arrived even if React UI is hidden
        try {
          const dbg = document.createElement('div')
          dbg.setAttribute('data-debug-notification', String(id))
          dbg.textContent = (payload && (payload.candidate_name || payload.type || payload.application_id)) ? `${payload.candidate_name || payload.type || payload.application_id}` : 'notification'
          dbg.style.cssText = 'position:fixed; top:8px; right:8px; z-index:999999999; background:#111; color:#fff; padding:6px 10px; border-radius:6px; box-shadow:0 6px 20px rgba(0,0,0,0.6); font-size:12px;'
          document.body.appendChild(dbg)
          setTimeout(() => { try { document.body.removeChild(dbg) } catch { void 0 } }, 3800)
        } catch { void 0 }
      } catch { /* ignore */ }
    }
    try { window.addEventListener('app:notification', handler) } catch { /* ignore */ }
    return () => { try { window.removeEventListener('app:notification', handler) } catch { /* ignore */ } }
  }, [])

  // Portal-rendered toast container so notifications are always above page-level transforms
  const ToastPortal = ({ toasts }) => {
    if (typeof document === 'undefined') return null

    const timeAgo = (iso) => {
      try {
        const d = new Date(iso)
        const s = Math.floor((Date.now() - d.getTime()) / 1000)
        if (s < 60) return `${s}s`
        if (s < 3600) return `${Math.floor(s / 60)}m`
        if (s < 86400) return `${Math.floor(s / 3600)}h`
        return `${Math.floor(s / 86400)}d`
      } catch { return '' }
    }

    return createPortal(
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 2147483647, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }} role="region" aria-live="polite">
        {toasts.map(t => {
          const raw = t.payload || {}
          // Notifications from DB may store the useful info inside `payload` JSON column. Merge them so we can handle either shape.
          const body = (raw && raw.payload && typeof raw.payload === 'object') ? { ...raw, ...raw.payload } : raw

          const title = body.candidate_name || body.title || null
          const subtitleBase = body.job_title ? `${body.job_title} • ${body.company_name || ''}` : (body.body || '')
          const when = raw.created_at || body.updated_at || body.applied_at || body.created_at || ''
          const status = String(body.type || body.application_status || body.status || '').toLowerCase()
          // color: green for shortlisted/accepted, red for rejected, blue otherwise
          const statusColor = (status.includes('shortlist') || status.includes('shortlisted') || status.includes('accepted')) ? '#16a34a' : (status.includes('reject') || status.includes('rejected') ? '#dc2626' : '#0ea5e9')

          // If payload is minimal (only application_id / job_id / type), render a clear candidate-facing message
          const applicationId = body.application_id || body.p_application_id || body.applicationId || ''
          const jobId = body.job_id || body.jobId || ''
          let computedTitle = title
          let computedSubtitle = subtitleBase
          if (!computedTitle) {
            // no candidate name: craft a short message about the application
            const statusLabel = status ? status.replace(/_/g, ' ') : 'updated'
            computedTitle = `Application ${statusLabel}`
            if (jobId) computedSubtitle = `Job #${jobId}${applicationId ? ` • App ${applicationId}` : ''}`
            else if (applicationId) computedSubtitle = `Application ${applicationId}`
            else computedSubtitle = subtitleBase || ''
          }
          return (
            <div key={t.id} style={{ minWidth: 300, maxWidth: 540, background: '#0b1220', color: '#fff', borderRadius: 10, boxShadow: '0 12px 40px rgba(2,6,23,0.6)', padding: 12, pointerEvents: 'auto', display: 'flex', gap: 12, alignItems: 'flex-start', borderLeft: `4px solid ${statusColor}` }}>
              {/* avatar */}
              {body.candidate_profile_img ? (
                <img src={body.candidate_profile_img} alt={body.candidate_name} style={{ width: 48, height: 48, borderRadius: 9999, objectFit: 'cover', flex: '0 0 48px' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 9999, background: '#0f1724', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>{String((body.candidate_name || 'U').charAt(0)).toUpperCase()}</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{computedTitle}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{computedSubtitle}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{timeAgo(when)}</div>
                    <div style={{ background: statusColor, color: '#fff', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>{body.application_status || body.status || body.type || 'Update'}</div>
                  </div>
                </div>
                {/* optional message / email */}
                {body.candidate_email && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{body.candidate_email}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>,
      document.body
    )
  }

  // Load authoritative profile name using Cookie Store (if available) then myProfile() RPC and populate headerName
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          let token = null
          if (typeof window !== 'undefined' && window.cookieStore && cookieStore.get) {
            try {
              const c = await cookieStore.get('access_token')
              token = c?.value || null
              // ensure document.cookie contains access_token for existing helpers
              if (token) document.cookie = `access_token=${encodeURIComponent(token)}; path=/`
            } catch (e) {
              console.warn('cookieStore.get failed', e)
            }
          }
          if (!token) token = getAccessToken()

          if (!token) return

          const resp = await myProfile().catch((e) => e || null)
          console.log('resp', resp)
          try {
            const errStatus = resp?.status || resp?.error?.status || (resp?.error && resp.error.code) || null
            const errMsg = String(resp?.error?.message || '').toLowerCase()
            if (errStatus === 400 || String(errStatus) === '400' || errMsg.includes('bad request')) {
              console.warn('Dashboard: myProfile (header) returned 400/Bad Request, redirecting to /')
              window.location.href = '/'
              return
            }
          } catch { /* ignore */ }

          const payload = resp?.candidate || resp?.recruiter || resp?.data?.candidate || resp?.data?.recruiter || resp?.data || resp || null
          console.log('payload', payload)
          if (!mounted) return
          if (payload) {
            const name = payload.name || payload.first_name || payload.candidate_name || payload.recruiter_name || payload.user_metadata?.name || payload.email || null
            if (name) setHeaderName(name)
            
            // Extract profile image from payload
            const profileImg = payload.profile_img || payload.avatar || null
            if (profileImg) setUserProfileImage(profileImg)
            
            // also set currentUser for consistency
            setCurrentUser(prev => ({ ...prev, email: payload.email || prev?.email || null, user_metadata: { ...(prev?.user_metadata || {}), name: name } }))
          }
        } catch (err) {
          console.warn('profile fetch failed', err)
        }
      })()
    return () => { mounted = false }
  }, [])

  // Event listener for #sym:createJobPosting
  useEffect(() => {
    const handleCreateJobPosting = async (event) => {
      const { payload } = event.detail
      try {
        // Generate embedding text from jobData
        const text = generateJobEmbeddingText(payload)
        // Generate the 768-dim embedding
  const response = await createEmbedding({ text })
  console.debug('createEmbedding raw response:', response)
        const embedding = response?.data?.[0]?.embedding
        if (!embedding) throw new Error('Failed to generate embedding')
        // Add embedding to payload
        const updatedPayload = { ...payload, embedding }
        // Call the API
        await createJobPosting(updatedPayload)
        console.log('createJobPosting succeeded with embedding')
        // Close the modal
        setCreateJobOpen(false)
      } catch (err) {
        console.error('createJobPosting failed', err)
        // Optionally, show an error message
      }
    }

    window.addEventListener('#sym:createJobPosting', handleCreateJobPosting)
    return () => window.removeEventListener('#sym:createJobPosting', handleCreateJobPosting)
  }, [])

  // Accept a few common recruiter role variants (case-insensitive, substring match)
  const isRecruiterRole = (r) => {
    if (r == null) return false
    // If array, check any element
    if (Array.isArray(r)) return r.some(isRecruiterRole)
    // If object, check all values recursively
    if (typeof r === 'object') return Object.values(r).some(isRecruiterRole)
    try {
      return String(r).toLowerCase().includes('recruit')
    } catch {
      return false
    }
  }

  const isRecruiter = isRecruiterRole(role)

  const _handleAttitudeSubmit = async (scores) => {
    // Save scores locally and notify the app/server
    console.log('Attitude scores:', scores)
    // persist locally for quick access
    try { localStorage.setItem('attitudeScores', JSON.stringify(scores)) } catch { /* ignore */ }

    // Map app role to allowed table/event role values (must be either 'candidates' or 'recruiters')
    const allowed = ['candidates', 'recruiters']
    let roleParam = isRecruiter ? 'recruiters' : 'candidates'
    if (!allowed.includes(roleParam)) roleParam = 'candidates'

    // Resolve a reliable userId (fall back to currentUser if needed)
    const resolvedUserId = userId || (currentUser && (currentUser.id || currentUser.user_id)) || null

    // Dispatch a global symbol event so other parts of the app can react
    try {
  window.dispatchEvent(new CustomEvent('#sym:updateAttitudeScore', { detail: { scores, role: roleParam, userId: resolvedUserId } }))
  console.log('#sym:updateAttitudeScore dispatched', { scores, role: roleParam, userId: resolvedUserId })
    } catch (e) { console.warn('dispatch #sym:updateAttitudeScore failed', e) }

    // Call backend helper to persist the attitude score (best-effort)
    try {
      if (userId) {
        await updateAttitudeScore(scores, userId, roleParam)
        console.log('updateAttitudeScore succeeded')
      } else {
        console.warn('updateAttitudeScore skipped: missing userId')
      }
    } catch (err) {
      console.error('updateAttitudeScore API error', err)
    }
  }

  const handleJobPostingSubmit = async (payload) => {
    console.log('Job posting payload:', payload)
    // Dispatch the #sym:createJobPosting event
    try {
      window.dispatchEvent(new CustomEvent('#sym:createJobPosting', { detail: { payload } }))
      console.log('#sym:createJobPosting dispatched', { payload })
    } catch (e) {
      console.warn('dispatch #sym:createJobPosting failed', e)
    }
  }

  if (!role) return (
    <div className="min-h-screen p-3 text-gray-900 font-sans">
      <ToastPortal toasts={toasts} />
      <div>Loading dashboard...</div>
    </div>
  )

  return (
    <div className={`h-screen p-3 text-gray-900 font-sans flex flex-col overflow-auto`} style={{ background: 'linear-gradient(135deg, var(--background), rgba(0,119,181,0.03))', ...(isRecruiter ? { ['--primary']: '#0077B5', ['--secondary']: '#005885', ['--primary-foreground']: '#ffffff', ['--background']: '#f0f8ff', ['--foreground']: '#003d5c', ['--card']: '#e6f7ff', ['--card-foreground']: '#003d5c', ['--border']: 'rgba(0,61,92,0.06)', ['--ring']: 'rgba(0,119,181,0.15)' } : {}) }}>
      {/* Portal-rendered toasts (ensures visibility above transforms/overlays) */}
      <ToastPortal toasts={toasts} />
      <div className="w-full flex-1 flex flex-col" style={{ perspective: 900 }}>
        {/* Header: clean, compact and responsive */}
        <header className="mb-2 flex-shrink-0" ref={(el) => { window.__dashboard_header_el = el }}>
          <div className="flex items-center justify-between p-3 md:p-4 bg-white rounded-xl shadow-sm border border-transparent">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div>
                <h1 className="text-lg md:text-xl font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  Hello {headerName || 'there'}
                </h1>
                <div className="text-xs md:text-sm text-gray-500">Welcome back</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 flex-shrink-0">
              <div className="inline-flex items-center bg-transparent p-1 rounded-full">
                {!isRecruiter ? (
                  <>
                    <button
                      onClick={() => {
                        setCandidateInitialTab('jobs')
                        setCurrentView('candidate')
                      }}
                      className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'candidate' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'candidate' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'candidate'}
                    >
                      Recommendations
                    </button>

                    <button
                      onClick={() => {
                        setCandidateInitialTab('jobs')
                        setCurrentView('saved')
                      }}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'saved' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'saved' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'saved'}
                    >
                      Saved
                    </button>

                    <button
                      onClick={() => {
                        setCandidateInitialTab('jobs')
                        setCurrentView('chat')
                      }}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'chat' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'chat' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'chat'}
                    >
                      Chat
                    </button>

                    <button
                      onClick={() => {
                        console.log('Resume button clicked - setting view to resume')
                        setCurrentView('resume')
                        setTimeout(() => {
                          try {
                            window.dispatchEvent(new CustomEvent('app:openResume'))
                            console.log('app:openResume event dispatched')
                          } catch (e) {
                            console.error('Failed to dispatch app:openResume event:', e)
                          }
                        }, 100)
                      }}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'resume' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'resume' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'resume'}
                    >
                      Resume
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'dashboard' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'dashboard' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'dashboard'}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentView('candidates')}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'candidates' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'candidates' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'candidates'}
                    >
                      Candidates
                    </button>
                    <button
                      onClick={() => setCurrentView('saved')}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'saved' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'saved' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'saved'}
                    >
                      Saved
                    </button>
                    <button
                      onClick={() => setCurrentView('chat')}
                      className={`ml-2 px-3 md:px-4 py-1 md:py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'chat' ? 'shadow-sm' : 'hover:bg-[color:var(--muted)]'}`}
                      style={currentView === 'chat' ? { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}
                      aria-pressed={currentView === 'chat'}
                    >
                      Chat
                    </button>
                  </>
                )}
              </div>
            </nav>

            {/* Mobile/Tablet Actions */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Create Job Button - Only for recruiters on larger screens */}
              {isRecruiter && (
                <button
                  onClick={() => setCreateJobOpen(true)}
                  className="hidden sm:flex ml-3 px-3 md:px-5 py-2 border border-green-600 text-green-700 font-semibold rounded-full bg-white hover:bg-green-50 hover:border-green-700 transition items-center gap-1 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                  </svg>
                  <span className="hidden md:inline">Create Job Posting</span>
                  <span className="md:hidden">Create</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setAvatarMenuOpen(s => !s)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Profile Avatar */}
              <div className="relative">
                <button
                  onClick={() => setAvatarMenuOpen(s => !s)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold shadow overflow-hidden touch-manipulation"
                  style={{ background: userProfileImage ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                >
                  {userProfileImage ? (
                    <img
                      src={userProfileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        setUserProfileImage(null);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = String(currentUser?.user_metadata?.name || headerName || currentUser?.email || 'U').charAt(0);
                      }}
                    />
                  ) : (
                    String(currentUser?.user_metadata?.name || headerName || currentUser?.email || 'U').charAt(0)
                  )}
                </button>

                {/* Desktop Dropdown Menu */}
                {avatarMenuOpen && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
                    <button onClick={() => { setCurrentView('settings'); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Settings</button>
                    <button onClick={() => { setAttitudeFormOpen(true); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-2 hover:bg-gray-50">Attitude Form</button>
                    <button onClick={() => { apiLogout(); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50">Logout</button>
                  </div>
                )}

                {/* Mobile Dropdown Menu */}
                {avatarMenuOpen && (
                  <div className="md:hidden absolute right-0 top-full mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
                    {/* Mobile Navigation */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex flex-col gap-2">
                        {!isRecruiter ? (
                          <>
                            <button
                              onClick={() => {
                                setCandidateInitialTab('jobs')
                                setCurrentView('candidate')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'candidate' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Recommendations
                            </button>

                            <button
                              onClick={() => {
                                setCandidateInitialTab('jobs')
                                setCurrentView('saved')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'saved' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Saved Jobs
                            </button>

                            <button
                              onClick={() => {
                                setCandidateInitialTab('jobs')
                                setCurrentView('chat')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'chat' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Chat
                            </button>

                            <button
                              onClick={() => {
                                setCurrentView('resume')
                                setAvatarMenuOpen(false)
                                setTimeout(() => {
                                  try {
                                    window.dispatchEvent(new CustomEvent('app:openResume'))
                                  } catch (e) {
                                    console.error('Failed to dispatch app:openResume event:', e)
                                  }
                                }, 100)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'resume' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Resume
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setCurrentView('dashboard')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'dashboard' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Dashboard
                            </button>
                            <button
                              onClick={() => {
                                setCurrentView('candidates')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'candidates' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Candidates
                            </button>
                            <button
                              onClick={() => {
                                setCurrentView('saved')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'saved' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Saved Jobs
                            </button>
                            <button
                              onClick={() => {
                                setCurrentView('chat')
                                setAvatarMenuOpen(false)
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${currentView === 'chat' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                              Chat
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="p-4 space-y-2">
                      {isRecruiter && (
                        <button
                          onClick={() => {
                            setCreateJobOpen(true)
                            setAvatarMenuOpen(false)
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-green-600 text-green-700 font-semibold rounded-lg bg-white hover:bg-green-50 hover:border-green-700 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                          </svg>
                          Create Job Posting
                        </button>
                      )}

                      <button onClick={() => { setCurrentView('settings'); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg">Settings</button>
                      <button onClick={() => { setAttitudeFormOpen(true); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg">Attitude Form</button>
                      <button onClick={() => { apiLogout(); setAvatarMenuOpen(false) }} className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50 rounded-lg">Logout</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Views (simple CSS transition) */}
        <SimpleTransition key={currentView}>
          <div className="w-full flex-1 transition-panel">
            {isRecruiter ? (
              <RecruiterDashboard userId={userId} currentUser={currentUser} view={currentView} />
            ) : (
              <>
                {currentView === 'candidate' && (
                  <CandidateDashboard
                    userId={userId}
                    currentUser={currentUser}
                    savedJobs={savedJobs}
                    setSavedJobs={setSavedJobs}
                    initialTab={candidateInitialTab}
                    filters={filters}
                    setFilters={setFilters}
                    onOpenSaved={(job) => {
                      setHighlightSavedId(job.id || job.job_id)
                      setCurrentView('saved')
                    }}
                  />
                )}

                {currentView === 'resume' && (
                  <CandidateDashboard
                    userId={userId}
                    currentUser={currentUser}
                    savedJobs={savedJobs}
                    setSavedJobs={setSavedJobs}
                    initialTab="resume"
                    filters={filters}
                    setFilters={setFilters}
                    onOpenSaved={(job) => {
                      setHighlightSavedId(job.id || job.job_id)
                      setCurrentView('saved')
                    }}
                  />
                )}

                {currentView === 'saved' && (() => {
                  const sanitized = (savedJobs || []).map((job) => ({
                    ...job,
                    company_name: job.company_name || (job.company && (typeof job.company === 'string' ? job.company : job.company.name)),
                    company_location: job.company_location || (job.company && (typeof job.company === 'string' ? '' : job.company.location)),
                    // remove full company object to avoid accidental rendering
                    company: undefined
                  }))

                  return (
                    <div className="lg:col-span-9 col-span-12">
                      <SavedJobsPage jobs={sanitized} highlightId={highlightSavedId} />
                    </div>
                  )
                })()}
              </>
            )}

            {currentView === 'settings' && (
              <SettingsPage currentUser={currentUser} />
            )}
            {currentView === 'chat' && (
              <div className="lg:col-span-12 col-span-12">
                <Chat currentUser={currentUser} />
              </div>
            )}
          </div>
        </SimpleTransition>
      </div>

            {/* Bottom Action Bar - Single Filters Button - Fixed to viewport bottom - Mobile/Tablet only */}
            {(!isRecruiter && currentView === 'candidate') && (
              <div className="fixed bottom-4 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-4 z-50 md:hidden">
                <div className="flex items-center justify-center">
                  {/* Filters Button */}
                  <button
                    onClick={() => {
                      setShowFiltersModal(true);
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-medium transition-colors duration-200 touch-manipulation shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Filter Jobs</span>
                  </button>
                </div>
              </div>
            )}

      {createJobOpen && (
        <JobPostingForm recruiterId={userId} onClose={() => setCreateJobOpen(false)} onSubmit={handleJobPostingSubmit} />
      )}

      {/* Filters Modal - Mobile/Tablet only */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFiltersModal(false)}
          />
          {/* Modal */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-white to-teal-50/50 rounded-t-2xl shadow-2xl border-t border-teal-100 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Refine Your Search</h3>
              </div>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Keywords */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Keywords
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. React, Python, Manager"
                    value={filters.keyword}
                    onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. New York, Remote"
                    value={filters.location}
                    onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Industry
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Technology, Finance"
                    value={filters.industry}
                    onChange={(e) => setFilters(f => ({ ...f, industry: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Min Match % */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Minimum Match
                </label>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minSimilarity}
                    onChange={(e) => setFilters(f => ({ ...f, minSimilarity: e.target.value }))}
                    className="w-full h-2 bg-gradient-to-r from-teal-200 to-teal-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span className="font-medium">0%</span>
                    <span className="font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">{filters.minSimilarity}%</span>
                    <span className="font-medium">100%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setFilters({ keyword: '', location: '', industry: '', minSimilarity: 0 })
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All
                  </div>
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Apply Filters
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attitude Form Modal */}
      {attitudeFormOpen && (
        <AttitudeForm
          role={isRecruiter ? 'recruiter' : 'candidate'}
          onSubmit={async (answers) => {
            try {
              await updateAttitudeScore(answers)
              setAttitudeFormOpen(false)
              // You might want to show a success message here
            } catch (error) {
              console.error('Failed to update attitude score:', error)
              // You might want to show an error message here
            }
          }}
          onClose={() => setAttitudeFormOpen(false)}
        />
      )}
    </div>
  )
}

export default Dashboard