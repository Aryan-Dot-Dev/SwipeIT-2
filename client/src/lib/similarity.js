/**
 * Calculate cosine similarity between two vectors
 * Returns a value between 0 and 1, where 1 means identical
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    magnitudeA += vecA[i] * vecA[i]
    magnitudeB += vecB[i] * vecB[i]
  }

  magnitudeA = Math.sqrt(magnitudeA)
  magnitudeB = Math.sqrt(magnitudeB)

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Calculate skill match percentage between candidate skills and job requirements
 * Returns a percentage (0-100) based on skill overlap
 */
export function calculateSkillMatch(candidateSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 100 // If no requirements, 100% match
  }

  if (!candidateSkills || candidateSkills.length === 0) {
    return 0 // If no candidate skills, 0% match
  }

  // Normalize to lowercase for comparison
  const normalizedCandidateSkills = candidateSkills.map(s => 
    typeof s === 'string' ? s.toLowerCase().trim() : ''
  )
  const normalizedRequiredSkills = requiredSkills.map(s => 
    typeof s === 'string' ? s.toLowerCase().trim() : ''
  )

  // Count matching skills
  const matchingSkills = normalizedRequiredSkills.filter(requiredSkill =>
    normalizedCandidateSkills.some(candidateSkill =>
      candidateSkill.includes(requiredSkill) || requiredSkill.includes(candidateSkill)
    )
  )

  // Calculate percentage
  const matchPercentage = (matchingSkills.length / normalizedRequiredSkills.length) * 100

  return Math.round(matchPercentage)
}

/**
 * Calculate overall match score based on multiple factors
 * Returns a percentage (0-100)
 */
export function calculateOverallMatch(candidate, job) {
  const factors = []

  // 1. Skills match (40% weight)
  if (job.required_skills || job.skills) {
    const skillMatch = calculateSkillMatch(
      candidate.candidate_profile?.skills || candidate.skills,
      job.required_skills || job.skills
    )
    factors.push({ score: skillMatch, weight: 0.4 })
  }

  // 2. Experience match (30% weight)
  if (job.experience_min !== undefined || job.experience_max !== undefined) {
    const candidateExp = candidate.candidate_profile?.experience_years || 0
    const minExp = job.experience_min || 0
    const maxExp = job.experience_max || 999

    let expScore = 0
    if (candidateExp >= minExp && candidateExp <= maxExp) {
      expScore = 100
    } else if (candidateExp < minExp) {
      // Penalize for under-qualified
      expScore = Math.max(0, 100 - ((minExp - candidateExp) * 20))
    } else {
      // Slightly penalize for over-qualified
      expScore = Math.max(70, 100 - ((candidateExp - maxExp) * 5))
    }

    factors.push({ score: expScore, weight: 0.3 })
  }

  // 3. Location match (15% weight)
  if (job.location && candidate.candidate_profile) {
    const candidateLocation = [
      candidate.candidate_profile.city,
      candidate.candidate_profile.state,
      candidate.candidate_profile.country
    ].filter(Boolean).join(', ').toLowerCase()

    const jobLocation = job.location.toLowerCase()

    const locationMatch = candidateLocation.includes(jobLocation) || 
                         jobLocation.includes(candidateLocation) ? 100 : 0

    factors.push({ score: locationMatch, weight: 0.15 })
  }

  // 4. Job type match (15% weight)
  if (job.job_type && candidate.candidate_preferences?.preferred_job_type) {
    const typeMatch = job.job_type.toLowerCase() === 
                     candidate.candidate_preferences.preferred_job_type.toLowerCase() ? 100 : 50
    factors.push({ score: typeMatch, weight: 0.15 })
  }

  // Calculate weighted average
  if (factors.length === 0) {
    return null // Not enough data to calculate
  }

  const weightedSum = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0)
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)

  return Math.round(weightedSum / totalWeight)
}
