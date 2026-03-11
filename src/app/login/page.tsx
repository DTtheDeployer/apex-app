'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00d084, transparent 70%)' }} />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-green/10 border border-green/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                <polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <span className="text-lg font-bold">APEX <span className="text-subtle font-normal">/ HL</span></span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-muted text-sm">{mode === 'login' ? 'Sign in to your APEX dashboard' : 'Start paper trading free — no card needed'}</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required minLength={8} className="input" placeholder="8+ characters"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red text-sm bg-red/5 border border-red/20 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="btn-primary w-full text-center justify-center flex items-center gap-2 disabled:opacity-50">
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <span className="text-muted text-sm">{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}</span>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-green text-sm font-medium hover:underline">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-subtle mt-6">Non-custodial · Your funds always stay in your wallet</p>
      </div>
    </div>
  )
}
