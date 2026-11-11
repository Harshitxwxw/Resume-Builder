import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Bot,
  FileText,
  FilePlus,
  BarChart2,
  Compass,
  Bookmark,
  Wand2,
  CheckCircle2,
  ArrowRight,
  Download,
  Mic,
  Star,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  Sun,
  Moon,
  Coins,
  Check,
  TrendingUp,
  Cpu,
  Award,
  Globe,
  Lock,
  Play
} from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import { useTheme } from '../../../context/ThemeContext'
import CareerAILogo, { CareerAIIcon } from '../../../components/CareerAILogo'
import '../styles/landing.scss'

const TOOLS_LIST = [
  {
    id: 'mock-interview',
    title: 'AI Mock Interview Agent',
    badge: 'Voice & Text',
    badgeColor: 'mint',
    icon: Bot,
    tagline: 'Simulate high-stakes technical & behavioral interviews in real time.',
    description:
      'Answer questions dynamically using your microphone or keyboard. Get an instant 0–10 score with evaluation breakdown, strengths, areas to improve, and model answers.',
    highlights: [
      'Speech-to-text mic integration or keyboard answers',
      'Instant 0–10 scoring with deep answer breakdown',
      'Earn +25 Credits for scoring 8.0 or higher'
    ],
    route: '/mock-interview',
    ctaText: 'Practice Mock Interview'
  },
  {
    id: 'interview-report',
    title: 'Interview Report & Roadmap Generator',
    badge: 'Personalized Plan',
    badgeColor: 'blue',
    icon: FileText,
    tagline: 'Tailor your preparation to any specific job description.',
    description:
      'Upload your resume and paste a target job description. The AI compares competencies, extracts critical skill gaps, and generates 10+ custom Q&As with a 5–7 day preparation roadmap.',
    highlights: [
      'Target role matching against your resume competencies',
      '10+ tailored technical & behavioral interview questions',
      'Day-by-day roadmap with actionable study tasks'
    ],
    route: '/interview-report',
    ctaText: 'Generate Prep Report'
  },
  {
    id: 'resume-creator',
    title: 'ATS Resume Builder & Exporter',
    badge: 'PDF + DOCX',
    badgeColor: 'navy',
    icon: FilePlus,
    tagline: 'Craft recruiter-approved, 100% ATS-parseable resumes in minutes.',
    description:
      'Choose from 4 proven layouts (Modern Single Column, Two-Column Split, Minimalist Clean, Executive Accent Banner) and 22 curated Google fonts with instant PDF and Word export.',
    highlights: [
      '4 recruiter-vetted ATS layouts & 22 Google fonts',
      'Export to both high-res PDF and editable Word (.docx)',
      'Real-time live preview with persistent cloud auto-sync'
    ],
    route: '/resume-creator',
    ctaText: 'Build ATS Resume'
  },
  {
    id: 'ats-calculator',
    title: 'ATS Fit Score Calculator',
    badge: '0–100% Match',
    badgeColor: 'amber',
    icon: BarChart2,
    tagline: 'Know exactly how ATS algorithms will score your resume.',
    description:
      'Analyze your resume against any target job opening. Get an exact 0–100% compatibility score, keyword density metrics, and a checklist of missing requirements.',
    highlights: [
      '0–100% match score with keyword match percentages',
      'Identifies missing technical skills and certifications',
      'Actionable recommendations to pass automated filters'
    ],
    route: '/ats-calculator',
    ctaText: 'Check ATS Score'
  },
  {
    id: 'ats-enhancer',
    title: 'AI Resume Enhancer',
    badge: 'Gemini AI',
    badgeColor: 'purple',
    icon: Wand2,
    tagline: 'Rewrite bullet points with high-impact action verbs and metrics.',
    description:
      'Leverage Google Gemini AI to elevate weak bullet points, craft professional executive summaries, and optimize phrasing to impress both ATS parsers and human hiring managers.',
    highlights: [
      'Rewrites bullet points with measurable impact metrics',
      'Generates compelling professional career summaries',
      'Fine-tuned for technical, design, and management roles'
    ],
    route: '/ats-enhancer',
    ctaText: 'Enhance Resume'
  },
  {
    id: 'plan-tracker',
    title: 'Preparation Plan Tracker',
    badge: 'Milestones',
    badgeColor: 'emerald',
    icon: Compass,
    tagline: 'Stay organized and track daily study milestones for target roles.',
    description:
      'Turn generated interview preparation roadmaps into active task checklists. Track tasks done, monitor overall interview readiness, and stay accountable leading up to interview day.',
    highlights: [
      'Daily milestone checklists for all your applied roles',
      'Live interview readiness percentage calculation',
      'Track multiple target positions simultaneously'
    ],
    route: '/plan-tracker',
    ctaText: 'Open Plan Tracker'
  }
]

const DEMO_TABS = [
  { id: 'mock', label: 'AI Mock Interview', icon: Bot },
  { id: 'resume', label: 'ATS Resume Builder', icon: FilePlus },
  { id: 'roadmap', label: 'Interview Roadmap', icon: FileText },
  { id: 'ats', label: 'ATS Fit Score', icon: BarChart2 }
]

const FAQS = [
  {
    q: 'How does the Voice AI Mock Interview work?',
    a: 'You enter your target role, experience level, and optionally attach your resume. Our AI Agent asks tailored interview questions one by one. You can answer using your microphone (speech-to-text) or keyboard. The AI evaluates each answer on technical depth, structure, and communication, giving you an instant 0–10 score and actionable feedback.'
  },
  {
    q: 'Are the resumes created really 100% ATS-compliant?',
    a: 'Yes! Our 4 layouts are designed according to strict ATS parsing standards: standard single-column or clean two-column structures, machine-readable headings, zero unparseable graphics or tables, and standard metadata. They pass through all modern ATS scanners including Workday, Taleo, Greenhouse, and Lever.'
  },
  {
    q: 'Can I download my resume in Word (.docx) format?',
    a: 'Absolutely! CareerAI supports dual-engine export: you can export high-quality, print-ready PDF resumes, as well as fully editable Microsoft Word (.docx) documents with your customized accent colors.'
  },
  {
    q: 'How does the free credit system work?',
    a: 'Every new account starts with 100 free credits. You can generate detailed interview reports (50 credits) or take full AI mock interviews (50 credits). Plus, whenever you score 8.0 or higher in a mock interview, you earn an instant bonus of +25 credits!'
  },
  {
    q: 'Is my personal resume data private and secure?',
    a: 'Yes. Your personal information, resume content, and interview evaluations are strictly private and encrypted. We never share, sell, or publicly index your resume data.'
  }
]

const LandingPage = () => {
  const { user } = useAuth()
  const { theme, isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [activeDemoTab, setActiveDemoTab] = useState('mock')
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  const handleCtaClick = (path) => {
    if (user) {
      navigate(path || '/dashboard')
    } else {
      navigate('/register')
    }
  }

  return (
    <div className={`landing-page ${isDark ? 'dark' : 'light'}`}>
      {/* ==================== 1. TOP NAVBAR ==================== */}
      <header className="landing-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <CareerAILogo size={32} />
          </Link>

          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#tools">All Tools</a>
            <a href="#demo">Live Demo</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <div className="nav-user-cluster">
                <span className="user-greeting">
                  Hi, <strong>{user.username}</strong>
                </span>
                <Link to="/dashboard" className="btn btn-primary nav-cta">
                  <span>Go to Dashboard</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary nav-cta">
                  <span>Sign Up </span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==================== 2. HERO SECTION ==================== */}
      <section className="landing-hero">
        <div className="hero-glow-sphere" />
        <div className="hero-container">
          <div className="hero-pill-badge">
            <CareerAIIcon size={16} />
            <span>Next-Gen Career Intelligence Platform</span>
            <span className="pill-divider">·</span>
            <span className="free-credits-tag">100 Free Credits ⚡</span>
          </div>

          <h1 className="hero-title">
            Master Interviews. <span className="gradient-text">Optimize Resumes.</span>
            <br />
            Land Your Dream Job Faster.
          </h1>

          <p className="hero-subtitle">
            The all-in-one AI career co-pilot: practice real-time voice mock interviews with live scoring,
            build 100% ATS-compliant resumes in PDF & Word, evaluate job description match, and follow
            custom preparation roadmaps.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn btn-hero-primary"
              onClick={() => handleCtaClick('/dashboard')}
            >
              <span>{user ? 'Launch Dashboard' : 'Get Started — 100 Credits'}</span>
              <ArrowRight size={18} />
            </button>

            <a href="#tools" className="btn btn-hero-secondary">
              <span>Explore All Tools</span>
              <ChevronDown size={17} />
            </a>
          </div>

          {/* Social Proof / Metrics Bar */}
          <div className="hero-stats-strip">
            <div className="stat-card">
              <span className="stat-number">100%</span>
              <span className="stat-label">ATS Parseable Format</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">0–10</span>
              <span className="stat-label">Live AI Voice Scoring</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">4 Layouts</span>
              <span className="stat-label">22 Pro Typography Styles</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">PDF & DOCX</span>
              <span className="stat-label">Dual Format Export</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-card">
              <span className="stat-number">+25 Credits</span>
              <span className="stat-label">Rewards for 8.0+ Scores</span>
            </div>
          </div>

          {/* Interactive Hero Showcase Preview */}
          <div className="hero-visual-card">
            <div className="browser-header">
              <div className="browser-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="browser-address">careerai.app/workspace</div>
              <div className="browser-badges">
                <span className="credits-badge">
                  <Coins size={13} />
                  <span>100 Credits</span>
                </span>
              </div>
            </div>

            <div className="hero-mockup-grid">
              {/* Card 1: Active Mock Interview Voice Card */}
              <div className="mockup-widget voice-widget">
                <div className="widget-header">
                  <div className="icon-wrap mint">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4>AI Mock Interview (Live)</h4>
                    <span className="widget-sub">Technical & System Design</span>
                  </div>
                  <span className="widget-pill mint">9.2 / 10 Score</span>
                </div>
                <p className="widget-quote">
                  "Explain how you design a resilient caching layer using Redis with cache invalidation strategies."
                </p>
                <div className="waveform-simulator">
                  <div className="wave-bar b1" />
                  <div className="wave-bar b2" />
                  <div className="wave-bar b3" />
                  <div className="wave-bar b4" />
                  <div className="wave-bar b5" />
                  <div className="wave-bar b6" />
                  <div className="wave-bar b7" />
                  <div className="wave-bar b8" />
                  <div className="wave-bar b9" />
                  <div className="wave-bar b10" />
                </div>
                <div className="widget-footer-tags">
                  <span className="tag">Mic Active</span>
                  <span className="tag">+25 Credits Earned</span>
                </div>
              </div>

              {/* Card 2: ATS Role Fit Score Card */}
              <div className="mockup-widget score-widget">
                <div className="widget-header">
                  <div className="icon-wrap blue">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4>Target Role Fit Report</h4>
                    <span className="widget-sub">Senior Full-Stack Engineer</span>
                  </div>
                  <span className="widget-pill blue">88% Match</span>
                </div>

                <div className="fit-ring-row">
                  <div className="mini-ring">
                    <span className="ring-val">88%</span>
                    <span className="ring-lbl">ATS Fit</span>
                  </div>
                  <div className="fit-details">
                    <div className="fit-item">
                      <CheckCircle2 size={14} color="#10b981" />
                      <span>React, Node.js, System Architecture matched</span>
                    </div>
                    <div className="fit-item">
                      <Sparkles size={14} color="#3b82f6" />
                      <span>6-Day Roadmap Generated (10 Q&As)</span>
                    </div>
                  </div>
                </div>

                <div className="roadmap-preview-pills">
                  <span className="day-pill active">Day 1: Microservices</span>
                  <span className="day-pill">Day 2: Database Scaling</span>
                  <span className="day-pill">Day 3: Behavioral</span>
                </div>
              </div>

              {/* Card 3: ATS Resume Builder Card */}
              <div className="mockup-widget resume-widget">
                <div className="widget-header">
                  <div className="icon-wrap purple">
                    <FilePlus size={18} />
                  </div>
                  <div>
                    <h4>ATS Resume Creator</h4>
                    <span className="widget-sub">Modern Single Column</span>
                  </div>
                  <span className="widget-pill purple">100% Parsed</span>
                </div>

                <div className="resume-mini-preview">
                  <div className="doc-line title" />
                  <div className="doc-line sub" />
                  <div className="doc-section">
                    <div className="doc-heading" />
                    <div className="doc-bullet" />
                    <div className="doc-bullet" />
                  </div>
                </div>

                <div className="resume-export-actions">
                  <span className="btn-mini-export">
                    <Download size={12} />
                    <span>Download PDF</span>
                  </span>
                  <span className="btn-mini-export docx">
                    <Download size={12} />
                    <span>Download DOCX</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. ALL TOOLS DEEP DIVE ==================== */}
      <section className="landing-tools-section" id="tools">
        <div className="section-container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Comprehensive Career Toolkit</span>
            <h2 className="section-title">
              Every Tool You Need to <span className="gradient-text">Crack Top Tech Roles</span>
            </h2>
            <p className="section-desc">
              CareerAI unites advanced GenAI, speech-to-text evaluation, ATS formatting engines, and progress
              tracking into one frictionless platform.
            </p>
          </div>

          <div className="tools-grid">
            {TOOLS_LIST.map((tool) => {
              const IconComponent = tool.icon
              return (
                <div className="tool-card" key={tool.id}>
                  <div className="tool-card-top">
                    <div className={`tool-icon-box ${tool.badgeColor}`}>
                      <IconComponent size={24} />
                    </div>
                    <span className={`tool-badge ${tool.badgeColor}`}>{tool.badge}</span>
                  </div>

                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-tagline">{tool.tagline}</p>
                  <p className="tool-description">{tool.description}</p>

                  <ul className="tool-highlights">
                    {tool.highlights.map((h, i) => (
                      <li key={i}>
                        <Check size={15} className="check-icon" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="btn btn-tool-cta"
                    onClick={() => handleCtaClick(tool.route)}
                  >
                    <span>{tool.ctaText}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==================== 4. INTERACTIVE FEATURE DEMO ==================== */}
      <section className="landing-demo-section" id="demo">
        <div className="section-container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Interactive Feature Preview</span>
            <h2 className="section-title">See CareerAI In Action</h2>
            <p className="section-desc">
              Experience the tools engineered to elevate every stage of your job hunt.
            </p>
          </div>

          <div className="demo-tabs-bar">
            {DEMO_TABS.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  type="button"
                  key={tab.id}
                  className={`demo-tab-btn${activeDemoTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveDemoTab(tab.id)}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="demo-display-card">
            {activeDemoTab === 'mock' && (
              <div className="demo-content-row">
                <div className="demo-text-side">
                  <div className="demo-chip mint">Real-Time Voice & Text Agent</div>
                  <h3>Practice with a realistic AI Interviewer</h3>
                  <p>
                    Speak naturally through your microphone or type your responses. The AI agent analyzes your
                    answers using industry competency frameworks and gives you objective, confidence-building feedback.
                  </p>
                  <ul className="demo-feature-list">
                    <li>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Live Speech-to-Text with one-tap microphone toggle</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Scores answers from 0 to 10 with clear rubrics</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Suggests model answers and optimal phrasing</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCtaClick('/mock-interview')}
                  >
                    <span>Launch Mock Interview</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="demo-preview-box">
                  <div className="interactive-mock-preview">
                    <div className="mock-q-bubble">
                      <span className="speaker-label">CareerAI Interviewer:</span>
                      <p>
                        "How do you handle race conditions in distributed systems when multiple workers update the same document?"
                      </p>
                    </div>
                    <div className="mock-user-bubble">
                      <span className="speaker-label">Your Voice Response:</span>
                      <p>
                        "I implement optimistic concurrency control using document versioning, or use distributed locking via Redis Redlock..."
                      </p>
                    </div>
                    <div className="mock-verdict-box">
                      <div className="score-badge">9.0 / 10</div>
                      <div className="verdict-text">
                        <strong>Strong Technical Depth:</strong> Excellent understanding of optimistic concurrency and distributed locking.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'resume' && (
              <div className="demo-content-row">
                <div className="demo-text-side">
                  <div className="demo-chip navy">Multi-Format ATS Builder</div>
                  <h3>Build resumes that recruiters & bots both love</h3>
                  <p>
                    Choose from 4 layout templates and 22 pro Google fonts. Every template is strictly ATS-verified,
                    ensuring applicant tracking systems parse your contact, skills, and work experience with 100% fidelity.
                  </p>
                  <ul className="demo-feature-list">
                    <li>
                      <CheckCircle2 size={16} color="#3b82f6" />
                      <span>4 Layouts: Single Column, Two-Column, Minimalist, Executive</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#3b82f6" />
                      <span>22 Professional typography selections with live font switcher</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#3b82f6" />
                      <span>Dual download: high-res PDF and editable Word (.docx)</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCtaClick('/resume-creator')}
                  >
                    <span>Create Your Resume</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="demo-preview-box">
                  <div className="interactive-resume-preview">
                    <div className="resume-picker-bar">
                      <span className="badge-pill active">Modern Single Column</span>
                      <span className="badge-pill">Two-Column Split</span>
                      <span className="badge-pill">Executive Banner</span>
                    </div>
                    <div className="resume-sheet">
                      <h4 className="sheet-name">Alex Morgan</h4>
                      <p className="sheet-title">Lead Software Engineer · alex@example.com</p>
                      <div className="sheet-sep" />
                      <div className="sheet-block">
                        <strong>Technical Skills</strong>
                        <p>React.js, Node.js, Python, PostgreSQL, AWS, Docker, Microservices</p>
                      </div>
                      <div className="sheet-block">
                        <strong>Experience</strong>
                        <p>Senior Full-Stack Engineer — FinTech Corp (2022 – Present)</p>
                        <p className="bullet">• Scaled payment ingestion pipeline handling 50k+ daily transactions</p>
                      </div>
                    </div>
                    <div className="download-bar">
                      <span className="btn-dl">Export PDF</span>
                      <span className="btn-dl docx">Export DOCX</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'roadmap' && (
              <div className="demo-content-row">
                <div className="demo-text-side">
                  <div className="demo-chip blue">Tailored Study Plans</div>
                  <h3>Custom 5–7 Day Preparation Roadmaps</h3>
                  <p>
                    Never wonder what to study before an interview again. Upload a job posting to extract key focus areas
                    and generate day-by-day structured milestone roadmaps packed with technical and behavioral questions.
                  </p>
                  <ul className="demo-feature-list">
                    <li>
                      <CheckCircle2 size={16} color="#2563eb" />
                      <span>Daily breakdowns customized to role seniority</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#2563eb" />
                      <span>Curated technical questions with key points to mention</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#2563eb" />
                      <span>One-click integration with the Plan Tracker</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCtaClick('/interview-report')}
                  >
                    <span>Generate Prep Roadmap</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="demo-preview-box">
                  <div className="interactive-roadmap-preview">
                    <div className="roadmap-day-card">
                      <span className="day-number">Day 1</span>
                      <div>
                        <h5>Core Architecture & System Patterns</h5>
                        <p>Review event-driven design, message queues, and API idempotency.</p>
                      </div>
                    </div>
                    <div className="roadmap-day-card">
                      <span className="day-number">Day 2</span>
                      <div>
                        <h5>Database Scaling & Performance</h5>
                        <p>Sharding, indexing strategies, write amplification, and connection pooling.</p>
                      </div>
                    </div>
                    <div className="roadmap-day-card">
                      <span className="day-number">Day 3</span>
                      <div>
                        <h5>Behavioral & Leadership Scenarios</h5>
                        <p>Practice STAR-format responses for technical conflicts and tight deadlines.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeDemoTab === 'ats' && (
              <div className="demo-content-row">
                <div className="demo-text-side">
                  <div className="demo-chip amber">ATS Keyword Matcher</div>
                  <h3>Beat the automated recruiter screening gate</h3>
                  <p>
                    Applicant Tracking Systems reject over 70% of resumes before a human recruiter even looks at them.
                    Our analyzer highlights matching competencies and exposes critical missing keywords.
                  </p>
                  <ul className="demo-feature-list">
                    <li>
                      <CheckCircle2 size={16} color="#f59e0b" />
                      <span>0–100% overall ATS match compatibility score</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#f59e0b" />
                      <span>Categorized keyword matching & density analysis</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} color="#f59e0b" />
                      <span>One-click AI Enhancer to rewrite weak bullet points</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCtaClick('/ats-calculator')}
                  >
                    <span>Check Your ATS Score</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                <div className="demo-preview-box">
                  <div className="interactive-ats-preview">
                    <div className="ats-score-meter">
                      <div className="meter-circle">
                        <span className="meter-score">85%</span>
                        <span className="meter-label">Match Score</span>
                      </div>
                      <div className="meter-verdict">
                        <span className="status-high">Strong ATS Match</span>
                        <p>Your resume matches 17 out of 20 critical requirements.</p>
                      </div>
                    </div>
                    <div className="keywords-wrap">
                      <span className="kw matched">✓ React.js (Matched)</span>
                      <span className="kw matched">✓ Node.js (Matched)</span>
                      <span className="kw matched">✓ Microservices (Matched)</span>
                      <span className="kw missing">⚠ Kubernetes (Missing)</span>
                      <span className="kw missing">⚠ CI/CD Pipeline (Missing)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 5. HOW IT WORKS ==================== */}
      <section className="landing-how-section" id="how-it-works">
        <div className="section-container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Seamless 3-Step Workflow</span>
            <h2 className="section-title">How CareerAI Accelerates Your Career</h2>
            <p className="section-desc">
              From zero to interview-ready in a structured, measurable progression.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num-badge">01</div>
              <h4>Build or Import Your Resume</h4>
              <p>
                Use our ATS builder with 4 modern layouts, or upload an existing PDF. Preview in real time
                and export whenever you want in PDF or Word format.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">02</div>
              <h4>Simulate Interviews & Find Gaps</h4>
              <p>
                Paste your target job description. Generate tailored technical Q&As and practice live
                voice AI mock interviews to sharpen answers and communication.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">03</div>
              <h4>Track Progress & Get Hired</h4>
              <p>
                Follow your customized 5–7 day roadmap using the Plan Tracker. Check off daily milestones,
                monitor readiness, and step into interviews with total confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. GAMIFIED CREDIT REWARDS ==================== */}
      <section className="landing-credits-callout">
        <div className="section-container">
          <div className="credits-banner-card">
            <div className="credits-banner-content">
              <div className="credits-icon-sphere">
                <Coins size={36} />
              </div>
              <div>
                <span className="banner-eyebrow">Gamified Motivation</span>
                <h3 className="banner-title">Earn Credits While You Practice</h3>
                <p className="banner-desc">
                  Start with <strong>100 Free Credits</strong> on signup. Score <strong>8.0 or higher</strong> in any AI mock
                  interview and get rewarded with <strong>+25 bonus credits</strong> automatically credited to your account!
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-credits-cta"
              onClick={() => handleCtaClick('/mock-interview')}
            >
              <span>{user ? 'Practice for +25 Credits' : 'Claim 100 Free Credits'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== 7. TESTIMONIALS ==================== */}
      <section className="landing-testimonials-section">
        <div className="section-container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Real Candidate Success</span>
            <h2 className="section-title">Built for Serious Job Seekers</h2>
            <p className="section-desc">
              Discover how developers and tech professionals used CareerAI to accelerate their interview prep.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="quote">
                "The Voice Mock Interview was a game changer for me. Being able to practice answering system design
                questions verbally and getting instant scoring helped me eliminate filler words and ace my Google onsite."
              </p>
              <div className="author-row">
                <div className="avatar">RK</div>
                <div>
                  <strong>Rohan K.</strong>
                  <span>Senior Software Engineer</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="quote">
                "I was applying to 50+ roles with no callbacks. I tested my resume on CareerAI's ATS Calculator,
                rebuilt it with the Modern Single Column layout, and had 4 interview invites within two weeks."
              </p>
              <div className="author-row">
                <div className="avatar">PS</div>
                <div>
                  <strong>Priya S.</strong>
                  <span>Full-Stack Developer</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars-row">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="quote">
                "The 6-day prep roadmap gives you a clear daily action plan instead of drowning in random LeetCode questions.
                The Plan Tracker kept me accountable the entire week before my final round."
              </p>
              <div className="author-row">
                <div className="avatar">AM</div>
                <div>
                  <strong>Ananya M.</strong>
                  <span>Backend Engineer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 8. FAQ ACCORDION ==================== */}
      <section className="landing-faq-section" id="faq">
        <div className="section-container">
          <div className="section-heading-center">
            <span className="section-eyebrow">Got Questions?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-desc">
              Everything you need to know about CareerAI, our tools, and credits.
            </p>
          </div>

          <div className="faq-accordion-wrap">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div className={`faq-item${isOpen ? ' open' : ''}`} key={index}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="chevron-icon" />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ==================== 9. BOTTOM FINAL CTA ==================== */}
      <section className="landing-bottom-cta">
        <div className="section-container">
          <div className="bottom-cta-box">
            <span className="bottom-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <CareerAIIcon size={16} />
              <span>Start Accelerating Today</span>
            </span>
            <h2 className="bottom-title">
              Ready to Walk Into Your Next Interview With Complete Confidence?
            </h2>
            <p className="bottom-desc">
              Join CareerAI today. Create ATS-optimized resumes, practice real-time AI mock interviews,
              and follow tailored roadmaps.
            </p>

            <div className="bottom-btn-row">
              <button
                type="button"
                className="btn btn-hero-primary"
                onClick={() => handleCtaClick('/dashboard')}
              >
                <span>{user ? 'Go to Dashboard' : 'Create Account — 100 Credits'}</span>
                <ArrowRight size={18} />
              </button>

              {!user && (
                <Link to="/login" className="btn btn-ghost-light">
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 10. FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand-col">
            <div className="footer-logo">
              <CareerAILogo size={28} />
            </div>
            <p className="footer-tagline">
              The complete AI-powered career intelligence platform for modern tech professionals.
            </p>
          </div>

          <div className="footer-links-col">
            <h5>Core Tools</h5>
            <ul>
              <li>
                <Link to="/mock-interview">Mock AI Interview</Link>
              </li>
              <li>
                <Link to="/interview-report">Interview Roadmaps</Link>
              </li>
              <li>
                <Link to="/resume-creator">ATS Resume Builder</Link>
              </li>
              <li>
                <Link to="/ats-calculator">ATS Score Calculator</Link>
              </li>
              <li>
                <Link to="/ats-enhancer">AI Resume Enhancer</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h5>Productivity</h5>
            <ul>
              <li>
                <Link to="/plan-tracker">Plan Tracker</Link>
              </li>
              <li>
                <Link to="/wishlist">Wishlist & Bookmarks</Link>
              </li>
              <li>
                <Link to="/profile">Profile & Skills</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h5>Account</h5>
            <ul>
              {user ? (
                <>
                  <li>
                    <Link to="/dashboard">My Workspace</Link>
                  </li>
                  <li>
                    <Link to="/profile">Account Settings</Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login">Sign In</Link>
                  </li>
                  <li>
                    <Link to="/register">Create Free Account</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>© {new Date().getFullYear()} CareerAI. All rights reserved.</p>
          <div className="footer-legal">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

