import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-green flex items-center justify-center text-2xl font-extrabold text-bg mx-auto mb-6">
          A
        </div>
        <h1 className="text-5xl font-bold text-white mb-3">404</h1>
        <p className="text-muted text-lg mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-teal to-green text-white font-semibold rounded-lg shadow-lg hover:shadow-green/25 transition-all"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:border-white/20 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
