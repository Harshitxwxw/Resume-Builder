import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Wand2,
  Sparkles,
  FileText,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Save,
  Zap,
  Layers,
  BarChart2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sliders,
  ChevronRight,
  TrendingUp,
  Tag,
  Coins
} from 'lucide-react'
import {
  getSavedResumes,
  saveResume,
  createNewResume,
  ACTIVE_RESUME_ID_KEY,
  CURRENT_RESUME_DATA_KEY
} from '../../resume/services/resume.storage'
import {
  getUserCredits,
  hasSufficientCredits,
  deductCredits,
  addCredits,
  syncCreditsFromDb,
  ATS_ENHANCER_COST
} from '../../credits/services/credits.storage'
import { getUserScopedKey } from '../../../utils/userScope'
import {
  enhanceResumeApi,
  resumeDataToText,
  getStoredGeminiKey
} from '../services/ats.api'
import '../styles/atsEnhancer.scss'

const AtsEnhancer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Resumes list
  const [savedResumes, setSavedResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [targetRole, setTargetRole] = useState('Senior Full Stack Software Engineer')
  const [jobDescription, setJobDescription] = useState('')
  const [enhancementFocus, setEnhancementFocus] = useState('all') // 'all', 'summary', 'experience', 'skills', 'projects'

  // Credits System State (15 credits per ATS enhancement)
  const [userCredits, setUserCredits] = useState(() => getUserCredits())
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)

  // Loading & Results
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [enhancedResult, setEnhancedResult] = useState(null)
  const [activeTab, setActiveTab] = useState('diff') // 'diff' | 'full' | 'summary' | 'experience'
  const [toastMessage, setToastMessage] = useState('')
  const [copiedSection, setCopiedSection] = useState('')

  // Sync user credits on mount and on storage/event updates
  useEffect(() => {
    syncCreditsFromDb().then((bal) => {
      if (typeof bal === 'number') setUserCredits(bal)
    })

    const handleCreditsUpdate = () => {
      setUserCredits(getUserCredits())
    }

    window.addEventListener('career_credits_updated', handleCreditsUpdate)
    return () => {
      window.removeEventListener('career_credits_updated', handleCreditsUpdate)
    }
  }, [])

  useEffect(() => {
    const list = getSavedResumes()
    setSavedResumes(list)

    // Check location state
    if (location.state?.resumeId && list.some((r) => r.id === location.state.resumeId)) {
      setSelectedResumeId(location.state.resumeId)
    } else if (list.length > 0) {
      setSelectedResumeId(list[0].id)
    }

    if (location.state?.targetRole) {
      setTargetRole(location.state.targetRole)
    }
    if (location.state?.jobDescription) {
      setJobDescription(location.state.jobDescription)
    }
  }, [location.state])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3200)
  }

  const getSelectedResume = () => {
    return savedResumes.find((r) => r.id === selectedResumeId)
  }

  // Credit & resume eligibility
  const hasEnoughCredits = userCredits >= ATS_ENHANCER_COST
  const canEnhance = hasEnoughCredits && !loading && savedResumes.length > 0 && Boolean(selectedResumeId)

  const handleEnhance = async () => {
    const resume = getSelectedResume()
    if (!resume) {
      showToast('Please select a resume to enhance.')
      return
    }

    // 1. Verify credits first
    if (!hasSufficientCredits(ATS_ENHANCER_COST)) {
      setShowInsufficientModal(true)
      return
    }

    // 2. Deduct 15 credits
    const deduction = deductCredits(ATS_ENHANCER_COST, 'ATS Resume Enhancement')
    if (!deduction.success) {
      setShowInsufficientModal(true)
      return
    }

    setUserCredits(deduction.newBalance)
    showToast(`🪙 15 Credits used. Remaining balance: ${deduction.newBalance} credits.`)

    setLoading(true)
    setLoadingStep('Analyzing current resume structure & gaps...')

    try {
      setLoadingStep('Generating STAR-method bullets & injecting ATS keywords with AI...')
      const result = await enhanceResumeApi({
        resumeData: resume.data,
        resumeText: resumeDataToText(resume.data),
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim(),
        enhancementFocus,
        apiKey: getStoredGeminiKey()
      })

      setLoadingStep('Finalizing enhanced resume...')
      setEnhancedResult(result)
      showToast('Resume successfully enhanced with AI! ✨')

      setTimeout(() => {
        const el = document.getElementById('enhancer-results-section')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error(err)
      showToast('⚠️ Enhancement failed. 15 Credits refunded to your balance.')
      // Auto-refund credits on error
      addCredits(ATS_ENHANCER_COST, 'ATS Enhancement Refund (Error)')
      setUserCredits(getUserCredits())
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // Save the enhanced version as a new resume in storage
  const handleSaveAsNewResume = () => {
    if (!enhancedResult?.enhancedData) return

    const baseResume = getSelectedResume()
    const newTitle = `${baseResume?.title || targetRole} (AI Enhanced)`
    const newResume = createNewResume(enhancedResult.enhancedData, newTitle)

    try {
      localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), newResume.id)
      localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(enhancedResult.enhancedData))
    } catch (e) {
      console.warn(e)
    }

    showToast('Saved as new ATS Resume in your workspace!')
    setTimeout(() => {
      navigate(`/resume-creator?id=${newResume.id}`)
    }, 1000)
  }

  // Copy text helper
  const handleCopy = (text, sectionName) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionName)
    showToast(`Copied ${sectionName} to clipboard!`)
    setTimeout(() => setCopiedSection(''), 2000)
  }

  const selectedResume = getSelectedResume()

  return (
    <main className="ats-enhancer-page">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="enhancer-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="enhancer-header">
        <div className="header-left">
          <div className="header-badge">
            <Wand2 size={14} />
            <span>AI Resume Optimization Engine</span>
          </div>
          <h1 className="header-title">ATS Resume Enhancer</h1>
          <p className="header-subtitle">
            Transform passive bullet points into quantified STAR accomplishments, inject high-yield keywords,
            and boost your resume's interview callback probability with Gemini AI.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary-nav"
            onClick={() => navigate('/ats-calculator')}
          >
            <BarChart2 size={15} />
            <span>Check ATS Score First</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONFIGURATION & SOURCE INPUT SECTION */}
      {/* ============================================================ */}
      <div className="enhancer-config-grid">
        {/* Step 1: Select Resume */}
        <section className="config-card">
          <div className="card-top">
            <span className="step-num">1</span>
            <div>
              <h3>Select Resume to Enhance</h3>
              <p>Pick a resume from your created ATS resumes collection.</p>
            </div>
          </div>

          {savedResumes.length === 0 ? (
            <div className="no-resumes-box">
              <p>No resumes created yet in your workspace.</p>
              <button
                type="button"
                className="btn btn-create-now"
                onClick={() => navigate('/resume-creator')}
              >
                Create ATS Resume First
              </button>
            </div>
          ) : (
            <div className="resume-select-group">
              <label>Active Resume</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                {savedResumes.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.title || res.data?.personal?.fullName || 'ATS Resume'} — (
                    {res.data?.personal?.profession || 'Candidate'})
                  </option>
                ))}
              </select>

              {selectedResume && (
                <div className="current-preview-pill">
                  <span className="name">{selectedResume.title}</span>
                  <span className="meta">
                    {selectedResume.data?.experience?.length || 0} Work Roles &middot;{' '}
                    {selectedResume.data?.skills?.length || 0} Skills &middot;{' '}
                    {selectedResume.data?.projects?.length || 0} Projects
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Target Role & Enhancement Options */}
        <section className="config-card">
          <div className="card-top">
            <span className="step-num">2</span>
            <div>
              <h3>Target Role & Tailoring Strategy</h3>
              <p>Specify the target job title and optional job description for tailored keyword injection.</p>
            </div>
          </div>

          <div className="form-fields">
            <div className="form-group">
              <label>Target Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Senior Full Stack Software Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Target Job Description (Optional but recommended)</label>
              <textarea
                rows={3}
                placeholder="Paste key responsibilities and tools from the job listing..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div className="focus-row">
              <label>Enhancement Focus:</label>
              <div className="focus-pills">
                {[
                  { id: 'all', label: 'Complete Resume' },
                  { id: 'summary', label: 'Summary Only' },
                  { id: 'experience', label: 'Experience Bullets' },
                  { id: 'skills', label: 'Skills & Keywords' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`focus-pill${enhancementFocus === f.id ? ' active' : ''}`}
                    onClick={() => setEnhancementFocus(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Insufficient Credits Banner (Requires 15 Credits) */}
          {!hasEnoughCredits && (
            <div className="credits-insufficient-banner">
              <AlertCircle size={15} />
              <div className="banner-text">
                <span>You need <strong>15 Credits</strong> to enhance your resume with AI. Your balance: <strong>{userCredits} Credits</strong>.</span>
                <button
                  type="button"
                  className="banner-earn-link"
                  onClick={() => navigate('/plan-tracker')}
                >
                  Earn +15 in Plan Tracker →
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className={`btn btn-enhance-main ${!canEnhance ? 'disabled-btn' : ''} ${!hasEnoughCredits ? 'insufficient-btn' : ''}`}
            disabled={!canEnhance || loading}
            onClick={handleEnhance}
            title={
              !hasEnoughCredits
                ? `Insufficient credits (15 required). Current balance: ${userCredits}`
                : savedResumes.length === 0
                  ? 'Please create a resume first to enhance'
                  : 'Enhance Resume with AI (15 Credits)'
            }
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="spin-icon" />
                <span>{loadingStep || 'Enhancing with Gemini AI...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={17} />
                <span>Enhance Resume with AI Now</span>
                <span className="btn-cost-badge">
                  <Coins size={13} className="cost-coins-icon" />
                  <span>15 Credits</span>
                </span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* ============================================================ */}
      {/* RESULTS SECTION: BEFORE & AFTER DIFFS, FULL ENHANCED DATA */}
      {/* ============================================================ */}
      {enhancedResult && (
        <div className="enhancer-results-section" id="enhancer-results-section">
          {/* Header Banner of Enhanced Output */}
          <div className="results-hero-card">
            <div className="hero-left">
              <div className="badge-row">
                <span className="boost-badge">
                  <TrendingUp size={14} />
                  <span>{enhancedResult.atsScoreBoost || '+28% ATS Boost'}</span>
                </span>
                <span className="role-tag">Tailored for: {targetRole}</span>
              </div>
              <h2 className="hero-title">Your Resume has been AI-Enhanced! 🚀</h2>
              <p className="hero-summary">{enhancedResult.keyChangesSummary}</p>
            </div>

            <div className="hero-actions-wrap">
              <button
                type="button"
                className="btn btn-save-resume"
                onClick={handleSaveAsNewResume}
                title="Save as a new resume in your workspace"
              >
                <Save size={15} />
                <span>Save as New ATS Resume</span>
              </button>

              <button
                type="button"
                className="btn btn-recalc"
                onClick={() =>
                  navigate('/ats-calculator', {
                    state: {
                      resumeData: enhancedResult.enhancedData,
                      jobTitle: targetRole,
                      jobDescription: jobDescription
                    }
                  })
                }
                title="Verify score in ATS Calculator"
              >
                <BarChart2 size={15} />
                <span>Recalculate ATS Score</span>
              </button>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <div className="view-mode-tabs">
            <button
              type="button"
              className={`tab-btn${activeTab === 'diff' ? ' active' : ''}`}
              onClick={() => setActiveTab('diff')}
            >
              <Sliders size={14} />
              <span>Before & After Comparisons</span>
            </button>

            <button
              type="button"
              className={`tab-btn${activeTab === 'full' ? ' active' : ''}`}
              onClick={() => setActiveTab('full')}
            >
              <FileText size={14} />
              <span>Full Enhanced Resume Preview</span>
            </button>
          </div>

          {/* VIEW 1: BEFORE & AFTER COMPARISONS */}
          {activeTab === 'diff' && (
            <div className="diff-comparisons-view">
              <div className="diff-header-bar">
                <h3>Bullet Point Upgrades (STAR Method & Quantified Metrics)</h3>
                <p>See how passive responsibilities were transformed into high-impact accomplishments.</p>
              </div>

              <div className="diff-cards-grid">
                {(enhancedResult.bulletPointComparisons || []).map((comp, idx) => (
                  <div className="comparison-card" key={idx}>
                    <div className="comp-section-tag">
                      <Tag size={12} />
                      <span>{comp.section}</span>
                    </div>

                    <div className="comp-grid">
                      {/* Before Box */}
                      <div className="box before-box">
                        <span className="box-label">Original / Before</span>
                        <p className="box-text">{comp.original}</p>
                      </div>

                      {/* After Box */}
                      <div className="box after-box">
                        <div className="box-header-row">
                          <span className="box-label">AI Enhanced (STAR + Metrics)</span>
                          <button
                            type="button"
                            className="btn-copy-inline"
                            onClick={() => handleCopy(comp.enhanced, `Bullet ${idx + 1}`)}
                            title="Copy enhanced bullet"
                          >
                            {copiedSection === `Bullet ${idx + 1}` ? (
                              <Check size={13} color="#16a34a" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <p className="box-text">{comp.enhanced}</p>
                      </div>
                    </div>

                    {comp.improvement && (
                      <div className="comp-improvement-footer">
                        <Sparkles size={13} className="sparkle" />
                        <span>{comp.improvement}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: FULL ENHANCED RESUME PREVIEW */}
          {activeTab === 'full' && enhancedResult.enhancedData && (
            <div className="full-preview-view">
              {/* Summary Section */}
              <div className="preview-section-card">
                <div className="section-title-row">
                  <h4>Enhanced Professional Summary</h4>
                  <button
                    type="button"
                    className="btn-copy-sec"
                    onClick={() =>
                      handleCopy(enhancedResult.enhancedData.summary, 'Professional Summary')
                    }
                  >
                    <Copy size={13} />
                    <span>Copy Summary</span>
                  </button>
                </div>
                <p className="enhanced-summary-text">{enhancedResult.enhancedData.summary}</p>
              </div>

              {/* Skills Section */}
              <div className="preview-section-card">
                <div className="section-title-row">
                  <h4>Enhanced ATS Skills & Keywords</h4>
                  <button
                    type="button"
                    className="btn-copy-sec"
                    onClick={() =>
                      handleCopy(
                        (enhancedResult.enhancedData.skills || []).join(', '),
                        'Skills'
                      )
                    }
                  >
                    <Copy size={13} />
                    <span>Copy Skills</span>
                  </button>
                </div>
                <div className="skills-pill-wrap">
                  {(enhancedResult.enhancedData.skills || []).map((sk, sIdx) => (
                    <span className="skill-pill" key={sIdx}>
                      {typeof sk === 'string' ? sk : sk.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience Section */}
              <div className="preview-section-card">
                <div className="section-title-row">
                  <h4>Enhanced Work Experience</h4>
                  <button
                    type="button"
                    className="btn-copy-sec"
                    onClick={() =>
                      handleCopy(
                        (enhancedResult.enhancedData.experience || [])
                          .map((e) => `${e.role} at ${e.company}\n${e.description}`)
                          .join('\n\n'),
                        'Experience'
                      )
                    }
                  >
                    <Copy size={13} />
                    <span>Copy Experience</span>
                  </button>
                </div>
                <div className="exp-items-list">
                  {(enhancedResult.enhancedData.experience || []).map((exp, eIdx) => (
                    <div className="exp-card-preview" key={eIdx}>
                      <div className="exp-role-row">
                        <span className="role">{exp.role}</span>
                        <span className="dot">&middot;</span>
                        <span className="company">{exp.company}</span>
                        <span className="duration">
                          ({exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate})
                        </span>
                      </div>
                      <div className="exp-bullets">
                        {exp.description.split('\n').map((line, lIdx) => (
                          <p key={lIdx}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              {enhancedResult.enhancedData.projects?.length > 0 && (
                <div className="preview-section-card">
                  <div className="section-title-row">
                    <h4>Enhanced Projects</h4>
                  </div>
                  <div className="projects-items-list">
                    {enhancedResult.enhancedData.projects.map((proj, pIdx) => (
                      <div className="proj-card-preview" key={pIdx}>
                        <div className="proj-name-row">
                          <span className="name">{proj.name}</span>
                          <span className="type">({proj.type || 'Full Stack'})</span>
                        </div>
                        <div className="proj-bullets">
                          {proj.description.split('\n').map((line, lIdx) => (
                            <p key={lIdx}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Insufficient Credits Dialog */}
      {showInsufficientModal && (
        <div className="credits-modal-backdrop" onClick={() => setShowInsufficientModal(false)}>
          <div className="credits-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-coin-badge">
              <Coins size={30} />
            </div>
            <h3>Insufficient Credits</h3>
            <p className="modal-lead">
              You need <strong>15 Credits</strong> to enhance your resume with AI. Your current balance is <strong>{userCredits} Credits</strong>.
            </p>

            <div className="modal-ways-list">
              <span className="ways-title">Ways to Earn Credits:</span>
              <div className="way-item">
                <span className="way-badge">+15</span>
                <span>Complete daily study roadmap tasks in <strong>Plan Tracker</strong></span>
              </div>
              <div className="way-item">
                <span className="way-badge">+25</span>
                <span>Score 8.0 or higher in a <strong>Mock AI Interview</strong></span>
              </div>
            </div>

            <div className="modal-btn-row">
              <button
                type="button"
                className="btn-earn-plan"
                onClick={() => {
                  setShowInsufficientModal(false)
                  navigate('/plan-tracker')
                }}
              >
                <Sparkles size={14} />
                <span>Earn in Plan Tracker (+15 Credits)</span>
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowInsufficientModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default AtsEnhancer
