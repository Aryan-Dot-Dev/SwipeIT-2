import React, { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AttitudeRadar from '@/components/AttitudeRadar'
import supabase, { getCurrentUser } from '@/utils/supabaseInstance'
import { myProfile, updateCProfile } from '@/api/auth.api'
import { uploadRecruiterProfileSingle } from '@/api/onboarding.api'
import { uploadPfp, uploadResume } from '@/api/storage.api.js'
import { getResume } from '@/api/candidate.api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [candidateUserId, setCandidateUserId] = useState(null)
    const [profileImageUrl, setProfileImageUrl] = useState('')
    const [resumeUrl, setResumeUrl] = useState('')
    const [showSavedModal, setShowSavedModal] = useState(false)
    const savedModalTimer = useRef(null)
    const [profile, setProfile] = useState({
        phone: '',
        age: '',
        profile_img: '',
        bio: '',
        city: '',
        state: '',
        country: '',
        skills: '', // comma-separated
        experience_years: '',
        resume: '', // resume URL
        // preferences
        preferred_job_type: 'remote',
        expected_salary_min: 0,
        expected_salary_max: 0,
        willing_to_relocate: false,
        available_from: '',
        notice_period_days: '',
        min_experience_years: '',
        location_radius_km: '',
    })
    const [isRecruiter, setIsRecruiter] = useState(false)
    const [recruiterSettings, setRecruiterSettings] = useState({
        company_id: '',
        company_name: '',
        company_website: '',
        company_industry: '',
        company_location: '',
        company_logo: '',
        recruiter_first_name: '',
        recruiter_designation: '',
        recruiter_phone: '',
        recruiter_email: '',
        profile_img: '',
    })

    useEffect(() => {
        let mounted = true
            ; (async () => {
                setLoading(true)
                // Prefer server RPC `myProfile()` which returns shape like { candidate: { ... } }
                try {
                    const resp = await myProfile().catch((e) => e || null)
                    console.log('resp', resp)
                    // If the RPC returned a 400 Bad Request (or similar client error), redirect to landing.
                    // Supabase RPCs may return an object with `error` or `status` fields; check common shapes.
                    try {
                        const errStatus = resp?.status || resp?.error?.status || (resp?.error && resp.error.code) || null
                        const errMsg = String(resp?.error?.message || '').toLowerCase()
                        if (errStatus === 400 || String(errStatus) === '400' || errMsg.includes('bad request')) {
                            console.warn('Settings: myProfile returned 400/Bad Request, redirecting to /')
                            window.location.href = '/'
                            return
                        }
                    } catch { /* ignore */ }
                    // prefer server response shapes. If resp.data contains a recruiter structure,
                    // use that as the authoritative payload (this repo returns { data: { ... } }).
                    const respObj = resp || {}
                    const topData = respObj?.data
                    let payload = null
                    if (topData && (topData.role === 'recruiter' || topData.recruiter || topData.company)) {
                        payload = topData
                    } else if (respObj?.recruiter || respObj?.data?.recruiter) {
                        payload = respObj?.recruiter || respObj?.data?.recruiter
                    } else if (respObj?.candidate || respObj?.data?.candidate) {
                        payload = respObj || respObj?.data?.candidate
                    } else {
                        payload = respObj?.data || respObj || null
                    }
                    if (payload) {
                        console.log('Settings: myProfile payload ->', payload)
                        // If this payload looks like a recruiter (contains recruiter/company fields or explicit role),
                        // map recruiter/company -> settings fields so the inputs are prefilled for recruiters.
                        const looksLikeRecruiter = !!(payload?.role === 'recruiter' || payload?.recruiter || payload?.company || (payload?.role && String(payload.role).toLowerCase().includes('recruit')))
                        console.log('Settings: looksLikeRecruiter=', looksLikeRecruiter)
                        if (looksLikeRecruiter) {
                            console.log('Settings: enabling recruiter UI')
                            // Recruiter payloads sometimes come with `recruiter` and `company` nested objects
                            const rec = payload.recruiter || payload
                            const comp = payload.company || payload.company_profile || payload

                            // Prefer the recruiter's personal name (first + last) over the company name for the profile display
                            const recruiterName = [rec?.first_name, rec?.last_name].filter(Boolean).join(' ') || rec?.name || payload?.name || ''
                            const normalizedUser = {
                                id: payload.user_id || payload.id || rec?.user_id || null,
                                email: rec?.email || payload.email || null,
                                user_metadata: { name: recruiterName }
                            }

                            if (mounted) setCurrentUser(normalizedUser)
                            if (mounted) setIsRecruiter(true)

                            // populate recruiter-specific settings object
                            if (mounted) setRecruiterSettings({
                                company_id: comp?.id || comp?.company_id || comp?.company_id || '',
                                company_name: comp?.name || comp?.company_name || '',
                                company_website: comp?.website || comp?.company_website || '',
                                company_industry: comp?.industry || '',
                                company_location: comp?.location || '',
                                company_logo: comp?.logo || comp?.company_logo || '',
                                recruiter_first_name: rec?.first_name || rec?.name || '',
                                recruiter_designation: rec?.designation || '',
                                recruiter_phone: rec?.phone || '',
                                recruiter_email: rec?.email || payload.email || '',
                                profile_img: rec?.profile_img || '',
                            })

                            if (mounted) setProfile(p => ({
                                ...p,
                                phone: rec?.phone || payload.phone || p.phone,
                                // Prefer recruiter personal profile image, then company logo
                                profile_img: rec?.profile_img || comp?.logo || comp?.company_logo || p.profile_img,
                                bio: comp?.description || payload.bio || p.bio,
                                city: comp?.location || payload.city || p.city,
                                state: comp?.state || payload.state || p.state,
                                country: comp?.country || payload.country || p.country,
                                // keep skills / experience fields empty or preserved
                                skills: p.skills,
                                experience_years: p.experience_years,
                            }))
                            if (mounted) setProfileImageUrl(rec?.profile_img || comp?.logo || comp?.company_logo || '')
                            setLoading(false)
                            return
                        }

                        // normalize into `currentUser` and `profile` shapes used by this page (candidate flow)
                        const candidateData = payload.data.candidate || payload
                        const preferencesData = payload.data.preferences || candidateData.preferences

                        const meta = {
                            name: candidateData.name || payload?.candidate_name || '',
                            phone: candidateData.phone || payload.phone || '',
                            profile_img: candidateData.profile_img || payload.avatar || '',
                            bio: candidateData.bio || '',
                            skills: Array.isArray(candidateData.skills) ? candidateData.skills : (typeof candidateData.skills === 'string' ? candidateData.skills.split(',') : []),
                            experience_years: candidateData.experience_years || candidateData.experience || null,
                            city: candidateData.city || '',
                            state: candidateData.state || '',
                            country: candidateData.country || '',
                            // Include preferences data
                            preferred_job_type: preferencesData.preferred_job_type || 'hybrid',
                            expected_salary_min: preferencesData.expected_salary_min || null,
                            expected_salary_max: preferencesData.expected_salary_max || null,
                            willing_to_relocate: preferencesData.willing_to_relocate || false,
                            available_from: preferencesData.available_from || null,
                            notice_period_days: preferencesData.notice_period_days || null,
                            min_experience_years: preferencesData.min_experience_years || null,
                            location_radius_km: preferencesData.location_radius_km || null,
                        }

                        const normalizedUser = {
                            id: payload.user_id || payload.id || null,
                            email: payload.email || candidateData.email || null,
                            user_metadata: meta,
                        }

                        if (mounted) {
                            setCurrentUser(normalizedUser);
                            setCandidateUserId(candidateData.user_id || payload.user_id || payload.id);
                            setIsRecruiter(false);
                        }

                        if (mounted) setProfile(p => ({
                            ...p,
                            phone: candidateData.phone || meta.phone || p.phone,
                            age: candidateData.age || p.age,
                            profile_img: candidateData.profile_img || meta.profile_img || p.profile_img,
                            bio: candidateData.bio || meta.bio || p.bio,
                            city: candidateData.city || meta.city || p.city,
                            state: candidateData.state || meta.state || p.state,
                            country: candidateData.country || meta.country || p.country,
                            skills: Array.isArray(candidateData.skills) ? candidateData.skills.join(',') : (Array.isArray(meta.skills) ? meta.skills.join(',') : (meta.skills || p.skills)),
                            experience_years: candidateData.experience_years || meta.experience_years || p.experience_years,
                            resume: candidateData.resume || p.resume,
                            preferred_job_type: preferencesData.preferred_job_type || meta.preferred_job_type || p.preferred_job_type,
                            expected_salary_min: preferencesData.expected_salary_min || meta.expected_salary_min || p.expected_salary_min,
                            expected_salary_max: preferencesData.expected_salary_max || meta.expected_salary_max || p.expected_salary_max,
                            willing_to_relocate: preferencesData.willing_to_relocate !== undefined ? preferencesData.willing_to_relocate : (meta.willing_to_relocate !== undefined ? meta.willing_to_relocate : p.willing_to_relocate),
                            available_from: preferencesData.available_from || meta.available_from || p.available_from,
                            notice_period_days: preferencesData.notice_period_days || meta.notice_period_days || p.notice_period_days,
                            min_experience_years: preferencesData.min_experience_years || meta.min_experience_years || p.min_experience_years,
                            location_radius_km: preferencesData.location_radius_km || meta.location_radius_km || p.location_radius_km,
                        }))

                        if (mounted) setResumeUrl(candidateData.resume || '')
                        if (mounted) setProfileImageUrl(candidateData.profile_img || meta.profile_img || '')
                        setLoading(false)
                        return
                    }

                } catch (err) {
                    console.error('myProfile rpc failed', err)
                }

                // Fallback to client-side session user if RPC didn't return data
                try {
                    const user = await getCurrentUser()
                    if (!mounted) return
                    if (user) {
                        setCurrentUser(user)
                        setCandidateUserId(user.id)
                        const meta = user?.user_metadata || {}
                        setProfile(p => ({
                            ...p,
                            phone: meta.phone || p.phone,
                            age: meta.age || p.age,
                            profile_img: meta.profile_img || meta.avatar || p.profile_img,
                            bio: meta.bio || p.bio,
                            city: meta.city || p.city,
                            state: meta.state || p.state,
                            country: meta.country || p.country,
                            skills: (meta.skills && Array.isArray(meta.skills)) ? meta.skills.join(',') : (meta.skills || p.skills),
                            experience_years: meta.experience_years || p.experience_years,
                            resume: meta.resume || p.resume,
                            preferred_job_type: meta.preferred_job_type || p.preferred_job_type,
                            expected_salary_min: meta.expected_salary_min || p.expected_salary_min,
                            expected_salary_max: meta.expected_salary_max || p.expected_salary_max,
                            willing_to_relocate: meta.willing_to_relocate || p.willing_to_relocate,
                            available_from: meta.available_from || p.available_from,
                            notice_period_days: meta.notice_period_days || p.notice_period_days,
                            min_experience_years: meta.min_experience_years || p.min_experience_years,
                            location_radius_km: meta.location_radius_km || p.location_radius_km,
                        }))
                        setProfileImageUrl(meta.profile_img || meta.avatar || '')
                        if (meta.resume) {
                            setResumeUrl(meta.resume);
                        }
                    }
                } catch { void 0 }

                setLoading(false)
            })()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        return () => {
            if (savedModalTimer.current) clearTimeout(savedModalTimer.current)
        }
    }, [])



    // If recruiterSettings get populated (from myProfile), ensure isRecruiter is true
    useEffect(() => {
        if (recruiterSettings && (recruiterSettings.company_name || recruiterSettings.recruiter_email)) setIsRecruiter(true)
    }, [recruiterSettings])

    // Debug: log role-related state used for choosing recruiter vs candidate UI
    useEffect(() => {
        try {
            console.log('Settings: isRecruiter=', isRecruiter, 'currentUser=', currentUser, 'recruiterSettings=', recruiterSettings)
        } catch { /* ignore */ }
    }, [isRecruiter, currentUser, recruiterSettings])

    // Fetch resume data from database to get the file_url
    useEffect(() => {
        let mounted = true
        if (!candidateUserId || isRecruiter) return

        const fetchResumeData = async () => {
            try {
                const resumeData = await getResume(candidateUserId)
                if (mounted && resumeData && resumeData.file_url) {
                    setResumeUrl(resumeData.file_url)
                }
            } catch (err) {
                console.error('Failed to fetch resume data:', err)
            }
        }

        fetchResumeData()
        return () => { mounted = false }
    }, [candidateUserId, isRecruiter])

    // Listen for profile image updates from other components
    useEffect(() => {
        const handleProfileImageUpdate = (event) => {
            const { profileImage } = event.detail;
            if (profileImage) {
                setProfileImageUrl(profileImage);
                setField('profile_img', profileImage);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
            return () => {
                window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
            };
        }
    }, []);

    function setField(key, val) {
        setProfile(p => ({ ...p, [key]: val }))
    }

    function setRecruiterField(key, val) {
        setRecruiterSettings(r => ({ ...r, [key]: val }))
    }

    async function handleProfilePictureUpload(file) {
        try {
            setUploading(true);
            const user = await getCurrentUser();
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const publicUrl = await uploadPfp(file, user.id, isRecruiter ? 'recruiter' : 'candidate');

            // Add cache-busting parameter to force image refresh
            const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;

            // Update profile image for both candidate and recruiter
            if (isRecruiter) {
                setRecruiterField('profile_img', cacheBustedUrl);
            } else {
                setField('profile_img', cacheBustedUrl);
            }
            setProfileImageUrl(cacheBustedUrl);

            // Dispatch event to update header avatar in real-time
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('profileImageUpdated', {
                    detail: { profileImage: cacheBustedUrl }
                }));
            }
        } catch (error) {
            console.error('Profile picture upload failed:', error);
            alert('Failed to upload profile picture. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    // Remove profile image: delete storage object when possible and clear DB field
    async function handleRemoveProfileImage() {
        try {
            const user = await getCurrentUser();
            const userId = user?.id || candidateUserId;
            if (!userId) throw new Error('No authenticated user')

            // Try to delete file from storage if URL present
            const url = profile.profile_img || profileImageUrl || currentUser?.user_metadata?.profile_img || ''
            if (url) {
                try {
                    const parsed = new URL(url)
                    const pathIndex = parsed.pathname.indexOf('/storage/v1/object/public/')
                    if (pathIndex !== -1) {
                        const after = parsed.pathname.substring(pathIndex + '/storage/v1/object/public/'.length)
                        // after = "<bucket>/<objectPath>"
                        const firstSlash = after.indexOf('/')
                        if (firstSlash !== -1) {
                            const bucket = after.substring(0, firstSlash)
                            const objectPath = after.substring(firstSlash + 1)
                            try {
                                const del = await supabase.storage.from(bucket).remove([objectPath])
                                if (del?.error) console.warn('Failed to remove storage object:', del.error)
                                else console.log('Removed storage object', objectPath)
                            } catch (e) {
                                console.warn('Error deleting storage object from supabase:', e)
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse profile image URL for deletion:', e)
                }
            }

            // Clear DB column for profile image
            if (isRecruiter) {
                const { error } = await supabase.from('recruiters').update({ profile_img: '' }).eq('user_id', userId)
                if (error) console.warn('Failed to clear recruiter profile_img:', error)
            } else {
                const { error } = await supabase.from('candidates').update({ profile_img: '' }).eq('user_id', userId)
                if (error) console.warn('Failed to clear candidate profile_img:', error)
            }

            // Update local state and notify other components
            setField('profile_img', '')
            setProfileImageUrl('')
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { profileImage: '' } }))

        } catch (err) {
            console.error('Failed to remove profile image', err)
            alert('Failed to remove profile image. Check console for details.')
        }
    }

    async function handleResumeUpload(file) {
        try {
            setUploading(true);
            const user = await getCurrentUser();
            if (!user?.id) {
                throw new Error('User not authenticated');
            }

            const result = await uploadResume(file, user.id);

            setField('resume', result.url);
            setResumeUrl(result.url);

        } catch (error) {
            console.error('Resume upload failed:', error);
            alert('Failed to upload resume. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    async function handleSaveRecruiter(e) {
        e?.preventDefault()
        setSaving(true)
        try {
            const payload = {
                user_id: currentUser?.id || null,
                first_name: recruiterSettings.recruiter_first_name || null,
                email: recruiterSettings.recruiter_email || null,
                phone: recruiterSettings.recruiter_phone || null,
                designation: recruiterSettings.recruiter_designation || null,
                profile_img: profileImageUrl || profile.profile_img || null,
                company: {
                    id: recruiterSettings.company_id || null,
                    name: recruiterSettings.company_name || null,
                    website: recruiterSettings.company_website || null,
                    industry: recruiterSettings.company_industry || null,
                    location: recruiterSettings.company_location || null,
                    logo: recruiterSettings.company_logo || null,
                }
            }
            // call onboarding API helper
            await uploadRecruiterProfileSingle(payload)
            setShowSavedModal(true)
            if (savedModalTimer.current) clearTimeout(savedModalTimer.current)
            savedModalTimer.current = setTimeout(() => setShowSavedModal(false), 3000)
        } catch (err) {
            console.error('save recruiter profile failed', err)
            alert('Failed to save recruiter settings')
        } finally {
            setSaving(false)
        }
    }

    function validate() {
        const age = Number(profile.age)
        if (profile.age && (isNaN(age) || age < 18)) return 'Age must be a number and at least 18'
        const min = Number(profile.expected_salary_min || 0)
        const max = Number(profile.expected_salary_max || 0)
        if (min < 0) return 'Minimum expected salary must be >= 0'
        if (max && max < min) return 'Maximum expected salary must be >= minimum expected salary'
        return null
    }

    async function handleSave(e) {
        if (e) e.preventDefault()
        const err = validate()
        if (err) return alert(err)
        setSaving(true)
        try {
            const payload = {
                user_id: candidateUserId,
                name: currentUser?.user_metadata?.name || null,
                email: currentUser?.email || null,
                phone: profile.phone || null,
                age: profile.age ? Number(profile.age) : null,
                profile_img: profile.profile_img || null,
                bio: profile.bio || null,
                city: profile.city || null,
                state: profile.state || null,
                country: profile.country || null,
                skills: profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
                experience_years: profile.experience_years ? Number(profile.experience_years) : null,
                resume: profile.resume || null,
                candidate_preferences: {
                    preferred_job_type: profile.preferred_job_type || null,
                    expected_salary_min: profile.expected_salary_min ? Number(profile.expected_salary_min) : null,
                    expected_salary_max: profile.expected_salary_max ? Number(profile.expected_salary_max) : null,
                    willing_to_relocate: !!profile.willing_to_relocate,
                    available_from: profile.available_from || null,
                    notice_period_days: profile.notice_period_days ? Number(profile.notice_period_days) : null,
                    min_experience_years: profile.min_experience_years ? Number(profile.min_experience_years) : null,
                    location_radius_km: profile.location_radius_km ? Number(profile.location_radius_km) : null,
                }
            }

            const res = await updateCProfile(payload)
            if (!res) {
                alert('Failed to save profile')
            } else {
                // show a temporary celebratory modal instead of the default alert
                setShowSavedModal(true)
                if (savedModalTimer.current) clearTimeout(savedModalTimer.current)
                savedModalTimer.current = setTimeout(() => setShowSavedModal(false), 3000)
            }
        } catch (err) {
            console.error('save error', err)
            alert('Error saving profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <LoadingSpinner size="lg" text="Loading settings..." fullScreen />

    return (
        <div className="w-full min-h-screen px-2 sm:px-4 md:px-6 py-4" style={{ background: 'linear-gradient(135deg, var(--sidebar), rgba(255,255,255,0))' }}>
            <div className="w-full max-w-[1600px] mx-auto grid grid-cols-12 gap-4 md:gap-6">
                {/* Layout: desktop = 3 / 9 columns; tablet (md) = 4 / 8 columns; mobile = stacked (col-span-12) */}
                <aside className="col-span-12 md:col-span-4 lg:col-span-3">
                    <div className="bg-white border border-[#E4DFF5] rounded-2xl shadow-md overflow-hidden md:sticky md:top-6">
                        {/* Avatar overlapping banner */}
                        <div className="px-5 pb-4">
                            <div className="flex items-end gap-3 mb-3">
                                <div
                                    className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                                    style={{
                                        backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : 'linear-gradient(135deg,#9A8CF2,#16a34a)',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                >
                                    {!profileImageUrl && (
                                        isRecruiter
                                            ? (recruiterSettings.company_name || 'C').charAt(0)
                                            : (currentUser?.user_metadata?.name || currentUser?.email || 'U').charAt(0)
                                    )}
                                </div>
                                <div className="pb-1 min-w-0">
                                    <div className="font-semibold text-[#1C1A2E] text-base leading-tight truncate">
                                        {isRecruiter
                                            ? (recruiterSettings.recruiter_first_name || currentUser?.user_metadata?.name || recruiterSettings.company_name)
                                            : (currentUser?.user_metadata?.name || currentUser?.email)}
                                    </div>
                                    <div className="text-xs text-[#6E6B86] truncate mt-0.5">
                                        {isRecruiter
                                            ? (recruiterSettings.company_name || recruiterSettings.company_website || currentUser?.email)
                                            : currentUser?.email}
                                    </div>
                                    {isRecruiter && recruiterSettings.company_location && (
                                        <div className="text-xs text-[#9A8CF2] mt-0.5">{recruiterSettings.company_location}</div>
                                    )}
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="bg-[#F6F5FA] rounded-xl px-3 py-2.5 text-sm text-[#6E6B86] leading-relaxed mb-3">
                                {profile.bio || (
                                    <span className="italic text-[#9A8CF2]/60">No bio yet — add a short summary about yourself.</span>
                                )}
                            </div>

                            {/* Stat chips — candidate only */}
                            {!isRecruiter && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <div className="flex items-center gap-1.5 bg-[#E4DFF5] text-[#9A8CF2] text-xs font-semibold px-3 py-1.5 rounded-full">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {profile.experience_years || '—'} yrs exp
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-[#16a34a]/15 text-[#0F7A4A] text-xs font-semibold px-3 py-1.5 rounded-full">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        {profile.preferred_job_type || 'any'}
                                    </div>
                                </div>
                            )}

                            {/* Avatar upload controls */}
                            <div className="flex gap-2 mb-4">
                                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm cursor-pointer font-medium transition-all" style={{ background: '#9A8CF2', color: '#fff' }}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleProfilePictureUpload(file); }} className="hidden" />
                                    {uploading ? 'Uploading…' : 'Update photo'}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveProfileImage()}
                                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Remove
                                </button>
                            </div>

                            {/* Resume upload — candidates only */}
                            {!isRecruiter && (
                                <div className="mb-4">
                                    <div className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-2">Resume</div>
                                    <div
                                        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all ${uploading
                                            ? 'border-[#9A8CF2]/40 bg-[#9A8CF2]/5'
                                            : resumeUrl
                                                ? 'border-[#16a34a] bg-[#16a34a]/8'
                                                : 'border-[#E4DFF5] hover:border-[#9A8CF2]/40 hover:bg-[#F6F5FA]'
                                            }`}
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#9A8CF2]/50'); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#9A8CF2]/50'); }}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-[#9A8CF2]/50'); const files = e.dataTransfer.files; if (files.length > 0 && files[0]) { handleResumeUpload(files[0]); } }}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => { const file = e.target.files?.[0]; if (file) handleResumeUpload(file); }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            disabled={uploading}
                                        />
                                        <div className="flex flex-col items-center gap-1.5">
                                            {uploading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-transparent border-t-[#9A8CF2]" />
                                                    <p className="text-xs font-semibold text-[#9A8CF2]">Uploading resume…</p>
                                                </>
                                            ) : resumeUrl ? (
                                                <>
                                                    <div className="w-8 h-8 rounded-full bg-[#16a34a]/20 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-[#0F7A4A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <p className="text-xs font-semibold text-[#0F7A4A]">Resume uploaded!</p>
                                                    <p className="text-xs text-[#6E6B86]">Click to replace</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-8 h-8 rounded-full bg-[#E4DFF5] flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-[#9A8CF2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                    </div>
                                                    <p className="text-xs font-medium text-[#1C1A2E]">Click or drag resume here</p>
                                                    <p className="text-xs text-[#6E6B86]">PDF, DOC, DOCX (max 10MB)</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* View PDF button */}
                                    {resumeUrl && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(resumeUrl, '_blank')}
                                            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-[#9A8CF2] text-white hover:bg-[#8879e8] transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            View PDF
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Skills */}
                            {!isRecruiter && (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                                <div className="mb-2">
                                    <div className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-2">Skills</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(profile.skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 10).map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-[#E4DFF5] text-[#9A8CF2] text-xs font-medium rounded-full">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attitude radar */}
                            {((profile && profile.attitude_score) || (currentUser?.user_metadata && currentUser.user_metadata.attitude_score)) && (
                                <div className="mt-3">
                                    <div className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-2">Attitude</div>
                                    <AttitudeRadar data={(profile.attitude_score || currentUser.user_metadata.attitude_score)} size={200} levels={4} />
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Right column: editable sections + sticky save bar */}
                <main className="col-span-12 md:col-span-8 lg:col-span-9">
                    <div className="bg-white border border-[#E4DFF5] rounded-2xl shadow-md overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-[#E4DFF5] bg-gradient-to-r from-[#F6F5FA] to-white">
                            <div>
                                <h3 className="text-base font-semibold text-[#1C1A2E]">Profile Settings</h3>
                                <p className="text-xs text-[#6E6B86] mt-0.5">Update your profile and preferences</p>
                            </div>
                            <div className="hidden md:block">
                                <Button onClick={() => { if (isRecruiter) { handleSaveRecruiter() } else { handleSave() } }} disabled={saving} className="border-0 rounded-xl px-5" style={{ background: '#16a34a', color: '#FFFFFF', fontWeight: 700 }}>{saving ? 'Saving…' : (isRecruiter ? 'Save settings' : 'Save changes')}</Button>
                            </div>
                        </div>

                        {/* Conditional: recruiter vs candidate simplified and balanced */}
                        {isRecruiter ? (
                            <form onSubmit={e => { e.preventDefault(); handleSaveRecruiter(e) }} className="p-5 space-y-6 pb-24 md:pb-6">
                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Company</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#6E6B86] font-medium text-xs uppercase tracking-wide">Company name</Label>
                                            <Input value={recruiterSettings.company_name} onChange={e => setRecruiterField('company_name', e.target.value)} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-[#6E6B86] font-medium text-xs uppercase tracking-wide">Website</Label>
                                            <Input value={recruiterSettings.company_website} onChange={e => setRecruiterField('company_website', e.target.value)} className="mt-1" />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Contact</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#6E6B86] font-medium text-xs uppercase tracking-wide">First name</Label>
                                            <Input value={recruiterSettings.recruiter_first_name} onChange={e => setRecruiterField('recruiter_first_name', e.target.value)} className="mt-1" />
                                        </div>
                                        <div>
                                            <Label className="text-[#6E6B86] font-medium text-xs uppercase tracking-wide">Email</Label>
                                            <Input value={recruiterSettings.recruiter_email} onChange={e => setRecruiterField('recruiter_email', e.target.value)} className="mt-1" />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button className="bg-[#F2F2F5] text-[#1C1A2E] hover:bg-[#E4DFF5] border-0 rounded-xl" onClick={() => setRecruiterSettings(r => ({ ...r, company_name: '', company_website: '', company_industry: '', company_location: '', company_logo: '' }))}>Reset</Button>
                                    <Button onClick={handleSaveRecruiter} className="border-0 rounded-xl" style={{ background: '#16a34a', color: '#FFFFFF', fontWeight: 700 }}>{saving ? 'Saving…' : 'Save settings'}</Button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={e => { e.preventDefault(); handleSave(e) }} className="p-5 space-y-6 pb-24 md:pb-6">
                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Basic information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Full name</Label>
                                            <Input value={currentUser?.user_metadata?.name || ''} disabled />
                                        </div>
                                        <div>
                                            <Label>Email</Label>
                                            <Input value={currentUser?.email || ''} disabled />
                                        </div>
                                        <div>
                                            <Label>Phone</Label>
                                            <Input value={profile.phone} onChange={e => setField('phone', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Age</Label>
                                            <Input type="number" value={profile.age} onChange={e => setField('age', e.target.value)} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Location</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <Label>City</Label>
                                            <Input value={profile.city} onChange={e => setField('city', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>State</Label>
                                            <Input value={profile.state} onChange={e => setField('state', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Country</Label>
                                            <Input value={profile.country} onChange={e => setField('country', e.target.value)} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Bio</h4>
                                    <textarea value={profile.bio} onChange={e => setField('bio', e.target.value)} className="w-full rounded-xl border border-[#E4DFF5] bg-[#F6F5FA] p-3 min-h-[100px] text-sm focus:outline-none focus:border-[#9A8CF2] focus:ring-2 focus:ring-[#9A8CF2]/20 transition-all" />
                                </section>

                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Skills</h4>
                                    <Input value={profile.skills} onChange={e => setField('skills', e.target.value)} placeholder="comma separated, e.g. React, Node, SQL" />
                                </section>

                                <section>
                                    <h4 className="text-xs font-semibold text-[#9A8CF2] uppercase tracking-wider mb-3">Experience & Preferences</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Years of experience</Label>
                                            <Input type="number" value={profile.experience_years} onChange={e => setField('experience_years', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Minimum experience (pref)</Label>
                                            <Input type="number" value={profile.min_experience_years} onChange={e => setField('min_experience_years', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Location radius (km)</Label>
                                            <Input type="number" value={profile.location_radius_km} onChange={e => setField('location_radius_km', e.target.value)} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E4DFF5]">
                                        <div>
                                            <Label>Preferred job type</Label>
                                            <select value={profile.preferred_job_type} onChange={e => setField('preferred_job_type', e.target.value)} className="w-full rounded-xl border border-[#E4DFF5] bg-[#F6F5FA] p-2.5 text-sm focus:outline-none focus:border-[#9A8CF2] mt-1 transition-all">
                                                <option value="remote">Remote</option>
                                                <option value="onsite">Onsite</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Willing to relocate</Label>
                                            <div className="flex items-center gap-2"><input id="relocate" type="checkbox" checked={profile.willing_to_relocate} onChange={e => setField('willing_to_relocate', e.target.checked)} /><label htmlFor="relocate" className="text-sm">Yes</label></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <Label>Expected salary min</Label>
                                            <Input type="number" value={profile.expected_salary_min} onChange={e => setField('expected_salary_min', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Expected salary max</Label>
                                            <Input type="number" value={profile.expected_salary_max} onChange={e => setField('expected_salary_max', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-[#E4DFF5]">
                                        <Button type="submit" disabled={saving} className="border-0 rounded-xl px-6" style={{ background: '#16a34a', color: '#FFFFFF', fontWeight: 700 }}>{saving ? 'Saving…' : 'Save changes'}</Button>
                                    </div>
                                </section>

                                {/* Keep resume upload area and resume access card (already mobile-friendly) */}
                            </form>
                        )}
                    </div>
                </main>
            </div>
            {/* Mobile-only fixed save bar for touch devices */}
            <div className="fixed bottom-4 left-0 right-0 px-4 md:hidden z-50">
                <div className="max-w-[1600px] mx-auto">
                    <Button onClick={() => { if (isRecruiter) { handleSaveRecruiter() } else { handleSave() } }} disabled={saving} className="w-full py-3 border-0 rounded-2xl font-bold shadow-lg" style={{ background: '#16a34a', color: '#FFFFFF' }}>{saving ? 'Saving…' : (isRecruiter ? 'Save recruiter settings' : 'Save changes')}</Button>
                </div>
            </div>

            <SavedModal open={showSavedModal} />
        </div>
    )
}

/* Celebratory modal styles are minimal and self-contained for quick use */
const SavedModal = ({ open = false }) => {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 bg-[color:var(--card)] rounded-lg p-6 w-full max-w-sm text-center shadow-2xl border" style={{ borderColor: 'var(--border)' }}>
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                <h3 className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Profile saved</h3>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-1">Your profile changes were saved successfully.</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--primary)', animation: 'saved-bounce 800ms infinite alternate' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--secondary)', animation: 'saved-bounce 700ms infinite alternate-reverse' }} />
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--accent)', animation: 'saved-bounce 900ms infinite alternate' }} />
                </div>
            </div>
            <style>{`@keyframes saved-bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }`}</style>
        </div>
    )
}

export default SettingsPage
