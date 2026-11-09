import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import "../styles/report.scss"
import {
  ChevronDown,
  MessageCircle,
  ArrowLeft,
  Compass,
  CheckCircle2,
  ArrowRight,
  Bookmark
} from 'lucide-react'
import { getInterviewReportById, toggleTrackReport } from '../services/report.api'
import {
  isPlanTracked as checkPlanTracked,
  setPlanTracked
} from '../../planTracker/services/planTracker.storage'
import {
  isReportWishlisted,
  toggleReportWishlist
} from '../../wishlist/services/wishlist.storage'

// ---- Fallback Mock Data ----
const FALLBACK_CATEGORIES = [
  { id: 'technical', label: 'Technical Questions' },
  { id: 'behavioral', label: 'Behavioral Questions' },
  { id: 'prep-plan', label: 'Preparation Plan' },
]

const FALLBACK_QUESTIONS = {
  technical: [
    {
      id: 't1',
      question: 'Explain the difference between a process and a thread.',
      intention: 'Assessing OS fundamentals.',
      answer: 'A process is an execution environment with its own memory space, while a thread is a lightweight sequence of execution within a process that shares memory and resources with other threads in the same process.',
    },
    {
      id: 't2',
      question: 'Describe the CAP theorem and its implications in distributed systems.',
      intention: 'Evaluating system design knowledge.',
      answer: 'The CAP theorem states that a distributed data store can only simultaneously guarantee at most two out of three characteristics: Consistency, Availability, and Partition Tolerance.',
    },
    {
      id: 't3',
      question: 'When would you reach for Redis over a relational database?',
      intention: 'Checking data-store trade-off awareness.',
      answer: 'When you need sub-millisecond in-memory read/write performance for caching, pub/sub, session management, or high-throughput counters.',
    },
  ],
  behavioral: [
    {
      id: 'b1',
      question: 'Tell me about a time you disagreed with a teammate on a technical decision.',
      intention: 'Assessing communication, conflict resolution, and teamwork.',
      answer: 'Structure with STAR: contextualize the disagreement, share the objective data/proofs evaluated, and highlight how the team aligned and executed.',
    },
    {
      id: 'b2',
      question: 'Describe a project that didn’t go as planned. What did you do?',
      intention: 'Evaluating ownership, resilience, and problem recovery.',
      answer: 'Emphasize early detection of the blocker, transparent stakeholder communication, corrective pivots, and post-mortem improvements.',
    },
  ],
}

const FALLBACK_PREP_PLAN = [
  {
    day: 1,
    focus: 'Core Foundations & Architecture',
    tasks: [
      'Refresh core system design patterns (load balancing, caching, sharding).',
      'Review database indexing strategies and query optimizations.',
    ],
  },
  {
    day: 2,
    focus: 'Technical Problem Solving',
    tasks: [
      'Practice hands-on coding scenarios and data structures.',
      'Review fundamental asynchronous and concurrency patterns.',
    ],
  },
  {
    day: 3,
    focus: 'Behavioral Scenarios & Delivery',
    tasks: [
      'Draft 4-5 STAR stories highlighting past impactful engineering projects.',
      'Practice answering situational questions out loud with concise timeframes.',
    ],
  },
]

const MatchGauge = ({ score }) => {
  const cx = 100
  const cy = 100
  const r = 80
  const cleanScore = Math.min(100, Math.max(0, Math.round(score || 0)))

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          className="gauge-track"
          pathLength="100"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          className="gauge-fill"
          pathLength="100"
          strokeDasharray={`${cleanScore} 100`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="gauge-readout">
        <p className="gauge-score">
          {cleanScore}<span>/100</span>
        </p>
        <p className="gauge-caption">Overall Fit</p>
      </div>
    </div>
  )
}

const Report = () => {
  const { interviewId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Prioritize preloaded state from navigation, otherwise fetch via API
  const [report, setReport] = useState(() => location.state?.report || null)
  const [loading, setLoading] = useState(() => !location.state?.report && !!interviewId)
  const [fetchError, setFetchError] = useState('')

  const [openQuestions, setOpenQuestions] = useState({})

  // Plan tracking persistence
  const [isPlanTracked, setIsPlanTracked] = useState(() => {
    if (location.state?.report?.isTracked) return true
    if (!interviewId) return false
    return checkPlanTracked(interviewId)
  })

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(() => isReportWishlisted(interviewId))

  useEffect(() => {
    if (interviewId) {
      setIsWishlisted(isReportWishlisted(interviewId))
    }
  }, [interviewId, report])

  const handleToggleWishlist = () => {
    const reportData = report || {
      _id: interviewId,
      id: interviewId,
      title: reportTitle,
      matchscore: matchScore,
      matchScore: matchScore,
      preparationPlan,
      technicalQuestions: report?.technicalQuestions || [],
      behavioralQuestions: report?.behavioralQuestions || [],
      skillGaps,
      isTracked: isPlanTracked,
      createdAt: report?.createdAt || new Date().toISOString()
    }
    const nextState = toggleReportWishlist(reportData)
    setIsWishlisted(nextState)
  }

  // Sync state if report finishes loading with isTracked flag
  useEffect(() => {
    if (report?.isTracked) {
      setIsPlanTracked(true)
      setPlanTracked(report, true)
    }
  }, [report])

  const handleTrackPlan = async () => {
    const nextState = !isPlanTracked
    setIsPlanTracked(nextState)

    // Save snapshot to centralized local storage
    if (report) {
      setPlanTracked({ ...report, _id: report._id || interviewId }, nextState)
    } else if (interviewId) {
      setPlanTracked({
        _id: interviewId,
        title: reportTitle,
        preparationPlan,
        matchscore: matchScore,
        skillGaps
      }, nextState)
    }

    // Sync to backend if interviewId exists
    if (interviewId) {
      try {
        await toggleTrackReport(interviewId)
      } catch (err) {
        console.warn('Could not sync track status to server:', err)
      }
    }
  }

  // Fetch report by ID if not passed in navigation state
  useEffect(() => {
    if (!report && interviewId) {
      let isMounted = true
      const fetchReport = async () => {
        try {
          setLoading(true)
          const data = await getInterviewReportById(interviewId)
          if (isMounted) {
            if (data && data.interviewReport) {
              setReport(data.interviewReport)
            } else {
              setFetchError('Interview report not found.')
            }
          }
        } catch (err) {
          if (isMounted) {
            console.error('Failed to load report:', err)
            setFetchError(err.response?.data?.message || 'Failed to load report.')
          }
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }
      fetchReport()
      return () => {
        isMounted = false
      }
    }
  }, [interviewId, report])

  // Derive questions and data
  const technicalQuestions = report?.technicalQuestions?.length
    ? report.technicalQuestions
    : FALLBACK_QUESTIONS.technical

  const behavioralQuestions = report?.behavioralQuestions?.length
    ? report.behavioralQuestions
    : FALLBACK_QUESTIONS.behavioral

  const preparationPlan = report?.preparationPlan?.length
    ? report.preparationPlan
    : FALLBACK_PREP_PLAN

  const skillGaps = report?.skillGaps?.length
    ? report.skillGaps
    : ['System Design', 'Redis', 'Docker', 'AWS']

  const matchScore = report?.matchscore ?? report?.matchScore ?? 85
  const reportTitle = report?.title || 'Your Interview Report'

  const toggleQuestion = (id) => {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return (
      <main className="report" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite'
          }} />
          <h2 style={{ fontSize: '20px', color: '#0f172a', margin: 0 }}>Loading Interview Report...</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Retrieving tailored questions and preparation plan.</p>
        </div>
      </main>
    )
  }

  if (fetchError && !report) {
    return (
      <main className="report" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px', padding: '32px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Report Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{fetchError}</p>
          <button
            type="button"
            className="btn generate-btn"
            style={{ padding: '12px 24px', fontSize: '14px' }}
            onClick={() => navigate('/interview-report')}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            <span>Generate New Report</span>
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="report">
      {/* Top Header Bar with Back Link & Wishlist */}
      <div className="report-top-header">
        <button
          type="button"
          onClick={() => navigate('/interview-report')}
          className="back-btn"
          title="Back to generator"
        >
          <ArrowLeft size={16} />
          <span>New Report</span>
        </button>

        <h1 className="report-main-title">
          {reportTitle}
        </h1>

        {/* Header Right Actions: Wishlist */}
        <div className="header-right-actions">
          <button
            type="button"
            className={`wishlist-btn-header${isWishlisted ? ' active' : ''}`}
            onClick={handleToggleWishlist}
            title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          >
            <Bookmark size={15} fill={isWishlisted ? '#2563eb' : 'none'} />
            <span>{isWishlisted ? 'Wishlisted' : 'Save to Wishlist'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COMPACT REPORT VIEW (Single Unified View)                    */}
      {/* ============================================================ */}
      <div className="compact-report-layout">
        {/* Hero Summary Card: Fit Score & Metrics */}
        <div className="compact-hero-card">
          <div className="compact-hero-content">
            <div className="compact-title-row">
              <span className="role-tag">Target Role Analysis</span>
              <span className="fit-pill">{matchScore}% Profile Fit</span>
            </div>
            <h2 className="role-title">{reportTitle}</h2>
            <p className="role-summary-text">
              AI evaluation matches your profile against key requirements for this position.
              Identified focus skill gaps and a day-by-day roadmap are summarized below.
            </p>

            {/* Skill Gaps Tags */}
            <div className="compact-skill-gaps">
              <span className="gaps-label">Priority Skill Focus:</span>
              <div className="gaps-pills-row">
                {skillGaps.map((item, idx) => {
                  const skillName = typeof item === 'object' ? item.skill : item
                  return (
                    <span className="compact-gap-pill" key={`${skillName}-${idx}`}>
                      {skillName}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Key Counts Row */}
            <div className="compact-counts-row">
              <div className="count-pill">
                <strong>{technicalQuestions.length}</strong> Technical Topics
              </div>
              <div className="count-pill">
                <strong>{behavioralQuestions.length}</strong> Behavioral Scenarios
              </div>
              <div className="count-pill">
                <strong>{preparationPlan.length}</strong> Day Study Plan
              </div>
            </div>
          </div>

          <div className="compact-hero-gauge">
            <MatchGauge score={matchScore} />
          </div>
        </div>

        {/* Compact Preparation Plan Section */}
        <div className="compact-card compact-plan-section">
          <div className="compact-card-header">
            <div className="header-title-box">
              <Compass size={18} />
              <h3>Preparation Roadmap Summary</h3>
            </div>
            <span className="duration-tag">{preparationPlan.length} Days</span>
          </div>

          <div className="compact-days-flow">
            {preparationPlan.map((day, idx) => {
              const dayNum = day.day || idx + 1
              const dayTitle = day.title || day.focus || `Day ${dayNum} Focus`
              const tasks = Array.isArray(day.tasks) ? day.tasks : []

              return (
                <div className="compact-day-card" key={`c-day-${dayNum}-${idx}`}>
                  <div className="day-meta-bar">
                    <span className="badge">Day {dayNum}</span>
                    <span className="title">{dayTitle}</span>
                    <span className="tasks-count">{tasks.length} Key Tasks</span>
                  </div>
                  <ul className="tasks-brief-list">
                    {tasks.map((task, tIdx) => {
                      const taskText = typeof task === 'object' ? (task.text || task.task) : task
                      return (
                        <li key={`t-${tIdx}`}>
                          <span className="dot" />
                          <span>{taskText}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Bottom Track Action in Compact View */}
          <div className="compact-plan-footer">
            <button
              type="button"
              className={`btn track-plan-btn${isPlanTracked ? ' tracked' : ''}`}
              onClick={handleTrackPlan}
            >
              {isPlanTracked ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Plan Tracked &middot; In Progress</span>
                </>
              ) : (
                <>
                  <Compass size={16} />
                  <span>Track Preparation Plan</span>
                </>
              )}
            </button>

            {isPlanTracked && (
              <button
                type="button"
                className="btn-open-tracker"
                onClick={() => navigate('/plan-tracker')}
              >
                <span>Open in Plan Tracker</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Compact Question Topics Preview with Expandable Sample Answers */}
        <div className="compact-card compact-questions-preview">
          <div className="compact-card-header">
            <div className="header-title-box">
              <MessageCircle size={18} />
              <h3>Interview Questions Overview</h3>
            </div>
            <span className="duration-tag">
              {technicalQuestions.length + behavioralQuestions.length} Questions Prepared
            </span>
          </div>

          <div className="compact-q-grid">
            <div className="q-category-column">
              <h4>Technical Questions ({technicalQuestions.length})</h4>
              <div className="q-preview-list">
                {technicalQuestions.map((q, idx) => {
                  const qKey = `tech-${idx}`
                  const isOpen = !!openQuestions[qKey]
                  return (
                    <div
                      className={`q-preview-item${isOpen ? ' expanded' : ''}`}
                      key={`tq-${idx}`}
                      onClick={() => toggleQuestion(qKey)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleQuestion(qKey)
                        }
                      }}
                      title="Click to view sample answer"
                    >
                      <div className="q-preview-header">
                        <span className="q-num">Q{idx + 1}</span>
                        <div className="q-desc">
                          <p className="q-title">{q.question}</p>
                          <span className="q-intent">Focus: {q.intention}</span>
                        </div>
                        <span className="q-chevron">
                          <ChevronDown size={15} />
                        </span>
                      </div>
                      {isOpen && q.answer && (
                        <div className="q-preview-answer">
                          <div className="qa-bubble">
                            <span className="qa-badge">Sample Answer</span>
                            <p>{q.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="q-category-column">
              <h4>Behavioral Scenarios ({behavioralQuestions.length})</h4>
              <div className="q-preview-list">
                {behavioralQuestions.map((q, idx) => {
                  const qKey = `behav-${idx}`
                  const isOpen = !!openQuestions[qKey]
                  return (
                    <div
                      className={`q-preview-item${isOpen ? ' expanded' : ''}`}
                      key={`bq-${idx}`}
                      onClick={() => toggleQuestion(qKey)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleQuestion(qKey)
                        }
                      }}
                      title="Click to view sample answer"
                    >
                      <div className="q-preview-header">
                        <span className="q-num behavioral">B{idx + 1}</span>
                        <div className="q-desc">
                          <p className="q-title">{q.question}</p>
                          <span className="q-intent">Evaluation: {q.intention}</span>
                        </div>
                        <span className="q-chevron">
                          <ChevronDown size={15} />
                        </span>
                      </div>
                      {isOpen && q.answer && (
                        <div className="q-preview-answer">
                          <div className="qa-bubble">
                            <span className="qa-badge">STAR Framework / Sample Answer</span>
                            <p>{q.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Report
