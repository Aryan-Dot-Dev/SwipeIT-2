import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log to analytics service if available
    try {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.toString(),
          fatal: true
        })
      }
    } catch (e) {
      // Ignore analytics errors
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F6F5FA] to-[#E4DFF5] p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-[#E4DFF5] p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-[#1C1A2E] mb-3">
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p className="text-[#6E6B86] mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe. 
              Try refreshing the page or go back to the home page.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-[#9A8CF2] hover:text-[#6ED7A5] transition-colors">
                  View error details
                </summary>
                <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-200 text-xs font-mono text-red-800 overflow-auto max-h-40">
                  <div className="font-bold mb-2">Error:</div>
                  <div className="mb-3">{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mb-2">Stack trace:</div>
                      <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#9A8CF2] to-[#6ED7A5] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#E4DFF5] text-[#1C1A2E] font-semibold rounded-xl hover:border-[#9A8CF2] hover:bg-[#F6F5FA] transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Support link */}
            <p className="mt-6 text-sm text-[#6E6B86]">
              Need help?{' '}
              <a 
                href="mailto:team@swipeit.in" 
                className="text-[#9A8CF2] hover:text-[#6ED7A5] font-medium underline underline-offset-2 transition-colors"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
