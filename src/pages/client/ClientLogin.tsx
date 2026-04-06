import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function ClientLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        navigate('/client', { replace: true })
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundColor: '#020c06',
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,255,136,0.03) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#00ff88', boxShadow: '0 0 8px #00ff88' }}
            />
            <span
              className="text-sm font-bold tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Syne', sans-serif", color: '#00ff88' }}
            >
              VANTAGE
            </span>
          </div>
          <div
            className="text-[9px] uppercase tracking-[0.3em]"
            style={{ color: '#4a7a5a' }}
          >
            Client Portal
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div
            className="p-6 space-y-5"
            style={{ backgroundColor: '#050f08', border: '1px solid #0d2a18' }}
          >
            <div
              className="text-[9px] uppercase tracking-[0.3em] font-bold pb-3"
              style={{ color: '#4a7a5a', borderBottom: '1px solid #0d2a18' }}
            >
              Sign In
            </div>

            <div>
              <label
                className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: '#4a7a5a' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 text-xs outline-none transition-colors"
                style={{
                  backgroundColor: '#020c06',
                  border: '1px solid #0d2a18',
                  color: '#c8f0d8',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#00ff88')}
                onBlur={e => (e.currentTarget.style.borderColor = '#0d2a18')}
              />
            </div>

            <div>
              <label
                className="block text-[9px] uppercase tracking-[0.2em] mb-2"
                style={{ color: '#4a7a5a' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 text-xs outline-none transition-colors"
                style={{
                  backgroundColor: '#020c06',
                  border: '1px solid #0d2a18',
                  color: '#c8f0d8',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#00ff88')}
                onBlur={e => (e.currentTarget.style.borderColor = '#0d2a18')}
              />
            </div>

            {error && (
              <div
                className="px-4 py-2 text-[10px]"
                style={{
                  backgroundColor: 'rgba(255,68,68,0.08)',
                  border: '1px solid rgba(255,68,68,0.3)',
                  color: '#ff4444',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-opacity"
              style={{
                backgroundColor: '#00ff88',
                color: '#020c06',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <span className="text-[9px] tracking-[0.15em]" style={{ color: '#4a7a5a' }}>
            Vantage Infrastructure Intelligence Platform
          </span>
        </div>
      </div>
    </div>
  )
}
