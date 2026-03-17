'use client'

import { useState, type CSSProperties } from 'react'

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(10, 22, 40, 0.6)',
  border: '1px solid rgba(30, 58, 95, 0.6)',
  borderRadius: '10px',
  color: '#E8EEF4',
  fontSize: '15px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  fontFamily: 'inherit',
}

const inputFocusBoxShadow = '0 0 0 2px rgba(0, 168, 150, 0.25)'
const inputFocusBorder = 'rgba(0, 168, 150, 0.5)'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Login failed')
        setLoading(false)
        return
      }
    } catch {
      setError('Network error')
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
        background: '#0A1628',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Left branding panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background:
            'linear-gradient(160deg, #0A1628 0%, #0d1e38 40%, #0f2847 70%, #0A1628 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0, 168, 150, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(0, 168, 150, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '48px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00A896, #00D4AA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 800,
                color: '#0A1628',
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#E8EEF4',
                letterSpacing: '-0.02em',
              }}
            >
              APEX
            </span>
          </div>

          <h1
            style={{
              fontSize: '44px',
              fontWeight: 700,
              color: '#E8EEF4',
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: '0 0 24px 0',
            }}
          >
            Real-time trading
            <br />
            intelligence, powered
            <br />
            by{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00A896, #00D4AA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              automation
            </span>
            .
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'rgba(232, 238, 244, 0.5)',
              margin: 0,
              maxWidth: '400px',
            }}
          >
            Monitor positions, execute strategies, and track performance
            — all from a single dashboard.
          </p>
        </div>
      </div>

      {/* Right login panel */}
      <div
        style={{
          width: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          borderLeft: '1px solid rgba(30, 58, 95, 0.4)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            animation: 'fadeIn 0.4s ease-out',
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            input::placeholder {
              color: rgba(232, 238, 244, 0.3);
            }
          `}</style>

          <h2
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#E8EEF4',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(232, 238, 244, 0.45)',
              margin: '0 0 36px 0',
            }}
          >
            Sign in to your APEX account
          </p>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.25)',
                borderRadius: '10px',
                color: '#ff6b6b',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(232, 238, 244, 0.6)',
                marginBottom: '8px',
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={{
                ...inputStyle,
                ...(emailFocused
                  ? {
                      borderColor: inputFocusBorder,
                      boxShadow: inputFocusBoxShadow,
                    }
                  : {}),
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'rgba(232, 238, 244, 0.6)',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin()
              }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={{
                ...inputStyle,
                ...(passwordFocused
                  ? {
                      borderColor: inputFocusBorder,
                      boxShadow: inputFocusBoxShadow,
                    }
                  : {}),
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? 'rgba(0, 168, 150, 0.5)'
                : 'linear-gradient(135deg, #00A896, #00BFA6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
              boxShadow: loading
                ? 'none'
                : '0 2px 12px rgba(0, 168, 150, 0.25)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: 'rgba(232, 238, 244, 0.25)',
              marginTop: '32px',
            }}
          >
            APEX Signals
          </p>
        </div>
      </div>
    </div>
  )
}
