import { LoginForm } from "@/components/LoginForm"

export default function LoginPage() {
  return (
  <div className="grid min-h-svh lg:grid-cols-2" style={{ background: 'linear-gradient(135deg, rgba(220,240,255,0.8), rgba(255,255,255,0.9), rgba(240,245,250,1))' }}>
      <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
        <div className="flex justify-center lg:justify-start gap-2">
          <a href="/" className="flex items-center gap-2 font-medium">
            <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <span className="sr-only">SwipeIT</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs sm:max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
        <div className="hidden lg:flex bg-muted m-4 rounded-4xl relative items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
          <img src="/logo_white_bg_removed.png" alt="SwipeIT" className="h-48 w-48 md:h-60 md:w-60 object-contain" />
        </div>
    </div>
  )
}
