// Helper to generate a single text blob from candidate data suitable for embeddings
export function generateCandidateEmbeddingText(data) {
  const c = data.candidate || {};

  // Candidate basic info
  let text = `Candidate: ${c.name || ''}\n`;
  if (c.bio) text += `Bio: ${c.bio}\n`;
  if (c.skills && c.skills.length > 0) text += `Skills: ${c.skills.join(', ')}\n`;
  if (c.experience_years) text += `Experience: ${c.experience_years} years\n`;
  if (c.city || c.state || c.country) {
    text += `Location: ${[c.city, c.state, c.country].filter(Boolean).join(', ')}\n`;
  }

  // Preferences
  const p = data.candidate_preferences || {};
  if (p) {
    const prefs = [];
    if (p.preferred_job_type) prefs.push(`Prefers ${p.preferred_job_type} jobs`);
    if (p.willing_to_relocate) prefs.push('Willing to relocate');
    if (p.expected_salary_min || p.expected_salary_max) {
      prefs.push(`Salary expectations: ${p.expected_salary_min ?? 'N/A'}-${p.expected_salary_max ?? 'N/A'}`);
    }
    if (prefs.length > 0) text += `Preferences: ${prefs.join(', ')}\n`;
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduTexts = data.education.map(e => {
      const parts = [e.degree, e.institution, e.location ? `(${e.location})` : '', e.start_year && e.end_year ? `${e.start_year}-${e.end_year}` : '', e.gpa ? `GPA: ${e.gpa}` : ''].filter(Boolean);
      return parts.join(' ');
    });
    text += `Education: ${eduTexts.join('; ')}\n`;
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    const expTexts = data.experience.map(exp => {
      const parts = [exp.title, exp.company, exp.location ? `(${exp.location})` : '', exp.start_date && exp.end_date ? `${exp.start_date} to ${exp.end_date}` : '', exp.description].filter(Boolean);
      return parts.join(' ');
    });
    text += `Work Experience: ${expTexts.join('; ')}\n`;
  }

  // Resumes
  if (data.resumes && data.resumes.length > 0) {
    const resumeTexts = data.resumes.map(r => r.file_text).filter(Boolean);
    if (resumeTexts.length > 0) text += `Resume Text: ${resumeTexts.join(' ')}\n`;
  }

  return text.trim();
}

// Helper to generate a single text blob from job data suitable for embeddings
export function generateJobEmbeddingText(jobData) {
  let text = `Job Title: ${jobData.title || ''}\n`;
  if (jobData.description) text += `Description: ${jobData.description}\n`;
  if (jobData.required_skills && Array.isArray(jobData.required_skills)) text += `Required Skills: ${jobData.required_skills.join(', ')}\n`;
  if (jobData.job_type) text += `Job Type: ${jobData.job_type}\n`;
  if (jobData.experience_min || jobData.experience_max) text += `Experience Required: ${jobData.experience_min || 0}-${jobData.experience_max || 'unlimited'} years\n`;
  if (jobData.salary_min || jobData.salary_max) text += `Salary Range: ${jobData.salary_min || 'N/A'}-${jobData.salary_max || 'N/A'} ${jobData.currency || 'USD'}\n`;
  if (jobData.education_level) text += `Education Level: ${jobData.education_level}\n`;
  if (jobData.company_name) text += `Company: ${jobData.company_name}\n`;
  return text.trim();
}


