import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  BarChart2,
  Compass,
  LogOut,
  User,
  Bookmark,
  Wand2,
  Bot
} from 'lucide-react'
import { useAuth } from '../features/auth/hooks/useAuth'
import './sidebar.scss'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard size={20} strokeWidth={2} />,
  },
  {
    label: 'Mock AI Interview',
    to: '/mock-interview',
    icon: <Bot size={20} strokeWidth={2} />,
  },
  {
    label: 'Interview Report Generator',
    to: '/interview-report',
    icon: <FileText size={20} strokeWidth={2} />,
  },
  {
    label: 'Plan Tracker',
    to: '/plan-tracker',
    icon: <Compass size={20} strokeWidth={2} />,
  },
  {
    label: 'Resume Creator',
    to: '/resume-creator',
    icon: <FilePlus size={20} strokeWidth={2} />,
  },
  {
    label: 'ATS Calculator',
    to: '/ats-calculator',
    icon: <BarChart2 size={20} strokeWidth={2} />,
  },
  {
    label: 'ATS Enhancer',
    to: '/ats-enhancer',
    icon: <Wand2 size={20} strokeWidth={2} />,
  },
]

const ACCOUNT_ITEMS = [
  {
    label: 'My Profile',
    to: '/profile',
    icon: <User size={20} strokeWidth={2} />,
  },
  {
    label: 'Wishlist',
    to: '/wishlist',
    icon: <Bookmark size={20} strokeWidth={2} />,
  },
]

const Sidebar = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Close confirmation modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showLogoutConfirm && !isLoggingOut) {
        setShowLogoutConfirm(false)
      }
    }
    if (showLogoutConfirm) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLogoutConfirm, isLoggingOut])

  const handleOpenLogoutConfirm = () => {
    setShowLogoutConfirm(true)
  }

  const handleCloseLogoutConfirm = () => {
    if (isLoggingOut) return
    setShowLogoutConfirm(false)
  }

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      await handleLogout()
      setShowLogoutConfirm(false)
      navigate('/login', { replace: true, state: null })
    } catch (err) {
      console.error('Logout error:', err)
      setShowLogoutConfirm(false)
      navigate('/login', { replace: true, state: null })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <aside className="sidebar">
        {/* ---- Brand ---- */}
        <div
          className="sidebar__brand"
          onClick={() => navigate('/dashboard')}
          style={{ cursor: 'pointer' }}
          title="Go to Dashboard"
        >
          <span className="sidebar__brand-icon">✦</span>
          <span className="sidebar__brand-name">CareerAI</span>
        </div>

        {/* ---- Navigation ---- */}
        <nav className="sidebar__nav">
          <p className="sidebar__nav-label">Tools</p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              <span className="sidebar__nav-text">{item.label}</span>
            </NavLink>
          ))}

          <p className="sidebar__nav-label" style={{ marginTop: '16px' }}>Account</p>
          {ACCOUNT_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              <span className="sidebar__nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ---- User / Logout ---- */}
        <div className="sidebar__footer">
          {user && (
            <div
              className="sidebar__user"
              onClick={() => navigate('/profile')}
              style={{ cursor: 'pointer' }}
              title="View complete profile"
            >
              <div className="sidebar__avatar">
                {user.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user.username}</p>
                <p className="sidebar__user-email">{user.email}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            className="sidebar__logout"
            onClick={handleOpenLogoutConfirm}
            title="Log out of CareerAI"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ---- Logout Confirmation Modal ---- */}
      {showLogoutConfirm &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="logout-modal-backdrop"
            onClick={handleCloseLogoutConfirm}
            role="presentation"
          >
            <div
              className="logout-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-dialog-title"
            >
              <div className="logout-modal__icon-wrap">
                <div className="logout-modal__icon">
                  <LogOut size={24} strokeWidth={2.3} />
                </div>
              </div>

              <h3 id="logout-dialog-title" className="logout-modal__title">
                Confirm Logout
              </h3>

              <p className="logout-modal__desc">
                Are you sure you want to log out? Any saved data will remain safely stored in your account.
              </p>

              {user && (
                <div className="logout-modal__account-pill">
                  <div className="account-pill-avatar">
                    {user.username?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="account-pill-info">
                    <span className="account-pill-name">{user.username}</span>
                    <span className="account-pill-email">{user.email}</span>
                  </div>
                </div>
              )}

              <div className="logout-modal__actions">
                <button
                  type="button"
                  className="logout-modal__btn logout-modal__btn--cancel"
                  onClick={handleCloseLogoutConfirm}
                  disabled={isLoggingOut}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="logout-modal__btn logout-modal__btn--confirm"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <span className="logout-modal__spinner" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={15} strokeWidth={2.2} />
                      <span>Yes, Log Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default Sidebar
