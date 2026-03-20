'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red/20 to-red/10 border border-red/20 flex items-center justify-center text-2xl mx-auto mb-6">
          !
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-muted mb-8">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-teal to-green text-white font-semibold rounded-lg shadow-lg hover:shadow-green/25 transition-all"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:border-white/20 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
