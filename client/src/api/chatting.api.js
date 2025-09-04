import supabase, { initSessionFromCookies } from "@/utils/supabaseInstance";
import { getAccessToken, getRefreshToken } from "@/utils/cookieInstance";

async function debugSessionContext(tag, extra = {}) {
    try {
        const userResp = await supabase.auth.getUser().catch(() => null)
        const userId = userResp?.data?.user?.id || null
        const hasToken = !!getAccessToken()
        console.log(`chatting.api:${tag}: debug`, { hasToken, userId, ...extra })
    } catch (e) {
        console.warn(`chatting.api:${tag}: debug failed`, e)
    }
}

export async function startConversation(matchId, message) {
    // ensure client session is initialized / repaired from cookies
    await ensureSession()
    await debugSessionContext('startConversation', { matchId })

    try {
        const token = getAccessToken()
        const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const res = await supabase.rpc('start_conversation', {
            p_match_id: matchId,
            p_message: message,
        }, opts)
        if (res?.error) console.error('chatting.api:startConversation RPC error', res.error)
        else console.log('chatting.api:startConversation result', res)
        return res
    } catch (err) {
        console.error('chatting.api:startConversation threw', err)
        return { data: null, error: err }
    }
}

export async function sendMessage(matchId, message) {
    // ensure client session is initialized / repaired from cookies
    await ensureSession()
    await debugSessionContext('sendMessage', { matchId })

    try {
        const token = getAccessToken()
        const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const res = await supabase.rpc('send_message', {
            p_match_id: matchId,
            p_message: message,
        }, opts)
        if (res?.error) console.error('chatting.api:sendMessage RPC error', res.error)
        else console.log('chatting.api:sendMessage result', res)
        return res
    } catch (err) {
        console.error('chatting.api:sendMessage threw', err)
        return { data: null, error: err }
    }
}

export async function getConversations() {
    await ensureSession()
    await debugSessionContext('getConversations')
    try {
        const token = getAccessToken()
        const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        const { data, error } = await supabase.rpc('get_my_messages', {}, opts)
        if (error) console.error('chatting.api:getConversations RPC error', error)
        return { data, error }
    } catch (err) {
        console.error('chatting.api:getConversations threw', err)
        return { data: null, error: err }
    }
}

export async function checkConversationExists(matchId) {
    try {
    await ensureSession()
    await debugSessionContext('checkConversationExists', { matchId })
    const token = getAccessToken()
    const opts = token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    const { data, error } = await supabase.rpc('get_my_messages', {}, opts)
        if (error) {
            console.error('chatting.api:checkConversationExists error', error)
            return false
        }

        const conversationExists = data && data.some((conversation) => (conversation.match_id === matchId || conversation.application_id === matchId))
        console.log('chatting.api:checkConversationExists result', { matchId, conversationExists })
        return conversationExists
    } catch (err) {
        console.error('chatting.api:checkConversationExists threw', err)
        return false
    }
}

/**
 * Ensure supabase client has a session: try init from cookies; if getUser() still null
 * but access_token cookie exists, attempt to setSession using cookies.
 */
async function ensureSession() {
    try {
        await initSessionFromCookies().catch(() => null)
        const userResp = await supabase.auth.getUser().catch(() => null)
        if (!userResp?.data?.user) {
            const access_token = getAccessToken()
            const refresh_token = getRefreshToken()
            if (access_token) {
                try {
                    await supabase.auth.setSession({ access_token, refresh_token })
                    console.log('chatting.api:ensureSession setSession from cookies')
                } catch (e) {
                    console.warn('chatting.api:ensureSession setSession failed', e)
                }
            }
        }
    } catch (e) {
        console.warn('chatting.api:ensureSession failed', e)
    }
}