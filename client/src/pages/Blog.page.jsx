import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const BlogPost = ({ title, excerpt, category, date, readTime, readUrl }) => (
  <div className="p-6 bg-white/90 rounded-xl shadow-sm" style={{ borderColor: 'var(--border)' }}>
    <div className="flex items-center gap-2 mb-3">
      <span className="px-2 py-1 bg-[color:var(--primary)] text-white text-xs rounded-full">{category}</span>
      <span className="text-xs text-[color:var(--muted-foreground)]">{date} • {readTime} min read</span>
    </div>
    <h3 className="font-semibold text-lg mb-2">{title}</h3>
    <p className="text-sm text-[color:var(--muted-foreground)] mb-4">{excerpt}</p>
    {readUrl ? (
      <a href={readUrl} target="_blank" rel="noopener noreferrer" className="text-[color:var(--primary)] font-medium underline">Read more →</a>
    ) : (
      <Button variant="link" className="p-0 h-auto">Read more →</Button>
    )}
  </div>
)

const CategoryCard = ({ name, count, icon }) => (
  <div className="p-4 bg-white/95 rounded-lg shadow text-center" style={{ borderColor: 'var(--border)' }}>
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-semibold">{name}</div>
    <div className="text-xs text-[color:var(--muted-foreground)]">{count} posts</div>
  </div>
)

export default function BlogPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // Keep only approved posts that include a readUrl (external links)
  const featuredPosts = [
    {
      title: 'Silence: Why Keyword Matching is Failing Hiring (and How Context Fixes It)',
      excerpt: 'Most resumes never reach a human recruiter — they’re filtered and discarded by keyword-matching ATS. This post explains why keyword filters fail, shows the data, and outlines how embeddings and similarity models restore context and fairness to hiring.',
      category: 'Hiring Tips',
      date: 'Oct 1, 2025',
      readTime: 7,
      readUrl: 'https://www.linkedin.com/pulse/keyword-matching-outdated-context-new-gold-standard-yashwanth-c-3qwee/?trackingId=hS%2FwtcvZQgi7IfXClIhNJw%3D%3D'
    },
    {
      title: "Bias Isn’t Always Intentional. But It’s Always Expensive.",
      excerpt: 'Despite decades of awareness around diversity and inclusion, hiring across the world remains inherently biased — even when we don’t intend it to be. This post lays out the costs of biased hiring, where bias creeps in, and why blind hiring can materially improve outcomes.',
      category: 'Diversity',
      date: 'Jun 17, 2025',
      readTime: 6,
      readUrl: 'https://www.linkedin.com/pulse/bias-isnt-always-intentional-its-expensive-yashwanth-c-o2i0e/?trackingId=GTUI1xi7TK6aOuwmb3U%2B9g%3D%3D'
    }
  ]

  const categories = [
    { name: 'AI & Tech', count: 12, icon: '⚡' },
    { name: 'Hiring Tips', count: 8, icon: '💡' },
    { name: 'Diversity', count: 6, icon: '�' },
    { name: 'Workforce', count: 10, icon: '👥' }
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
                href="/about"
                className="text-base py-3 px-6 text-green-600 hover:text-[color:var(--foreground)] hover:bg-[color:var(--card)] transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
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
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">Blog</div>
            <h1 className="mt-4 md:mt-6 text-2xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Insights on Modern Hiring</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto px-4">Stay ahead of the curve with expert insights on AI-driven recruitment, candidate experience, company culture, and the future of work.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Featured Posts</h2>
          <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {featuredPosts.map((post, i) => <BlogPost key={i} {...post} />)}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center" style={{ color: 'var(--foreground)' }}>Explore Topics</h2>
          <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categories.map((cat, i) => <CategoryCard key={i} {...cat} />)}
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
            <div className="bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              <div className="text-center md:text-left">
                <div className="text-lg md:text-xl font-semibold">Want to stay updated?</div>
                <div className="mt-1 md:mt-2 text-sm md:text-base">Subscribe to our newsletter for the latest insights on hiring and recruitment.</div>
              </div>
              <div className="flex-shrink-0">
                <a href="/newsletter"><Button className="btn-secondary">Subscribe</Button></a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 md:py-12 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
            <div>
                <div className="mb-3"><img src="/logo.png" alt="SwipeIT" className="w-28 object-contain" /></div>
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
