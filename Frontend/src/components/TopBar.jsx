import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  HelpCircle,
  Check,
  CheckCheck,
  FilePlus,
  FileText,
  BarChart2,
  LayoutDashboard,
  Sparkles,
  X,
  ExternalLink,
  Compass,
  User,
  Bookmark,
  Wand2,
  Bot,
  Coins,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getWishlistCounts } from '../features/wishlist/services/wishlist.storage'
import { getUserCredits, getCreditHistory, syncCreditsFromDb } from '../features/credits/services/credits.storage'
import { getUserScopedKey } from '../utils/userScope'
import './topbar.scss'

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'ATS Resume Score: 92%',
    description: 'Your resume format is ATS-optimized with modern single-column layout.',
    time: '10m ago',
    unread: true,
    type: 'resume',
  },
  {
    id: 2,
    title: 'Interview Report Ready',
    description: 'Tailored questions and preparation roadmap generated for your profile.',
    time: '45m ago',
    unread: true,
    type: 'interview',
  },
  {
    id: 3,
    title: 'Font Library Expanded',
    description: '22 ATS-friendly Google fonts and live font search now active.',
    time: '2h ago',
    unread: true,
    type: 'system',
  },
  {
    id: 4,
    title: 'Profile Updated',
    description: 'Personal contact details and skills successfully synchronized.',
    time: '1d ago',
    unread: false,
    type: 'system',
  },
]

const QUICK_SEARCH_TOOLS = [
  { label: 'Dashboard', to: '/', desc: 'Overview & tools hub', icon: LayoutDashboard },
  { label: 'Mock AI Interview Agent', to: '/mock-interview', desc: 'Interactive voice & text interview simulation', icon: Bot },
  { label: 'My Profile', to: '/profile', desc: 'Skills, bio, projects & experience', icon: User },
  { label: 'Wishlist', to: '/wishlist', desc: 'Saved reports & resumes collection', icon: Bookmark },
  { label: 'Interview Report Generator', to: '/interview-report', desc: 'Generate custom Q&A and prep plan', icon: FileText },
  { label: 'Plan Tracker', to: '/plan-tracker', desc: 'Track your preparation roadmaps & tasks', icon: Compass },
  { label: 'Resume Creator', to: '/resume-creator', desc: 'Build ATS resumes with live preview', icon: FilePlus },
  { label: 'ATS Calculator', to: '/ats-calculator', desc: 'Analyze resume match percentage with AI', icon: BarChart2 },
  { label: 'ATS Enhancer', to: '/ats-enhancer', desc: 'Optimize & enhance resume with AI', icon: Wand2 },
]

const TopBar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, isDark, toggleTheme } = useTheme()

  // Notification state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(getUserScopedKey('career_ai_notifications'))
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS
    } catch {
      return INITIAL_NOTIFICATIONS
    }
  })
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showCreditsMenu, setShowCreditsMenu] = useState(false)
  const [wishlistCounts, setWishlistCounts] = useState(() => getWishlistCounts())

  // Credits System State (Default 100)
  const [userCredits, setUserCredits] = useState(() => getUserCredits())
  const [creditHistory, setCreditHistory] = useState(() => getCreditHistory())

  // Credits & Wishlist event listeners
  useEffect(() => {
    // Sync initial credits directly from MongoDB
    syncCreditsFromDb().then((bal) => {
      if (typeof bal === 'number') {
        setUserCredits(bal)
        setCreditHistory(getCreditHistory())
      }
    })

    const updateCredits = () => {
      setUserCredits(getUserCredits())
      setCreditHistory(getCreditHistory())
    }
    const updateWishlist = () => {
      setWishlistCounts(getWishlistCounts())
    }
    const handleAuthChange = () => {
      syncCreditsFromDb().then((bal) => {
        if (typeof bal === 'number') {
          setUserCredits(bal)
          setCreditHistory(getCreditHistory())
        }
      })
      updateCredits()
      updateWishlist()
      try {
        const saved = localStorage.getItem(getUserScopedKey('career_ai_notifications'))
        setNotifications(saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS)
      } catch {
        setNotifications(INITIAL_NOTIFICATIONS)
      }
    }
    window.addEventListener('career_credits_updated', updateCredits)
    window.addEventListener('career_wishlist_updated', updateWishlist)
    window.addEventListener('career_auth_changed', handleAuthChange)
    return () => {
      window.removeEventListener('career_credits_updated', updateCredits)
      window.removeEventListener('career_wishlist_updated', updateWishlist)
      window.removeEventListener('career_auth_changed', handleAuthChange)
    }
  }, [])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  const notifRef = useRef(null)
  const helpRef = useRef(null)
  const searchRef = useRef(null)
  const creditsRef = useRef(null)

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(getUserScopedKey('career_ai_notifications'), JSON.stringify(notifications))
    } catch (e) {
      console.error(e)
    }
  }, [notifications])

  // Click outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setShowHelpMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
      if (creditsRef.current && !creditsRef.current.contains(e.target)) {
        setShowCreditsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    )
  }

  const handleClearNotification = (e, id) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // Filtered tools for search bar
  const filteredSearchTools = QUICK_SEARCH_TOOLS.filter((t) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
  })

  // Dynamic Current Page Title & Icon
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', icon: LayoutDashboard }
      case '/resume-creator':
        return { title: 'Resume Creator', icon: FilePlus }
      case '/interview-report':
        return { title: 'Interview Report Generator', icon: FileText }
      case '/plan-tracker':
        return { title: 'Plan Tracker', icon: Compass }
      case '/ats-calculator':
        return { title: 'ATS Calculator', icon: BarChart2 }
      case '/ats-enhancer':
        return { title: 'ATS Enhancer', icon: Wand2 }
      case '/profile':
        return { title: 'My Profile', icon: User }
      case '/wishlist':
        return { title: 'Wishlist', icon: Bookmark }
      case '/mock-interview':
        return { title: 'Mock AI Interview', icon: Bot }
      default:
        return { title: 'CareerAI Workspace', icon: Sparkles }
    }
  }

  const pageInfo = getPageInfo()
  const PageIcon = pageInfo.icon

  return (
    <header className="topbar">
      {/* ---- Left: Current Page Breadcrumb / Title ---- */}
      <div className="topbar__left">
        <div className="topbar__page-badge">
          <div className="topbar__icon-container">
            <PageIcon size={14} />
          </div>
          <span className="topbar__badge-title">{pageInfo.title}</span>
        </div>
      </div>

      {/* ---- Center: Quick Search Bar ---- */}
      <div className="topbar__center" ref={searchRef}>
        <div className="topbar__search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tools, resumes, or interview questions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchDropdown(true)
            }}
            onFocus={() => setShowSearchDropdown(true)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="search-kbd">Ctrl K</kbd>
          )}
        </div>

        {/* Live Search Quick Nav Dropdown */}
        {showSearchDropdown && (
          <div className="topbar__search-dropdown">
            <div className="search-dropdown-header">
              <span>Quick Navigation</span>
            </div>
            {filteredSearchTools.length === 0 ? (
              <div className="search-no-results">No tools match "{searchQuery}"</div>
            ) : (
              <div className="search-results-list">
                {filteredSearchTools.map((tool) => {
                  const ToolIcon = tool.icon
                  return (
                    <button
                      key={tool.to}
                      type="button"
                      className="search-result-item"
                      onClick={() => {
                        navigate(tool.to)
                        setShowSearchDropdown(false)
                        setSearchQuery('')
                      }}
                    >
                      <div className="result-icon-box">
                        <ToolIcon size={15} />
                      </div>
                      <div className="result-text">
                        <span className="result-label">{tool.label}</span>
                        <span className="result-desc">{tool.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Right: Controls (Theme Toggle, Help, Notifications, Credits) ---- */}
      <div className="topbar__right">
        {/* Dark / Light Theme Switcher */}
        <div className="topbar__action-item">
          <button
            type="button"
            className={`topbar__icon-btn topbar__theme-btn ${isDark ? 'dark-active' : ''}`}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? (
              <Sun size={18} className="theme-toggle-icon sun-icon" />
            ) : (
              <Moon size={18} className="theme-toggle-icon moon-icon" />
            )}
          </button>
        </div>

        {/* Help & Support Button */}
        <div className="topbar__action-item" ref={helpRef}>
          <button
            type="button"
            className={`topbar__icon-btn ${showHelpMenu ? 'active' : ''}`}
            onClick={() => {
              setShowHelpMenu((p) => !p)
              setShowNotifications(false)
              setShowCreditsMenu(false)
            }}
            title="Help & Resources"
          >
            <HelpCircle size={18} />
          </button>

          {showHelpMenu && (
            <div className="topbar__dropdown help-dropdown">
              <div className="dropdown-header">
                <h3>Help & Quick Guides</h3>
              </div>
              <div className="help-items">
                <div className="help-item">
                  <strong>Resume Creator</strong>
                  <p>Choose from 22 ATS-friendly Google fonts and standard column layouts.</p>
                </div>
                <div className="help-item">
                  <strong>Interview Report</strong>
                  <p>Paste a job description and upload your resume for tailored Q&A.</p>
                </div>
                <div className="help-item">
                  <strong>ATS Calculator</strong>
                  <p>Analyze keywords and match score before submitting job applications.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Center */}
        <div className="topbar__action-item" ref={notifRef}>
          <button
            type="button"
            className={`topbar__icon-btn notif-btn ${showNotifications ? 'active' : ''}`}
            onClick={() => {
              setShowNotifications((p) => !p)
              setShowHelpMenu(false)
              setShowCreditsMenu(false)
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="topbar__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="topbar__dropdown notif-dropdown">
              <div className="dropdown-header">
                <div className="header-title-row">
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="notif-count-pill">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Check size={24} className="empty-icon" />
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notif-item ${notif.unread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif.id)}
                    >
                      <div className={`notif-type-icon ${notif.type}`}>
                        {notif.type === 'resume' && <FilePlus size={14} />}
                        {notif.type === 'interview' && <FileText size={14} />}
                        {notif.type === 'system' && <Sparkles size={14} />}
                      </div>

                      <div className="notif-content">
                        <div className="notif-title-row">
                          <span className="notif-title">{notif.title}</span>
                          <span className="notif-time">{notif.time}</span>
                        </div>
                        <p className="notif-desc">{notif.description}</p>
                      </div>

                      <button
                        type="button"
                        className="notif-remove-btn"
                        onClick={(e) => handleClearNotification(e, notif.id)}
                        title="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Credits Balance Pill & Dropdown (Replaces profile icon on far right) */}
        <div className="topbar__action-item topbar__credits-item" ref={creditsRef}>
          <button
            type="button"
            className={`topbar__credits-pill ${showCreditsMenu ? 'active' : ''}`}
            onClick={() => {
              setShowCreditsMenu((p) => !p)
              setShowNotifications(false)
              setShowHelpMenu(false)
            }}
            title="Career AI Credits Balance"
          >
            <div className="credits-coin-badge">
              <Coins size={14} className="coin-icon" />
            </div>
            <span className="credits-amount">{userCredits}</span>
            <span className="credits-unit">Credits</span>
          </button>

          {showCreditsMenu && (
            <div className="topbar__dropdown credits-dropdown">
              <div className="credits-dropdown-header">
                <div className="credits-balance-hero">
                  <div className="coin-icon-circle">
                    <Coins size={22} />
                  </div>
                  <div className="hero-text">
                    <span className="hero-label">Available Balance</span>
                    <span className="hero-number">{userCredits} Credits</span>
                  </div>
                </div>
              </div>

              {/* Recent History */}
              <div className="credits-history-box">
                <span className="history-section-title">Recent Activity</span>
                <div className="history-entries">
                  {creditHistory.length === 0 ? (
                    <p className="no-history-text">No transactions yet.</p>
                  ) : (
                    creditHistory.slice(0, 4).map((item) => (
                      <div className="history-entry" key={item.id}>
                        <div className="entry-left">
                          <span className="entry-reason">{item.reason}</span>
                          <span className="entry-time">
                            {(() => {
                              if (!item.timestamp) return 'Recent'
                              const d = new Date(item.timestamp)
                              return isNaN(d.getTime())
                                ? 'Recent'
                                : d.toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                            })()}
                          </span>
                        </div>
                        <span className={`entry-badge ${item.type}`}>
                          {item.type === 'earned' ? `+${item.amount}` : `-${item.amount}`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Link */}
              <div className="credits-dropdown-action">
                <button
                  type="button"
                  className="btn-earn-more"
                  onClick={() => {
                    navigate('/plan-tracker')
                    setShowCreditsMenu(false)
                  }}
                >
                  <Sparkles size={13} />
                  <span>Earn +15 Credits in Plan Tracker</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopBar

