import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance"

const createJobPosting = async(jobData) => {
    try {
        // Primary approach: Use RPC function
        const { data, error } = await supabase.rpc("create_job_posting", {
            p_application_deadline: jobData.application_deadline,
            p_currency: jobData.currency,
            p_description: jobData.description,
            p_education_level: jobData.education_level,
            p_embedding: jobData.embedding,
            p_experience_min: jobData.experience_min || 1,
            p_job_type: jobData.job_type,
            p_location: jobData.location,
            p_recruiter_id: jobData.recruiter_id,
            p_required_skills: jobData.required_skills,
            p_salary_max: jobData.salary_max,
            p_salary_min: jobData.salary_min,
            p_status: jobData.status,
            p_title: jobData.title
        })

        

        if (error) {
            throw new Error("Error creating job posting: " + error.message)
        }

        return data;
    } catch (rpcError) {
        console.warn('RPC function failed, trying direct table insertion:', rpcError.message)

        // Fallback to direct table insertion if RPC doesn't exist
        try {
            const { data, error } = await supabase
                .from('job_postings')
                .insert({
                    title: jobData.title,
                    description: jobData.description,
                    recruiter_id: jobData.recruiter_id,
                    location: jobData.location,
                    job_type: jobData.job_type,
                    salary_min: jobData.salary_min,
                    salary_max: jobData.salary_max,
                    currency: jobData.currency,
                    experience_min: jobData.experience_min || 1,
                    education_level: jobData.education_level,
                    status: jobData.status,
                    application_deadline: jobData.application_deadline,
                    required_skills: jobData.required_skills,
                    embedding: jobData.embedding
                })
                .select()

            if (error) {
                throw new Error("Error creating job posting via table insertion: " + error.message)
            }

            return data;
        } catch (tableError) {
            console.error('Both RPC and table insertion failed:', { rpcError: rpcError.message, tableError: tableError.message })
            throw new Error("Failed to create job posting: " + rpcError.message)
        }
    }
}

const createJobPosting_V2 = createJobPosting;

const getAllMyJobs = async() =>{
    const { data, error } = await supabase.rpc('get_recruiter_jobs_dashboard', {}, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) throw new Error("Error fetching jobs: " + error.message);
    return data;
}

export { createJobPosting, createJobPosting_V2, getAllMyJobs }