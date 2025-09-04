// Lightweight wrapper for calling the candidate onboarding edge function
const REMOTE_FUNCTIONS_URL = "https://guzggqrlaexecpzyesxm.supabase.co/functions/v1";
import supabase, { getCurrentUser } from "@/utils/supabaseInstance";

export async function updateCandidateProfile(payload) {
    try {
        let access_token = null;
        let user_id = null;

        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) {
                access_token = data.session.access_token;
                user_id = data.session.user?.id;
            }
        } catch {
            // ignore and fallback
        }

        if (!access_token || !user_id) {
            // try cookies/session via supabase helper
            try {
                const user = await getCurrentUser()
                user_id = user_id || user?.id || null
            } catch { /* ignore */ }
            // try cookie access_token
            try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ }
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        // Validate presence of required fields before calling the Edge Function
        if (!user_id || !payload) {
            console.error('Missing user_id or profileData before request', { user_id, hasPayload: !!payload });
            return null;
        }

        const res = await fetch(`${REMOTE_FUNCTIONS_URL}/candidate_onboarding`, {
            method: 'POST',
            headers,
            // Edge function expects `profileData` key (server-side error indicated this)
            body: JSON.stringify({ profileData: { user_id, ...payload } }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error('Error updating profile:', data.error || data.message || data);
            return null;
        }

        return data;
    } catch (err) {
        console.error('updateCandidateProfile error', err);
        return null;
    }
}

export async function uploadCandidateEmbedding(candidateId, candidate_embedding) {

    try {
        const url = `${REMOTE_FUNCTIONS_URL}/candidate_embedding`;

        const body = JSON.stringify({ p_candidate_id: candidateId, p_embedding: candidate_embedding });
        const res = await fetch(url, { method: 'POST', body });

        const data = await res.json().catch(() => ({}));
        console.log('uploadCandidateEmbedding response status:', res.status, 'body:', data);
        if (!res.ok) throw new Error(data?.error || data?.message || 'generateCandidateEmbedding failed');
        return data;
    } catch (err) {
        console.error('generateCandidateEmbedding error', err);
        return null;
    }
}

export async function uploadRecruiterProfile(user_id, company, contact, designation) {
    try {
        // build headers with auth fallback like other functions
        let access_token = null;

        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch { /* ignore */ }
        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_profile`;
        const body = JSON.stringify({ user_id, company, contact, designation });
        const res = await fetch(url, { method: 'POST', headers, body });

        const data = await res.json().catch(() => ({}));
        console.log('uploadRecruiterProfile status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('uploadRecruiterProfile error:', data?.error || data?.message || data);
            return null;
        }
        return data;
    } catch (err) {
        console.error('uploadRecruiterProfile error', err);
        return null;
    }
}

export async function uploadRecruiterJobs(user_id, job_openings, embedding, company_id = null) {
    try {
        // auth/header handling
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch { /* ignore */ }
        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_jobs`;
        const body = JSON.stringify({ user_id, job_openings, embedding, company_id });
        const res = await fetch(url, { method: 'POST', headers, body });

        const data = await res.json().catch(() => ({}));
        console.log('uploadRecruiterJobs status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('uploadRecruiterJobs error:', data?.error || data?.message || data);
            return null;
        }
        return data;
    } catch (err) {
        console.error('uploadRecruiterJobs error', err);
        return null;
    }
}

// New helper: accept single profileData object { user_id, first_name, last_name, email, phone, designation, company_id }
export async function uploadRecruiterProfileSingle(profileData) {
    try {
        // reuse auth/header logic
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch {
            // ignore
        }

        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_profile`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(profileData) });
        const data = await res.json().catch(() => ({}));
        console.log('uploadRecruiterProfileSingle status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('uploadRecruiterProfileSingle error:', data?.error || data?.message || data);
            throw new Error(data?.error || data?.message || 'uploadRecruiterProfile failed');
        }
        return data;
    } catch (err) {
        console.error('uploadRecruiterProfileSingle error', err);
        throw err;
    }
}

// New helper: accept single jobData object (see example in conversation)
export async function uploadRecruiterJobsSingle(jobData) {
    try {
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch {
            // ignore
        }

        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_jobs`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(jobData) });
        const data = await res.json().catch(() => ({}));
        console.log('uploadRecruiterJobsSingle status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('uploadRecruiterJobsSingle error:', data?.error || data?.message || data);
            throw new Error(data?.error || data?.message || 'uploadRecruiterJobs failed');
        }
        return data;
    } catch (err) {
        console.error('uploadRecruiterJobsSingle error', err);
        throw err;
    }
}

// New server-side helpers matching the requested API shape
export async function createOrUpdateCompany(company) {
    try {
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch {
            // ignore
        }

        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            // ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            // ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/company_profile`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(company) });
        const data = await res.json().catch(() => ({}));
        console.log('createOrUpdateCompany status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('createOrUpdateCompany error:', data?.error || data?.message || data);
            throw new Error(data?.error || data?.message || 'createOrUpdateCompany failed');
        }
        return data;
    } catch (err) {
        console.error('createOrUpdateCompany error', err);
        throw err;
    }
}

export async function upsertRecruiterProfile(user_id, recruiterData) {
    try {
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch {
            // ignore
        }

        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            // ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            // ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_profile`;
        const body = JSON.stringify({ user_id, ...recruiterData });
        const res = await fetch(url, { method: 'POST', headers, body });
        const data = await res.json().catch(() => ({}));
        console.log('upsertRecruiterProfile status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('upsertRecruiterProfile error:', data?.error || data?.message || data);
            throw new Error(data?.error || data?.message || 'upsertRecruiterProfile failed');
        }
        return data;
    } catch (err) {
        console.error('upsertRecruiterProfile error', err);
        throw err;
    }
}

export async function createJobPosting(jobData) {
    try {
        let access_token = null;
        try {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) access_token = data.session.access_token;
        } catch {
            // ignore
        }

        if (!access_token) { try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); access_token = access_token || (m ? decodeURIComponent(m[1]) : null) } catch { /* ignore */ } }

        const headers = {
            'Content-Type': 'application/json',
            // ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
            // ...(import.meta.env.VITE_SUPABASE_ANON_KEY ? { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } : {}),
        };

        const url = `${REMOTE_FUNCTIONS_URL}/recruiter_jobs`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(jobData) });
        const data = await res.json().catch(() => ({}));
        console.log('createJobPosting status:', res.status, 'body:', data);
        if (!res.ok) {
            console.error('createJobPosting error:', data?.error || data?.message || data);
            throw new Error(data?.error || data?.message || 'createJobPosting failed');
        }
        return data;
    } catch (err) {
        console.error('createJobPosting error', err);
        throw err;
    }
}

export async function updateAttitudeScore(attitudePayload, userId, role){
    
    try {
        const { data, error } = await supabase.from(role).update({attitude_score: attitudePayload}).eq('user_id', userId).select();
        if (error) {
            console.error('updateAttitudeScore error:', error);
            throw new Error(error.message || 'updateAttitudeScore failed');
        }
        return data;
    } catch (err) {
        console.error('updateAttitudeScore error', err);
        throw err;
    }
}