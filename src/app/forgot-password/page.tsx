'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A1628',
        padding: '24px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
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
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#E8EEF4', letterSpacing: '-0.02em' }}>
            APEX
          </span>
        </div>

        {sent ? (
          <>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#E8EEF4', margin: '0 0 8px 0' }}>
              Check your email
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(232, 238, 244, 0.45)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              We sent a password reset link to{' '}
              <strong style={{ color: '#00A896' }}>{email}</strong>.
              Click the link to set a new password.
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
              }}
            >
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#E8EEF4', margin: '0 0 8px 0' }}>
              Reset your password
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(232, 238, 244, 0.45)', margin: '0 0 32px 0' }}>
              Enter your email and we&apos;ll send you a reset link.
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

            <div style={{ marginBottom: '24px' }}>
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleReset() }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(10, 22, 40, 0.6)',
                  border: '1px solid rgba(30, 58, 95, 0.6)',
                  borderRadius: '10px',
                  color: '#E8EEF4',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading || !email}
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
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: 'rgba(232, 238, 244, 0.4)',
                marginTop: '24px',
              }}
            >
              Remember your password?{' '}
              <Link href="/login" style={{ color: '#00A896', textDecoration: 'none', fontWeight: 500 }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
