import React, { useState } from 'react'
import '../auth.form.scss'
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { user, loading, handleLogin } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // If already authenticated, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      await handleLogin(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !user) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
          <p style={{ marginTop: '14px', color: '#94a3b8', fontSize: '14px' }}>Verifying authentication...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      {/* Background ambient lighting */}
      <div className="auth-ambient-glow glow-1" />
      <div className="auth-ambient-glow glow-2" />

      {/* Top back navigation */}
      <div className="auth-top-nav">
        <Link to="/" className="back-home-link">
          <ArrowLeft size={16} />
        </Link>
      </div>

      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <Link to="/" className="brand-badge-link">
            <span className="brand-icon">✦</span>
            <span className="brand-name">CareerAI</span>
            <span className="brand-pill">PRO</span>
          </Link>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to access your resumes, AI mock interviews, and prep roadmaps.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={17} className="field-icon" />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter Your Email"
                value={email}
                required
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password">
              <span>Password</span>
            </label>
            <div className="input-wrapper">
              <Lock size={17} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                required
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Switch */}
        <div className="auth-card-footer">
          <span>Don't have an account?</span>
          <Link to="/register" className="switch-link">
            Sign up
          </Link>
        </div>

        {/* Feature Trust Strip */}
        <div className="auth-trust-strip">
          <div className="trust-item">
            <CheckCircle2 size={12} color="#10b981" />
            <span>100% ATS Ready</span>
          </div>
          <div className="trust-item">
            <Sparkles size={12} color="#3b82f6" />
            <span>Voice AI Mock</span>
          </div>
          <div className="trust-item">
            <ShieldCheck size={12} color="#8b5cf6" />
            <span>Encrypted & Private</span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Login
