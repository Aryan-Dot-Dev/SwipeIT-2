import supabase, { initSessionFromCookies } from "@/utils/supabaseInstance"

/**
 * Fetch applied/saved jobs for a candidate. Optionally supply an accessToken
 * which will be used to initialize the Supabase session for this call.
 *
 * @param {string|null} candidateId
 * @param {string|null} accessToken
 */
export const fetchAppliedJobs = async (candidateId, accessToken = null) => {
    try {
        // If an explicit accessToken is provided, attempt to initialise session.
        if (accessToken) {
            try {
                // set session using provided token (no refresh token available here)
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: null })
            } catch (e) {
                console.warn('Failed to set session from accessToken', e)
            }
        } else {
            // fallback: try cookie-based init if available
            try { await initSessionFromCookies() } catch { /* ignore */ }
        }

        const params = candidateId ? { p_candidate_id: candidateId } : {}
        const { data, error } = await supabase.rpc('get_applied_jobs', params)

        if (error) {
            console.error('Error fetching applied jobs:', error)
            return []
        }

        return data || []
    } catch (err) {
        console.error('fetchAppliedJobs unexpected error', err)
        return []
    }
}

export const getResume = async(candidateId) => {
    const { data, error } = await supabase
  .rpc('get_resumes_by_candidate', { p_candidate_id: candidateId });

    if (error) {
        console.error('Error fetching resume:', error)
        return null
    }

    return data?.[0] || null
}