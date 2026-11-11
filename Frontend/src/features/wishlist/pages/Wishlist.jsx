import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  FileText,
  FilePlus,
  ArrowRight,
  Trash2,
  Heart,
  Search,
  Calendar,
  Compass,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowLeft,
  Bot
} from 'lucide-react'
import {
  getWishlistReports,
  getWishlistResumes,
  getWishlistMockReports,
  syncWishlistFromDb,
  toggleReportWishlist,
  toggleResumeWishlist,
  toggleMockReportWishlist,
  removeWishlistReport,
  removeWishlistResume,
  removeWishlistMockReport
} from '../services/wishlist.storage'
import { isPlanTracked } from '../../planTracker/services/planTracker.storage'
import {
  ACTIVE_RESUME_ID_KEY,
  CURRENT_RESUME_DATA_KEY
} from '../../resume/services/resume.storage'
import { getUserScopedKey } from '../../../utils/userScope'
import '../styles/wishlist.scss'

const formatDate = (isoString) => {
  if (!isoString) return 'Recent'
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'Recent'
  }
}

const Wishlist = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [resumes, setResumes] = useState([])
  const [mockReports, setMockReports] = useState([])
  const [activeTab, setActiveTab] = useState('all') // 'all', 'reports', 'resumes', 'mock'
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  const loadWishlistData = () => {
    setReports(getWishlistReports())
    setResumes(getWishlistResumes())
    setMockReports(getWishlistMockReports())
  }

  useEffect(() => {
    loadWishlistData()
    syncWishlistFromDb().then(() => loadWishlistData())

    const handleUpdate = () => {
      loadWishlistData()
    }

    window.addEventListener('career_wishlist_updated', handleUpdate)
    return () => {
      window.removeEventListener('career_wishlist_updated', handleUpdate)
    }
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2800)
  }

  const handleRemoveReport = (reportId, title, e) => {
    e.stopPropagation()
    const updated = removeWishlistReport(reportId)
    setReports(updated)
    showToast(`Removed "${title || 'Report'}" from wishlist.`)
  }

  const handleRemoveResume = (resumeId, title, e) => {
    e.stopPropagation()
    const updated = removeWishlistResume(resumeId)
    setResumes(updated)
    showToast(`Removed "${title || 'Resume'}" from wishlist.`)
  }

  const handleRemoveMockReport = (mockId, title, e) => {
    e.stopPropagation()
    const updated = removeWishlistMockReport(mockId)
    setMockReports(updated)
    showToast(`Removed "${title || 'Mock Report'}" from wishlist.`)
  }

  const handleEditResume = (resume) => {
    try {
      localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), resume.id)
      if (resume.data) {
        localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(resume.data))
      }
    } catch (e) {
      console.warn(e)
    }
    navigate(`/resume-creator?id=${resume.id}`)
  }

  // Safe lowercase string matcher that never throws on numbers, null, or objects
  const safeIncludes = (val, q) => {
    if (val === null || val === undefined) return false
    return String(val).toLowerCase().includes(q)
  }

  // Filter based on search query
  const isSearching = Boolean(searchQuery.trim())

  const filteredReports = reports.filter((r) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const titleMatch = safeIncludes(r.title, q)
    const roleMatch = safeIncludes(r.role, q) || safeIncludes(r.targetRole, q)
    return titleMatch || roleMatch
  })

  const filteredResumes = resumes.filter((r) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const titleMatch = safeIncludes(r.title, q)
    const nameMatch = safeIncludes(r.data?.personal?.fullName, q)
    const profMatch = safeIncludes(r.data?.personal?.profession, q)
    return titleMatch || nameMatch || profMatch
  })

  const filteredMockReports = mockReports.filter((m) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const roleMatch = safeIncludes(m.role, q)
    const typeMatch = safeIncludes(m.interviewType, q)
    const levelMatch = safeIncludes(m.level, q)
    return roleMatch || typeMatch || levelMatch
  })

  const totalWishlistCount = reports.length + resumes.length + mockReports.length
  const totalFilteredCount = filteredReports.length + filteredResumes.length + filteredMockReports.length

  return (
    <main className="wishlist-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="wishlist-toast">
          <Bookmark size={15} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="wishlist-header">
        <div className="header-left">
          <h1 className="header-title">My Wishlist & Bookmarks</h1>
          <p className="header-subtitle">
            Quickly view and manage all your saved interview preparation roadmaps, ATS resumes, and mock interviews.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-back-dashboard"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="wishlist-controls-bar">
        <div className="wishlist-tabs">
          <button
            type="button"
            className={`tab-btn${activeTab === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={14} />
            <span>All Saved</span>
          </button>

          <button
            type="button"
            className={`tab-btn${activeTab === 'reports' ? ' active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={14} />
            <span>Interview Reports</span>
          </button>

          <button
            type="button"
            className={`tab-btn${activeTab === 'resumes' ? ' active' : ''}`}
            onClick={() => setActiveTab('resumes')}
          >
            <FilePlus size={14} />
            <span>Created Resumes</span>
          </button>

          <button
            type="button"
            className={`tab-btn${activeTab === 'mock' ? ' active' : ''}`}
            onClick={() => setActiveTab('mock')}
          >
            <Bot size={14} />
            <span>Mock Interviews</span>
          </button>
        </div>

        <div className="wishlist-search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Filter saved reports, resumes, or mock interviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {totalWishlistCount === 0 ? (
        <div className="empty-wishlist-card">
          <div className="empty-icon-wrap">
            <Heart size={36} className="empty-heart-icon" />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>
            You haven't bookmarked any interview reports or resumes yet.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-empty-primary"
              onClick={() => navigate('/dashboard')}
            >
              <span>Explore Dashboard</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="btn btn-empty-secondary"
              onClick={() => navigate('/interview-report')}
            >
              <FileText size={15} />
              <span>Generate New Report</span>
            </button>
          </div>
        </div>
      ) : isSearching && totalFilteredCount === 0 ? (
        <div className="wishlist-empty-state" style={{ minHeight: '260px', padding: '40px 20px' }}>
          <div className="empty-icon-wrap" style={{ width: '56px', height: '56px' }}>
            <Search size={28} />
          </div>
          <h3>No saved items match "{searchQuery}"</h3>
          <p>Try searching for a different keyword or role.</p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSearchQuery('')}
            >
              Clear Filter
            </button>
          </div>
        </div>
      ) : (
        <div className="wishlist-sections-container">
          {/* Section 1: Saved Interview Reports */}
          {(isSearching
            ? (activeTab === 'all' || activeTab === 'reports') && filteredReports.length > 0
            : (activeTab === 'all' || activeTab === 'reports')
          ) && (
            <section className="wishlist-section">
              <div className="section-title-bar">
                <div className="section-title-left">
                  <div className="dot blue" />
                  <h2>Wishlisted Interview Reports</h2>
                  <span className="badge">{filteredReports.length}</span>
                </div>
              </div>

              {filteredReports.length === 0 ? (
                <div className="section-empty-hint">
                  <p>No interview reports match your filter in the wishlist.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredReports.map((report) => {
                    const reportId = report._id || report.id
                    const isTracked = report.isTracked || isPlanTracked(reportId)
                    const techCount = report.technicalQuestions?.length || 0
                    const behCount = report.behavioralQuestions?.length || 0
                    const daysCount = report.preparationPlan?.length || 0

                    const isMock = reportId?.startsWith('mock-')
                    const viewUrl = isMock ? `/mock-interview?reportId=${reportId}` : `/interview/${reportId}`

                    return (
                      <div
                        className="asset-card report-asset-card compact"
                        key={reportId}
                        onClick={() => navigate(viewUrl)}
                        title="Click to view detailed report"
                      >
                        <div className="asset-card__main-info">
                          <div className="asset-card__icon-box blue">
                            <FileText size={20} />
                          </div>
                          <div className="asset-card__title-meta">
                            <div className="asset-card__title-row">
                              <h3 className="asset-title" title={report.title}>
                                {report.title || 'Technical Interview Report'}
                              </h3>
                              <span className="asset-score-pill">
                                {report.matchscore ?? report.matchScore ?? 85}% Fit
                              </span>
                            </div>
                            <div className="asset-card__meta-line">
                              <span className="meta-item">
                                <Calendar size={13} />
                                {formatDate(report.createdAt)}
                              </span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{daysCount}d Roadmap</span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{techCount + behCount} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="asset-card__footer">
                          {isTracked ? (
                            <span className="status-indicator-pill tracked">
                              <CheckCircle2 size={14} />
                              <span>Plan Tracked</span>
                            </span>
                          ) : (
                            <span className="status-indicator-pill available">
                              <Compass size={14} />
                              <span>Untracked</span>
                            </span>
                          )}

                          <div className="footer-actions-wrap">
                            <button
                              type="button"
                              className="wishlist-toggle-btn active"
                              title="Remove from wishlist"
                              onClick={(e) => handleRemoveReport(reportId, report.title, e)}
                            >
                              <Bookmark size={15} fill="#2563eb" />
                            </button>

                            <button
                              type="button"
                              className="btn-card-action"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(viewUrl)
                              }}
                            >
                              <span>View Report</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section 2: Saved Resumes */}
          {(isSearching
            ? (activeTab === 'all' || activeTab === 'resumes') && filteredResumes.length > 0
            : (activeTab === 'all' || activeTab === 'resumes')
          ) && (
            <section className="wishlist-section">
              <div className="section-title-bar">
                <div className="section-title-left">
                  <div className="dot navy" />
                  <h2>Wishlisted Resumes</h2>
                  <span className="badge">{filteredResumes.length}</span>
                </div>
              </div>

              {filteredResumes.length === 0 ? (
                <div className="section-empty-hint">
                  <p>No resumes match your filter in the wishlist.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredResumes.map((resume) => {
                    const personal = resume.data?.personal || {}
                    const expCount = resume.data?.experience?.length || 0
                    const eduCount = resume.data?.education?.length || 0

                    return (
                      <div
                        className="asset-card resume-asset-card compact"
                        key={resume.id}
                        onClick={() => handleEditResume(resume)}
                        title="Click to edit resume"
                      >
                        <div className="asset-card__main-info">
                          <div className="asset-card__icon-box navy">
                            <FilePlus size={20} />
                          </div>
                          <div className="asset-card__title-meta">
                            <div className="asset-card__title-row">
                              <h3 className="asset-title" title={resume.title}>
                                {resume.title || personal.fullName || 'ATS Resume'}
                              </h3>
                              <span className="layout-badge">
                                {resume.layout ? `${resume.layout.replace('-', ' ')}` : 'Single Col'}
                              </span>
                            </div>
                            <div className="asset-card__meta-line">
                              <span className="meta-item bold-text">
                                {personal.profession || 'Software Professional'}
                              </span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{expCount} Roles</span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{eduCount} Degrees</span>
                            </div>
                          </div>
                        </div>

                        <div className="asset-card__footer">
                          <span className="asset-card__footer-meta">
                            <Calendar size={13} />
                            <span>{formatDate(resume.updatedAt)}</span>
                            <span className="meta-sep">·</span>
                            <span className="font-hint">Font: {resume.font || 'Inter'}</span>
                          </span>

                          <div className="footer-actions-wrap">
                            <button
                              type="button"
                              className="wishlist-toggle-btn active"
                              title="Remove from wishlist"
                              onClick={(e) => handleRemoveResume(resume.id, resume.title, e)}
                            >
                              <Bookmark size={15} fill="#2563eb" />
                            </button>

                            <button
                              type="button"
                              className="btn-card-action primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditResume(resume)
                              }}
                            >
                              <Edit3 size={14} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section 3: Wishlisted Mock AI Interviews */}
          {(isSearching
            ? (activeTab === 'all' || activeTab === 'mock') && filteredMockReports.length > 0
            : (activeTab === 'all' || activeTab === 'mock')
          ) && (
            <section className="wishlist-section">
              <div className="section-title-bar">
                <div className="section-title-left">
                  <div className="dot mint" style={{ backgroundColor: '#10b981' }} />
                  <h2>Wishlisted Mock Interviews</h2>
                  <span className="badge">{filteredMockReports.length}</span>
                </div>
              </div>

              {filteredMockReports.length === 0 ? (
                <div className="section-empty-hint">
                  <p>No mock interview reports match your filter in the wishlist.</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredMockReports.map((mock) => {
                    const score = Number(mock.overallScore || 0).toFixed(1)
                    return (
                      <div
                        className="asset-card mock-asset-card"
                        key={mock.id}
                        onClick={() => navigate('/mock-interview')}
                        title="Click to view mock interview"
                      >
                        <div className="asset-card__main-info">
                          <div className="asset-card__icon-box mint" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <Bot size={22} />
                          </div>
                          <div className="asset-card__title-meta">
                            <div className="asset-card__title-row">
                              <h3 className="asset-title" title={mock.role}>
                                {mock.role || 'Interview Practice'}
                              </h3>
                              <span className="match-pill green" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.14)' }}>
                                {score}/10 Score
                              </span>
                            </div>
                            <div className="asset-card__meta-line">
                              <span className="meta-item">
                                <Calendar size={13} />
                                {formatDate(mock.createdAt)}
                              </span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{mock.level || 'Intermediate'}</span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{mock.qaCount || 5} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="asset-card__footer">
                          <span className="status-indicator-pill tracked" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                            <CheckCircle2 size={14} />
                            <span>Completed Session</span>
                          </span>

                          <div className="footer-actions-wrap">
                            <button
                              type="button"
                              className="wishlist-toggle-btn active"
                              title="Remove from wishlist"
                              onClick={(e) => handleRemoveMockReport(mock.id, mock.role, e)}
                            >
                              <Bookmark size={15} fill="#2563eb" />
                            </button>

                            <button
                              type="button"
                              className="btn-card-action mint"
                              style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate('/mock-interview')
                              }}
                            >
                              <span>View Session</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  )
}

export default Wishlist

