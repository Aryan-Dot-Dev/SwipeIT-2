import { SignupForm } from "@/components/SignupForm"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full py-6 sm:py-8">
        <div className="max-w-md md:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </a>
          <a href="/" className="flex items-center gap-3">
            <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            <span className="sr-only">SwipeIT</span>
          </a>
          <div className="w-12 sm:w-16"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full max-w-md md:max-w-6xl flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
          {/* Left Side - Branding (hidden on mobile, visible on tablet+) */}
          <div className="hidden md:flex md:flex-1 flex-col items-center justify-center text-center gap-6 lg:gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl opacity-20 rounded-full"></div>
              <svg className="w-24 h-24 lg:w-32 lg:h-32 relative z-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4">Join SwipeIT Today</h2>
              <p className="text-gray-600 text-base lg:text-lg max-w-md">Create your account and start connecting with opportunities in minutes.</p>
            </div>
            <div className="flex flex-col gap-3 lg:gap-4 text-left max-w-md w-full">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">Quick Setup</h3>
                  <p className="text-gray-600 text-sm">Get started in less than 2 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">For Everyone</h3>
                  <p className="text-gray-600 text-sm">Recruiters and candidates welcome</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold">Free to Start</h3>
                  <p className="text-gray-600 text-sm">No credit card required</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="w-full md:w-auto md:flex-1 max-w-md">
            <SignupForm />
          </div>
        </div>
      </main>

      <footer className="py-6">
        <div className="max-w-md md:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} SwipeIT — simple hiring
          </div>
        </div>
      </footer>
    </div>
  )
}
