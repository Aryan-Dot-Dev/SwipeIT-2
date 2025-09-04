import supabase from '@/utils/supabaseInstance'
import { getAccessToken } from '@/utils/cookieInstance'


const updateAttitude = async (attitudeScore) => {
    const { data, error } = await supabase.rpc('update_attitude_score', {
        p_score: attitudeScore
    }, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })
    if (error) {
        console.error('update.api:updateAttitude error', error)
        return { success: false, error }
    }
    return { success: true, data }
}

export { updateAttitude }