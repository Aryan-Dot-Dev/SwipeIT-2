
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import DemoSwipeCard from '@/components/DemoSwipeCard'

const Feature = ({ title, desc, icon }) => (
  <div className="p-4 md:p-6 glass-panel hover:scale-105 transition-all">
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-500 text-white flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="font-semibold text-sm md:text-base">{title}</div>
        <div className="text-xs md:text-sm text-[color:var(--muted-foreground)] mt-1">{desc}</div>
      </div>
    </div>
  </div>
)

const Testimonial = ({ text, name, role }) => (
  <div className="p-3 md:p-4 glass-panel hover:scale-105 transition-all">
    <div className="text-xs md:text-sm text-[color:var(--muted-foreground)]">"{text}"</div>
    <div className="mt-2 md:mt-3 font-medium text-sm md:text-base">{name}</div>
    <div className="text-xs text-[color:var(--muted-foreground)]">{role}</div>
  </div>
)

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const features = [
    { title: 'Fast matching', desc: 'Swipe, shortlist and message — move from discovery to interview faster.', icon: '⚡' },
    { title: 'Built-in chat', desc: 'Keep conversations neatly inside the app with message history and notifications.', icon: '💬' },
    { title: 'Candidate profiles', desc: 'View skills, experience and quick previews to make faster decisions.', icon: '�' },
    { title: 'Privacy-first', desc: 'We store only what you share and keep your hiring process private.', icon: '🔒' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 md:gap-3">
              <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              <span className="sr-only">SwipeIT</span>
            </a>
            <nav className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Features</a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Log in</a>
              <a href="/signup"><button className="btn-primary text-sm px-4 py-2">Sign up</button></a>
            </nav>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu Popup */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu */}
          <div className="absolute top-20 right-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-3 right-3 z-10 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-95"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col py-2 pt-10">
              <a
                href="#features"
                className="text-base py-3 px-6 text-green-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <div className="border-t border-[color:var(--border)] my-2"></div>
              <div className="px-6 pb-2">
                <button className="btn-secondary w-full mb-2 text-sm px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <a href="/login" className="block w-full">Log in</a>
                </button>
                <button className="btn-primary w-full text-sm px-4 py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <a href="/signup" className="block w-full">Sign up</a>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center py-6 md:py-10">
          <div className="order-1 lg:order-1">
            <div className="text-6xl text-gray-600 font-extrabold tracking-tight" style={{ color: 'var(--foreground)' }}>SwipeIt</div>
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">New · Designed for modern hiring</div>
            <h1 className="mt-4 md:mt-6 text-3xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Hire faster. Interview smarter.</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-xl">SwipeIT combines a fast candidate discovery workflow with built-in messaging and lightweight profiles — so hiring teams can focus on talking to great people, not managing tools.</p>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
              <a href="/signup" className="w-full sm:w-auto"><button className="btn-primary w-full sm:w-auto text-lg px-8 py-4">Create account — it's free</button></a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)]">Or <span className="underline">sign in</span> to continue</a>
            </div>

          
          </div>

          <div className="order-2 lg:order-2 flex items-center justify-center">
            <div className="w-full max-w-sm md:max-w-lg p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl bg-white relative overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <DemoSwipeCard onSwipe={(dir) => console.log('Demo card swiped', dir)} />
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8">
          <h3 className="text-xl md:text-2xl font-semibold text-center lg:text-left" style={{ color: 'var(--foreground)' }}>Features</h3>
          <p className="text-[color:var(--muted-foreground)] mt-2 text-center lg:text-left max-w-2xl">Everything you need to run an efficient hiring process — nothing you don't.</p>
          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {features.map((f, i) => <Feature key={i} {...f} />)}
          </div>
        </section>

        <section id="stats" className="bg-[color:var(--card)] py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 text-center">
            {/* Stats removed - placeholder content */}
          </div>
        </section>

        <section id="testimonials" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8">
          {/* Testimonials section removed - contained fake customer reviews */}
        </section>

        <section className="py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <div className="text-lg md:text-xl font-semibold">Ready to hire smarter?</div>
              <div className="mt-1 text-sm md:text-base">Start a free account and discover better matches in minutes.</div>
            </div>
            <div className="flex-shrink-0">
              <a href="/signup"><Button className="w-full lg:w-auto text-white bg-white/20 hover:bg-white/30 border-white/30" style={{ background: 'transparent' }}>Create free account</Button></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 md:py-8 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3"><img src="/logo_bg_removed.png" alt="SwipeIT" className="w-28 object-contain" /></div>
              <div>© {new Date().getFullYear()} SwipeIT — simple hiring</div>
              <div className="mt-3">SwipeIt ai</div>
              <div className="text-xs mt-1">Support: <a href="mailto:team@swipeit.in" className="underline hover:text-[color:var(--foreground)] transition-colors">team@swipeit.in</a></div>
              <div className="text-xs">Phone: <a href="tel:+916302728603" className="underline hover:text-[color:var(--foreground)] transition-colors">+91 63027 28603</a></div>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Product</div>
              <ul className="space-y-2">
                <li><a href="/blog" className="underline hover:text-[color:var(--foreground)] transition-colors">Blog</a></li>
                <li><a href="/newsletter" className="underline hover:text-[color:var(--foreground)] transition-colors">Newsletter</a></li>
                <li><a href="/about" className="underline hover:text-[color:var(--foreground)] transition-colors">About</a></li>
                <li><a href="/faq" className="underline hover:text-[color:var(--foreground)] transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Legal</div>
              <ul className="space-y-2">
                <li><a href="/privacy" className="underline hover:text-[color:var(--foreground)] transition-colors">Privacy & Cookies</a></li>
                <li><a href="/terms" className="underline hover:text-[color:var(--foreground)] transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Connect</div>
              <ul className="space-y-2">
                <li><a href="/contact" className="underline hover:text-[color:var(--foreground)] transition-colors">Contact & Legal Info</a></li>
                <li className="mt-2 flex items-center gap-3">
                  <a href="https://x.com/swipeit" target="_blank" rel="noreferrer" aria-label="X (opens in new tab)" className="p-2 rounded hover:bg-white/5 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M5 4L19 20M19 4L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>

                  <a href="https://www.instagram.com/swipeit.ai?igsh=ZWl3aG02bDRteWxx" target="_blank" rel="noreferrer" aria-label="Instagram (opens in new tab)" className="p-2 rounded hover:bg-white/5 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                    </svg>
                  </a>

                  <a href="https://www.linkedin.com/company/swipeit-ai/" target="_blank" rel="noreferrer" aria-label="LinkedIn (opens in new tab)" className="p-2 rounded hover:bg-white/5 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M7 10V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
                      <path d="M11 17V12c0-.8.7-1.5 1.5-1.5S14 11.2 14 12v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6 text-xs text-[color:var(--muted-foreground)] flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">Made with care — fair, bias-free hiring.</div>
            <div className="text-center lg:text-right">Want to advertise? <a href="mailto:team@swipeit.in" className="underline hover:text-[color:var(--foreground)] transition-colors">team@swipeit.in</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
