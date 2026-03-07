import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/utils/supabaseInstance'
import { getAccessToken } from '@/utils/cookieInstance'

/**
 * Hook to get current user authentication status
 * Returns: { isAuthenticated, user, userType, loading }
 */
export function useAuthStatus() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    userType: 'guest', // 'guest', 'candidate', 'recruiter'
    loading: true
  })

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const token = getAccessToken()
        
        if (!token) {
          if (mounted) {
            setAuthState({
              isAuthenticated: false,
              user: null,
              userType: 'guest',
              loading: false
            })
          }
          return
        }

        const user = await getCurrentUser()
        
        if (!mounted) return

        if (user) {
          // Determine user type based on user data
          const isRecruiter = !!(
            user.recruiter || 
            (user.company && (user.company.id || user.company.name)) ||
            user.user_metadata?.role === 'recruiter'
          )

          setAuthState({
            isAuthenticated: true,
            user,
            userType: isRecruiter ? 'recruiter' : 'candidate',
            loading: false
          })
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            userType: 'guest',
            loading: false
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (mounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            userType: 'guest',
            loading: false
          })
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:changed', handleAuthChange)
    }

    return () => {
      mounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:changed', handleAuthChange)
      }
    }
  }, [])

  return authState
}
