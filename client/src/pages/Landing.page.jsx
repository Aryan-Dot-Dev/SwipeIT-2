
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import DemoSwipeCard from '@/components/DemoSwipeCard'

const Feature = ({ title, desc, icon }) => (
  <div className="p-4 md:p-6 rounded-2xl border border-[color:var(--border)]/70 bg-white/80 backdrop-blur-xl shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_48px_-16px_rgba(138,43,226,0.35)] transition-all">
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ff66c4] via-[#b07bff] to-[#6f3bd8] text-white flex-shrink-0 shadow-lg shadow-[#b07bff]/30">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm md:text-base leading-snug text-[color:var(--foreground)]">{title}</div>
        <div className="text-xs md:text-sm text-[color:var(--muted-foreground)] mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  </div>
)

const StepCard = ({ step, title, desc }) => (
  <div className="flex items-start gap-3 p-3 sm:p-4 rounded-2xl border border-[color:var(--border)] bg-white/80 backdrop-blur-md shadow-sm">
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-semibold flex items-center justify-center">
      {step}
    </div>
    <div className="min-w-0">
      <div className="font-semibold text-sm sm:text-base text-[color:var(--foreground)]">{title}</div>
      <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] leading-relaxed">{desc}</p>
    </div>
  </div>
)

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const features = [
    {
      title: 'Instant candidate signal',
      desc: 'AI-written quick summaries and match scores so you know who to talk to first.',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    {
      title: 'Chat built-in',
      desc: 'Keep every conversation in one place with read receipts and notifications.',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    },
    {
      title: 'Structured profiles',
      desc: 'Skills, experience, and resumes in a compact, swipe-friendly layout.',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    },
    {
      title: 'Privacy-first',
      desc: 'Data stays with you. No public listings—just focused, private matching.',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
    }
  ]

  const steps = [
    { step: '01', title: 'Create a space', desc: 'Spin up your hiring workspace, invite teammates, and set preferences.' },
    { step: '02', title: 'Load roles & resumes', desc: 'Post roles in minutes or drag in resumes—our AI maps them instantly.' },
    { step: '03', title: 'Swipe & chat', desc: 'Prioritized stacks, quick shortlist, and built-in chat to move faster.' }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-[#f7f2ff] to-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-32 -left-20 w-80 h-80 bg-[#ff66c4]/25 blur-3xl rounded-full"></div>
        <div className="absolute top-10 right-[-60px] w-96 h-96 bg-[#8a2be2]/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-[-80px] left-10 w-72 h-72 bg-[#b07bff]/18 blur-3xl rounded-full"></div>
      </div>
      <header className="w-full py-3 md:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 md:gap-3">
              <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
              <span className="sr-only">SwipeIT</span>
            </a>
            <nav className="hidden md:flex items-center gap-4">
              <a href="#features" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Features</a>
              <a href="#how" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">How it works</a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Log in</a>
              <a href="/signup"><button className="btn-primary text-sm px-4 py-2">Sign up</button></a>
            </nav>
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

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute top-20 right-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300">
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
                className="text-base py-3 px-6 text-[color:var(--primary)] hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how"
                className="text-base py-3 px-6 text-[color:var(--primary)] hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How it works
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center py-6 md:py-10">
          <div className="order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 shadow-sm text-[11px] sm:text-xs font-medium text-[color:var(--foreground)] border border-[color:var(--border)]">
              Premium talent workspace
            </div>
            <h1 className="mt-3 md:mt-5 text-3xl sm:text-4xl md:text-5xl leading-tight font-extrabold text-[color:var(--foreground)]">
              Swipe faster. Decide faster. Stay in the flow.
            </h1>
            <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-[color:var(--muted-foreground)] max-w-xl leading-relaxed">
              Pink-and-purple glass UI, AI summaries, and built-in chat keep hiring teams moving without the tab maze.
            </p>

            <div className="mt-5 md:mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
              <a href="/signup" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white shadow-[0_10px_30px_-12px_rgba(255,102,196,0.7)] transition-transform active:scale-95" style={{ background: 'linear-gradient(135deg,#ff66c4,#b07bff 50%,#6f3bd8)' }}>
                  Start free
                </button>
              </a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)]">Already have an account? <span className="underline">Sign in</span></a>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[color:var(--foreground)] max-w-lg">
              <div className="p-3 rounded-2xl bg-white/70 border border-[color:var(--border)] shadow-sm">
                <div className="text-[12px] text-[color:var(--muted-foreground)]">What you get</div>
                <div className="text-sm font-semibold">Private swipe stacks, AI summaries, built-in chat.</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 border border-[color:var(--border)] shadow-sm">
                <div className="text-[12px] text-[color:var(--muted-foreground)]">No hype</div>
                <div className="text-sm font-semibold">Straightforward workflows without vanity claims.</div>
              </div>
            </div>
          </div>

          <div className="order-2 flex items-center justify-center">
            <div className="w-full max-w-sm md:max-w-lg p-[1px] rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#ff66c4] via-[#b07bff] to-[#6f3bd8] shadow-[0_14px_40px_-16px_rgba(111,59,216,0.55)]">
              <div className="p-3 sm:p-4 md:p-6 rounded-[1.05rem] md:rounded-[1.35rem] bg-white/95 backdrop-blur-xl border border-[color:var(--border)]">
                <DemoSwipeCard onSwipe={(dir) => console.log('Demo card swiped', dir)} />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-[color:var(--foreground)]">A calmer hiring surface</h3>
              <p className="text-[color:var(--muted-foreground)] mt-2 text-sm sm:text-base max-w-2xl">Everything critical above the fold, so you can move from screening to chat without tab chaos.</p>
            </div>
          </div>
          <div className="mt-5 md:mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-5">
            {features.map((f, i) => <Feature key={i} {...f} />)}
          </div>
        </section>

        <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-center">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--card)] text-[11px] sm:text-xs font-medium text-[color:var(--foreground)] border border-[color:var(--border)]">How it works</div>
            <h3 className="text-2xl md:text-3xl font-semibold text-[color:var(--foreground)]">From resume to conversation in three steps.</h3>
            <p className="text-[color:var(--muted-foreground)] text-sm sm:text-base max-w-xl">Keep stakeholders aligned with a single flow that highlights signal, not noise.</p>
            <div className="space-y-3 sm:space-y-4 mt-3">
              {steps.map((s) => <StepCard key={s.step} {...s} />)}
            </div>
          </div>
          <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-[color:var(--border)] shadow-[0_14px_50px_-20px_rgba(111,59,216,0.5)] p-4 sm:p-6 lg:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white font-bold">AI</div>
              <div>
                <div className="text-sm text-[color:var(--muted-foreground)]">Signal preview</div>
                <div className="text-lg font-semibold text-[color:var(--foreground)]">What hiring teams see first</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[color:var(--foreground)]">
              <div className="p-3 rounded-2xl bg-[color:var(--card)] border border-[color:var(--border)]">AI-generated summary of the profile (skills, impact, preferences).</div>
              <div className="p-3 rounded-2xl bg-white border border-[color:var(--border)]">Match scoring, availability, and location surfaced together.</div>
              <div className="p-3 rounded-2xl bg-white border border-[color:var(--border)]">Key skills and links so you can decide in seconds.</div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="p-5 sm:p-6 rounded-3xl border border-[color:var(--border)] bg-white/85 backdrop-blur-md shadow-lg space-y-3">
            <div className="text-[11px] sm:text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">For recruiters</div>
            <h4 className="text-xl font-semibold text-[color:var(--foreground)]">Pipeline clarity without extra tabs.</h4>
            <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
              <li>• Single inbox for candidates and hiring managers.</li>
              <li>• AI summaries, resume links, and quick shortlist actions.</li>
              <li>• Share shortlists with stakeholders in one click.</li>
            </ul>
            <Button className="w-full sm:w-auto">Open recruiter view</Button>
          </div>
          <div className="p-5 sm:p-6 rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)]/90 backdrop-blur-md shadow-lg space-y-3">
            <div className="text-[11px] sm:text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">For candidates</div>
            <h4 className="text-xl font-semibold text-[color:var(--foreground)]">Human, fast, and transparent.</h4>
            <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
              <li>• Clean swipe experience with clear status updates.</li>
              <li>• Built-in chat—no lost email threads.</li>
              <li>• Privacy-first: share only what you choose.</li>
            </ul>
            <Button className="w-full sm:w-auto" variant="outline">Try candidate flow</Button>
          </div>
        </section>

        <section className="py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-[#ff66c4] via-[#b07bff] to-[#6f3bd8] shadow-[0_18px_60px_-24px_rgba(111,59,216,0.55)]">
              <div className="relative rounded-[1.1rem] bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] p-5 sm:p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="text-center lg:text-left space-y-1">
                  <div className="text-lg md:text-xl font-semibold leading-tight">Ready to hire smarter?</div>
                  <div className="text-sm md:text-base opacity-90">Start free today. Bring your team when you’re ready.</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto justify-center">
                  <a href="/signup"><Button className="w-full lg:w-auto text-white bg-white/15 hover:bg-white/25 border-white/30">Create free account</Button></a>
                  <a href="/login"><Button className="w-full lg:w-auto bg-white text-[color:var(--primary)] hover:bg-white/90">Log in</Button></a>
                </div>
              </div>
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
