import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const TermsSection = ({ title, content }) => (
  <div className="p-4 md:p-6 bg-white/90 rounded-xl shadow-sm" style={{ borderColor: 'var(--border)' }}>
    <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">{title}</h3>
    <div className="text-[color:var(--muted-foreground)] text-sm md:text-base space-y-3">
      {content}
    </div>
  </div>
)

export default function TermsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: (
        <>
          <p>By accessing or using SwipeIT's website, applications, or services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
          <p>These terms apply to all users including job seekers, recruiters, employers, and visitors to our platform.</p>
        </>
      )
    },
    {
      title: 'User Eligibility',
      content: (
        <>
          <p>To use SwipeIT, you must:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Be at least 16 years of age or meet the minimum age requirements in your jurisdiction</li>
            <li>Comply with all applicable employment and labor laws</li>
            <li>Have the legal capacity to enter into binding agreements</li>
            <li>Not be barred from using our services under applicable laws</li>
          </ul>
        </>
      )
    },
    {
      title: 'Account Registration and Security',
      content: (
        <>
          <p>When you create an account with us, you agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide accurate and complete information</li>
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Be responsible for all activities that occur under your account</li>
          </ul>
        </>
      )
    },
    {
      title: 'Acceptable Use Policy',
      content: (
        <>
          <p>You agree not to use SwipeIT to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Discriminate against individuals based on protected characteristics</li>
            <li>Harass, intimidate, or abuse other users</li>
            <li>Post false, misleading, or inappropriate content</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to gain unauthorized access to our systems</li>
          </ul>
        </>
      )
    },
    {
      title: 'Intellectual Property',
      content: (
        <>
          <p>All content, features, and functionality of SwipeIT, including but not limited to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Software, algorithms, and technology</li>
            <li>Branding, logos, and trademarks</li>
            <li>Text, graphics, and user interface designs</li>
            <li>AI models and matching algorithms</li>
          </ul>
          <p className="mt-3">are owned by SwipeIT and protected by intellectual property laws.</p>
        </>
      )
    },
    {
      title: 'Service Availability and Termination',
      content: (
        <>
          <p>We reserve the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Modify or discontinue services at any time</li>
            <li>Suspend or terminate accounts that violate these terms</li>
            <li>Update these terms with reasonable notice</li>
            <li>Limit access to certain features or content</li>
          </ul>
        </>
      )
    },
    {
      title: 'Limitation of Liability',
      content: (
        <>
          <p>SwipeIT provides matching services but does not guarantee:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Employment outcomes or job placement</li>
            <li>The accuracy of user-provided information</li>
            <li>The suitability of matches for specific roles</li>
            <li>The conduct or reliability of other users</li>
          </ul>
          <p className="mt-3">Our liability is limited to the maximum extent permitted by applicable law.</p>
        </>
      )
    },
    {
      title: 'Governing Law',
      content: (
        <>
          <p>These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts in India.</p>
        </>
      )
    }
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
              <a href="/about" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">About</a>
              <a href="/login" className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors">Log in</a>
              <a href="/signup"><Button size="sm" className="text-white" style={{ background: 'var(--primary)' }}>Sign up</Button></a>
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
                href="/about"
                className="text-base py-3 px-6 text-green-600 hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </a>
              <div className="border-t border-[color:var(--border)] my-2"></div>
              <div className="px-6 pb-2">
                <Button size="sm" variant="outline" className="w-full mb-2 border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                  <a href="/login" className="block w-full">Log in</a>
                </Button>
                <Button size="sm" className="w-full text-white" style={{ background: 'var(--primary)' }} onClick={() => setIsMobileMenuOpen(false)}>
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
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">Terms of Service</div>
            <h1 className="mt-4 md:mt-6 text-2xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Terms & Conditions</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto px-4">Please read these terms carefully before using SwipeIT. By using our platform, you agree to be bound by these terms.</p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-6">
            {sections.map((section, i) => <TermsSection key={i} {...section} />)}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="p-6 bg-[color:var(--card)] rounded-xl text-center">
            <h2 className="text-xl font-semibold mb-4">Questions About These Terms?</h2>
            <p className="text-[color:var(--muted-foreground)] mb-6">If you have any questions about these Terms of Service, please contact our legal team.</p>
            <a href="/contact"><Button>Contact Legal</Button></a>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-6 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-8 text-white flex flex-col md:flex-row items-center justify-between">
            <div>
              <div className="text-xl font-semibold">Last updated: August 2025</div>
              <div className="mt-1 text-sm">We may update these terms periodically. Continued use constitutes acceptance of changes.</div>
            </div>
            <div className="mt-4 md:mt-0">
              <a href="/contact"><Button className="text-white" style={{ background: 'transparent' }}>Contact Support</Button></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 md:py-12 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">SwipeIT</div>
              <div>© {new Date().getFullYear()} SwipeIT — simple hiring</div>
              <div className="mt-3">SwipeIt ai</div>
              <div className="text-xs mt-1">Support: <a href="mailto:team@swipeit.in" className="underline">team@swipeit.in</a></div>
              <div className="text-xs">Phone: <a href="tel:+916302728603" className="underline">+91 63027 28603</a></div>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Product</div>
              <ul className="space-y-2">
                <li><a href="/blog" className="underline">Blog</a></li>
                <li><a href="/newsletter" className="underline">Newsletter</a></li>
                <li><a href="/about" className="underline">About</a></li>
                <li><a href="/faq" className="underline">FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Legal</div>
              <ul className="space-y-2">
                <li><a href="/privacy" className="underline">Privacy & Cookies</a></li>
                <li><a href="/terms" className="underline">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-[color:var(--foreground)] mb-3">Connect</div>
              <ul className="space-y-2">
                <li><a href="/contact" className="underline">Contact & Legal Info</a></li>
                <li className="mt-2 flex flex-wrap items-center gap-2 md:gap-3">
                  <a href="https://x.com/swipeit" target="_blank" rel="noreferrer" aria-label="X (opens in new tab)" className="p-2 rounded hover:bg-white/5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <path d="M5 4L19 20M19 4L5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>

                  <a href="https://www.instagram.com/swipeit.ai?igsh=ZWl3aG02bDRteWxx" target="_blank" rel="noreferrer" aria-label="Instagram (opens in new tab)" className="p-2 rounded hover:bg-white/5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                    </svg>
                  </a>

                  <a href="https://www.linkedin.com/company/swipeit-ai/" target="_blank" rel="noreferrer" aria-label="LinkedIn (opens in new tab)" className="p-2 rounded hover:bg-white/5">
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

          <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6 text-xs text-[color:var(--muted-foreground)] flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
            <div>Made with care — fair, bias-free hiring.</div>
            <div className="mt-2 md:mt-0">Want to advertise? <a href="mailto:team@swipeit.in" className="underline">team@swipeit.in</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
