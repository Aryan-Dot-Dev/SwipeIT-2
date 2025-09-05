import React, { useEffect, useState, useRef } from 'react'
import { Button } from './ui/button'
import useMessages from '@/hooks/useMessages'
import { sendMessage as rpcSendMessage, getConversations } from '@/api/chatting.api'
import { getCandidateData, getRecruiterData, getMatchDetails } from '@/api/details.api'

// don't show example placeholders when real chats exist — start with empty convos unless user has saved ones

function Avatar({ name, src }) {
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover" />
  return <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))'}}>{String(name || 'U').charAt(0)}</div>
}

// Module-level helper: strip eq. prefix
const stripEq = (v) => (typeof v === 'string' && v.startsWith('eq.') ? v.replace(/^eq\./, '') : v)

export default function Chat({ currentUser }) {
  const [convos, setConvos] = useState([])
  const [selectedId, setSelectedId] = useState(convos[0]?.id || null)
  const [input, setInput] = useState('')
  const messagesEnd = useRef(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [headerOffset, setHeaderOffset] = useState(0)


  // Load conversations from server RPC instead of localStorage
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await getConversations()
        const data = resp?.data || []
        if (!mounted) return
        if (!Array.isArray(data) || data.length === 0) {
          setConvos([])
          return
        }
        const mapped = data.map((r) => {
          
          let matchId = r.match_id || r.application_id || r.p_match_id || r.id || r.matchId
          if (matchId != null) matchId = String(matchId)
          const id = matchId ? `match-${matchId}` : (r.id ? `c${r.id}` : `c${Date.now()}`)
          // try several places for a human-friendly name — backend shapes vary
          const name = r.candidate_name || r.candidate?.name || r.candidate?.candidate_name || r.name || r.recruiter_first_name || r.recruiter?.first_name || r.recruiter_name || r.user_metadata?.name || r.candidate_profile?.name || `conv-${matchId}`
          const avatar = r.candidate_profile_img || r.profile_img || r.candidate?.profile_img || ''
          const last = r.last_message || r.last || r.message || r.last_message_text || ''
          return {
              id,
              matchId,
              name,
              avatar,
              last,
              messages: [],
              _raw: r
            }
        })
        // dedupe by matchId (keep first occurrence)
        const seen = new Set()
        const dedup = []
        for (const m of mapped) {
          if (m.matchId && seen.has(m.matchId)) continue
          if (m.matchId) seen.add(m.matchId)
          dedup.push(m)
        }
        setConvos(dedup)
        setSelectedId(dedup[0]?.id || null)
      } catch (err) {
        console.error('Chat: getConversations failed', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Resolve convo names from receiver_id when available using details API
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // iterate convos and resolve any that still use conv- fallback
  for (const c of convos) {
          if (!mounted) break
          if (!c || !c._raw) continue
          const hasHumanName = c.name && !String(c.name).startsWith('conv-')
          if (hasHumanName) continue
          const raw = c._raw
          const receiverId = raw.receiver_id || raw.receiver_user_id || raw.receiver || raw.to || raw.receiverId
          if (!receiverId) continue
          // detect if current user appears to be a candidate (so we should fetch recruiter data)
          const looksLikeCandidate = !!(currentUser && (currentUser.candidate || currentUser.candidate_id || currentUser.role === 'candidate' || (currentUser.user_metadata && currentUser.user_metadata.role === 'candidate')))
          try {
            // If the current user is a candidate, prefer resolving the recruiter (the other party)
            if (looksLikeCandidate) {
              try {
                const rec = await getRecruiterData(receiverId).catch(() => null)
                let recName = null
                if (rec) {
                  if (Array.isArray(rec)) recName = rec[0]?.first_name || rec[0]?.recruiter_first_name || rec[0]?.name || rec[0]?.recruiter_name || null
                  else recName = rec.first_name || rec.recruiter_first_name || rec.name || rec.recruiter_name || null
                }
                if (recName) {
                  if (!mounted) break
                  setConvos(prev => prev.map(x => x.id === c.id ? { ...x, name: recName } : x))
                  continue
                }
              } catch { /* ignore */ }
              // fallback to candidate lookup if recruiter resolution failed
              const cand = await getCandidateData(receiverId).catch(() => null)
              let candName = null
              if (cand) {
                if (Array.isArray(cand)) candName = cand[0]?.name || cand[0]?.candidate_name || null
                else candName = cand.name || cand.candidate_name || null
              }
              if (candName) {
                if (!mounted) break
                setConvos(prev => prev.map(x => x.id === c.id ? { ...x, name: candName } : x))
                continue
              }
            } else {
              // default: try candidate first, then recruiter
              const cand = await getCandidateData(receiverId).catch(() => null)
              let candName = null
              if (cand) {
                if (Array.isArray(cand)) candName = cand[0]?.name || cand[0]?.candidate_name || null
                else candName = cand.name || cand.candidate_name || null
              }
              if (candName) {
                if (!mounted) break
                setConvos(prev => prev.map(x => x.id === c.id ? { ...x, name: candName } : x))
                continue
              }
              try {
                const rec = await getRecruiterData(receiverId).catch(() => null)
                let recName = null
                if (rec) {
                  if (Array.isArray(rec)) recName = rec[0]?.first_name || rec[0]?.recruiter_first_name || rec[0]?.name || rec[0]?.recruiter_name || null
                  else recName = rec.first_name || rec.recruiter_first_name || rec.name || rec.recruiter_name || null
                }
                if (recName) {
                  if (!mounted) break
                  setConvos(prev => prev.map(x => x.id === c.id ? { ...x, name: recName } : x))
                  continue
                }
              } catch { /* ignore */ }
            }
          } catch { /* ignore */ }
        }
      } catch (e) {
        console.error('Chat: convo name resolution failed', e)
      }
    })()
    return () => { mounted = false }
  }, [convos, currentUser])

  // Ensure the displayed convo name is the OTHER participant (not the current user).
  // Many server shapes include both candidate and recruiter ids/names; prefer the
  // opposite party's name so candidate sees recruiter name and vice versa.
  useEffect(() => {
    let mounted = true
    if (!convos || convos.length === 0) return
    ;(async () => {
      try {
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId || null
        const looksLikeRecruiter = !!(currentUser?.recruiter || (currentUser?.company && (currentUser.company.id || currentUser.company.name)))
        let changed = false
        const updated = await Promise.all(convos.map(async (c) => {
          const raw = c._raw || {}

          // explicit participant ids
          const candidateId = stripEq(raw.candidate_user_id || raw.candidate_id || raw.candidate?.user_id || raw.candidate?.id || raw.candidateId || null)
          const recruiterId = stripEq(raw.recruiter_user_id || raw.recruiter_id || raw.recruiter?.user_id || raw.recruiter?.id || raw.recruiterId || raw.receiver_id || raw.receiver_user_id || raw.receiver || raw.to || null)

          // explicit sender/receiver override
          const senderId = stripEq(raw.sender_id || raw.sender_user_id || raw.from_user || raw.from || raw.created_by || null)
          const receiverId = stripEq(raw.receiver_id || raw.receiver_user_id || raw.receiver || raw.to || null)

          // decide otherId: prefer sender/receiver when they indicate who is who
          let otherId = null
          if (currentUserId && senderId && String(senderId) === String(currentUserId) && receiverId) otherId = receiverId
          else if (currentUserId && receiverId && String(receiverId) === String(currentUserId) && senderId) otherId = senderId
          else if (currentUserId && recruiterId && String(recruiterId) === String(currentUserId) && candidateId) otherId = candidateId
          else if (currentUserId && candidateId && String(candidateId) === String(currentUserId) && recruiterId) otherId = recruiterId
          else otherId = looksLikeRecruiter ? candidateId || recruiterId : recruiterId || candidateId

          // compute desired name based on which side otherId belongs to
          let desired = c.name
          const candidateName = raw.candidate_name || raw.candidate?.name || raw.candidate_profile?.name || null
          const recruiterName = raw.recruiter_first_name || raw.recruiter_name || raw.recruiter?.first_name || raw.recruiter?.name || raw.company_name || null

          if (otherId) {
            if (candidateId && String(otherId) === String(candidateId)) {
              desired = candidateName || desired
            } else if (recruiterId && String(otherId) === String(recruiterId)) {
              desired = recruiterName || desired
            }
          }

          // final guard: if desired equals current user's name, try the opposite field
          const currentUserName = currentUser?.first_name || currentUser?.name || currentUser?.full_name || null
          if (currentUserName && desired && String(desired) === String(currentUserName)) {
            if (String(desired) === String(candidateName) && recruiterName) desired = recruiterName
            else if (String(desired) === String(recruiterName) && candidateName) desired = candidateName
          }

          if (desired && desired !== c.name) {
            changed = true
            return { ...c, name: desired }
          }
          return c
        }))
        if (mounted && changed) setConvos(updated)
      } catch (e) {
        console.error('Chat: failed to set other-party names', e)
      }
    })()
    return () => { mounted = false }
  }, [convos, currentUser])

  // Listen for external requests to open a chat (e.g., recruiter started conversation)
  useEffect(() => {
    const handler = async (ev) => {
      try {
        const d = ev?.detail || {}
        // If the event was forwarded by the Dashboard (tagged), ignore to avoid duplicate handling
        if (d && d._from_dashboard) {
          // minimal debug suppressed to avoid noise
          return
        }
        // console.log('Chat: app:openChat received', d)

        
        const matchId = d.matchId || d.match_id || d.applicationId || d.application_id
        const name = d.name || d.candidateName || d.candidate_name || `conv-${matchId}`
        const initial = d.initialMessage || d.message || ''
        console.log('Chat: parsed matchId, name, initial', matchId, name, initial)
        if (!matchId) return

        const id = `match-${matchId}`
        setConvos(prev => {
          const found = prev.find(c => c.id === id || c.matchId === matchId)
          if (found) {
            // move found to front
            return [found, ...prev.filter(p => p.id !== found.id)]
          }
          const n = { id, matchId, name, avatar: '', last: initial || '', messages: [] }
          // keep only other real match convos (drop placeholder local convos)
          const otherMatches = prev.filter(p => p.matchId)
          return [n, ...otherMatches]
        })
        setSelectedId(id)
      } catch (e) { void e }
    }
    try { window.addEventListener('app:openChat', handler) } catch { /* ignore */ }
    return () => { try { window.removeEventListener('app:openChat', handler) } catch { /* ignore */ } }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [selectedId, convos])

  function scrollToBottom() {
    try { messagesEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) } catch (e) { console.warn('scrollToBottom failed', e) }
  }

  const current = convos.find(c => c.id === selectedId) || convos[0]
  console.log('Chat: current convo', convos)
  const serverMessages = useMessages(current?.matchId)
  console.log('Chat: serverMessages', serverMessages)

  // whether we have a selected/real conversation to display
  const hasConvo = !!(current && (current.id || current.matchId))
  // detect if current user is (likely) a candidate
  const isCandidate = !!(currentUser && (currentUser.candidate || currentUser.candidate_id || currentUser.role === 'candidate' || (currentUser.user_metadata && currentUser.user_metadata.role === 'candidate')))

  // can the current user send a message in this view?
  // Candidates should be able to reply on existing match-backed conversations (matchId present),
  // but should not be able to create arbitrary new local convos. Recruiters can send even on local convos.
  const canSend = hasConvo && (current?.matchId || !isCandidate)

  // Use matchId to fetch canonical match row and resolve the other party via
  // match.candidate_id / match.recruiter_id. Recruiters send to candidate_id,
  // so when current user is a recruiter, fetch candidate details; reverse for candidates.
  useEffect(() => {
    let mounted = true
    if (!current?.matchId) return
    ;(async () => {
      try {
        const match = await getMatchDetails(current.matchId).catch(() => null)
        if (!match || !mounted) return

        const candId = stripEq(match.candidate_id || match.candidate_user_id || match.candidate_id || match.candidate || null)
        const recId = stripEq(match.recruiter_id || match.recruiter_user_id || match.recruiter_id || match.recruiter || null)

        const looksLikeRecruiter = !!(currentUser?.recruiter || (currentUser?.company && (currentUser.company.id || currentUser.company.name)))

        if (looksLikeRecruiter) {
          // recruiter -> show candidate
          if (!candId) return
          const cand = await getCandidateData(candId).catch(() => null)
          let name = null
          let avatar = null
          if (cand) {
            if (Array.isArray(cand)) {
              name = cand[0]?.name || cand[0]?.candidate_name || null
              avatar = cand[0]?.profile_img || cand[0]?.avatar || null
            } else {
              name = cand.name || cand.candidate_name || null
              avatar = cand.profile_img || cand.avatar || null
            }
          }
          if (mounted && name) setConvos(prev => prev.map(c => c.id === current.id ? { ...c, name, avatar } : c))
        } else {
          // candidate -> show recruiter
          if (!recId) return
          const rec = await getRecruiterData(recId).catch(() => null)
          let name = null
          let avatar = null
          if (rec) {
            if (Array.isArray(rec)) {
              name = rec[0]?.first_name || rec[0]?.recruiter_first_name || rec[0]?.name || null
              avatar = rec[0]?.profile_img || rec[0]?.avatar || null
            } else {
              name = rec.first_name || rec.recruiter_first_name || rec.name || null
              avatar = rec.profile_img || rec.avatar || null
            }
          }
          if (mounted && name) setConvos(prev => prev.map(c => c.id === current.id ? { ...c, name, avatar } : c))
        }
      } catch (e) {
        console.error('Chat: match-based participant resolution failed', e)
      }
    })()
    return () => { mounted = false }
  }, [current?.matchId, current?.id, currentUser?.id, currentUser?.company, currentUser?.recruiter])

  // Normalize server messages into the UI shape and compute `fromMe` by comparing
  // the message sender id to the current user's id. Accept common sender fields.
  // Helper: extract human-readable string from various server message shapes
  function extractText(msg) {
    if (msg == null) return ''
    if (typeof msg === 'string') return msg
    // If msg is the whole message object, try common fields
    const cand = msg.content || msg.text || msg.message || msg.body || msg.html || null
    if (typeof cand === 'string') {
      // If HTML, try to extract hrefs first (so <a href=> links are preserved).
      if (msg.html) {
        const html = String(msg.html)
        const hrefs = []
        const hrefRe = /href=["']([^"']+)["']/gi
        let hm
        // collect href values
        while ((hm = hrefRe.exec(html)) !== null) hrefs.push(hm[1])
        if (hrefs.length) return hrefs.join(' ')
        // fallback: strip tags
        return html.replace(/<[^>]+>/g, ' ')
      }
      return String(cand)
    }
    // Entities (common in rich payloads)
    if (Array.isArray(msg.entities) && msg.entities.length > 0) {
      const urls = msg.entities.map(e => e.url || e.href).filter(Boolean)
      if (urls.length) return urls.join(' ')
    }
    // Blocks (editor-like payloads)
    if (Array.isArray(msg.blocks) && msg.blocks.length > 0) {
      const texts = msg.blocks.map(b => b.text || b.body || '').filter(Boolean)
      if (texts.length) return texts.join(' ')
    }
    // Fallback: gather any string values nested inside the object
    try {
      const collected = []
      const walk = (obj) => {
        if (obj == null) return
        if (typeof obj === 'string') { collected.push(obj); return }
        if (Array.isArray(obj)) { obj.forEach(walk); return }
        if (typeof obj === 'object') { Object.values(obj).forEach(walk); return }
      }
      walk(msg)
      if (collected.length) return collected.join(' ')
    } catch { /* ignore */ }
    return ''
  }

  const displayMessages = (serverMessages && serverMessages.length > 0 ? serverMessages : (current?.messages || [])).map((m) => {
    // preserve existing fromMe if present
    if (typeof m.fromMe === 'boolean') return m
    const currentUserId = currentUser?.id || currentUser?.user_id || null
    const senderId = m.sender_id || m.user_id || m.from_user || m.from || m.created_by || null
    const fromMe = currentUserId && senderId ? String(senderId) === String(currentUserId) : !!m.from_me || false
  // attach a normalized displayText useful for rendering and linkifying
  const displayText = extractText(m)
  return { ...m, fromMe, displayText }
  })

  // Debug: log recruiter-side messages once so we can inspect server payload shapes
  const _loggedRef = useRef(new Set())
  useEffect(() => {
    try {
      for (const msg of displayMessages) {
        if (!msg) continue
        if (msg.fromMe) continue
        const id = msg.id || msg._id || `${msg.created_at || ''}-${Math.random()}`
        if (_loggedRef.current.has(id)) continue
        // Log a concise payload to devtools; user can paste this for debugging
  console.debug('Chat: recruiter message payload for debugging', { id, matchId: current?.matchId, msg })
        _loggedRef.current.add(id)
      }
  } catch { /* ignore */ }
  }, [displayMessages, current?.matchId])

  // Convert plain text with URLs into an array of React nodes with clickable anchors.
  // Keeps plain text otherwise. Handles http(s):// and www. prefixes.
  function linkify(text, fromMe = false) {
    if (text == null) return null
    // If message content is an object/array (some server shapes), stringify so URLs inside are preserved.
    const str = (typeof text === 'string') ? text : JSON.stringify(text)
    // split and keep URLs in the result
  const parts = str.split(/(\b(?:https?:\/\/|www\.)[^\s"'<>\s]+)/g)
    const linkClass = fromMe ? 'text-white underline' : 'text-[color:var(--primary)] underline'
    return parts.map((part, idx) => {
      if (!part) return null
      const isUrl = /^(?:https?:\/\/|www\.)/i.test(part)
      if (isUrl) {
        const href = /^https?:\/\//i.test(part) ? part : `http://${part}`
        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            style={{ pointerEvents: 'auto', cursor: 'pointer', display: 'inline' }}
          >
            {part}
          </a>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  // Keep server-fetched messages stored on the matching convo so the left convo list
  // shows accurate `last` and message preview and so messages persist when switching.
  useEffect(() => {
    try {
      if (!serverMessages || serverMessages.length === 0) return
      const latest = serverMessages[serverMessages.length - 1]
  const latestText = extractText(latest) || ''
      const latestTime = latest?.created_at || latest?.time || null
      setConvos(prev => prev.map(c => {
        if (!c.matchId || !current?.matchId) return c
        if (String(c.matchId) !== String(current.matchId)) return c
        return { ...c, messages: serverMessages, last: latestText || c.last, lastTime: latestTime || c.lastTime }
      }))
    } catch (e) { console.error('Chat: failed to merge serverMessages into convos', e) }
  }, [serverMessages, current?.matchId])

  async function sendMessage() {
    const text = (input || '').trim()
    if (!text) return

    // If this convo is backed by a matchId, send via RPC and optimistically append
    if (current && current.matchId) {
        // normalize matchId: strip eq. and any UI prefix like 'match-'
        const rawMatchId = current.matchId
        let matchId = typeof rawMatchId === 'string' ? rawMatchId.replace(/^match-/, '') : rawMatchId
        matchId = stripEq(matchId)
        console.log('Chat: sending message for matchId', { rawMatchId, matchId })
        // optimistic UI: clear input while RPC runs; restore on failure
        setInput('')
        try {
          // call RPC to insert message
          const res = await rpcSendMessage(matchId, text)
          // handle API-level error returned from our wrapper
          if (res && res.error) {
            console.error('sendMessage RPC returned error', res.error)
            // restore input so user can retry
            setInput(text)
          }
        } catch (err) {
          console.error('sendMessage RPC failed', err)
          setInput(text)
        }
      return
    }

    // fallback: local-only convo
    const next = convos.map(c => {
      if (c.id !== (current?.id)) return c
      return { ...c, messages: [...c.messages, { id: Date.now(), fromMe: true, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }], last: text }
    })
    setConvos(next)
    setInput('')
    setTimeout(() => {
      const reply = next.map(c => {
        if (c.id !== (current?.id)) return c
        return { ...c, messages: [...c.messages, { id: Date.now()+1, fromMe: false, text: 'Thanks — I will check and reply soon.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }], last: 'Thanks — I will check and reply soon.' }
      })
      setConvos(reply)
    }, 800)
  }

  // compute dynamic top offset from header if available
  try {
    const hdr = (typeof window !== 'undefined' && window.__dashboard_header_el) ? window.__dashboard_header_el : null
    if (hdr && hdr.getBoundingClientRect) Math.ceil(hdr.getBoundingClientRect().bottom + 8)
  } catch (e) { void e }

  // Measure header height (or any top header element) and set chat container height accordingly
  useEffect(() => {
    function updateHeaderOffset() {
      try {
        if (typeof window === 'undefined') return
        // prefer a reference left by Dashboard if available
        const hdr = window.__dashboard_header_el || document.querySelector('header') || document.querySelector('.header') || null
        if (hdr && hdr.getBoundingClientRect) {
          const rect = hdr.getBoundingClientRect()
          const offset = Math.ceil(rect.height || rect.bottom || 0)
          setHeaderOffset(offset)
          return
        }
      } catch { /* ignore */ }
      setHeaderOffset(0)
    }

    updateHeaderOffset()
    window.addEventListener('resize', updateHeaderOffset)
    // also listen for potential DOM changes that might affect header size
    const ro = typeof MutationObserver !== 'undefined' ? new MutationObserver(updateHeaderOffset) : null
    if (ro) {
      const node = document.querySelector('header') || document.querySelector('.header') || document.body
      ro.observe(node, { attributes: true, childList: false, subtree: false })
    }
    return () => {
      window.removeEventListener('resize', updateHeaderOffset)
      if (ro) ro.disconnect()
    }
  }, [])

  return (
  <div className="w-full bg-white md:rounded-lg shadow-md flex flex-col md:flex-row" style={{ height: `calc(100vh - ${headerOffset + 32}px)`, overflow: 'hidden' }}>
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={() => setShowSidebar(true)}
          className="w-10 h-10 bg-[color:var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center"
          aria-label="Open conversations"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Left: conversations sidebar */}
      <aside className={`w-full md:w-80 border-r flex flex-col transition-all duration-300 ${
        showSidebar ? 'fixed inset-y-0 left-0 z-40' : 'hidden md:flex'
      }`} style={{ background: 'var(--muted)', borderRightColor: 'var(--border)' }}>
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end p-3 border-b">
          <button
            onClick={() => setShowSidebar(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3 md:p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-base md:text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Chats</div>
            <div className="text-xs md:text-sm" style={{ color: 'var(--muted-foreground)' }}>{currentUser?.first_name || 'You'}</div>
          </div>
          <div className="mb-3">
            <input value={''} placeholder="Search conversations" className="w-full px-3 py-2 rounded text-sm" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)' }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {convos.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedId(c.id)
                setShowSidebar(false) // Close sidebar on mobile after selection
              }}
              className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center gap-3 transition-colors ${
                c.id === selectedId ? 'bg-[color:var(--card)]' : 'hover:bg-[color:var(--card)]/50'
              }`}
              style={{ border: '1px solid var(--border)' }}
            >
              <Avatar name={c.name} src={c.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{c.name}</div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{c.messages?.slice(-1)[0]?.time}</div>
                </div>
                <div className="text-xs text-gray-600 truncate">{c.last}</div>
              </div>
            </button>
          ))}
        </div>

        {!isCandidate && (
          <div className="p-3 border-t" style={{ borderTopColor: 'var(--border)' }}>
            <button
              aria-label="New chat"
              onClick={() => {
                const id = `c${Date.now()}`
                const n = { id, name: 'New chat', avatar: '', last: '', messages: [] }
                setConvos([n, ...convos])
                setSelectedId(id)
                setShowSidebar(false) // Close sidebar on mobile
              }}
              className="w-full py-3 rounded-md text-sm font-medium"
              style={{ border: '2px dotted var(--primary)', background: 'transparent', color: 'var(--primary)', textAlign: 'center' }}
            >
              + New chat
            </button>
          </div>
        )}
      </aside>

      {/* Mobile sidebar backdrop */}
      {showSidebar && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

  {/* Right: chat area */}
  <main className="flex-1 flex flex-col min-w-0 h-full md:ml-0">
      {hasConvo ? (
        <>
          <div className="px-4 md:px-6 py-3 md:py-4 border-b flex items-center justify-between" style={{ background: 'var(--card)', borderBottomColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={current?.name} src={current?.avatar} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm md:text-base truncate" style={{ color: 'var(--foreground)' }}>{current?.name}</div>
                <div className="text-xs flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--primary)', display: 'inline-block' }} />
                  <span className="truncate">{current?.last || 'No recent messages'}</span>
                </div>
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-500 flex items-center gap-2 flex-shrink-0">
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--primary)', display: 'inline-block', boxShadow: '0 0 0 3px rgba(13,148,136,0.12)' }} />
              <span style={{ color: 'var(--foreground)' }}>Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 md:py-6 px-0 pb-28 md:pb-20" style={{ background: 'linear-gradient(180deg, var(--card), var(--muted))' }}>
            <div className="w-full max-w-full md:max-w-4xl md:mx-auto space-y-3 md:space-y-4 px-3 md:px-0">
              {displayMessages.map(m => {
                const renderedText = m.displayText || m.content || m.text || m.message || m.body || ''
                const containsUrl = /(?:https?:\/\/|www\.)/i.test(String(renderedText))
                // debug log for quick inspection
                if (!m.fromMe && containsUrl) console.debug('Chat: detected URL in recruiter message', { id: m.id, renderedText })
                return (
                  <div key={m.id} className="flex w-full px-2 md:px-4">
                    <div className={`flex w-full ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`p-3 rounded-xl shadow-sm max-w-[95%] md:max-w-[70%] ${
                          m.fromMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                        }`}
                        data-has-url={containsUrl}
                        style={{
                          wordBreak: 'break-word',
                          ...(m.fromMe ? {
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            border: '1px solid rgba(255,255,255,0.06)'
                          } : {
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          })
                        }}
                      >
                        <div className="text-sm md:text-base">{linkify(renderedText, m.fromMe)}</div>
                        <div className="text-xs text-gray-200 mt-1 text-right">
                          {(m.created_at && new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) || m.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEnd} />
            </div>
          </div>

          {/* Inputs: hidden for candidate users */}
          {canSend && (
            <div className="hidden md:flex md:sticky md:bottom-0 md:left-0 md:right-0 px-3 md:px-4 py-3 border-t bg-white items-center gap-3" style={{ borderTopColor: 'var(--border)' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage() } }}
                placeholder="Type a message..."
                className="flex-1 px-3 md:px-4 py-2 md:py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] text-sm md:text-base"
              />
              <Button
                onClick={sendMessage}
                size="sm"
                className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base flex-shrink-0"
              >
                Send
              </Button>
            </div>
          )}

          {/* Mobile fixed input bar (hidden for candidates) */}
          {canSend && (
            <div className="fixed bottom-0 left-0 right-0 p-3 md:hidden z-40 bg-[color:var(--card)] border-t" style={{ borderTopColor: 'var(--border)' }}>
              <div className="max-w-full mx-auto flex items-center gap-2 px-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage() } }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] text-sm"
                />
                <Button
                  onClick={sendMessage}
                  size="sm"
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl px-6">
            <div className="flex flex-col items-center justify-center min-h-[40vh] md:min-h-[50vh] text-center py-12 md:py-16 gap-4">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-[color:var(--muted)] flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-16 md:h-16 text-[color:var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-lg md:text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>No conversations yet</div>
              <div className="text-sm md:text-base text-[color:var(--muted-foreground)] max-w-lg">There are no active chats here. {isCandidate ? 'Recruiters can message you — wait for an incoming message.' : "Start a new chat or wait for someone to message you."}</div>
              {!isCandidate && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const id = `c${Date.now()}`
                      const n = { id, name: 'New chat', avatar: '', last: '', messages: [] }
                      setConvos([n, ...convos])
                      setSelectedId(id)
                      setShowSidebar(false)
                    }}
                    className="px-4 py-2 rounded-md font-medium"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    Start new chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
