import supabase from "@/utils/supabaseInstance";

export async function listenToNotifications(userId) {
    try { console.log('#sym:listenToNotifications:called', userId) } catch { void 0 }

    const channel = supabase.channel('notifications')
        .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`
        }, async (payload) => {
            // payload.new is the raw DB row; try to fetch an enriched version if your backend populates one
            let data = payload?.new || {}
            try {
                const res = await supabase.from('notifications_enriched').select('*').eq('id', payload.new.id).maybeSingle()
                if (res && res.data) data = res.data
            } catch (e) {
                try { console.warn('#sym:listenToNotifications:enrichFetchFailed', e) } catch { void 0 }
            }

            try { console.log('#sym:app:notification:dispatch', data) } catch { void 0 }
            try { window.dispatchEvent(new CustomEvent('app:notification', { detail: data })) } catch { void 0 }
            return data
        })

    try {
        const sub = await channel.subscribe()
        try { console.log('#sym:listenToNotifications:subscribed', userId, sub) } catch { void 0 }
        return sub
    } catch (err) {
        try { console.error('#sym:listenToNotifications:subscribeError', err) } catch { void 0 }
        // best-effort: return the channel object so caller can attempt manual subscribe/unsubscribe
        return channel
    }
}