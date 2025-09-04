import { SignupForm } from "@/components/SignupForm"

export default function SignupPage() {
  return (
  <div className="grid min-h-svh lg:grid-cols-2" style={{ background: 'linear-gradient(135deg, rgba(255,230,240,0.6), rgba(255,240,220,0.6), rgba(255,255,255,1))' }}>
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        <div className="flex justify-center lg:justify-start gap-2">
          <a href="/" className="flex items-center gap-2 font-medium">
            <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <span className="sr-only">SwipeIT</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs sm:max-w-sm">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="hidden lg:flex bg-muted relative items-center justify-center m-4 rounded-4xl" style={{ background: 'linear-gradient(135deg, rgba(20,20,30,0.9), rgba(60,60,70,0.9))' }}>
  <img src="/logo_white_bg_removed.png" alt="SwipeIT" className="h-48 w-48 md:h-60 md:w-60 object-contain" />
      </div>
    </div>
  )
}
