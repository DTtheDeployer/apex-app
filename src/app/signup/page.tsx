'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'

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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSignup() {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Signup failed')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1628',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '440px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00A896, #00D4AA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: '#0A1628',
              margin: '0 auto 24px',
            }}
          >
            A
          </div>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#E8EEF4',
              margin: '0 0 12px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(232, 238, 244, 0.5)',
              lineHeight: 1.6,
              margin: '0 0 32px 0',
            }}
          >
            We sent a confirmation link to <strong style={{ color: '#00A896' }}>{email}</strong>.
            Click the link to activate your account and start trading.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#E8EEF4',
              fontSize: '15px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="login-wrapper"
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
        className="login-brand"
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
        {/* Accent glows */}
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
            Start trading with
            <br />
            full{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #00A896, #00D4AA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              transparency
            </span>
            .
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'rgba(232, 238, 244, 0.5)',
              margin: '0 0 32px 0',
              maxWidth: '400px',
            }}
          >
            Paper trade free, then go live. Every trade comes with a plain-English explanation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Paper trade with $10k virtual balance',
              '6 AI strategies that adapt to market regimes',
              'Non-custodial — your keys, your funds',
              'No credit card required',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#00A896', fontSize: '14px' }}>&#10003;</span>
                <span style={{ color: 'rgba(232, 238, 244, 0.55)', fontSize: '14px' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right signup panel */}
      <div
        className="login-form-panel"
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
          className="login-form-inner"
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
            @media (max-width: 768px) {
              .login-wrapper { flex-direction: column !important; }
              .login-brand { display: none !important; }
              .login-mobile-logo { display: flex !important; }
              .login-form-panel {
                width: 100% !important;
                border-left: none !important;
                padding: 24px !important;
                min-height: 100vh;
              }
              .login-form-inner { max-width: 100% !important; }
            }
            @media (min-width: 769px) and (max-width: 1024px) {
              .login-brand { padding: 48px !important; }
              .login-brand h1 { font-size: 32px !important; }
              .login-form-panel { width: 440px !important; padding: 32px !important; }
            }
          `}</style>

          {/* Mobile-only logo */}
          <div
            className="login-mobile-logo"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #00A896, #00D4AA)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: '#0A1628',
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#E8EEF4',
                letterSpacing: '-0.02em',
              }}
            >
              APEX
            </span>
          </div>

          <h2
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: '#E8EEF4',
              margin: '0 0 8px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: 'rgba(232, 238, 244, 0.45)',
              margin: '0 0 32px 0',
            }}
          >
            Start paper trading in under a minute
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
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                ...(focusedField === 'email'
                  ? { borderColor: inputFocusBorder, boxShadow: inputFocusBoxShadow }
                  : {}),
              }}
            />
          </div>

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
              Password
            </label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                ...(focusedField === 'password'
                  ? { borderColor: inputFocusBorder, boxShadow: inputFocusBoxShadow }
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
              Confirm password
            </label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSignup()
              }}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle,
                ...(focusedField === 'confirm'
                  ? { borderColor: inputFocusBorder, boxShadow: inputFocusBoxShadow }
                  : {}),
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleSignup}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'rgba(232, 238, 244, 0.4)',
              marginTop: '24px',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: '#00A896',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          </p>

          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: 'rgba(232, 238, 244, 0.2)',
              marginTop: '24px',
              lineHeight: 1.5,
            }}
          >
            By signing up you agree to our Terms of Service and Privacy Policy.
            Trading involves significant risk.
          </p>
        </div>
      </div>
    </div>
  )
}
