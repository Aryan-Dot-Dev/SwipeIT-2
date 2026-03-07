import { getAccessToken } from "@/utils/cookieInstance";
import supabase from "@/utils/supabaseInstance"

const createJobPosting = async (jobData) => {
    // Fallback: direct table insertion (skipping embedding — it's a server-side vector field)
    try {
        const { data, error } = await supabase
            .from('job_postings')
            .insert({
                title: jobData.title,
                description: jobData.description,
                recruiter_id: jobData.recruiter_id,
                location: jobData.location || null,
                job_type: jobData.job_type || null,
                salary_min: jobData.salary_min ? Number(jobData.salary_min) : null,
                salary_max: jobData.salary_max ? Number(jobData.salary_max) : null,
                currency: jobData.currency || 'INR',
                experience_min: jobData.experience_min ? Number(jobData.experience_min) : null,
                education_level: jobData.education_level || null,
                status: jobData.status || 'active',
                application_deadline: jobData.application_deadline || null,
                required_skills: jobData.required_skills || null,
                apply_url: jobData.apply_url ? jobData.apply_url.trim() : null,
            })
            .select()

        if (error) {
            console.error('Job posting insert error:', error)
            throw new Error("Error creating job posting: " + error.message)
        }

        return data;
    } catch (err) {
        console.error('createJobPosting failed:', err)
        throw err
    }
}

const createJobPosting_V2 = createJobPosting;

const getAllMyJobs = async () => {
    const { data, error } = await supabase.rpc('get_recruiter_jobs_dashboard', {}, {
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    })

    if (error) throw new Error("Error fetching jobs: " + error.message);
    return data;
}

const deleteJob = async (jobId) => {
    try {
        const { data, error } = await supabase.rpc('delete_job', {
            job_id_input: jobId
        })

        if (error) {
            throw new Error("Error deleting job: " + error.message)
        }

        return data;
    } catch (err) {
        console.error('Failed to delete job:', err)
        throw err
    }
}

export { createJobPosting, createJobPosting_V2, getAllMyJobs, deleteJob }