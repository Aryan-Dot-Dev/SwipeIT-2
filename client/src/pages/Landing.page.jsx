
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import DemoSwipeCard from '@/components/DemoSwipeCard'
import { Zap, MessageSquare, User, Shield, BarChart2, Eye } from 'lucide-react'
import supabase from '@/utils/supabaseInstance'

const Feature = ({ title, desc, icon }) => (
  <div className="p-5 md:p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] text-white flex-shrink-0 shadow-md">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm md:text-base leading-snug text-gray-900">{title}</div>
        <div className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  </div>
)

const StepCard = ({ step, title, desc }) => (
  <div className="flex items-start gap-3 p-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
      {step}
    </div>
    <div className="min-w-0">
      <div className="font-semibold text-sm sm:text-base text-gray-900">{title}</div>
      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-0.5">{desc}</p>
    </div>
  </div>
)

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data?.session)
    })
  }, [])

  const features = [
    {
      title: 'Two-Way Swipe Matching',
      desc: 'Talent gets discovered even without applying. When both sides swipe right — it\'s a match.',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      title: 'Attitude-Based Hiring',
      desc: 'Skills can be learned. Attitude defines success. Interactive graphs visualize compatibility before the first word.',
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      title: 'AI Resume Intelligence',
      desc: 'Analyzes profiles to reveal core strengths, improvement areas, and your unique competitive advantage.',
      icon: <User className="w-5 h-5" />,
    },
    {
      title: 'Blind Hiring Mode',
      desc: 'Toggle off names, age, gender, and demographics. Focus only on skill, attitude, and potential.',
      icon: <Eye className="w-5 h-5" />,
    },
    {
      title: 'Built-in Chat',
      desc: 'Every conversation in one place with read receipts and real-time notifications. No lost email threads.',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      title: 'Privacy-First',
      desc: 'Data stays with you. No public listings — just focused, private matching between the right people.',
      icon: <Shield className="w-5 h-5" />,
    },
  ]

  const steps = [
    { step: '01', title: 'Create your profile', desc: 'Candidates upload resumes & set preferences. Recruiters post roles in minutes — AI maps them instantly.' },
    { step: '02', title: 'Swipe & discover', desc: 'Candidates swipe jobs they love. Recruiters swipe candidates they\'re excited about. Both sides are active.' },
    { step: '03', title: 'Match. Chat. Hire.', desc: 'When both swipe right, it\'s a match — and built-in chat moves you from screening to offer with no tab maze.' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white relative overflow-hidden">
      {/* Subtle background blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-40 -left-24 w-96 h-96 bg-[#E4DFF5]/70 blur-3xl rounded-full" />
        <div className="absolute top-20 right-[-80px] w-[28rem] h-[28rem] bg-[#6ED7A5]/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-100px] left-20 w-80 h-80 bg-[#9A8CF2]/15 blur-3xl rounded-full" />
      </div>

      {/* ── Header ── */}
      <header className="w-full py-3 md:py-4 sticky top-0 z-40 bg-white backdrop-blur-md border-b border-[#E4DFF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 md:gap-3">
              <img src="/logo_bg_removed_new.png" alt="SwipeIt" className="h-20 md:h-22 object-contain" />
            </a>
            <nav className="hidden md:flex items-center gap-5">
              <a href="#features" className="text-sm font-medium text-[#6E6B86] hover:text-[#9A8CF2] transition-colors">Features</a>
              <a href="#how" className="text-sm font-medium text-[#6E6B86] hover:text-[#9A8CF2] transition-colors">How it works</a>
              {isLoggedIn ? (
                <a href="/dashboard">
                  <button className="btn-primary text-sm px-5 py-2 rounded-xl flex items-center gap-1.5">
                    Go to Dashboard <span aria-hidden>→</span>
                  </button>
                </a>
              ) : (
                <>
                  <a href="/login" className="text-sm font-medium text-[#6E6B86] hover:text-[#9A8CF2] transition-colors">Log in</a>
                  <a href="/signup">
                    <button className="btn-primary text-sm px-5 py-2 rounded-xl">Sign up free</button>
                  </a>
                </>
              )}
            </nav>
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
                aria-label="Toggle menu"
              >
                <svg className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-16 right-4 left-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <nav className="flex flex-col py-2 pt-10">
              <a href="#features" className="text-base py-3 px-6 text-gray-700 hover:text-[#16a34a] hover:bg-green-50 transition-all" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a href="#how" className="text-base py-3 px-6 text-gray-700 hover:text-[#16a34a] hover:bg-green-50 transition-all" onClick={() => setIsMobileMenuOpen(false)}>How it works</a>
              <div className="border-t border-gray-100 mx-4 my-2" />
              <div className="px-4 pb-4 flex flex-col gap-2">
                {isLoggedIn ? (
                  <a href="/dashboard"><button className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-1.5">Go to Dashboard <span>→</span></button></a>
                ) : (
                  <>
                    <a href="/login"><button className="btn-secondary w-full text-sm py-2.5">Log in</button></a>
                    <a href="/signup"><button className="btn-primary w-full text-sm py-2.5">Sign up free</button></a>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 relative z-10">
        {/* ── Hero ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center py-10 md:py-16">
          <div className="order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E4DFF5] border border-[#9A8CF2]/30 text-xs font-semibold text-[#9A8CF2] mb-4">
              <span className="w-2 h-2 rounded-full bg-[#9A8CF2] animate-pulse" />
              Mobile-first hiring platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-[#1C1A2E] mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>
              Where Talent Meets<br />
              <span className="text-[#9A8CF2]">Opportunity</span> —{' '}
              <span className="text-primary">One Swipe</span>
              <br />at a Time.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#6E6B86] max-w-xl leading-relaxed">
              Hiring today is broken. Great candidates are rejected by keyword filters, and recruiters spend hours on resumes that don't show potential. <strong className="text-[#1C1A2E]">SwipeIt changes that.</strong>
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a href="/signup" className="w-full sm:w-auto">
                <button className="btn-primary w-full sm:w-auto text-base px-8 py-4 rounded-xl font-bold shadow-lg">
                  Get started free
                </button>
              </a>
              <a href="/login" className="text-sm text-[#6E6B86] text-center sm:text-left flex items-center justify-center">
                Already have an account? <span className="ml-1 text-[#9A8CF2] font-semibold underline underline-offset-2">Sign in</span>
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 text-sm max-w-lg">
              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-400 mb-0.5">Two-way matching</div>
                <div className="font-semibold text-gray-800">Both sides swipe. Both sides win.</div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-400 mb-0.5">Tagline</div>
                <div className="font-bold text-gray-800">Swipe. Match. Get Hired.</div>
              </div>
            </div>
          </div>

          <div className="order-2 flex items-center justify-center">
            <div className="w-full max-w-sm md:max-w-md p-[2px] rounded-3xl bg-gradient-to-br from-[#9A8CF2] via-[#6ED7A5] to-[#E4DFF5] shadow-2xl shadow-[#9A8CF2]/20">
              <div className="p-4 sm:p-6 rounded-[1.4rem] bg-white">
                <DemoSwipeCard onSwipe={(dir) => console.log('Demo card swiped', dir)} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Why SwipeIt ── */}
        <section className="bg-[#F6F5FA] border-y border-[#E4DFF5] py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-500 mb-4">Why SwipeIt is Different</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>
                A new way to get hired
              </h2>
              <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-2xl mx-auto">
                On SwipeIt, talent doesn't have to chase jobs. Recruiters discover your skills even if you never applied. When both sides swipe right, it's a match — turning hiring into a mutual connection, not a one-sided application.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>Everything built for speed and fairness</h3>
              <p className="text-gray-500 mt-1.5 text-sm sm:text-base max-w-2xl">From screening to chat — without the tab maze or the bias.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {features.map((f, i) => <Feature key={i} {...f} />)}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="bg-[#F6F5FA] border-y border-[#E4DFF5] py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-500">How it works</div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>
                From resume to conversation in three steps.
              </h3>
              <p className="text-gray-500 text-sm sm:text-base max-w-xl">
                The match feels personal, intentional, and exciting — just like meaningful connections in social apps.
              </p>
              <div className="space-y-3 mt-2">
                {steps.map((s) => <StepCard key={s.step} {...s} />)}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-5 sm:p-6 lg:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9A8CF2] to-[#6ED7A5] flex items-center justify-center text-white font-bold text-sm shadow-md">AI</div>
                <div>
                  <div className="text-xs text-gray-400">Signal preview</div>
                  <div className="text-base font-semibold text-gray-900">What hiring teams see first</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="p-3 rounded-xl bg-[#E4DFF5] border border-[#9A8CF2]/20 text-[#6E6B86]">✦ AI-generated summary: core strengths, competitive advantage &amp; personal value proposition.</div>
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-[#6E6B86]">✦ Attitude graph — compatibility between candidate values &amp; company culture.</div>
                <div className="p-3 rounded-xl bg-white border border-gray-200 text-[#6E6B86]">✦ Match score, skills, and resume — decide in seconds, not hours.</div>
                <div className="p-3 rounded-xl bg-[#6ED7A5]/10 border border-[#6ED7A5]/30 text-[#6E6B86]">✦ Blind Hiring Toggle — hide name, age, gender, and demographics for bias-free decisions.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── For recruiters / candidates ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-sm space-y-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#9A8CF2]">For recruiters</div>
            <h4 className="text-xl font-bold text-gray-900 mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>Pipeline clarity without extra tabs.</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2"><span className="text-[#6ED7A5] mt-0.5">✓</span> Discover talent that never even applied to your role.</li>
              <li className="flex items-start gap-2"><span className="text-[#6ED7A5] mt-0.5">✓</span> AI summaries, attitude graphs, resume links, and quick shortlist actions.</li>
              <li className="flex items-start gap-2"><span className="text-[#6ED7A5] mt-0.5">✓</span> Blind hiring toggle for bias-free, skills-first evaluation.</li>
              <li className="flex items-start gap-2"><span className="text-[#6ED7A5] mt-0.5">✓</span> Share shortlists with your team in one click.</li>
            </ul>
            <a href="/signup"><Button className="w-full sm:w-auto bg-[#6ED7A5] hover:bg-[#5ec898] text-[#0F172A] border-0 font-bold">Open recruiter view</Button></a>
          </div>
          <div className="p-6 rounded-3xl border border-gray-200 bg-gray-50 shadow-sm space-y-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#9A8CF2]">For candidates</div>
            <h4 className="text-xl font-bold text-gray-900 mb-0" style={{ background: 'none', WebkitTextFillColor: 'inherit' }}>Human, fast, and transparent.</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2"><span className="text-[#9A8CF2] mt-0.5">✓</span> Get discovered even if you didn't apply — recruiters come to you.</li>
              <li className="flex items-start gap-2"><span className="text-[#9A8CF2] mt-0.5">✓</span> Clean swipe experience with clear status updates and no ghosting.</li>
              <li className="flex items-start gap-2"><span className="text-[#9A8CF2] mt-0.5">✓</span> Built-in chat — no lost email threads, no external tools.</li>
              <li className="flex items-start gap-2"><span className="text-[#9A8CF2] mt-0.5">✓</span> Privacy-first: share only what you choose.</li>
            </ul>
            <a href="/signup"><Button className="w-full sm:w-auto" variant="outline">Try candidate flow</Button></a>
          </div>
        </section>

        {/* ── The Result / CTA ── */}
        <section className="py-8 md:py-10 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-r from-[#9A8CF2] via-[#6ED7A5] to-[#E4DFF5] shadow-2xl shadow-[#9A8CF2]/20">
              <div className="relative rounded-[calc(1.5rem-1.5px)] bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] p-6 sm:p-8 md:p-10 text-white flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left space-y-2">
                  <div className="text-2xl md:text-3xl font-extrabold">Swipe. Match. Get Hired.</div>
                  <div className="text-sm md:text-base text-white/85">
                    Faster hiring. Better matches. Fair opportunities. A more human hiring experience.
                  </div>
                  <div className="text-sm text-white/70">SwipeIt turns recruitment into connection.</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto justify-center">
                  <a href="/signup"><Button className="w-full lg:w-auto bg-white text-[#16a34a] hover:bg-white/90 font-bold border-0 shadow-md">Create free account</Button></a>
                  <a href="/login"><Button className="w-full lg:w-auto text-white bg-white/15 hover:bg-white/25 border-white/30">Log in</Button></a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 md:py-10 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm text-gray-500">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-3"><img src="/logo_bg_removed_new.png" alt="SwipeIt" className="h-20 object-contain" /></div>
              <div className="text-gray-400">© {new Date().getFullYear()} SwipeIt — fair, fast hiring</div>
              <div className="text-xs mt-1">Support: <a href="mailto:team@swipeit.in" className="underline hover:text-[#16a34a] transition-colors">team@swipeit.in</a></div>
              <div className="text-xs">Phone: <a href="tel:+916302728603" className="underline hover:text-[#16a34a] transition-colors">+91 63027 28603</a></div>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-3">Product</div>
              <ul className="space-y-2">
                <li><a href="/blog" className="hover:text-[#16a34a] transition-colors">Blog</a></li>
                <li><a href="/newsletter" className="hover:text-[#16a34a] transition-colors">Newsletter</a></li>
                <li><a href="/about" className="hover:text-[#16a34a] transition-colors">About</a></li>
                <li><a href="/faq" className="hover:text-[#16a34a] transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-3">Legal</div>
              <ul className="space-y-2">
                <li><a href="/privacy" className="hover:text-[#16a34a] transition-colors">Privacy &amp; Cookies</a></li>
                <li><a href="/terms" className="hover:text-[#16a34a] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800 mb-3">Connect</div>
              <ul className="space-y-2">
                <li><a href="/contact" className="hover:text-[#16a34a] transition-colors">Contact &amp; Legal Info</a></li>
                <li className="mt-2 flex items-center gap-3">
                  <a href="https://x.com/Swipeit_ai" target="_blank" rel="noreferrer" aria-label="X" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 4L19 20M19 4L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </a>
                  <a href="https://www.instagram.com/swipeit.ai?igsh=ZWl3aG02bDRteWxx" target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
                  </a>
                  <a href="https://www.linkedin.com/company/swipeit-ai/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M7 10V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="7" cy="7" r="1.2" fill="currentColor" /><path d="M11 17V12c0-.8.7-1.5 1.5-1.5S14 11.2 14 12v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-100 pt-5 text-xs text-gray-400 flex flex-col lg:flex-row items-center justify-between gap-3">
            <div>Made with care — fair, bias-free hiring.</div>
            <div>Want to advertise? <a href="mailto:team@swipeit.in" className="underline hover:text-[#16a34a] transition-colors">team@swipeit.in</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
