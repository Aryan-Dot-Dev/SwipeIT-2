import supabase from "@/utils/supabaseInstance"

export async function getCandidateData(candidateId) {
  try {
    // Defensive: callers may accidentally pass a filter string like 'eq.<id>'
    // (originating from PostgREST/Supabase filter syntax). Strip that if present.
    let id = candidateId
    try {
      if (typeof id === 'string' && id.startsWith('eq.')) {
        console.warn('details.api:getCandidateData - stripping eq. prefix from id', id)
        id = id.replace(/^eq\./, '')
      }
    } catch { /* ignore */ }

    const {data, error} = await supabase.from('candidates').select("*").eq('user_id', id)
    return data
  } catch (error) {
    console.error('Error fetching candidate data:', error)
    throw error
  }
}

export async function getRecruiterData(recruiterId) {
  try {
    let id = recruiterId
    try {
      if (typeof id === 'string' && id.startsWith('eq.')) {
        console.warn('details.api:getRecruiterData - stripping eq. prefix from id', id)
        id = id.replace(/^eq\./, '')
      }
    } catch { /* ignore */ }    

    const response = await supabase.from('recruiters').select('*').eq('user_id::uuid', id).maybeSingle()
    return response.data;
  } catch (error) {
    console.error('Error fetching recruiter data:', error)
    throw error
  }
}

export async function getMatchDetails(matchId) {
    try {
        const { data, error } = await supabase.from('matches').select("*").eq('id', matchId).maybeSingle()
        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching match details:', error)
        throw error
    }
}