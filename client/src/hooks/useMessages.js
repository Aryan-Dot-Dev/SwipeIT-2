import { useEffect, useState } from 'react'
import supabase from '@/utils/supabaseInstance'

export default function useMessages(matchId) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (!matchId) return
    let mounted = true

    // fetch history
    console.log('useMessages: fetching history for matchId=', matchId)
    supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .then((res) => {
        try {
          console.log('useMessages: initial fetch result', { matchId, res })
          const data = res?.data || null
          if (mounted && data) setMessages(data)
        } catch (e) { console.error('useMessages: fetch handler error', e) }
      })

    // subscribe to new messages
    const chan = supabase
      .channel(`messages:match:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          try {
            console.log('useMessages: realtime payload received', { matchId, payload })
            setMessages((prev) => [...prev, payload.new])
          } catch (e) { console.error('useMessages: realtime handler error', e) }
        }
      )
      .subscribe()

    try {
      console.log('useMessages: subscription created', { matchId, chan })
    } catch { /* ignore */ }

    return () => {
      mounted = false
      try { supabase.removeChannel(chan) } catch { /* ignore */ }
    }
  }, [matchId])

  return messages
}
