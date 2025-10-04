import React, { useState } from 'react';
import { Button } from './ui/button';

const Header = ({
  navigation = [],
  showMobileMenu = true,
  userType = 'guest', // 'guest', 'candidate', 'recruiter'
  userName = '',
  userAvatar = null,
  onMenuClick = () => {},
  onFilterClick = () => {},
  showFilters = false,
  savedJobsCount = 0,
  isMenuOpen = null, // External menu state control
  onMenuToggle = null, // External menu toggle handler
  showCustomMenuButton = false // Show custom menu button for external menu handling
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isMobileMenuOpen = isMenuOpen !== null ? isMenuOpen : internalMenuOpen;
  const handleMenuToggle = onMenuToggle || (() => setInternalMenuOpen(!internalMenuOpen));

  // Different navigation based on user type
  const getNavigationByUserType = () => {
    switch (userType) {
      case 'candidate':
        return [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/profile', label: 'Profile' },
          { href: '/saved-jobs', label: 'Saved Jobs' },
          { href: '/settings', label: 'Settings' },
          { href: '/logout', label: 'Sign Out', isButton: true }
        ];
      case 'recruiter':
        return [
          { href: '/recruiter-dashboard', label: 'Dashboard' },
          { href: '/post-job', label: 'Post Job' },
          { href: '/candidates', label: 'Candidates' },
          { href: '/analytics', label: 'Analytics' },
          { href: '/settings', label: 'Settings' },
          { href: '/logout', label: 'Sign Out', isButton: true }
        ];
      default:
        return [
          { href: '/', label: 'Home' },
          { href: '/about', label: 'About' },
          { href: '/blog', label: 'Blog' },
          { href: '/login', label: 'Log in' },
          { href: '/signup', label: 'Sign up', isButton: true }
        ];
    }
  };

  const navItems = navigation.length > 0 ? navigation : getNavigationByUserType();

  return (
    <header className="w-full py-3 md:py-4 lg:py-6 overflow-x-hidden bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between min-w-0">
          {/* Logo/Brand Section */}
          <a href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 object-contain" />
            <span className="sr-only">SwipeIT</span>
          </a>

          {/* User Info for Dashboard Users */}
          {(userType === 'candidate' || userType === 'recruiter') && (
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-24">
                {userName}
              </span>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 flex-shrink-0">
            {navItems.map((item, index) => (
              item.isButton ? (
                <a key={index} href={item.href} className="flex-shrink-0">
                  <Button
                    size="sm"
                    className="text-white font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                  >
                    {item.label}
                  </Button>
                </a>
              ) : (
                <a
                  key={index}
                  href={item.href}
                  className="text-sm xl:text-base text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105 whitespace-nowrap flex-shrink-0"
                >
                  {item.label}
                  {item.label === 'Saved Jobs' && savedJobsCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {savedJobsCount}
                    </span>
                  )}
                </a>
              )
            ))}
          </nav>

          {/* Mobile/Tablet Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Filter Button - Only for candidates */}
            {showFilters && userType === 'candidate' && (
              <button
                onClick={onFilterClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation lg:hidden"
                aria-label="Open filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            )}

            {/* Custom Menu Button */}
            {showCustomMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 touch-manipulation lg:hidden"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Navigation Menu Popup */}
        {showMobileMenu && isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                handleMenuToggle();
                onMenuClick();
              }}
            />
            {/* Menu */}
            <div className="absolute top-16 left-2 right-2 sm:left-4 sm:right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => {
                  handleMenuToggle();
                  onMenuClick();
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 touch-manipulation"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* User Info Section - For Dashboard Users */}
              {(userType === 'candidate' || userType === 'recruiter') && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[color:var(--primary)]/10 to-[color:var(--secondary)]/10">
                  <div className="flex items-center gap-4">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--secondary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{userName}</div>
                      <div className="text-sm text-gray-600 capitalize">{userType}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Logo Section - For Guest Users */}
              {userType === 'guest' && (
                <div className="flex items-center justify-center p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <img src="/logo_bg_removed.png" alt="SwipeIT" className="w-12 h-12 object-contain" />
                    <div className="text-lg font-semibold text-gray-900">SwipeIT</div>
                  </div>
                </div>
              )}

              {/* Navigation Menu */}
              <nav className="flex flex-col py-4">
                {navItems.map((item, index) => (
                  item.isButton ? (
                    <div key={index} className="px-6 pb-3">
                      <Button
                        size="sm"
                        className="w-full text-white font-medium transition-all duration-200 active:scale-95 py-3 text-base touch-manipulation"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                        onClick={() => {
                          handleMenuToggle();
                          onMenuClick();
                        }}
                      >
                        <a href={item.href} className="block w-full">{item.label}</a>
                      </Button>
                    </div>
                  ) : (
                    <a
                      key={index}
                      href={item.href}
                      className="text-base py-4 px-6 text-gray-700 hover:bg-gray-50 transition-all duration-200 active:scale-95 touch-manipulation block relative"
                      style={{ '--hover-color': 'var(--primary)' }}
                      onClick={() => {
                        handleMenuToggle();
                        onMenuClick();
                      }}
                    >
                      {item.label}
                      {item.label === 'Saved Jobs' && savedJobsCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {savedJobsCount}
                        </span>
                      )}
                    </a>
                  )
                ))}
              </nav>

              {/* Quick Actions for Dashboard Users */}
              {(userType === 'candidate' || userType === 'recruiter') && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {userType === 'candidate' ? (
                      <>
                        <button
                          onClick={() => {
                            handleMenuToggle();
                            onMenuClick();
                            onFilterClick();
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-200 touch-manipulation"
                          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--primary)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Filters</span>
                        </button>
                        <button
                          onClick={() => {
                            handleMenuToggle();
                            onMenuClick();
                            // Navigate to saved jobs
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-200 touch-manipulation relative"
                          style={{ background: 'var(--card)' }}
                        >
                          <svg className="w-6 h-6 text-[color:var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span className="text-xs font-medium text-[color:var(--primary)]">Saved</span>
                          {savedJobsCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{savedJobsCount}</span>
                            </div>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            handleMenuToggle();
                            onMenuClick();
                            // Navigate to post job
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200 touch-manipulation"
                        >
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs font-medium text-purple-700">Post Job</span>
                        </button>
                        <button
                          onClick={() => {
                            handleMenuToggle();
                            onMenuClick();
                            // Navigate to analytics
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors duration-200 touch-manipulation"
                        >
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="text-xs font-medium text-orange-700">Analytics</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
