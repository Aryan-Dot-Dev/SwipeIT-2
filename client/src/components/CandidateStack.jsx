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
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-md p-6 bg-white rounded-lg border-4 border-gray-300 shadow-pixel-sm text-center">
          <h3 className="text-2xl font-extrabold text-gray-900">No more candidates</h3>
          <p className="text-sm text-gray-600 mt-2">Try again later or expand your filters.</p>
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
