import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-[color:var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 md:p-6 text-left bg-white/90 hover:bg-white/95 transition-colors flex items-center justify-between"
      >
        <span className="font-semibold text-sm md:text-base pr-2">{question}</span>
        <span className={`transform transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="p-4 md:p-6 bg-[color:var(--card)] text-[color:var(--muted-foreground)] text-sm md:text-base">
          {answer}
        </div>
      )}
    </div>
  )
}

const CategoryCard = ({ title, count, icon }) => (
  <div className="p-3 md:p-4 bg-white/95 rounded-lg shadow text-center hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border)' }}>
    <div className="text-xl md:text-2xl mb-2">{icon}</div>
    <div className="font-semibold text-sm md:text-base">{title}</div>
    <div className="text-xs md:text-sm text-[color:var(--muted-foreground)]">{count} questions</div>
  </div>
)

export default function FaqPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const faqs = [
    {
      question: 'How does SwipeIT differ from traditional job portals?',
      answer: 'Unlike portals that rely on keyword filters and outdated systems, SwipeIT uses AI-powered matching to ensure candidates are evaluated holistically, not just on keywords. Our system considers skills, experience, attitude, and cultural fit to provide more accurate matches.'
    },
    {
      question: 'How accurate is SwipeIT\'s matching system?',
      answer: 'Our AI uses advanced algorithms including vector embeddings, cosine similarity, and behavioral assessments to ensure highly relevant matches. We continuously improve our models based on successful hires and user feedback.'
    },
    {
      question: 'Is my data safe on SwipeIT?',
      answer: 'Absolutely. All data is encrypted and handled with the highest security standards. We never sell personal data to third parties and comply with GDPR and other privacy regulations. Your information is used only to improve matching and user experience.'
    },
    {
      question: 'What is the attitude compatibility assessment?',
      answer: 'The attitude compatibility quiz helps evaluate personality traits, teamwork style, and adaptability. Recruiters can set preferred traits for their company culture, and SwipeIT automatically calculates compatibility scores to find candidates who will thrive in their environment.'
    },
    {
      question: 'Can SwipeIT replace my company\'s ATS?',
      answer: 'Yes. SwipeIT is built as a modern replacement for outdated ATS systems, providing better accuracy, faster results, and fairer hiring practices. Our integrated chat and profile system eliminates the need for multiple tools.'
    },
    {
      question: 'How much does SwipeIT cost?',
      answer: 'SwipeIT offers flexible pricing plans starting with a free tier for small teams. Our paid plans include advanced features like unlimited matches, priority support, and analytics. Contact our sales team for a custom quote.'
    },
    {
      question: 'Can candidates see who viewed their profile?',
      answer: 'For privacy and fairness, we don\'t show profile views. However, when you send a message or shortlist a candidate, they\'ll be notified to encourage engagement.'
    },
    {
      question: 'How do I get started as a recruiter?',
      answer: 'Simply sign up for a free account, complete your company profile, and start posting jobs. Our AI will begin matching you with relevant candidates immediately.'
    }
  ]

  const categories = [
    { title: 'Getting Started', count: 2, icon: '�' },
    { title: 'Matching & AI', count: 3, icon: '⚡' },
    { title: 'Privacy & Security', count: 2, icon: '🔒' },
    { title: 'Pricing & Support', count: 2, icon: '�' }
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">FAQ</div>
            <h1 className="mt-4 md:mt-6 text-2xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Frequently Asked Questions</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto px-4">Find answers to common questions about SwipeIT. Can't find what you're looking for? Contact our support team.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center" style={{ color: 'var(--foreground)' }}>Browse by Category</h2>
          <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categories.map((cat, i) => <CategoryCard key={i} {...cat} />)}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8" style={{ color: 'var(--foreground)' }}>All Questions</h2>
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
            <div className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl font-semibold">Still have questions?</div>
                <div className="mt-1 md:mt-2 text-sm md:text-base">Our support team is here to help. Get in touch and we'll respond within 24 hours.</div>
              </div>
              <div className="flex-shrink-0">
                <a href="/contact"><Button className="text-white bg-white/10 hover:bg-white/20 border border-white/20" style={{ background: 'transparent' }}>Contact Support</Button></a>
              </div>
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
