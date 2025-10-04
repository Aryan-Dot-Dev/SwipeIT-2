import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

const AdPackage = ({ title, description, features, price, popular }) => (
  <div className={`p-4 md:p-6 rounded-xl shadow-sm ${popular ? 'bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] text-white' : 'bg-white/90'}`} style={{ borderColor: 'var(--border)' }}>
    {popular && <div className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full inline-block mb-3 md:mb-4">Most Popular</div>}
    <h3 className="font-semibold text-base md:text-lg mb-2">{title}</h3>
    <p className={`text-sm mb-3 md:mb-4 ${popular ? 'text-white/90' : 'text-[color:var(--muted-foreground)]'}`}>{description}</p>
    <div className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{price}</div>
    <ul className="space-y-2 mb-4 md:mb-6">
      {features.map((feature, i) => (
        <li key={i} className={`text-xs md:text-sm flex items-center gap-2 ${popular ? 'text-white/90' : ''}`} style={popular ? {} : { color: 'var(--muted-foreground)' }}>
          <span className="text-green-500">✓</span>
          {feature}
        </li>
      ))}
    </ul>
    <Button className={`w-full text-sm md:text-base ${popular ? 'bg-white text-[color:var(--primary)] hover:bg-white/90' : ''}`}>
      Get Started
    </Button>
  </div>
)

const BenefitCard = ({ title, description, icon }) => (
  <div className="p-4 md:p-6 bg-white/95 rounded-lg shadow text-center" style={{ borderColor: 'var(--border)' }}>
    <div className="text-2xl md:text-3xl mb-3 md:mb-4">{icon}</div>
    <div className="font-semibold text-sm md:text-base mb-2">{title}</div>
    <div className="text-xs md:text-sm text-[color:var(--muted-foreground)]">{description}</div>
  </div>
)

export default function AdvertisePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const packages = [
    {
      title: 'Starter',
      description: 'Perfect for small businesses looking to increase visibility.',
      features: ['5 Promoted Jobs', 'Basic Analytics', 'Email Support', '30-day campaign'],
      price: '$299/month',
      popular: false
    },
    {
      title: 'Professional',
      description: 'Ideal for growing companies with multiple hiring needs.',
      features: ['25 Promoted Jobs', 'Advanced Analytics', 'Priority Support', 'Custom Branding', 'A/B Testing'],
      price: '$899/month',
      popular: true
    },
    {
      title: 'Enterprise',
      description: 'Comprehensive solution for large organizations.',
      features: ['Unlimited Jobs', 'Full Analytics Suite', 'Dedicated Manager', 'API Access', 'White-label Options'],
      price: 'Custom Pricing',
      popular: false
    }
  ]

  const benefits = [
    {
      title: 'Targeted Reach',
      description: 'Reach qualified candidates actively searching for opportunities in your industry.',
      icon: '🎯'
    },
    {
      title: 'Higher Visibility',
      description: 'Promoted jobs appear at the top of search results and in featured sections.',
      icon: '�'
    },
    {
      title: 'Quality Leads',
      description: 'Connect with candidates who match your requirements through our AI matching.',
      icon: '⭐'
    },
    {
      title: 'Brand Building',
      description: 'Showcase your company culture and values to attract top talent.',
      icon: '🏢'
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
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-xs md:text-sm font-medium">Advertising</div>
            <h1 className="mt-4 md:mt-6 text-2xl md:text-4xl lg:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Reach Top Talent</h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto px-4">Promote your jobs and brand to thousands of qualified candidates actively searching for opportunities. Our targeted advertising solutions help you find the perfect match faster.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-6 md:mb-8" style={{ color: 'var(--foreground)' }}>Why Advertise with SwipeIT?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, i) => <BenefitCard key={i} {...benefit} />)}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-6 md:mb-8" style={{ color: 'var(--foreground)' }}>Advertising Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {packages.map((pkg, i) => <AdPackage key={i} {...pkg} />)}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-6 py-8 md:py-12">
          <div className="p-6 md:p-8 bg-[color:var(--card)] rounded-xl text-center">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">Custom Solutions</h2>
            <p className="text-[color:var(--muted-foreground)] mb-4 md:mb-6 text-sm md:text-base">Need something tailored to your specific needs? We offer custom advertising solutions for large organizations and unique campaigns.</p>
            <a href="mailto:team@swipeit.in"><Button className="w-full sm:w-auto btn-primary">Contact Sales</Button></a>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">
              <div className="text-lg md:text-xl font-semibold">Ready to get started?</div>
              <div className="mt-1 text-sm md:text-base">Contact our advertising team to discuss your campaign goals and find the perfect solution.</div>
            </div>
            <div className="flex-shrink-0 mt-4 lg:mt-0">
              <a href="mailto:team@swipeit.in"><Button className="w-full lg:w-auto btn-secondary">Start Advertising</Button></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 md:py-12 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="font-semibold text-[color:var(--foreground)] mb-3 text-base md:text-lg">SwipeIT</div>
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

          <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6 text-xs text-[color:var(--muted-foreground)] flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-left">Made with care — fair, bias-free hiring.</div>
            <div className="text-center lg:text-right">Want to advertise? <a href="mailto:team@swipeit.in" className="underline hover:text-[color:var(--foreground)] transition-colors">team@swipeit.in</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
