import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  FileText,
  FilePlus,
  Compass,
  ArrowRight,
  ExternalLink,
  Plus,
  Search,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  CheckCircle2,
  Award,
  Layers,
  ChevronRight,
  Bookmark,
  Download,
  FileEdit,
  Bot,
  X,
  RotateCcw
} from 'lucide-react'
import './dashboard.scss'
import { getAllInterviewReports } from '../../interview/services/report.api'
import {
  downloadResumeAsPdf,
  downloadResumeAsDocx
} from '../../resume/services/resumeExport'
import {
  getSavedResumes,
  syncResumesFromDb,
  deleteResume,
  createNewResume,
  ACTIVE_RESUME_ID_KEY,
  CURRENT_RESUME_DATA_KEY
} from '../../resume/services/resume.storage'
import { isPlanTracked, getTrackedPlanDetails } from '../../planTracker/services/planTracker.storage'
import {
  isReportWishlisted,
  isResumeWishlisted,
  isMockReportWishlisted,
  toggleReportWishlist,
  toggleResumeWishlist,
  toggleMockReportWishlist,
  getWishlistCounts
} from '../../wishlist/services/wishlist.storage'
import {
  getSavedMockReports,
  syncMockReportsFromDb,
  deleteMockReport
} from '../../mockInterview/services/mockInterview.storage'
import { syncCreditsFromDb } from '../../credits/services/credits.storage'
import { getUserScopedKey } from '../../../utils/userScope'

const EMPTY_RESUME_TEMPLATE = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    location: '',
    profession: '',
    linkedin: '',
    website: ''
  },
  summary: '',
  experience: [
    {
      id: 1,
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: ''
    }
  ],
  education: [
    {
      id: 1,
      institution: '',
      degree: '',
      field: '',
      date: '',
      gpa: ''
    }
  ],
  projects: [
    {
      id: 1,
      name: '',
      type: '',
      description: ''
    }
  ],
  skills: []
}

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

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [reports, setReports] = useState([])
  const [resumes, setResumes] = useState(() => getSavedResumes())
  const [mockReports, setMockReports] = useState(() => getSavedMockReports())
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'reports', 'resumes', 'mock'
  const [searchQuery, setSearchQuery] = useState('')
  const [wishlistTick, setWishlistTick] = useState(0)
  const [activeDownloadId, setActiveDownloadId] = useState(null)

  useEffect(() => {
    const handleCloseDownload = () => setActiveDownloadId(null)
    if (activeDownloadId) {
      document.addEventListener('click', handleCloseDownload)
      return () => document.removeEventListener('click', handleCloseDownload)
    }
  }, [activeDownloadId])

  useEffect(() => {
    const handleWishlistChange = () => {
      setWishlistTick((t) => t + 1)
    }
    const handleResumeChange = () => {
      setResumes(getSavedResumes())
    }
    const handleMockChange = () => {
      setMockReports(getSavedMockReports())
    }
    const handleAuthChange = () => {
      setResumes(getSavedResumes())
      setMockReports(getSavedMockReports())
    }
    window.addEventListener('career_wishlist_updated', handleWishlistChange)
    window.addEventListener('career_resume_saved', handleResumeChange)
    window.addEventListener('career_mock_report_saved', handleMockChange)
    window.addEventListener('career_auth_changed', handleAuthChange)
    return () => {
      window.removeEventListener('career_wishlist_updated', handleWishlistChange)
      window.removeEventListener('career_resume_saved', handleResumeChange)
      window.removeEventListener('career_mock_report_saved', handleMockChange)
      window.removeEventListener('career_auth_changed', handleAuthChange)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)

      // 1. Initial cached state
      setResumes(getSavedResumes())
      setMockReports(getSavedMockReports())

      // 2. Fetch fresh user records directly from MongoDB
      try {
        const [resumesRes, mocksRes, reportsRes] = await Promise.allSettled([
          syncResumesFromDb(),
          syncMockReportsFromDb(),
          getAllInterviewReports(),
          syncCreditsFromDb()
        ])

        if (isMounted) {
          if (resumesRes.status === 'fulfilled' && Array.isArray(resumesRes.value)) {
            setResumes(resumesRes.value)
          }
          if (mocksRes.status === 'fulfilled' && Array.isArray(mocksRes.value)) {
            setMockReports(mocksRes.value)
          }
          if (reportsRes.status === 'fulfilled' && reportsRes.value?.interviewReports) {
            setReports(reportsRes.value.interviewReports)
          } else if (reportsRes.status === 'fulfilled') {
            setReports([])
          }
        }
      } catch (err) {
        console.warn('Could not load records from MongoDB server:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [user?.id, user?.email])

  // KPI Calculations
  const totalReports = reports.length
  const totalResumes = resumes.length
  const trackedCount = reports.filter((r) => r.isTracked || isPlanTracked(r._id)).length
  const avgMatchScore =
    totalReports > 0
      ? Math.round(
        reports.reduce((acc, r) => acc + (r.matchscore ?? r.matchScore ?? 82), 0) / totalReports
      )
      : 85

  // Handlers
  const handleEditResume = (resume) => {
    try {
      localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), resume.id)
      localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(resume.data))
    } catch (e) {
      console.warn(e)
    }
    navigate(`/resume-creator?id=${resume.id}`)
  }

  const handleCreateResume = () => {
    const draftResume = createNewResume(EMPTY_RESUME_TEMPLATE, '', false)
    navigate(`/resume-creator?new=true&id=${draftResume.id}`)
  }

  const handleDeleteResume = (id, e) => {
    e.stopPropagation()
    const updated = deleteResume(id)
    setResumes(updated)
  }

  const handleDeleteMockReport = (id, e) => {
    e.stopPropagation()
    const updated = deleteMockReport(id)
    setMockReports(updated)
  }

  // Safe lowercase string matcher that never throws on numbers, null, or objects
  const safeIncludes = (val, q) => {
    if (val === null || val === undefined) return false
    return String(val).toLowerCase().includes(q)
  }

  // Filter lists based on search
  const isSearching = Boolean(searchQuery.trim())

  const filteredReports = reports.filter((r) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const titleMatch = safeIncludes(r.title, q)
    const roleMatch = safeIncludes(r.role, q) || safeIncludes(r.targetRole, q)
    const jobDescMatch = safeIncludes(r.jobDescription, q)
    const skillMatch =
      Array.isArray(r.skillGaps) &&
      r.skillGaps.some((s) =>
        typeof s === 'string'
          ? safeIncludes(s, q)
          : safeIncludes(s?.skill, q) || safeIncludes(s?.name, q)
      )
    const planMatch =
      Array.isArray(r.preparationPlan) &&
      r.preparationPlan.some((p) =>
        safeIncludes(p?.topic, q) ||
        safeIncludes(p?.focus, q) ||
        safeIncludes(p?.day, q) ||
        (Array.isArray(p?.tasks) && p.tasks.some((t) => safeIncludes(t, q)))
      )
    return titleMatch || roleMatch || jobDescMatch || skillMatch || planMatch
  })

  const filteredResumes = resumes.filter((r) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const titleMatch = safeIncludes(r.title, q)
    const nameMatch = safeIncludes(r.data?.personal?.fullName, q)
    const profMatch = safeIncludes(r.data?.personal?.profession, q)
    const emailMatch = safeIncludes(r.data?.personal?.email, q)
    const skillsMatch =
      Array.isArray(r.data?.skills) &&
      r.data.skills.some((s) =>
        typeof s === 'string'
          ? safeIncludes(s, q)
          : safeIncludes(s?.name, q) || safeIncludes(s?.skill, q)
      )
    return titleMatch || nameMatch || profMatch || emailMatch || skillsMatch
  })

  const filteredMockReports = mockReports.filter((m) => {
    if (!isSearching) return true
    const q = searchQuery.toLowerCase().trim()
    const roleMatch = safeIncludes(m.role, q)
    const titleMatch = safeIncludes(m.title, q)
    const typeMatch = safeIncludes(m.interviewType, q)
    const verdictMatch = safeIncludes(m.performanceVerdict, q)
    return roleMatch || titleMatch || typeMatch || verdictMatch
  })

  const totalMatches = filteredReports.length + filteredResumes.length + filteredMockReports.length

  return (
    <main className="dashboard">
      {/* ---- Welcome Banner & Quick Action Buttons ---- */}
      <div className="dashboard-hero">
        <div className="hero-greeting">

          <h1 className="hero-username">Welcome back, {user?.username ?? 'there'} 👋</h1>
          <p className="hero-subtitle">
            Manage all your tailored interview preparation reports and created ATS resumes.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-hero btn-hero--mint"
            onClick={() => navigate('/mock-interview')}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <Bot size={16} />
            <span>Mock AI Interview</span>
          </button>

          <button
            type="button"
            className="btn btn-hero btn-hero--primary"
            onClick={() => navigate('/interview-report')}
          >
            <Plus size={16} />
            <span>New Interview Report</span>
          </button>

          <button
            type="button"
            className="btn btn-hero btn-hero--secondary"
            onClick={handleCreateResume}
          >
            <Plus size={16} />
            <span>Create ATS Resume</span>
          </button>
        </div>
      </div>

      {/* ---- Top KPI Stat Cards (Counts) ---- */}
      <div className="dashboard-stats-grid">
        <div className="stat-box blue">
          <div className="stat-icon-wrapper">
            <FileText size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-count">{totalReports}</span>
            <span className="stat-title">Generated Reports</span>
            <span className="stat-caption">Tailored interview roadmaps</span>
          </div>
        </div>

        <div className="stat-box navy">
          <div className="stat-icon-wrapper">
            <FilePlus size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-count">{totalResumes}</span>
            <span className="stat-title">Resumes Created</span>
            <span className="stat-caption">ATS-optimized resumes</span>
          </div>
        </div>

        <div className="stat-box emerald">
          <div className="stat-icon-wrapper">
            <Compass size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-count">{trackedCount}</span>
            <span className="stat-title">Tracked Plans</span>
            <span className="stat-caption">Active prep roadmaps</span>
          </div>
        </div>

        <div
          className="stat-box mint"
          onClick={() => {
            setActiveTab('mock')
            const mockSection = document.getElementById('mock-interview-reports-section')
            if (mockSection) {
              mockSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          style={{ cursor: 'pointer' }}
          title="View AI Mock Interview Reports"
        >
          <div className="stat-icon-wrapper">
            <Bot size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-count">{mockReports.length}</span>
            <span className="stat-title">AI Mock Interviews</span>
            <span className="stat-caption">Practice sessions completed &rarr;</span>
          </div>
        </div>
      </div>

      {/* ---- Filter Tabs & Search Bar ---- */}
      <div className="dashboard-toolbar">
        <div className="toolbar-tabs">
          <button
            type="button"
            className={`tab-btn${activeTab === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Items</span>
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

        <div className="toolbar-search">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search reports, resumes, or mock interviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Content Sections: Generated Reports & Created Resumes ---- */}
      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <p>Loading your reports and resumes...</p>
        </div>
      ) : (
        <div className="dashboard-content-flow">
          {/* Case 1: When searching and ZERO items match across all categories */}
          {isSearching && totalMatches === 0 ? (
            <div className="empty-content-card search-empty-card">
              <div className="empty-icon-box">
                <Search size={32} />
              </div>
              <h3>No items found for "{searchQuery}"</h3>
              <p>
                We couldn't find any interview reports, created resumes, or mock interviews matching your search.
              </p>
              <div className="search-empty-actions">
                <button
                  type="button"
                  className="btn btn-empty-cta"
                  onClick={() => setSearchQuery('')}
                >
                  <RotateCcw size={15} />
                  <span>Clear Search</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* If on a specific tab with search active and 0 matches in this tab */}
              {isSearching && activeTab === 'reports' && filteredReports.length === 0 && (
                <div className="empty-content-card search-empty-card">
                  <div className="empty-icon-box">
                    <Search size={32} />
                  </div>
                  <h3>No interview reports found for "{searchQuery}"</h3>
                  <p>
                    {totalMatches > 0
                      ? `Found ${totalMatches} matching item${totalMatches > 1 ? 's' : ''} in other categories.`
                      : 'No interview reports matched your search query.'}
                  </p>
                  <div className="search-empty-actions">
                    {totalMatches > 0 && (
                      <button
                        type="button"
                        className="btn btn-empty-cta"
                        onClick={() => setActiveTab('all')}
                      >
                        <span>View All Results ({totalMatches})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-empty-cta outline"
                      onClick={() => setSearchQuery('')}
                    >
                      <RotateCcw size={15} />
                      <span>Clear Search</span>
                    </button>
                  </div>
                </div>
              )}

              {isSearching && activeTab === 'resumes' && filteredResumes.length === 0 && (
                <div className="empty-content-card search-empty-card">
                  <div className="empty-icon-box">
                    <Search size={32} />
                  </div>
                  <h3>No resumes found for "{searchQuery}"</h3>
                  <p>
                    {totalMatches > 0
                      ? `Found ${totalMatches} matching item${totalMatches > 1 ? 's' : ''} in other categories.`
                      : 'No created resumes matched your search query.'}
                  </p>
                  <div className="search-empty-actions">
                    {totalMatches > 0 && (
                      <button
                        type="button"
                        className="btn btn-empty-cta"
                        onClick={() => setActiveTab('all')}
                      >
                        <span>View All Results ({totalMatches})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-empty-cta outline"
                      onClick={() => setSearchQuery('')}
                    >
                      <RotateCcw size={15} />
                      <span>Clear Search</span>
                    </button>
                  </div>
                </div>
              )}

              {isSearching && activeTab === 'mock' && filteredMockReports.length === 0 && (
                <div className="empty-content-card search-empty-card">
                  <div className="empty-icon-box mint">
                    <Search size={32} />
                  </div>
                  <h3>No mock interview reports found for "{searchQuery}"</h3>
                  <p>
                    {totalMatches > 0
                      ? `Found ${totalMatches} matching item${totalMatches > 1 ? 's' : ''} in other categories.`
                      : 'No mock interview reports matched your search query.'}
                  </p>
                  <div className="search-empty-actions">
                    {totalMatches > 0 && (
                      <button
                        type="button"
                        className="btn btn-empty-cta mint"
                        onClick={() => setActiveTab('all')}
                      >
                        <span>View All Results ({totalMatches})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-empty-cta outline"
                      onClick={() => setSearchQuery('')}
                    >
                      <RotateCcw size={15} />
                      <span>Clear Search</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 1: Generated Interview Reports */}
              {(isSearching
                ? (activeTab === 'all' || activeTab === 'reports') && filteredReports.length > 0
                : (activeTab === 'all' || activeTab === 'reports')
              ) && (
            <section className="dashboard-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <div className="section-icon-dot blue" />
                  <h2 className="section-title">Generated Interview Reports</h2>
                  <span className="section-count-badge">{filteredReports.length}</span>
                </div>

                <button
                  type="button"
                  className="section-add-btn"
                  onClick={() => navigate('/interview-report')}
                >
                  <Plus size={14} />
                  <span>Generate Report</span>
                </button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="empty-content-card">
                  <div className="empty-icon-box">
                    <FileText size={32} />
                  </div>
                  <h3>No Interview Reports Generated Yet</h3>
                  <p>
                    Paste a job description or upload your resume to generate a tailored interview report
                    complete with technical questions, behavioral Q&A, and study roadmap.
                  </p>
                  <button
                    type="button"
                    className="btn btn-empty-cta"
                    onClick={() => navigate('/interview-report')}
                  >
                    <Plus size={15} />
                    <span>Generate Your First Report</span>
                  </button>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredReports.map((report) => {
                    const isTracked = report.isTracked || isPlanTracked(report._id)
                    const techCount = report.technicalQuestions?.length || 0
                    const behCount = report.behavioralQuestions?.length || 0
                    const daysCount = report.preparationPlan?.length || 0

                    return (
                      <div
                        className="asset-card report-asset-card compact"
                        key={report._id}
                        onClick={() => navigate(`/interview/${report._id}`)}
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

                          <div className="card-btn-grp">
                            <button
                              type="button"
                              className={`icon-wishlist-btn${isReportWishlisted(report._id) ? ' active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleReportWishlist(report)
                              }}
                              title={isReportWishlisted(report._id) ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                              <Bookmark size={15} fill={isReportWishlisted(report._id) ? '#2563eb' : 'none'} />
                            </button>

                            <button
                              type="button"
                              className="btn-card-action"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/interview/${report._id}`)
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

          {/* Section 2: Created Resumes */}
          {(isSearching
            ? (activeTab === 'all' || activeTab === 'resumes') && filteredResumes.length > 0
            : (activeTab === 'all' || activeTab === 'resumes')
          ) && (
            <section className="dashboard-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <div className="section-icon-dot navy" />
                  <h2 className="section-title">Created Resumes</h2>
                  <span className="section-count-badge">{filteredResumes.length}</span>
                </div>

                <button
                  type="button"
                  className="section-add-btn"
                  onClick={handleCreateResume}
                >
                  <Plus size={14} />
                  <span>Create Resume</span>
                </button>
              </div>

              {filteredResumes.length === 0 ? (
                <div className="empty-content-card">
                  <div className="empty-icon-box">
                    <FilePlus size={32} />
                  </div>
                  <h3>No Resumes Created Yet</h3>
                  <p>
                    Create a polished, ATS-optimized resume using curated templates, custom fonts,
                    and tailored industry formats.
                  </p>
                  <button
                    type="button"
                    className="btn btn-empty-cta"
                    onClick={handleCreateResume}
                  >
                    <Plus size={15} />
                    <span>Create Your First ATS Resume</span>
                  </button>
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

                          <div className="card-btn-grp">
                            {/* Quick Download Dropdown on Dashboard */}
                            <div className="card-dl-dropdown-wrap" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={`icon-dl-btn${activeDownloadId === resume.id ? ' active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveDownloadId(activeDownloadId === resume.id ? null : resume.id)
                                }}
                                title="Download resume as PDF or Word (DOCX)"
                              >
                                <Download size={14} />
                              </button>

                              {activeDownloadId === resume.id && (
                                <div className="card-dl-popover">
                                  <button
                                    type="button"
                                    className="card-dl-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveDownloadId(null)
                                      downloadResumeAsPdf(resume.data)
                                    }}
                                  >
                                    <FileText size={13} className="pdf-icon" />
                                    <span>Download PDF</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="card-dl-item"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveDownloadId(null)
                                      downloadResumeAsDocx(resume.data, { accentColor: resume.accentColor || '#2563eb' })
                                    }}
                                  >
                                    <FileEdit size={13} className="docx-icon" />
                                    <span>Download DOCX</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className={`icon-wishlist-btn${isResumeWishlisted(resume.id) ? ' active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleResumeWishlist(resume)
                              }}
                              title={isResumeWishlisted(resume.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                              <Bookmark size={15} fill={isResumeWishlisted(resume.id) ? '#2563eb' : 'none'} />
                            </button>

                            {resumes.length > 1 && (
                              <button
                                type="button"
                                className="icon-trash-btn"
                                onClick={(e) => handleDeleteResume(resume.id, e)}
                                title="Delete resume"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

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

          {/* Section 3: AI Mock Interview Reports */}
          {(isSearching
            ? (activeTab === 'all' || activeTab === 'mock') && filteredMockReports.length > 0
            : (activeTab === 'all' || activeTab === 'mock')
          ) && (
            <section className="dashboard-section" id="mock-interview-reports-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <div className="section-icon-dot mint" />
                  <h2 className="section-title">AI Mock Interview Reports</h2>
                  <span className="section-count-badge">{filteredMockReports.length}</span>
                </div>

                <button
                  type="button"
                  className="section-add-btn mint"
                  onClick={() => navigate('/mock-interview')}
                >
                  <Plus size={14} />
                  <span>Start Mock Interview</span>
                </button>
              </div>

              {filteredMockReports.length === 0 ? (
                <div className="empty-content-card">
                  <div className="empty-icon-box mint">
                    <Bot size={32} />
                  </div>
                  <h3>No Mock Interview Reports Generated Yet</h3>
                  <p>
                    Practice real-time voice or text interviews with our AI Agent to get instant scoring and actionable feedback.
                  </p>
                  <button
                    type="button"
                    className="btn btn-empty-cta mint"
                    onClick={() => navigate('/mock-interview')}
                  >
                    <Plus size={15} />
                    <span>Start Your First AI Interview</span>
                  </button>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredMockReports.map((mock) => {
                    const score = mock.overallScore ?? mock.report?.overallScore ?? 8.0
                    const questionCount =
                      mock.report?.breakdown?.length ||
                      mock.report?.questionsAndAnswers?.length ||
                      5

                    return (
                      <div
                        className="asset-card mock-asset-card compact"
                        key={mock.id}
                        onClick={() => navigate(`/mock-interview?reportId=${mock.id}`)}
                        title="Click to view mock interview analytics"
                      >
                        <div className="asset-card__main-info">
                          <div className="asset-card__icon-box mint">
                            <Bot size={20} />
                          </div>
                          <div className="asset-card__title-meta">
                            <div className="asset-card__title-row">
                              <h3 className="asset-title" title={mock.role || 'AI Mock Interview'}>
                                {mock.role || 'AI Mock Interview'}
                              </h3>
                              <span className="asset-score-pill mint-pill">
                                {score}/10 Score
                              </span>
                            </div>
                            <div className="asset-card__meta-line">
                              <span className="meta-item">
                                <Calendar size={13} />
                                {formatDate(mock.createdAt)}
                              </span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item bold-text">
                                {mock.interviewType || 'Technical Interview'}
                              </span>
                              <span className="meta-sep">·</span>
                              <span className="meta-item">{questionCount} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="asset-card__footer">
                          <span className="status-indicator-pill tracked">
                            <CheckCircle2 size={14} />
                            <span>{mock.performanceVerdict || 'Completed'}</span>
                          </span>

                          <div className="card-btn-grp">
                            <button
                              type="button"
                              className={`icon-wishlist-btn${isMockReportWishlisted(mock.id) ? ' active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleMockReportWishlist(mock)
                                setWishlistTick((t) => t + 1)
                              }}
                              title={isMockReportWishlisted(mock.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                            >
                              <Bookmark size={15} fill={isMockReportWishlisted(mock.id) ? '#2563eb' : 'none'} />
                            </button>

                            <button
                              type="button"
                              className="icon-trash-btn"
                              onClick={(e) => handleDeleteMockReport(mock.id, e)}
                              title="Delete mock report"
                            >
                              <Trash2 size={14} />
                            </button>

                            <button
                              type="button"
                              className="btn-card-action mint"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/mock-interview?reportId=${mock.id}`)
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
        </>
      )}
    </div>
  )}
    </main>
  )
}

export default Dashboard
