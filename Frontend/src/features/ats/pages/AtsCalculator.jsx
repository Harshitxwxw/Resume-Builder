import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart2,
  FileText,
  FilePlus,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Key,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  Zap,
  Tag,
  Wand2
} from 'lucide-react'
import {
  getSavedResumes,
  ACTIVE_RESUME_ID_KEY,
  CURRENT_RESUME_DATA_KEY
} from '../../resume/services/resume.storage'
import {
  calculateAtsScoreApi,
  resumeDataToText,
  getStoredGeminiKey,
  setStoredGeminiKey
} from '../services/ats.api'
import '../styles/atsCalculator.scss'

const SAMPLE_JOB_PRESETS = [
  {
    title: 'Senior Full Stack Engineer',
    desc: 'Looking for a Senior Full Stack Software Engineer proficient in React.js, Node.js, TypeScript, and cloud services (AWS/Docker). Must have experience building resilient RESTful microservices, Redis caching, CI/CD pipelines, and writing unit tests with Jest. Demonstrated ability to optimize high-traffic platforms with measurable performance gains.'
  },
  {
    title: 'Frontend React Developer',
    desc: 'Seeking a passionate Frontend Developer with deep expertise in React 18, Next.js, TypeScript, Tailwind CSS, and state management (Redux/Zustand). Experience in core web vitals optimization, accessible UI components, responsive design, and integrating RESTful APIs.'
  },
  {
    title: 'Backend Node.js Engineer',
    desc: 'We are hiring a Backend Engineer with strong expertise in Node.js, Express, MongoDB, PostgreSQL, and Redis. Responsibilities include designing scalable distributed architectures, handling authentication via JWT/OAuth, Docker containerization, and building high-throughput APIs.'
  }
]

const AtsCalculator = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Saved resumes list
  const [savedResumes, setSavedResumes] = useState([])
  const [resumeSource, setResumeSource] = useState('existing') // 'existing' | 'upload' | 'paste'
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [pastedText, setPastedText] = useState('')

  // Target job inputs
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer')
  const [jobDescription, setJobDescription] = useState(SAMPLE_JOB_PRESETS[0].desc)

  // API Key modal
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredGeminiKey())
  const [keySavedToast, setKeySavedToast] = useState(false)

  // Evaluation state
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Load existing resumes on mount
  useEffect(() => {
    const list = getSavedResumes()
    setSavedResumes(list)
    if (list.length > 0) {
      // If location state requested a specific resume
      const targetId = location.state?.resumeId || list[0].id
      setSelectedResumeId(targetId)
    } else {
      setResumeSource('paste')
    }
  }, [location.state])

  // Save custom Gemini API key
  const handleSaveApiKey = () => {
    setStoredGeminiKey(apiKeyInput)
    setShowKeyModal(false)
    setKeySavedToast(true)
    setTimeout(() => setKeySavedToast(false), 2500)
  }

  // Handle preset selection
  const handleSelectPreset = (preset) => {
    setJobTitle(preset.title)
    setJobDescription(preset.desc)
  }

  // Handle file drop / select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  // Get current active resume data
  const getSelectedResumeData = () => {
    return savedResumes.find((r) => r.id === selectedResumeId)
  }

  // Trigger calculation
  const handleCalculateAts = async () => {
    setErrorMsg('')
    setLoading(true)
    setLoadingStep('Reading resume & extracting ATS tokens...')

    try {
      let resumeText = ''
      let resumeData = null
      let resumeFile = null

      if (resumeSource === 'existing') {
        const found = getSelectedResumeData()
        if (!found) {
          setErrorMsg('Please select a resume to analyze.')
          setLoading(false)
          return
        }
        resumeData = found.data
        resumeText = resumeDataToText(found.data)
      } else if (resumeSource === 'upload') {
        if (!uploadedFile) {
          setErrorMsg('Please upload a PDF resume file.')
          setLoading(false)
          return
        }
        resumeFile = uploadedFile
      } else {
        if (!pastedText.trim()) {
          setErrorMsg('Please paste your resume text.')
          setLoading(false)
          return
        }
        resumeText = pastedText.trim()
      }

      setLoadingStep('Auditing against job description with Gemini AI...')
      const evalResult = await calculateAtsScoreApi({
        resumeText,
        resumeData,
        resumeFile,
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        apiKey: getStoredGeminiKey()
      })

      setLoadingStep('Compiling breakdown & improvement suggestions...')
      setResult(evalResult)

      // Scroll to results
      setTimeout(() => {
        const el = document.getElementById('ats-results-view')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Calculation error:', err)
      setErrorMsg('Failed to calculate ATS score. Please check your inputs.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // Navigate to Enhancer with this resume
  const handleOpenEnhancer = () => {
    const found = getSelectedResumeData()
    navigate('/ats-enhancer', {
      state: {
        resumeId: selectedResumeId,
        resumeData: found?.data || null,
        targetRole: jobTitle,
        jobDescription: jobDescription
      }
    })
  }

  const selectedResume = getSelectedResumeData()

  return (
    <main className="ats-calculator-page">
      {/* Toast Alert */}
      {keySavedToast && (
        <div className="ats-toast">
          <Key size={15} />
          <span>Gemini API Key saved successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="ats-header-card">
        <div className="header-left">
          <div className="header-pill">
            <Zap size={14} />
            <span>AI-Powered ATS Auditor</span>
          </div>
          <h1 className="header-title">ATS Resume Score Calculator</h1>
          <p className="header-subtitle">
            Scan your resume against any target job description using AI to discover your ATS match percentage,
            missing keywords, and actionable improvements.
          </p>
        </div>

        <div className="header-right-actions">
          <button
            type="button"
            className="btn btn-api-key"
            onClick={() => setShowKeyModal(true)}
            title="Configure custom Gemini API Key"
          >
            <Key size={14} />
            <span>{getStoredGeminiKey() ? 'API Key: Custom Set' : 'Gemini API Key'}</span>
          </button>

          <button
            type="button"
            className="btn btn-open-enhancer"
            onClick={() => navigate('/ats-enhancer')}
            title="Open ATS Resume Enhancer Tool"
          >
            <Wand2 size={15} />
            <span>Open ATS Enhancer</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="api-key-modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="api-key-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Key size={18} />
                <h3>Gemini API Key Configuration</h3>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowKeyModal(false)}
              >
                &times;
              </button>
            </div>

            <p className="modal-desc">
              CareerAI comes with a built-in Gemini API key on the backend. If you wish to use your own personal
              Google Gemini API key for higher rate limits or custom billing, enter it below.
            </p>

            <div className="modal-input-group">
              <label>Google Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy... or AQ.Ab..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-clear"
                onClick={() => {
                  setApiKeyInput('')
                  setStoredGeminiKey('')
                  setShowKeyModal(false)
                }}
              >
                Reset to Default
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={handleSaveApiKey}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* INPUT FORM: RESUME SELECTION & TARGET JOB */}
      {/* ============================================================ */}
      <div className="ats-input-container">
        {/* Step 1: Resume Source Selection */}
        <section className="input-panel">
          <div className="panel-header">
            <div className="step-badge">1</div>
            <div className="panel-titles">
              <h2>Select or Add Resume</h2>
              <p>Choose an existing ATS resume created in the app, or upload a new one.</p>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="source-tabs">
            <button
              type="button"
              className={`source-tab-btn${resumeSource === 'existing' ? ' active' : ''}`}
              onClick={() => setResumeSource('existing')}
              disabled={savedResumes.length === 0}
            >
              <FileText size={15} />
              <span>Select from Existing ({savedResumes.length})</span>
            </button>

            <button
              type="button"
              className={`source-tab-btn${resumeSource === 'upload' ? ' active' : ''}`}
              onClick={() => setResumeSource('upload')}
            >
              <Upload size={15} />
              <span>Upload PDF</span>
            </button>

            <button
              type="button"
              className={`source-tab-btn${resumeSource === 'paste' ? ' active' : ''}`}
              onClick={() => setResumeSource('paste')}
            >
              <FilePlus size={15} />
              <span>Paste Resume Text</span>
            </button>
          </div>

          {/* Source 1: Existing Resume Dropdown & Summary */}
          {resumeSource === 'existing' && (
            <div className="existing-resume-box">
              {savedResumes.length === 0 ? (
                <div className="no-resumes-hint">
                  <p>No saved resumes found in your workspace.</p>
                  <button
                    type="button"
                    className="btn btn-create-inline"
                    onClick={() => navigate('/resume-creator')}
                  >
                    Create a Resume First
                  </button>
                </div>
              ) : (
                <>
                  <div className="select-resume-wrap">
                    <label>Select Saved Resume</label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                    >
                      {savedResumes.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title || res.data?.personal?.fullName || 'ATS Resume'} — (
                          {res.data?.personal?.profession || 'Professional'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedResume && (
                    <div className="selected-resume-card">
                      <div className="card-top-row">
                        <div className="resume-icon-box">
                          <FileText size={20} />
                        </div>
                        <div className="resume-meta">
                          <h4 className="title">{selectedResume.title}</h4>
                          <span className="subtitle">
                            {selectedResume.data?.personal?.profession || 'Professional'} &middot;{' '}
                            {selectedResume.data?.experience?.length || 0} Experience Roles &middot;{' '}
                            {selectedResume.data?.skills?.length || 0} Skills Listed
                          </span>
                        </div>
                      </div>

                      {selectedResume.data?.summary && (
                        <p className="summary-preview">
                          <strong>Summary:</strong> {selectedResume.data.summary}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Source 2: Upload PDF */}
          {resumeSource === 'upload' && (
            <div className="upload-file-box">
              <label className="dropzone-label">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="file-input-hidden"
                />
                <div className="dropzone-content">
                  <Upload size={32} className="upload-icon" />
                  <span className="upload-title">
                    {uploadedFile ? uploadedFile.name : 'Click or drag PDF resume here'}
                  </span>
                  <span className="upload-hint">Supported formats: PDF (Maximum size: 10MB)</span>
                  {uploadedFile && (
                    <span className="file-success-badge">
                      <Check size={13} /> {uploadedFile.name} ready for scan
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Source 3: Paste Text */}
          {resumeSource === 'paste' && (
            <div className="paste-text-box">
              <label>Paste Complete Resume Content</label>
              <textarea
                rows={8}
                placeholder="Paste your professional summary, experience bullets, skills, and education here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Step 2: Target Job Details */}
        <section className="input-panel">
          <div className="panel-header">
            <div className="step-badge">2</div>
            <div className="panel-titles">
              <h2>Target Job Requirements</h2>
              <p>Enter the job title and description you want to optimize against.</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="presets-row">
            <span className="presets-label">Quick Presets:</span>
            {SAMPLE_JOB_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-preset-pill"
                onClick={() => handleSelectPreset(preset)}
              >
                {preset.title}
              </button>
            ))}
          </div>

          <div className="job-inputs-wrap">
            <div className="form-group">
              <label>Target Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full Stack Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Target Job Description / Key Responsibilities *</label>
              <textarea
                rows={7}
                required
                placeholder="Paste key responsibilities, required qualifications, and tools from the job listing..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="ats-error-banner">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            className="btn btn-calculate-cta"
            disabled={loading}
            onClick={handleCalculateAts}
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="spin-icon" />
                <span>{loadingStep || 'Calculating ATS Score...'}</span>
              </>
            ) : (
              <>
                <Zap size={17} />
                <span>Calculate ATS Score with AI</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* ============================================================ */}
      {/* RESULTS SECTION: OVERALL SCORE, PILLARS, MISSING, TIPS */}
      {/* ============================================================ */}
      {result && (
        <div className="ats-results-view" id="ats-results-view">
          {/* Main Score Hero Card */}
          <div className="score-hero-card">
            <div className="hero-left-content">
              <div className="match-tag-row">
                <span className={`match-badge ${result.matchLevel?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {result.matchLevel || 'High Match'}
                </span>
                <span className="target-role-tag">Target: {jobTitle}</span>
              </div>

              <h2 className="score-hero-title">
                {result.overallScore >= 80
                  ? 'Strong ATS Compatibility & Clear Match!'
                  : result.overallScore >= 65
                  ? 'Moderate Fit — Good Foundation with Improvement Potential'
                  : 'Needs Optimization to Clear Strict ATS Filters'}
              </h2>

              <p className="summary-verdict-text">{result.summaryVerdict}</p>

              {/* Direct Link to ATS Enhancer */}
              <div className="hero-cta-strip">
                <button
                  type="button"
                  className="btn btn-enhance-direct"
                  onClick={handleOpenEnhancer}
                >
                  <Sparkles size={16} />
                  <span>Enhance This Resume with AI</span>
                  <ArrowRight size={15} />
                </button>
                <span className="enhance-hint">
                  Automatically rewrites bullets with STAR formula & adds missing keywords
                </span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="hero-score-gauge">
              <div className="gauge-circle-outer">
                <svg className="gauge-svg" viewBox="0 0 120 120">
                  <circle
                    className="gauge-bg"
                    cx="60"
                    cy="60"
                    r="50"
                  />
                  <circle
                    className="gauge-progress"
                    cx="60"
                    cy="60"
                    r="50"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * result.overallScore) / 100}
                  />
                </svg>
                <div className="gauge-center-text">
                  <span className="score-num">{result.overallScore}</span>
                  <span className="score-max">/ 100</span>
                  <span className="score-label">ATS Score</span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown: 5 Pillars */}
          {result.breakdown && (
            <div className="pillars-grid">
              {Object.entries(result.breakdown).map(([key, item]) => {
                const labels = {
                  keywordsMatch: 'Keywords Match',
                  experienceRelevance: 'Experience Relevance',
                  impactAndMetrics: 'Impact & Quantified Metrics',
                  atsFormatting: 'ATS Formatting & Structure',
                  skillsCoverage: 'Skills Coverage'
                }
                const score = item.score || 75
                return (
                  <div className="pillar-card" key={key}>
                    <div className="pillar-header">
                      <span className="pillar-name">{labels[key] || key}</span>
                      <span className="pillar-score">{score}%</span>
                    </div>

                    <div className="pillar-bar-track">
                      <div
                        className="pillar-bar-fill"
                        style={{
                          width: `${score}%`,
                          backgroundColor:
                            score >= 80 ? '#2563eb' : score >= 65 ? '#d97706' : '#ef4444'
                        }}
                      />
                    </div>

                    <p className="pillar-desc">{item.description}</p>
                    {item.weight && <span className="pillar-weight">Weight: {item.weight}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Missing Things: Skills, Keywords, Sections */}
          <div className="results-dual-grid">
            {/* Left: Missing Skills & Keywords */}
            <div className="results-card missing-card">
              <div className="card-header-bar">
                <div className="icon-box red">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="card-title">Missing Skills & Keywords</h3>
                  <p className="card-subtitle">Critical keywords expected by ATS that were not detected.</p>
                </div>
              </div>

              {/* Missing Skills */}
              <div className="missing-block">
                <span className="block-label">High Priority Missing Skills:</span>
                <div className="missing-skills-list">
                  {(result.missingThings?.missingSkills || []).map((item, idx) => (
                    <div className="missing-skill-pill" key={idx}>
                      <span className="skill-title">{typeof item === 'object' ? item.skill : item}</span>
                      {item.importance && (
                        <span className={`importance-tag ${item.importance.toLowerCase()}`}>
                          {item.importance}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Keywords Cloud */}
              <div className="missing-block">
                <span className="block-label">Missing Industry Keywords:</span>
                <div className="keywords-cloud">
                  {(result.missingThings?.missingKeywords || []).map((kw, kIdx) => (
                    <span className="keyword-chip missing" key={kIdx}>
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Sections */}
              {result.missingThings?.missingSections?.length > 0 && (
                <div className="missing-block">
                  <span className="block-label">Missing Structural Elements:</span>
                  <ul className="missing-sections-list">
                    {result.missingThings.missingSections.map((sec, sIdx) => (
                      <li key={sIdx}>
                        <span className="dot" />
                        <span>{sec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Detected Strengths & Matched Keywords */}
            <div className="results-card strengths-card">
              <div className="card-header-bar">
                <div className="icon-box green">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="card-title">Key Strengths & Matched Keywords</h3>
                  <p className="card-subtitle">What your resume already gets right for this job.</p>
                </div>
              </div>

              {/* Key Strengths */}
              <div className="strengths-block">
                <span className="block-label">Detected Strengths:</span>
                <ul className="strengths-list">
                  {(result.keyStrengths || []).map((str, sIdx) => (
                    <li key={sIdx}>
                      <CheckCircle2 size={15} className="check-icon" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Matched Keywords Cloud */}
              <div className="strengths-block">
                <span className="block-label">Successfully Matched Keywords:</span>
                <div className="keywords-cloud">
                  {(result.matchingKeywords || []).map((kw, mIdx) => (
                    <span className="keyword-chip matched" key={mIdx}>
                      <Check size={11} /> {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Improvement Tips with Concrete Examples */}
          {result.improvementTips && (
            <div className="results-card improvement-card">
              <div className="card-header-bar">
                <div className="icon-box blue">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="card-title">Actionable Improvement Tips</h3>
                  <p className="card-subtitle">
                    Follow these step-by-step recommendations to elevate your resume into the top 5% candidate tier.
                  </p>
                </div>
              </div>

              <div className="tips-list">
                {result.improvementTips.map((tip, idx) => (
                  <div className="tip-item-card" key={idx}>
                    <div className="tip-header-row">
                      <span className={`priority-tag ${tip.priority?.toLowerCase() || 'medium'}`}>
                        {tip.priority || 'Medium'} Priority
                      </span>
                      <span className="tip-category">{tip.category || 'Content'}</span>
                      <h4 className="tip-title">{tip.title}</h4>
                    </div>

                    <p className="tip-recommendation">{tip.recommendation}</p>

                    {tip.example && (
                      <div className="tip-example-box">
                        <span className="example-label">Concrete Rewrite Example:</span>
                        <p className="example-text">{tip.example}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom CTA to Enhancer */}
              <div className="tips-footer-cta">
                <div className="cta-left">
                  <h4>Want AI to automatically apply all these improvements?</h4>
                  <p>Our ATS Enhancer tool rewrites your resume using STAR metrics and target keywords in seconds.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-enhance-large"
                  onClick={handleOpenEnhancer}
                >
                  <Wand2 size={16} />
                  <span>Enhance Resume with AI Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default AtsCalculator
