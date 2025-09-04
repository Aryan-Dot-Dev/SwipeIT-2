import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Button } from "@/components/ui/button"
import { generateCandidateEmbeddingText } from '@/lib/embeddings'
import { getCurrentUser } from '@/utils/supabaseInstance'
import { uploadResume, uploadPfp } from '@/api/storage.api.js'
// Import worker files as resolved asset URLs so Vite can provide a valid worker script URL.
import pdfWorkerMinUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema2 = yup
  .object({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
  })
  .required()

const initialData = {
  name: '', email: '', bio: '', phone: '', city: '', state: '', country: '', age: null, profile_img: '',
  skills: [], experienceYears: '', education: [], experience: [], resumes: [], resumeUrl: '', workHistory: '',
  jobType: 'remote', expected_salary_min: '', expected_salary_max: '', location: '', willingToRelocate: false,
  available_from: '', notice_period_days: '', min_experience_years: '', location_radius_km: '',
}

export default function CandidateOnboarding() {
  const navigate = useNavigate()
  const [data, setData] = useState(() => {
    try { const raw = localStorage.getItem('onboarding_data'); return raw ? JSON.parse(raw) : initialData } catch { return initialData }
  })
  const [step, setStep] = useState(0)
  const [skillInput, setSkillInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [educationDraft, setEducationDraft] = useState({ institution: '', degree: '', start_year: '', end_year: '' })
  const [copied, setCopied] = useState(false)
  const [skipHidden, setSkipHidden] = useState(false)
  // embedding state removed (not needed here) to avoid unused variable lint warnings

  const formRef = useRef(null)
  const profileInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema2), defaultValues: { name: data.name, email: data.email } })

  useEffect(() => { reset({ name: data.name, email: data.email }) }, [data.name, data.email, reset])
  useEffect(() => { localStorage.setItem('onboarding_data', JSON.stringify(data)) }, [data])

  function next() { setStep(s => Math.min(5, s + 1)) }
  function prev() { setStep(s => Math.max(0, s - 1)) }

  function addSkill() { const v = (skillInput || '').trim(); if (!v) return; if (!data.skills.includes(v)) setData({ ...data, skills: [...data.skills, v] }); setSkillInput('') }
  function removeSkill(skill) { setData({ ...data, skills: data.skills.filter(s => s !== skill) }) }

  async function uploadResumeToStorage(file) {
    try {
      setUploading(true);
      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
  const uploadResult = await uploadResume(file, user.id);
  // uploadResult expected to be { url, filename, aiReport }
  return uploadResult;
    } catch (error) {
      console.error('Resume upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function uploadProfilePicture(file) {
    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const publicUrl = await uploadPfp(file, user.id, 'candidate');
      
      // Add cache-busting parameter to force image refresh
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      return cacheBustedUrl;
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      throw error;
    }
  }
  async function extractTextFromFile(file) {
    // text files
    if (file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name)) {
      return await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsText(file);
      });
    }

    // PDFs: try to use pdfjs if available (optional dependency)
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
        if (typeof pdfWorkerMinUrl === 'string' && pdfWorkerMinUrl.length) {
          pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerMinUrl;
          console.debug('pdfjs workerSrc set to pdfWorkerMinUrl');
        } else if (typeof pdfWorkerUrl === 'string' && pdfWorkerUrl.length) {
          pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
          console.debug('pdfjs workerSrc set to pdfWorkerUrl');
        } else {
          const pdfjsVersion = pdfjs.version || pdfjs.v || null;
          if (pdfjsVersion) {
            const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/legacy/build/pdf.worker.min.mjs`;
            pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
            console.debug('pdfjs workerSrc set to', workerUrl);
          } else {
            pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.7.107/pdf.worker.min.js';
            console.debug('pdfjs version not detected, using fallback worker');
          }
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(it => it.str).join(' ');
          fullText += pageText + '\n';
        }
        return fullText.trim();
      } catch (err) {
        console.warn('PDF text extraction failed', err);
      }
    }

    // DOCX: try to use mammoth to extract plain text (browser-friendly)
    if (/\.docx$/i.test(file.name) || /officedocument.wordprocessingml/.test(file.type)) {
      try {
        let mammoth = null;
        try {
          mammoth = await import('mammoth');
        } catch (merr) {
          try {
            mammoth = await import('mammoth/mammoth.browser.js');
          } catch (merr2) {
            console.warn('mammoth import failed', merr, merr2);
          }
        }

        if (mammoth) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (result && result.value) return String(result.value).trim();
        }
      } catch (err) {
        console.warn('DOCX text extraction failed or mammoth not installed', err);
      }
    }

    // Other types: return null -> caller will fallback to base64
    return null;
  }

  async function handleProfilePictureChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadProfilePicture(file);
      setData({ ...data, profile_img: url });
      
      // Dispatch event to update header avatar in real-time
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { profileImage: url }
        }));
      }
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  }

  async function handleResumeChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    setUploading(true);
    let extractedText = null;
    try {
      extractedText = await extractTextFromFile(f);
    } catch (err) {
      console.warn('extractTextFromFile error', err);
      extractedText = null;
    }

    let base64 = null;
    try {
      base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result || '';
          const comma = result.indexOf(',');
          res(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });
    } catch (err) {
      console.warn('base64 fallback failed', err);
      base64 = null;
    }

    let uploadResult = null;
    try {
      uploadResult = await uploadResumeToStorage(f);
    } catch (uploadErr) {
      console.error('uploadResumeToStorage failed', uploadErr);
      alert('Failed to upload resume. Please try again. Error: ' + (uploadErr?.message || uploadErr));
      setUploading(false);
      return;
    }
    // Get the standardized filename
    const fileExtension = f.name.split('.').pop().toLowerCase();
    const standardizedFilename = `resume.${fileExtension}`;
    
    const newResume = {
      id: Date.now(),
      file_url: uploadResult?.url || null,
      uploaded_at: new Date().toISOString(),
      file_text: extractedText || null,
      file_base64: extractedText ? null : base64,
      name: standardizedFilename, // Use standardized filename
      mime: f.type,
      ai_report: uploadResult?.aiReport || null,
    };

    console.log('Resume uploaded:', {
      name: newResume.name,
      mime: newResume.mime,
      file_text_present: !!newResume.file_text,
      file_text_excerpt: newResume.file_text ? newResume.file_text.slice(0, 300) : null,
      base64_length: newResume.file_base64 ? newResume.file_base64.length : 0,
    });

  setUploading(false);
  const resumeUrl = uploadResult?.url || null;
  const newData = { ...data, resumeUrl, resumes: [newResume] };
    setData(newData);

    const immediatePayload = {
      candidate: {
        name: newData.name,
        email: newData.email,
        phone: newData.phone,
        age: newData.age,
        profile_img: newData.profile_img,
        bio: newData.bio,
        city: newData.city,
        state: newData.state,
        country: newData.country,
        skills: newData.skills,
        experience_years: newData.experienceYears ? Number(newData.experienceYears) : 0,
      },
      candidate_preferences: {
        preferred_job_type: newData.jobType,
        expected_salary_min: newData.expected_salary_min ? Number(newData.expected_salary_min) : null,
        expected_salary_max: newData.expected_salary_max ? Number(newData.expected_salary_max) : null,
        willing_to_relocate: !!newData.willingToRelocate,
        available_from: newData.available_from || null,
        notice_period_days: newData.notice_period_days ? Number(newData.notice_period_days) : null,
        min_experience_years: newData.min_experience_years ? Number(newData.min_experience_years) : null,
        location_radius_km: newData.location_radius_km ? Number(newData.location_radius_km) : null,
      },
  education: newData.education || [],
      experience: newData.experience || [],
      resumes: newData.resumes || [],
    };

    try {
      localStorage.setItem('candidate_onboarding_payload', JSON.stringify(immediatePayload, null, 2));
      console.log('Immediate onboarding payload (with resume text):', immediatePayload);
    } catch (err) {
      console.warn('Failed to store immediate onboarding payload', err);
    }
  }

  function addEducation() { const item = { ...educationDraft }; setData({ ...data, education: [...(data.education || []), item] }); setEducationDraft({ institution: '', degree: '', start_year: '', end_year: '' }) }
  function removeEducation(idx) { setData({ ...data, education: data.education.filter((_, i) => i !== idx) }) }

  function assemblePayload() {
    return {
      candidate: {
        name: data.name, email: data.email, phone: data.phone, age: data.age, profile_img: data.profile_img, bio: data.bio,
        city: data.city, state: data.state, country: data.country, skills: data.skills, experience_years: data.experienceYears ? Number(data.experienceYears) : 0,
      },
      candidate_preferences: {
        preferred_job_type: data.jobType, expected_salary_min: data.expected_salary_min ? Number(data.expected_salary_min) : null, expected_salary_max: data.expected_salary_max ? Number(data.expected_salary_max) : null,
        willing_to_relocate: !!data.willingToRelocate, available_from: data.available_from || null, notice_period_days: data.notice_period_days ? Number(data.notice_period_days) : null,
        min_experience_years: data.min_experience_years ? Number(data.min_experience_years) : null, location_radius_km: data.location_radius_km ? Number(data.location_radius_km) : null,
      },
      education: data.education || [], experience: data.experience || [], resumes: data.resumes || [],
    }
  }

  async function copyPayloadToClipboard() { try { const payload = assemblePayload(); await navigator.clipboard.writeText(JSON.stringify(payload, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch (e) { console.error('copy failed', e) } }

  function handleFormSubmit(formValues) { setData({ ...data, name: formValues.name, email: formValues.email }); next() }

  

  async function submitProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    const payload = assemblePayload();
    setSaving(true);
    try {
      const embeddingText = generateCandidateEmbeddingText(payload);
      try { console.log('generateCandidateEmbeddingText output (json):', JSON.stringify({ embeddingText })); } catch (err) { console.warn('Failed to stringify embeddingText', err); }

      let embeddingResult = null;
      try {
        const embMod = await import('@/api/embeddings.api.js');
        embeddingResult = await embMod.createEmbedding({ text: embeddingText });
        console.log('createEmbedding returned:', embeddingResult);
        const vector = embeddingResult?.data?.[0]?.embedding ?? null;
        if (vector) {
          embeddingResult.vector = vector;
        }
        console.debug('Embedding result (with vector if present):', embeddingResult);
      } catch (e) {
        console.warn('Embedding request failed', e);
      }

      payload.resumes = payload.resumes || [];
      payload.resumes[0] = { ...(payload.resumes[0] || {}), file_text: embeddingText, embedding: embeddingResult };

      payload.resumes = (payload.resumes || []).map((r, idx) => {
        const preferText = r.file_text || (idx === 0 ? embeddingText : null);
        const hasBase64 = !!r.file_base64;
        const dataUri = hasBase64 ? `data:${r.mime || 'application/octet-stream'};base64,${r.file_base64}` : null;
        const file_text_upsert = preferText || dataUri || '';
        return { ...r, file_text_upsert };
      });

      let collectedEmbeddingVector = null;
      console.log('Submitting onboarding payload resumes:', payload.resumes.map(r => {
        const isDataUri = typeof r.file_text_upsert === 'string' && r.file_text_upsert.startsWith('data:');
        const vec = r.embedding?.vector ?? null;
        if (!collectedEmbeddingVector && vec) collectedEmbeddingVector = vec;
  try { if (vec) console.debug('Collected resume embedding vector length:', Array.isArray(vec) ? vec.length : 'unknown'); } catch { /* ignore */ }
        console.log('resume embedding vector sample length:', vec ? vec.length : 0);
        return {
          name: r.name,
          file_text_present: !!r.file_text,
          file_text_upsert_isDataUri: isDataUri,
          file_text_upsert_length: r.file_text_upsert ? r.file_text_upsert.length : 0,
          excerpt: (!isDataUri && r.file_text_upsert) ? r.file_text_upsert.slice(0, 200) : null,
          embedding_attached: !!r.embedding,
        };
      }));

      const mod = await import('@/api/onboarding.api.js');

        try {
          let preUserId = null;
          try {
            const u = await getCurrentUser()
            preUserId = u?.id || null
          } catch { /* ignore */ }
          if (!preUserId) {
            try { const m = document.cookie.match(new RegExp('(?:^|; )access_token=([^;]*)')); if (m) preUserId = null; } catch { /* ignore */ }
          }
          if (preUserId) {
            console.log('Calling uploadCandidateEmbedding BEFORE onboarding with user_id:', preUserId, 'collectedEmbeddingVector present:', !!collectedEmbeddingVector);
            const preEmb = await mod.uploadCandidateEmbedding(preUserId, collectedEmbeddingVector);
            console.log('pre-onboarding candidate-embedding returned:', preEmb);
            payload.server_embedding_pre = preEmb || null;
          } else {
            console.log('No user_id available to call pre-onboarding uploadCandidateEmbedding');
          }
  } catch (e) {
        console.warn('Pre-onboarding uploadCandidateEmbedding failed', e);
      }

      const updated = await mod.updateCandidateProfile(payload);

      localStorage.setItem('candidate_onboarding_payload', JSON.stringify(payload));
      if (updated) {
        alert('Profile updated successfully!');
      } else {
        console.warn('Profile update returned no data');
      }
      navigate('/dashboard');
      return payload.server_embedding_pre || embeddingResult || null;
    } catch (err) {
      console.error('submitProfile error', err);
      alert('Failed to update profile. Changes saved locally.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen relative p-0 overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #ffe6f0 0%, #ffd7bf 40%, #ffffff 100%)' }}>
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full max-w-5xl h-full sm:h-[92vh] md:h-[90vh] lg:h-[85vh] overflow-hidden rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px) saturate(120%)' }}>
            <header className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 overflow-hidden">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight">Candidate Onboarding</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">A few quick steps to set up your profile and get recommended jobs.</p>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 self-start sm:self-auto flex-shrink-0 mt-1 sm:mt-0">Step {step + 1} of 6</div>
            </header>

            <div className="mb-4 sm:mb-6">
              <div className="h-2 bg-gray-200 rounded overflow-hidden"><div className={`h-2 rounded`} style={{ width: `${((step + 1) / 6) * 100}%`, background: 'linear-gradient(90deg, var(--secondary), rgba(249,115,22,0.85))' }} /></div>
            </div>

            <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-6 flex-1 overflow-auto">
              {step === 0 && (
                <section className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 md:gap-8">
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 sm:mb-3">Welcome to SwipeIT ✨</h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-5">Tell us a bit about yourself and we'll surface the best jobs for you — fast.</p>
                  </div>
                </section>
              )}

              {step === 1 && (
                <section className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Profile basics</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Full name</Label>
                      <Input id="name" {...register('name')} defaultValue={data.name} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                      {errors.name && <p className="text-xs sm:text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input id="email" {...register('email')} defaultValue={data.email} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                      {errors.email && <p className="text-xs sm:text-sm text-red-600">{errors.email.message}</p>}
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-sm">Short bio</Label>
                      <textarea id="bio" rows={3} sm:rows={4} className="w-full rounded-md border px-3 py-2 mt-1 bg-white text-sm sm:text-base resize-vertical" value={data.bio} onChange={(e) => setData({ ...data, bio: e.target.value })} style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div>
                      <Label className="text-sm">Phone</Label>
                      <Input id="phone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div>
                      <Label className="text-sm">City</Label>
                      <Input id="location" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div>
                      <Label className="text-sm">Age</Label>
                      <Input id="age" type="number" value={data.age ?? ''} onChange={(e) => setData({ ...data, age: e.target.value ? Number(e.target.value) : '' })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-sm">Profile image</Label>
                      <div className="mt-2">
                        <div className="w-full border border-dashed rounded-md p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-2 sm:gap-3 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center bg-[color:var(--muted)]">
                              <svg width="16" height="16" sm:width="20" sm:height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3v12" stroke="#ff6b8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 7l4-4 4 4" stroke="#ff6b8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs sm:text-sm font-medium">Upload profile picture</div>
                              <div className="text-xs text-gray-500">JPG, PNG — max 2MB</div>
                            </div>
                          </div>
                          <label onClick={() => profileInputRef.current && profileInputRef.current.click()} className="inline-flex items-center px-3 sm:px-4 py-2 bg-white border rounded-md text-xs sm:text-sm cursor-pointer whitespace-nowrap" style={{ borderColor: 'var(--border)' }}>
                            <input ref={profileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleProfilePictureChange} className="sr-only" />
                            Choose file
                          </label>
                        </div>
                        {data.profile_img ? (
                          <div className="mt-2 flex items-center justify-start">
                            <img src={data.profile_img} alt="profile preview" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 2 && (
                <section className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Skills & experience</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-sm">Skills</Label>
                      <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill" className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                        <Button type="button" onClick={addSkill} className="bg-black border text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {data.skills.map(s => (
                          <span key={s} className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm shadow-sm bg-[color:var(--muted)] text-[color:var(--foreground)]">
                            {s}
                            <button aria-label={`remove ${s}`} onClick={() => removeSkill(s)} className="ml-1 sm:ml-2 text-gray-400 text-xs sm:text-sm">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Years of experience</Label>
                      <Input value={data.experienceYears} onChange={(e) => setData({ ...data, experienceYears: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label className="text-sm">Education (add items below)</Label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input placeholder="Institution" value={educationDraft.institution} onChange={(e) => setEducationDraft({ ...educationDraft, institution: e.target.value })} className="w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                        <Input placeholder="Degree" value={educationDraft.degree} onChange={(e) => setEducationDraft({ ...educationDraft, degree: e.target.value })} className="w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input placeholder="Start year" value={educationDraft.start_year} onChange={(e) => setEducationDraft({ ...educationDraft, start_year: e.target.value })} className="w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                          <Input placeholder="End year" value={educationDraft.end_year} onChange={(e) => setEducationDraft({ ...educationDraft, end_year: e.target.value })} className="w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                          <Button type="button" onClick={addEducation} className="bg-black border text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap">Add</Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-1 sm:gap-2">
                        {(data.education || []).map((ed, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-md p-2 gap-2">
                            <div className="text-xs sm:text-sm">{ed.institution} — {ed.degree} ({ed.start_year} - {ed.end_year})</div>
                            <button onClick={() => removeEducation(idx)} className="text-xs sm:text-sm text-red-500 self-start sm:self-auto">Remove</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Resume upload</h2>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Upload resume (PDF / DOCX)</Label>
                      <div className="mt-2">
                        <div className="w-full border border-dashed rounded-md p-3 sm:p-4 flex flex-col items-center justify-center gap-3 sm:gap-4" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center bg-[color:var(--muted)]">
                              <svg width="16" height="16" sm:width="20" sm:height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3v12" stroke="#ff6b8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 7l4-4 4 4" stroke="#ff6b8a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="text-center sm:text-left">
                              <div className="text-xs sm:text-sm font-medium">Drag & drop or choose a file</div>
                              <div className="text-xs text-gray-500">PDF or DOCX — max 5MB</div>
                            </div>
                          </div>
                            <label onClick={() => resumeInputRef.current && resumeInputRef.current.click()} className="inline-flex items-center px-3 sm:px-4 py-2 bg-white border rounded-md text-xs sm:text-sm cursor-pointer" style={{ borderColor: 'var(--border)' }}>
                            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} className="sr-only" />
                            Choose file
                          </label>
                        </div>
                        {uploading && <p className="text-xs sm:text-sm text-gray-500 mt-2">Uploading...</p>}
                        {data.resumeUrl && <p className="text-xs sm:text-sm text-green-600 mt-2">Uploaded: <a className="underline" href={data.resumeUrl} target="_blank" rel="noreferrer">{data.resumes[0]?.name || 'resume.pdf'}</a></p>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Work history / Notes</Label>
                      <textarea rows={6} sm:rows={8} placeholder="Summarize your work history..." value={data.workHistory || ''} onChange={(e) => setData({ ...data, workHistory: e.target.value })} className="w-full rounded-md border px-3 sm:px-4 py-2 sm:py-3 mt-1 bg-white min-h-[120px] sm:min-h-[180px] resize-vertical text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                  </div>
                </section>
              )}

              {step === 4 && (
                <section className="space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Preferences</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Job type</Label>
                      <div className="relative mt-1">
                        <select className="w-full appearance-none rounded-md border px-3 py-2 pr-8 sm:pr-10 bg-white text-sm sm:text-base" value={data.jobType} onChange={(e) => setData({ ...data, jobType: e.target.value })} style={{ borderColor: 'var(--border)' }}>
                          <option value="remote">Remote</option>
                          <option value="onsite">Onsite</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Salary min</Label>
                      <Input value={data.expected_salary_min} onChange={(e) => setData({ ...data, expected_salary_min: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div>
                      <Label className="text-sm">Salary max</Label>
                      <Input value={data.expected_salary_max} onChange={(e) => setData({ ...data, expected_salary_max: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div>
                      <Label className="text-sm">Location</Label>
                      <Input value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} className="mt-1 w-full border bg-white text-sm sm:text-base" style={{ borderColor: 'var(--border)' }} />
                    </div>
                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                      <input id="relocate" type="checkbox" checked={data.willingToRelocate} onChange={(e) => setData({ ...data, willingToRelocate: e.target.checked })} className="h-4 w-4" />
                      <Label htmlFor="relocate" className="text-sm">Willing to relocate</Label>
                    </div>
                  </div>
                </section>
              )}

              {step === 5 && (
                <section className="space-y-4">
                  <p className="text-md text-underline text-gray-600">We'll create embeddings from your resume and skills to recommend jobs.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Full name</strong></div>
                      <div className="mt-1">{data.name || '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Email</strong></div>
                      <div className="mt-1">{data.email || '—'}</div>
                    </div>

                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Phone</strong></div>
                      <div className="mt-1">{data.phone || '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Location</strong></div>
                      <div className="mt-1">{[data.city, data.state, data.country].filter(Boolean).join(', ') || (data.location || '—')}</div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Short bio</strong></div>
                      <div className="mt-1 whitespace-pre-wrap">{data.bio || '—'}</div>
                    </div>

                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Age</strong></div>
                      <div className="mt-1">{data.age ?? '—'}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Profile image</strong></div>
                      <div className="mt-1">{data.profile_img ? <a className="underline" href={data.profile_img} target="_blank" rel="noreferrer">View</a> : '—'}</div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Skills</strong></div>
                      <div className="mt-1">{(data.skills && data.skills.length) ? data.skills.join(', ') : '—'}</div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Years of experience</strong></div>
                      <div className="mt-1">{data.experienceYears || '—'}</div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Work history / Notes</strong></div>
                      <div className="mt-1 whitespace-pre-wrap">{data.workHistory || '—'}</div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Education</strong></div>
                      <div className="mt-2 space-y-2">
                        {(data.education && data.education.length) ? data.education.map((ed, i) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <div className="text-sm font-medium">{ed.institution || '—'}</div>
                            <div className="text-xs text-gray-600">{ed.degree ? `${ed.degree} (${ed.start_year || '—'} - ${ed.end_year || '—'})` : `${ed.start_year || '—'} - ${ed.end_year || '—'}`}</div>
                          </div>
                        )) : <div className="text-sm text-gray-600">No education added</div>}
                      </div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Experience</strong></div>
                      <div className="mt-2 space-y-2">
                        {(data.experience && data.experience.length) ? data.experience.map((ex, i) => (
                          <div key={i} className="p-2 bg-white rounded border">
                            <div className="text-sm font-medium">{ex.title || ex.role || '—'}</div>
                            <div className="text-xs text-gray-600">{ex.company ? `${ex.company} • ${ex.start_date || '—'} - ${ex.end_date || 'Present'}` : (ex.period || '—')}</div>
                            <div className="text-sm mt-1 whitespace-pre-wrap">{ex.description || ''}</div>
                          </div>
                        )) : <div className="text-sm text-gray-600">No experience added</div>}
                      </div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Resumes</strong></div>
                      <div className="mt-2 space-y-2">
                        {(data.resumes && data.resumes.length) ? data.resumes.map((r) => {
                          // Handle both old string format and new object format for file_url
                          const fileUrl = r.file_url;
                          const displayName = fileUrl && typeof fileUrl === 'object' && fileUrl.filename
                            ? fileUrl.filename
                            : fileUrl && typeof fileUrl === 'object' && fileUrl.url
                            ? fileUrl.url.split('/').pop()
                            : fileUrl && typeof fileUrl === 'string'
                            ? fileUrl.split('/').pop()
                            : (r.name || 'Resume');
                          
                          const linkUrl = fileUrl && typeof fileUrl === 'object' && fileUrl.url
                            ? fileUrl.url
                            : fileUrl && typeof fileUrl === 'string'
                            ? fileUrl
                            : null;
                          
                          return (
                            <div key={r.id || (fileUrl && typeof fileUrl === 'object' ? fileUrl.url : fileUrl)} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="text-sm">{displayName}</div>
                              <div>{linkUrl ? <a className="underline text-sm" href={linkUrl} target="_blank" rel="noreferrer">View</a> : '—'}</div>
                            </div>
                          );
                        }) : <div className="text-sm text-gray-600">No resumes uploaded</div>}
                      </div>
                    </div>

                    <div className="col-span-2 bg-gray-50 rounded p-3 border-2 border-gray-200">
                      <div className="text-sm text-gray-700"><strong>Preferences</strong></div>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-600">Job type</div>
                          <div>{data.jobType || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Expected salary</div>
                          <div>{(data.expected_salary_min || '—') + (data.expected_salary_max ? ` — ${data.expected_salary_max}` : '')}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Location</div>
                          <div>{data.location || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Willing to relocate</div>
                          <div>{data.willingToRelocate ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between mt-2">
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => setStep(1)} className="text-xs underline">Edit profile</Button>
                        <Button type="button" onClick={() => setStep(2)} className="text-xs underline">Edit skills</Button>
                        <Button type="button" onClick={() => setStep(3)} className="text-xs underline">Edit resume</Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" onClick={copyPayloadToClipboard} className="bg-white border text-black text-sm px-3 py-1">{copied ? 'Copied!' : 'Copy JSON'}</Button>
                        {/* Removed inline Finish button per request; footer Finish remains */}
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </form>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="order-2 sm:order-1">
                  {step === 0 ? (!skipHidden && (<Button type="button" onClick={() => navigate('/dashboard')} className="bg-white border text-black hover:text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 w-full sm:w-auto">Skip</Button>)) : (<Button type="button" onClick={prev} className="bg-white border text-black hover:text-white text-sm sm:text-base font-medium px-3 sm:px-4 py-2 w-full sm:w-auto">Back</Button>)}
                </div>
                <div className="order-1 sm:order-2">
                  {step < 5 ? (<Button type="button" onClick={() => { if (step === 0) { setSkipHidden(true); next(); return } if (step === 1) { handleSubmit(handleFormSubmit)() } else { next() } }} className="text-white shadow-md text-sm sm:text-base font-medium px-3 sm:px-4 py-2 w-full sm:w-auto" style={{ background: 'linear-gradient(90deg, var(--secondary), rgba(249,115,22,0.85))' }}>Next</Button>) : (<Button type="button" onClick={submitProfile} className="text-white shadow-md text-sm sm:text-base font-medium px-3 sm:px-4 py-2 w-full sm:w-auto" style={{ background: 'linear-gradient(90deg, var(--secondary), rgba(249,115,22,0.85))' }} disabled={saving}>{saving ? 'Finishing...' : 'Finish and go to dashboard'}</Button>)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
