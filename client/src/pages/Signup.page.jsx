import { SignupForm } from "@/components/SignupForm"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full py-6 sm:py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 flex items-center justify-between">
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

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-sm sm:max-w-md">
          <SignupForm />
        </div>
      </main>

      <footer className="py-6">
        <div className="max-w-md mx-auto px-4 sm:px-6 text-center">
          <div className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} SwipeIT — simple hiring
          </div>
        </div>
      </footer>
    </div>
  )
}
