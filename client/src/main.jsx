import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import App from './App';
import LandingPage from './pages/Landing.page';
import LoginPage from './pages/Login.page';
import SignupPage from './pages/Signup.page';
import OnboardingPage from './pages/Onboarding.page';
import Dashboard from './pages/Dashboard.page';
import SettingsPage from './pages/Settings.page';
import BlogPage from './pages/Blog.page';
import NewsletterPage from './pages/Newsletter.page';
import AboutPage from './pages/About.page';
import FaqPage from './pages/Faq.page';
import TermsPage from './pages/Terms.page';
import PrivacyPage from './pages/Privacy.page';
import AdvertisePage from './pages/Advertise.page';
import ContactPage from './pages/Contact.page';
import { initSessionFromCookies } from '@/utils/supabaseInstance'

async function bootstrap() {
  try {
    await initSessionFromCookies()
  } catch { /* ignore */ }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/advertise" element={<AdvertisePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();