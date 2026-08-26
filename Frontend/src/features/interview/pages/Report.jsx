import React, { useState } from 'react'
import "../styles/report.scss"
import { Check, ChevronDown, Gauge, List, MessageCircle, Tags } from 'lucide-react'

// ---- Mock data ----------------------------------------------------
// Swap this for whatever your report-generation endpoint returns.
const CATEGORIES = [
  { id: 'technical', label: 'Technical Questions' },
  { id: 'behavioral', label: 'Behavioral Questions' },
  { id: 'prep-plan', label: 'Preparation Plan' },
  { id: 'culture-fit', label: 'Culture Fit' },
]

const QUESTIONS_BY_CATEGORY = {
  technical: [
    {
      id: 't1',
      question: 'Explain the difference between a process and a thread.',
      intention: 'Assessing OS fundamentals.',
      answer: 'A process is an execution environment, while an execution thread is a sequence of execution within a process. Processes are independent, threads share memory and resources. Context switching between threads is faster than between processes.',
    },
    {
      id: 't2',
      question: 'Describe the CAP theorem and its implications in distributed systems.',
      intention: 'Evaluating system design knowledge.',
      answer: 'Consistency, Availability, Partition tolerance. In the presence of a network partition, you must choose between Consistency and Availability.',
    },
    {
      id: 't3',
      question: 'When would you reach for Redis over a relational database?',
      intention: 'Checking data-store trade-off awareness.',
      answer: 'When you need sub-millisecond reads/writes for simple key-value or cache-style access patterns, and you can tolerate an in-memory store with optional persistence rather than strong relational guarantees.',
    },
  ],
  behavioral: [
    {
      id: 'b1',
      question: 'Tell me about a time you disagreed with a teammate on a technical decision.',
      intention: 'Assessing communication and conflict resolution.',
      answer: 'Look for a structured answer: the context, the disagreement, how they made their case with evidence, and how the team ultimately decided and moved forward.',
    },
    {
      id: 'b2',
      question: 'Describe a project that didn\u2019t go as planned. What did you do?',
      intention: 'Evaluating ownership and resilience under setbacks.',
      answer: 'Look for early recognition of the problem, a concrete corrective action, and what changed in their process afterward.',
    },
  ],
  'culture-fit': [
    {
      id: 'c1',
      question: 'What kind of team environment helps you do your best work?',
      intention: 'Gauging alignment with the team\u2019s working style.',
      answer: 'Listen for specifics (pace, autonomy, feedback style) rather than generic answers \u2014 specificity signals genuine self-awareness.',
    },
  ],
}

// Preparation Plan gets its own day-wise shape instead of the Q&A shape above.
const PREP_PLAN = [
  {
    day: 1,
    title: 'Foundations',
    tasks: [
      { id: 'd1t1', text: 'Refresh core system design patterns (load balancing, caching, sharding).' },
      { id: 'd1t2', text: 'Review CAP theorem trade-offs and where each system typically lands.' },
    ],
  },
  {
    day: 2,
    title: 'Hands-on Practice',
    tasks: [
      { id: 'd2t1', text: 'Get hands-on with Docker \u2014 build and run one containerized app end-to-end.' },
      { id: 'd2t2', text: 'Spin up Redis locally and practice a basic caching pattern.' },
    ],
  },
  {
    day: 3,
    title: 'Cloud & Deployment',
    tasks: [
      { id: 'd3t1', text: 'Walk through deploying a small service on AWS (EC2 or ECS).' },
      { id: 'd3t2', text: 'Read up on IAM basics \u2014 a common follow-up after AWS mentions.' },
    ],
  },
  {
    day: 4,
    title: 'Mock Interview & Review',
    tasks: [
      { id: 'd4t1', text: 'Do a full mock interview covering both technical and behavioral questions.' },
      { id: 'd4t2', text: 'Revisit the flagged skill gaps and re-answer this report\u2019s toughest questions out loud.' },
    ],
  },
]

const SKILLS_GAPS = ['Redis', 'AWS', 'Docker']
const MATCH_SCORE = 85

const MatchGauge = ({ score }) => {
  const cx = 100
  const cy = 100
  const r = 80

  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d3a56" />
            <stop offset="100%" stopColor="#5fc9ab" />
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
          strokeDasharray={`${score} 100`}
          transform={`rotate(-90 ${cx} ${cy})`} 
        />
      </svg>
      <div className="gauge-readout">
        <p className="gauge-score">
          {score}<span>/100</span>
        </p>
        <p className="gauge-caption">Overall Fit</p>
      </div>
    </div>
  )
}

const Roadmap = ({ plan, checkedTasks, onToggleTask }) => (
  <div className="roadmap">
    {plan.map((day) => (
      <div className="roadmap-item" key={day.day}>
        <div className="roadmap-marker">
          <span className="roadmap-day-number">{day.day}</span>
        </div>
        <div className="roadmap-content">
          <p className="roadmap-day-title">
            Day {day.day} <span>&middot;</span> {day.title}
          </p>
          <ul className="roadmap-tasks">
            {day.tasks.map((task) => {
              const checked = !!checkedTasks[task.id]
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    className={`task-item${checked ? ' checked' : ''}`}
                    onClick={() => onToggleTask(task.id)}
                    aria-pressed={checked}
                  >
                    <span className="task-checkbox">{checked && <Check size={100} />}</span>
                    <span className="task-text">{task.text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    ))}
  </div>
)

const Report = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [openQuestions, setOpenQuestions] = useState(() => {
    const initial = {}
    QUESTIONS_BY_CATEGORY[CATEGORIES[0].id].forEach((q) => { initial[q.id] = true })
    return initial
  })
  const [checkedTasks, setCheckedTasks] = useState({})

  const toggleQuestion = (id) => {
    setOpenQuestions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTask = (id) => {
    setCheckedTasks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isPrepPlan = activeCategory === 'prep-plan'
  const questions = QUESTIONS_BY_CATEGORY[activeCategory] || []

  return (
    <main className="report">
      <h1 className="page-title">Your Interview Report</h1>

      <div className="report-grid">
        {/* ---- Left: category navigation ---- */}
        <aside className="categories-panel">
          <div className="panel-header">
            <span>Question Categories</span>
            <List size={76} />
          </div>
          <nav className="category-list panel-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-item${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ---- Center: Q&A, or the day-wise roadmap for Preparation Plan ---- */}
        <section className="questions-panel">
          <div className="panel-header">
            <span>{isPrepPlan ? 'Preparation Roadmap' : 'Interview Q&A'}</span>
            <MessageCircle size={96} />
          </div>

          <div className="panel-scroll">
            {isPrepPlan ? (
              <Roadmap plan={PREP_PLAN} checkedTasks={checkedTasks} onToggleTask={toggleTask} />
            ) : (
              <div className="question-list">
                {questions.map((q, index) => {
                  const isOpen = !!openQuestions[q.id]
                  return (
                    <div className={`question-card${isOpen ? ' open' : ''}`} key={q.id}>
                      <button
                        type="button"
                        className="question-header"
                        onClick={() => toggleQuestion(q.id)}
                        aria-expanded={isOpen}
                      >
                        <span className="question-text">
                          <span className="question-index">Q{index + 1} ]</span> {q.question}
                        </span>
                        <span className="chevron"><ChevronDown size={100} /></span>
                      </button>

                      <div className="question-collapse">
                        <div className="question-collapse-inner">
                          <p><strong>Intention:</strong> {q.intention}</p>
                          <p><strong>Ans:</strong> {q.answer}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* ---- Right: insights ---- */}
        <aside className="insights-panel">
          <div className="panel-scroll">
            <div className="panel-header">
              <span>Skills Gaps</span>
              <Tags size={112} />
            </div>
            <div className="skills-grid">
              {SKILLS_GAPS.map((skill) => (
                <span className="skill-pill" key={skill}>{skill}</span>
              ))}
            </div>

            <div className="panel-header match-header">
              <span>Match Score</span>
              <Gauge size={100} />
            </div>
            <MatchGauge score={MATCH_SCORE} />
          </div>
        </aside>
      </div>
    </main>
  )
}

export default Report
