import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const ValueCard = ({ title, desc, icon }) => (
  <div className="p-4 md:p-6 bg-white/90 rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border)' }}>
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-[color:var(--primary)] text-white flex-shrink-0 text-lg md:text-xl">{icon}</div>
      <div className="min-w-0">
        <div className="font-semibold text-sm md:text-base">{title}</div>
        <div className="text-xs md:text-sm text-[color:var(--muted-foreground)] mt-1">{desc}</div>
      </div>
    </div>
  </div>
)

const TeamMember = ({ name, role, desc }) => (
  <div className="p-4 md:p-6 bg-white/95 rounded-lg shadow hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border)' }}>
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] mx-auto mb-3 md:mb-4"></div>
    <div className="text-center">
      <div className="font-semibold text-sm md:text-base">{name}</div>
      <div className="text-xs md:text-sm text-[color:var(--muted-foreground)]">{role}</div>
      <div className="text-xs text-[color:var(--muted-foreground)] mt-1 md:mt-2">{desc}</div>
    </div>
  </div>
)

export default function AboutPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const values = [
    { 
      title: 'Fair Hiring', 
      desc: 'We eliminate bias from recruitment with AI that focuses on skills and attitude, not just keywords.', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
    },
    { 
      title: 'Speed & Efficiency', 
      desc: 'Our swipe-based interface makes hiring faster, helping you find great matches in minutes.', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    { 
      title: 'Transparency', 
      desc: 'Clear processes and open communication ensure trust between candidates and recruiters.', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    },
    { 
      title: 'Innovation', 
      desc: 'We leverage cutting-edge AI to revolutionize how companies connect with talent.', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    },
  ]

  const team = [
    { name: 'Alex Chen', role: 'CEO & Founder', desc: 'Former HR tech executive passionate about fair hiring.' },
    { name: 'Maria Rodriguez', role: 'Head of AI', desc: 'AI researcher focused on bias-free algorithms.' },
    { name: 'David Kim', role: 'Lead Developer', desc: 'Full-stack engineer building the future of recruitment.' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, var(--background), #fbfdff)' }}>
      <header className="w-full py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <a href="/" className="flex items-center gap-3">
                <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
                <span className="sr-only">SwipeIT</span>
              </a>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <a href="/" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Home</a>
              <a href="/blog" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Blog</a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Log in</a>
              <a href="/signup"><Button size="sm" className="btn-primary">Sign up</Button></a>
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
          <div className="absolute top-20 right-4 w-64 bg-white rounded-xl shadow-2xl border border-[color:var(--border)] overflow-hidden animate-in slide-in-from-top-2 duration-300">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-3 right-3 z-10 p-1 rounded-full text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <nav className="flex flex-col py-2 pt-10">
              <a
                href="/"
                className="text-base py-3 px-6 text-green-600 hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/blog"
                className="text-base py-3 px-6 text-green-600 hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </a>
              <div className="border-t border-[color:var(--border)] my-2"></div>
              <div className="px-6 pb-2">
                <Button size="sm" className="btn-secondary w-full mb-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <a href="/login" className="block w-full">Log in</a>
                </Button>
                <Button size="sm" className="btn-primary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <a href="/signup" className="block w-full">Sign up</a>
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">About Us</div>
            <h1 className="mt-4 md:mt-6 text-2xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Revolutionizing Hiring with AI</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto px-4">SwipeIT is not just another job platform — it's a revolution in hiring. We combine AI-powered matching with a modern, intuitive interface to make recruitment fair, fast, and effective.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center" style={{ color: 'var(--foreground)' }}>Our Mission</h2>
          <p className="text-[color:var(--muted-foreground)] mt-3 md:mt-4 text-center max-w-3xl mx-auto px-4 text-sm md:text-base">Traditional recruitment has long been plagued by biased decisions, keyword-driven systems, and slow processes. We created SwipeIT to solve these problems with AI that evaluates candidates on skills, domain expertise, and attitude — helping companies find people who will thrive in their culture.</p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center" style={{ color: 'var(--foreground)' }}>Our Values</h2>
          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6">
            {values.map((v, i) => <ValueCard key={i} {...v} />)}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center" style={{ color: 'var(--foreground)' }}>Meet the Team</h2>
          <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {team.map((t, i) => <TeamMember key={i} {...t} />)}
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <div className="text-lg md:text-xl font-semibold">Ready to join the revolution?</div>
              <div className="mt-1 text-sm md:text-base">Start using SwipeIT today and experience hiring done right.</div>
            </div>
            <div className="flex-shrink-0 mt-4 lg:mt-0">
              <a href="/signup"><Button className="w-full lg:w-auto btn-secondary">Get started</Button></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 md:py-12 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3"><img src="/logo.png" alt="SwipeIT" className="w-28 object-contain" /></div>
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
                  <a href="https://x.com/Swipeit_ai" target="_blank" rel="noreferrer" aria-label="X (opens in new tab)" className="p-2 rounded hover:bg-white/5 transition-colors">
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
