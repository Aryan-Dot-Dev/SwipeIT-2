import React from 'react'

export default function Footer() {
  return (
    <footer className="py-6 md:py-8 bg-[color:var(--card)] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-sm text-[color:var(--muted-foreground)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3">
              <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-28 object-contain" />
            </div>
            <div>© {new Date().getFullYear()} SwipeIT — simple hiring</div>
            <div className="mt-3">SwipeIt ai</div>
            <div className="text-xs mt-1">
              Support: <a href="mailto:team@swipeit.in" className="underline hover:text-[color:var(--foreground)] transition-colors">team@swipeit.in</a>
            </div>
            <div className="text-xs">
              Phone: <a href="tel:+916302728603" className="underline hover:text-[color:var(--foreground)] transition-colors">+91 63027 28603</a>
            </div>
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
          <div className="text-center lg:text-right">
            Want to advertise? <a href="mailto:team@swipeit.in" className="underline hover:text-[color:var(--foreground)] transition-colors">team@swipeit.in</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
