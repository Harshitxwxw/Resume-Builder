import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/planTracker.scss'
import {
  Compass,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Trash2,
  ChevronDown,
  Check,
  Search,
  Filter,
  BarChart2,
  Clock,
  Target,
  Coins
} from 'lucide-react'
import { getAllInterviewReports, toggleTrackReport } from '../../interview/services/report.api'
import {
  getTrackedPlanIds,
  syncPlanTrackerFromDb,
  isPlanTracked,
  setPlanTracked,
  getTrackedPlanDetails,
  getCompletedTasks,
  toggleTaskCompleted,
  calculatePlanStats
} from '../services/planTracker.storage'
import {
  getUserCredits,
  isPrepDayAwarded,
  awardPrepDayCredits
} from '../../credits/services/credits.storage'

const PlanTracker = () => {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedMap, setCompletedMap] = useState({})
  const [expandedPlans, setExpandedPlans] = useState({})
  const [userCredits, setUserCredits] = useState(() => getUserCredits())
  const [earnedToast, setEarnedToast] = useState('')

  // Sync user credits on updates
  useEffect(() => {
    const handleCreditsUpdate = () => {
      setUserCredits(getUserCredits())
    }
    window.addEventListener('career_credits_updated', handleCreditsUpdate)
    return () => window.removeEventListener('career_credits_updated', handleCreditsUpdate)
  }, [])

  // Fetch reports from API & merge with locally tracked snapshots
  useEffect(() => {
    let isMounted = true

    const loadTrackedPlans = async () => {
      setLoading(true)
      await syncPlanTrackerFromDb()
      const localIds = getTrackedPlanIds()
      const localDetails = getTrackedPlanDetails()

      let apiReports = []
      try {
        const data = await getAllInterviewReports()
        if (data && Array.isArray(data.interviewReports)) {
          apiReports = data.interviewReports
        }
      } catch (err) {
        console.warn('Could not load reports from server; falling back to stored plans:', err)
      }

      if (!isMounted) return

      // Collect tracked plans
      const trackedListMap = new Map()

      // 1. Add any API reports that are tracked (either server flag isTracked or in local tracked IDs)
      apiReports.forEach((rep) => {
        const repId = String(rep._id)
        if (rep.isTracked || localIds.includes(repId)) {
          trackedListMap.set(repId, {
            ...rep,
            _id: repId,
            preparationPlan: rep.preparationPlan || [],
            title: rep.title || 'Interview Preparation Plan',
            matchscore: rep.matchscore ?? rep.matchScore ?? 85,
            trackedAt: rep.updatedAt || rep.createdAt || new Date().toISOString()
          })
        }
      })

      // 2. Add any local details snapshots that might not be on server or are offline
      Object.keys(localDetails).forEach((id) => {
        if (!trackedListMap.has(id)) {
          trackedListMap.set(id, {
            ...localDetails[id],
            _id: id,
            preparationPlan: localDetails[id].preparationPlan || []
          })
        }
      })

      const finalPlans = Array.from(trackedListMap.values())
      setPlans(finalPlans)

      // Initialize completed tasks map for each plan
      const taskStates = {}
      const expandStates = {}
      finalPlans.forEach((p, idx) => {
        taskStates[p._id] = getCompletedTasks(p._id)
        // Expand first 2 plans by default
        expandStates[p._id] = idx < 2
      })
      setCompletedMap(taskStates)
      setExpandedPlans(expandStates)

      setLoading(false)
    }

    loadTrackedPlans()

    return () => {
      isMounted = false
    }
  }, [])

  // Toggle individual task completion & award +15 credits when all day tasks are done
  const handleToggleTask = (plan, day, dayNum, taskId) => {
    const planId = plan._id
    const updated = toggleTaskCompleted(planId, taskId)
    setCompletedMap((prev) => ({
      ...prev,
      [planId]: updated
    }))

    // Check if all tasks for this day are now completed
    const dayTasks = Array.isArray(day?.tasks) ? day.tasks : []
    if (dayTasks.length > 0) {
      const allDone = dayTasks.every((_, tIdx) => updated[`d${dayNum}t${tIdx}`])
      if (allDone && !isPrepDayAwarded(planId, dayNum)) {
        const result = awardPrepDayCredits(planId, dayNum, day.title || day.focus)
        if (result.awarded) {
          setEarnedToast(`🎯 Day ${dayNum} Tasks Completed! +15 Credits Added to Balance (${result.newBalance} total)`)
          setTimeout(() => setEarnedToast(''), 4500)
        }
      }
    }
  }

  // Toggle card expansion
  const toggleExpand = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId]
    }))
  }

  // Untrack a plan
  const handleUntrack = async (plan) => {
    const planId = plan._id
    setPlanTracked(plan, false)
    setPlans((prev) => prev.filter((p) => p._id !== planId))

    try {
      await toggleTrackReport(planId)
    } catch (e) {
      console.warn('Could not sync untrack to server:', e)
    }
  }

  // Filter plans by search query
  const filteredPlans = plans.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.preparationPlan &&
        p.preparationPlan.some(
          (d) =>
            (d.focus && d.focus.toLowerCase().includes(q)) ||
            (d.tasks && d.tasks.some((t) => (typeof t === 'string' ? t.toLowerCase().includes(q) : false)))
        ))
    )
  })

  // Calculate overall tracker totals across all tracked plans
  let grandTotalTasks = 0
  let grandCompletedTasks = 0
  plans.forEach((p) => {
    const stats = calculatePlanStats(p.preparationPlan, completedMap[p._id] || {})
    grandTotalTasks += stats.total
    grandCompletedTasks += stats.completed
  })
  const grandPercent = grandTotalTasks > 0 ? Math.round((grandCompletedTasks / grandTotalTasks) * 100) : 0

  return (
    <main className="plan-tracker">
      {/* ---- Header Section ---- */}
      <div className="tracker-header">
        <div className="tracker-header__text">
          <h1 className="tracker-title">Plan Tracker</h1>
          <p className="tracker-subtitle">
            Track daily preparation milestones for roles you've targeted. Check off tasks as you prepare.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="tracker-stats-strip">
          <div className="stat-card">
            <div className="stat-icon-wrap blue">
              <Target size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{plans.length}</span>
              <span className="stat-label">Tracked Plans</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap emerald">
              <CheckCircle2 size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-number">
                {grandCompletedTasks} <span>/ {grandTotalTasks}</span>
              </span>
              <span className="stat-label">Tasks Done</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrap navy">
              <BarChart2 size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-number">{grandPercent}%</span>
              <span className="stat-label">Readiness</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Main Tracker Content ---- */}
      <div className="tracker-container">
        {loading ? (
          <div className="tracker-loading">
            <div className="tracker-spinner" />
            <h3>Loading Tracked Plans...</h3>
            <p>Gathering your interview preparation roadmaps.</p>
          </div>
        ) : plans.length === 0 ? (
          /* Empty State: No plans tracked yet */
          <div className="tracker-empty">
            <div className="empty-icon-circle">
              <Compass size={38} strokeWidth={1.8} />
            </div>
            <h2 className="empty-title">No Preparation Plans Tracked Yet</h2>
            <p className="empty-desc">
              When you generate an interview report, navigate to the <strong>Preparation Plan</strong> section
              and click <strong>"Track Plan"</strong> at the bottom. Your daily study milestones and checklist
              will appear right here!
            </p>
            <button
              type="button"
              className="btn generate-btn"
              onClick={() => navigate('/interview-report')}
            >
              <Sparkles size={16} />
              <span>Generate & Track an Interview Plan</span>
            </button>
          </div>
        ) : (
          /* List of Tracked Plans */
          <div className="tracker-plans-list">
            {/* Search Bar when multiple plans */}
            {plans.length > 1 && (
              <div className="tracker-filter-bar">
                <div className="search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search tracked roles or tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <span className="plans-count-badge">
                  {filteredPlans.length} {filteredPlans.length === 1 ? 'Plan' : 'Plans'}
                </span>
              </div>
            )}

            {filteredPlans.map((plan) => {
              const planTasks = completedMap[plan._id] || {}
              const stats = calculatePlanStats(plan.preparationPlan, planTasks)
              const isExpanded = !!expandedPlans[plan._id]
              const prepPlanDays = Array.isArray(plan.preparationPlan) ? plan.preparationPlan : []

              return (
                <div className={`plan-card${isExpanded ? ' is-expanded' : ''}`} key={plan._id}>
                  {/* Plan Card Header */}
                  <div className="plan-card__header">
                    <div className="plan-card__meta" onClick={() => toggleExpand(plan._id)}>
                      <div className="plan-title-row">
                        <h2 className="plan-title">{plan.title}</h2>
                        <span className="match-score-badge">
                          {plan.matchscore}% Match
                        </span>
                      </div>
                      <div className="plan-subtitle-row">
                        <span className="plan-days-count">
                          <Calendar size={13} />
                          {prepPlanDays.length} {prepPlanDays.length === 1 ? 'Day' : 'Days'} Plan
                        </span>
                        <span className="plan-tasks-count">
                          <CheckCircle2 size={13} />
                          {stats.completed} of {stats.total} completed ({stats.percent}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="plan-card__right">
                      <div className="plan-progress-pill">
                        <span className="progress-text">{stats.percent}% Ready</span>
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="plan-card__actions">
                        <button
                          type="button"
                          className="btn-action btn-view-report"
                          onClick={() => navigate(`/interview/${plan._id}`)}
                          title="Open full interview report"
                        >
                          <span>Full Report</span>
                          <ExternalLink size={14} />
                        </button>

                        <button
                          type="button"
                          className="btn-action btn-untrack"
                          onClick={() => handleUntrack(plan)}
                          title="Untrack this plan"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          type="button"
                          className={`btn-action btn-toggle-expand${isExpanded ? ' open' : ''}`}
                          onClick={() => toggleExpand(plan._id)}
                          aria-label="Expand roadmap tasks"
                        >
                          <ChevronDown size={17} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plan Card Body: Checkable Roadmap Tasks */}
                  {isExpanded && (
                    <div className="plan-card__body">
                      {prepPlanDays.length === 0 ? (
                        <p className="no-tasks-hint">No roadmap tasks defined for this plan.</p>
                      ) : (
                        <div className="plan-roadmap-grid">
                          {prepPlanDays.map((day, dIdx) => {
                            const dayNum = day.day || dIdx + 1
                            const dayTitle = day.title || day.focus || `Day ${dayNum} Focus`
                            const tasks = Array.isArray(day.tasks) ? day.tasks : []

                            return (
                              <div className="plan-day-column" key={`day-${dayNum}-${dIdx}`}>
                                <div className="day-header">
                                  <div className="day-badge-wrap">
                                    <span className="day-badge">Day {dayNum}</span>
                                    {isPrepDayAwarded(plan._id, dayNum) ? (
                                      <span className="day-credit-pill claimed" title="+15 Credits Earned">
                                        <Check size={10} strokeWidth={3} />
                                        <span>+15 Claimed</span>
                                      </span>
                                    ) : (
                                      <span className="day-credit-pill unearned" title="Complete all tasks in this day to earn 15 credits">
                                        <Coins size={10} />
                                        <span>+15 Credits</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="day-focus">{dayTitle}</span>
                                </div>

                                <ul className="day-task-list">
                                  {tasks.map((task, tIdx) => {
                                    const taskId = `d${dayNum}t${tIdx}`
                                    const taskText =
                                      typeof task === 'object'
                                        ? task.text || task.task || JSON.stringify(task)
                                        : task
                                    const isDone = !!planTasks[taskId]

                                    return (
                                      <li key={taskId}>
                                        <button
                                          type="button"
                                          className={`interactive-task-row${isDone ? ' is-done' : ''}`}
                                          onClick={() => handleToggleTask(plan, day, dayNum, taskId)}
                                          aria-pressed={isDone}
                                        >
                                          <span className="task-checkbox">
                                            {isDone && <Check size={12} strokeWidth={3} />}
                                          </span>
                                          <span className="task-label">{taskText}</span>
                                        </button>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Credits Earned Notification Toast */}
      {earnedToast && (
        <div className="plan-credits-toast">
          <Sparkles size={16} />
          <span>{earnedToast}</span>
        </div>
      )}
    </main>
  )
}

export default PlanTracker

