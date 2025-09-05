import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const NewsletterFeature = ({ title, description, icon }) => (
  <div className="p-6 bg-white/90 rounded-xl shadow-sm" style={{ borderColor: 'var(--border)' }}>
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[color:var(--primary)] text-white text-xl">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-[color:var(--muted-foreground)] mt-1">{description}</div>
      </div>
    </div>
  </div>
)

export default function NewsletterPage() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle newsletter subscription here
    setIsSubscribed(true)
    setEmail('')
  }

  const features = [
    {
      title: 'Industry Insights',
      description: 'Stay ahead with the latest trends in AI-powered recruitment and hiring best practices.',
      icon: '📊'
    },
    {
      title: 'Product Updates',
      description: 'Be the first to know about new features, improvements, and innovations on SwipeIT.',
      icon: '🚀'
    },
    {
      title: 'Expert Tips',
      description: 'Get actionable advice from HR professionals on attitude-based hiring and candidate assessment.',
      icon: '💡'
    },
    {
      title: 'Success Stories',
      description: 'Read about how companies are transforming their hiring with SwipeIT\'s technology.',
      icon: '🏆'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, var(--background), #fbfdff)' }}>
      <header className="w-full py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <span className="sr-only">SwipeIT</span>
          </a>
          <nav className="flex items-center gap-4">
            <a href="/" className="text-sm text-[color:var(--muted-foreground)]">Home</a>
            <a href="/about" className="text-sm text-[color:var(--muted-foreground)]">About</a>
            <a href="/login" className="text-sm text-[color:var(--muted-foreground)]">Log in</a>
            <a href="/signup"><Button size="sm" className="text-white" style={{ background: 'var(--primary)' }}>Sign up</Button></a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-[color:var(--card)] text-green-600 text-sm font-medium">Newsletter</div>
            <h1 className="mt-6 text-4xl md:text-5xl leading-tight font-extrabold" style={{ color: 'var(--foreground)' }}>Stay in the Loop</h1>
            <p className="mt-4 text-lg text-[color:var(--muted-foreground)] max-w-3xl mx-auto">Get the latest insights on AI-powered hiring, industry trends, and SwipeIT updates delivered straight to your inbox. Join thousands of HR professionals who stay ahead of the curve.</p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-semibold text-center mb-8" style={{ color: 'var(--foreground)' }}>What You'll Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => <NewsletterFeature key={i} {...feature} />)}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="p-8 bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] rounded-xl text-white text-center">
            <h2 className="text-2xl font-semibold mb-4">Subscribe Now</h2>
            <p className="mb-6 opacity-90">Join our community of forward-thinking recruiters and hiring professionals.</p>

            {isSubscribed ? (
              <div className="text-center">
                <div className="text-xl font-semibold mb-2">🎉 You're subscribed!</div>
                <p className="opacity-90">Check your email for a confirmation link and welcome message.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                  <Button type="submit" className="bg-white text-[color:var(--primary)] hover:bg-white/90">
                    Subscribe
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>What Our Subscribers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 bg-white/95 rounded-lg shadow" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm text-[color:var(--muted-foreground)] mb-4">"The SwipeIT newsletter keeps me updated on the latest hiring trends. Their insights on AI matching have been invaluable."</div>
                <div className="font-semibold">Sarah M.</div>
                <div className="text-xs text-[color:var(--muted-foreground)]">HR Director, TechCorp</div>
              </div>
              <div className="p-6 bg-white/95 rounded-lg shadow" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm text-[color:var(--muted-foreground)] mb-4">"I love the practical tips and success stories. It's helped me improve our recruitment process significantly."</div>
                <div className="font-semibold">Mike R.</div>
                <div className="text-xs text-[color:var(--muted-foreground)]">Talent Acquisition Lead, InnovateLabs</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-6 bg-[color:var(--card)] rounded-xl p-8 text-center">
            <div>
              <div className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>No spam, ever.</div>
              <div className="mt-1 text-sm text-[color:var(--muted-foreground)]">We respect your inbox and only send valuable content. Unsubscribe at any time.</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-[color:var(--card)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm text-[color:var(--muted-foreground)]">
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

          <div className="mt-8 border-t pt-6 text-xs text-[color:var(--muted-foreground)] flex flex-col md:flex-row items-center justify-between">
            <div>Made with care — fair, bias-free hiring.</div>
            <div className="mt-3 md:mt-0">Want to advertise? <a href="mailto:team@swipeit.in" className="underline">team@swipeit.in</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
