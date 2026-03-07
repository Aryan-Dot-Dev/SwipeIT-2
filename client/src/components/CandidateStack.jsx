import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import CandidateCard from './CandidateCard'
import { swipeRecruiter } from '@/api/swiping.api'

const CandidateStack = ({ initialCandidates = [], onShortlist, onReject, onView, anonymousMode = false }) => {
  const [items, setItems] = useState(initialCandidates)

  useEffect(() => { setItems(Array.isArray(initialCandidates) ? initialCandidates : []) }, [initialCandidates])

  const handleShortlist = async (c) => {
    try {
      onShortlist && onShortlist(c)
      // call RPC: accept
      const appId = c.application_id || c.applicationId || c.id
      console.log('#sym:swipeRecruiter', { applicationId: appId, accepted: true })
      if (appId) await swipeRecruiter(appId, true)
    } catch (err) {
      console.error('swipeRecruiter accept failed', err)
    } finally {
      setItems(prev => prev.slice(1))
    }
  }

  const handleReject = async (c) => {
    try {
      onReject && onReject(c)
      const appId = c.application_id || c.applicationId || c.id
      console.log('#sym:swipeRecruiter', { applicationId: appId, accepted: false })
      if (appId) await swipeRecruiter(appId, false)
    } catch (err) {
      console.error('swipeRecruiter reject failed', err)
    } finally {
      setItems(prev => prev.slice(1))
    }
  }
  const handleView = (c) => { try { onView && onView(c) } catch { /* ignore */ } }

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center w-full py-8">
        <div className="w-full max-w-md p-8 text-center rounded-3xl border border-[#E4DFF5] bg-white/80 backdrop-blur shadow-[0_8px_32px_-8px_rgba(154,140,242,0.2)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'linear-gradient(135deg,#E4DFF5,#D1F5E8)' }}>👥</div>
          <h3 className="text-xl font-bold text-[#1C1A2E] mb-2">No more candidates</h3>
          <p className="text-sm text-[#6E6B86]">Try again later or adjust your filters to discover more talent.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] w-full h-fit justify-center items-start">
      <AnimatePresence>
        {items[0] && (
          <CandidateCard key={items[0].application_id || items[0].applicationId || items[0].id || JSON.stringify(items[0])} candidate={items[0]} onShortlist={handleShortlist} onReject={handleReject} onView={handleView} anonymous={anonymousMode} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CandidateStack
