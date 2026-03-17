'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.assign('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A1628',
      }}
    >
      <div
        style={{
          background: '#0f1f3a',
          padding: '48px',
          borderRadius: '12px',
          width: '400px',
          border: '1px solid #1e3a5f',
        }}
      >
        <h1
          style={{
            color: '#00A896',
            marginBottom: '32px',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          APEX Signals
        </h1>

        {error && (
          <p
            style={{
              color: '#ff4444',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            background: '#0A1628',
            border: '1px solid #1e3a5f',
            borderRadius: '8px',
            color: '#E8EEF4',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleLogin()
          }}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '24px',
            background: '#0A1628',
            border: '1px solid #1e3a5f',
            borderRadius: '8px',
            color: '#E8EEF4',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#00A896',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}