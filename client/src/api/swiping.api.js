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