import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance";


export const swipeRightCandidate = async (userId, jobId, cover) => {
    const { data, error } = await supabase.rpc("candidate_swipe_right", {
        p_candidate: userId,
        p_job_id: jobId,
        p_cover: cover,
        p_source: 'swipe'
    })

    if (error) throw error;
    return data;
}

export const swipeRecruiter = async (applicationId, isAccepted) => {
    const { data, error } = await supabase.rpc('recruiter_swipe_candidate', {
        p_application_id: applicationId,
        p_is_accepted: isAccepted ? true : false
    },{
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) throw error;
    return data;
}

export const addAnonymousCandidate = async (candidateId) => {
    const { data, error } = await supabase.rpc('add_anonymous_candidate', {
        candidate_id_input: candidateId
    }, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) {
        // Don't throw on duplicate entry, just log it
        if (error.message && error.message.includes('duplicate_entry')) {
            console.log('Candidate already in anonymous list:', candidateId)
            return null
        }
        throw error
    }
    return data
}

export const updateJobStatus = async (jobId, newStatus) => {
    const { data, error } = await supabase.rpc('update_job_status', {
        job_id_input: jobId,
        new_status: newStatus
    }, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) throw error
    return data
}

export const getAnonymousUserIds = async () => {
    const { data, error } = await supabase.rpc('get_anonymous_user_ids', {}, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) throw error
    return data || []
}