import React, { Suspense, useMemo } from "react"

const CandidateOnboarding = React.lazy(() => import('./CandidateOnboarding.page.jsx'))
const RecruiterOnboarding = React.lazy(() => import('./RecruiterOnboarding.page.jsx'))

export default function OnboardingPage() {
  // Determine role silently from localStorage (keeps previous behavior) or default to 'candidate'
  const role = useMemo(() => (typeof window !== 'undefined' ? (localStorage.getItem('onboarding_role') || 'candidate') : 'candidate'), [])

  return (
    <Suspense fallback={<div className="p-8">Loading onboarding…</div>}>
      {role === 'candidate' ? <CandidateOnboarding /> : <RecruiterOnboarding />}
    </Suspense>
  )
}
