import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance";

export async function getJobRecommendations(userId, limit = 20) {
  // Try Edge Function first
  try {
    const response = await fetch(
      "https://guzggqrlaexecpzyesxm.supabase.co/functions/v1/recommendations",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_uuid: userId, top_n: limit })
      }
    );

    if (response.ok) {
      const data = await response.json();
      let normalized = [];
      if (Array.isArray(data)) normalized = data;
      else if (Array.isArray(data?.recommendations)) normalized = data.recommendations;
      else if (Array.isArray(data?.data)) normalized = data.data;
      else if (Array.isArray(data?.results)) normalized = data.results;
      else {
        const firstArray = Object.values(data || {}).find(v => Array.isArray(v));
        if (Array.isArray(firstArray)) normalized = firstArray;
      }

      // If Edge Function returned meaningful results, use them
      if (normalized.length > 1) {
        return normalized;
      }
    }
  } catch (err) {
    console.warn("Recommendations Edge Function failed, falling back to direct query:", err);
  }

  // Fallback: fetch directly from job_postings table
  console.log("Using direct job_postings fallback for user:", userId);
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        id,
        title,
        description,
        location,
        job_type,
        salary_min,
        salary_max,
        currency,
        experience_min,
        education_level,
        required_skills,
        status,
        apply_url,
        application_deadline,
        created_at,
        recruiter_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Direct job_postings query failed:", error);
      return [];
    }

    // Shape to match what the rest of the app expects
    return (data || []).map(job => ({
      ...job,
      similarity: 0.5, // neutral similarity for non-personalized results
      company_name: null,
      company_location: job.location,
    }));
  } catch (err) {
    console.error("Fallback job fetch failed:", err);
    return [];
  }
}

export async function getJobDetails(applicationId) {
  const { data, error } = await supabase.rpc('get_recruiter_details_by_application', { p_application_id: applicationId });
  if (error) {
    throw new Error("Failed to fetch job details");
  }
  return data;
}

export async function getCandidateDetails() {
  const { data, error } = await supabase.rpc('get_recruiter_applications', {}, {
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