import React, { useState } from 'react'
import '../auth.form.scss'
import { useNavigate, Link, Navigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { useTheme } from "../../../context/ThemeContext"
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Coins,
  Sun,
  Moon
} from 'lucide-react'

const Register = () => {
  const { user, loading, handleRegister } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
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
      await handleRegister(username, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !user) {
    return (
      <main className={`auth-page ${isDark ? 'dark' : 'light'}`} data-theme={theme}>
        <div className="auth-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'authSpin 0.8s linear infinite' }} />
          <p style={{ marginTop: '14px', color: 'var(--auth-text-muted)', fontSize: '14px' }}>Verifying authentication...</p>
        </div>
      </main>
    )
  }

  return (
    <main className={`auth-page ${isDark ? 'dark' : 'light'}`} data-theme={theme}>
      {/* Background ambient lighting */}
      <div className="auth-ambient-glow glow-1" />
      <div className="auth-ambient-glow glow-2" />

      {/* Top back navigation & Theme toggle */}
      <div className="auth-top-nav">
        <Link to="/" className="back-home-link">
          <ArrowLeft size={16} />
        </Link>

        <button
          type="button"
          className="auth-theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div className="auth-card">
        {/* Card Header */}
        <div className="auth-card-header">
          <Link to="/" className="brand-badge-link">
            <span className="brand-icon">✦</span>
            <span className="brand-name">CareerAI</span>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">
            Join CareerAI to build ATS resumes and ace your interviews with AI.
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
          {/* Username Field */}
          <div className="form-field">
            <label htmlFor="username">Full Username</label>
            <div className="input-wrapper">
              <User size={17} className="field-icon" />
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter Your Name"
                value={username}
                required
                autoComplete="name"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

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
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={17} className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Create a strong password"
                value={password}
                required
                autoComplete="new-password"
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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Switch */}
        <div className="auth-card-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="switch-link">
            Sign in
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

export default Register
