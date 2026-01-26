import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance";

export async function getJobRecommendations(userId, limit = 10) {
  try {
    const response = await fetch(
      "https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/recommendations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        //   "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY // or your anon/public key
        },
        body: JSON.stringify({
          candidate_uuid: userId,
          top_n: limit
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations");
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    return [];
  }
}

export async function getJobDetails(applicationId) {
  const {data, error} = await supabase.rpc('get_recruiter_details_by_application', { p_application_id: applicationId });
  if (error) {
    throw new Error("Failed to fetch job details");
  }
  return data;
}

export async function getCandidateDetails() {
  const {data, error} = await supabase.rpc('get_recruiter_applications', {}, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`
    }
  });
  if (error) {
    throw new Error("Failed to fetch candidate details");
  }
  console.log({ candidate_profile: data[0].candidate_profile })
  return data;
}

export async function getRecruiterShortlisted() {
  // RPC does not accept params; return the raw array the RPC provides
  try {
    const { data, error } = await supabase.rpc('get_shortlisted_candidates', {}, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
    if (!error && data) return Array.isArray(data) ? data : []
    return []
  } catch (err) {
    console.warn('getRecruiterShortlisted RPC failed', err)
    return []
  }

}