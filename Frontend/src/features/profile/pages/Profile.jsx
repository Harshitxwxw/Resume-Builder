import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  Code2,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  FileText,
  Calendar,
  Check
} from 'lucide-react'

const LinkedInIcon = ({ size = 13, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const GitHubIcon = ({ size = 13, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)
import {
  getUserProfile,
  syncProfileFromDb,
  saveUserProfile,
  syncProfileFromLatestResume,
  DEFAULT_PROFILE_DATA
} from '../services/profile.storage'
import '../styles/profile.scss'

const SKILL_CATEGORIES = [
  { id: 'frontend', label: 'Frontend Engineering', color: '#2563eb' },
  { id: 'backend', label: 'Backend & APIs', color: '#0f172a' },
  { id: 'databases', label: 'Databases & Storage', color: '#059669' },
  { id: 'devops', label: 'DevOps & Cloud Tools', color: '#7c3aed' },
  { id: 'methodologies', label: 'Architecture & Leadership', color: '#d97706' }
]

const Profile = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(() => getUserProfile(user))
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'skills', 'projects', 'experience'
  const [toastMessage, setToastMessage] = useState('')

  // New skill addition state
  const [newSkillCategory, setNewSkillCategory] = useState('frontend')
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState('Advanced')

  // New project modal / inline form state
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Full Stack',
    role: 'Lead Developer',
    period: '2024',
    description: '',
    techStackStr: 'React, Node.js, MongoDB',
    liveUrl: '',
    githubUrl: '',
    metrics: ''
  })

  useEffect(() => {
    // Refresh on user change and sync from MongoDB
    const fresh = getUserProfile(user)
    setProfile(fresh)
    syncProfileFromDb().then((dbProfile) => {
      if (dbProfile) setProfile(dbProfile)
    })
  }, [user])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2800)
  }

  // Handle saving the entire profile
  const handleSaveProfile = () => {
    const success = saveUserProfile(profile)
    if (success) {
      setIsEditing(false)
      showToast('Profile updated and saved successfully! ✨')
    } else {
      showToast('Failed to save profile changes.')
    }
  }

  // Sync from resume
  const handleSyncResume = () => {
    const res = syncProfileFromLatestResume()
    if (res.success) {
      setProfile(getUserProfile(user))
      showToast(res.message)
    } else {
      showToast(res.message)
    }
  }

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('Reset profile to default sample data? Your edits will be replaced.')) {
      saveUserProfile(DEFAULT_PROFILE_DATA)
      setProfile(DEFAULT_PROFILE_DATA)
      showToast('Reset profile to default template.')
    }
  }

  // Skills handlers
  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!newSkillName.trim()) return

    const updated = { ...profile }
    if (!updated.skills[newSkillCategory]) {
      updated.skills[newSkillCategory] = []
    }

    updated.skills[newSkillCategory].push({
      name: newSkillName.trim(),
      level: newSkillLevel
    })

    setProfile(updated)
    setNewSkillName('')
    showToast(`Added "${newSkillName.trim()}" to ${newSkillCategory}!`)
  }

  const handleRemoveSkill = (categoryKey, index) => {
    const updated = { ...profile }
    updated.skills[categoryKey].splice(index, 1)
    setProfile(updated)
  }

  // Projects handlers
  const handleAddProjectSubmit = (e) => {
    e.preventDefault()
    if (!newProject.title.trim() || !newProject.description.trim()) {
      showToast('Please provide a project title and description.')
      return
    }

    const techStack = newProject.techStackStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const projectObj = {
      id: `p-${Date.now()}`,
      title: newProject.title.trim(),
      category: newProject.category.trim(),
      role: newProject.role.trim(),
      period: newProject.period.trim(),
      description: newProject.description.trim(),
      techStack,
      liveUrl: newProject.liveUrl.trim(),
      githubUrl: newProject.githubUrl.trim(),
      metrics: newProject.metrics.trim(),
      featured: true
    }

    const updated = {
      ...profile,
      projects: [projectObj, ...(profile.projects || [])]
    }
    setProfile(updated)
    setShowAddProject(false)
    setNewProject({
      title: '',
      category: 'Full Stack',
      role: 'Lead Developer',
      period: '2024',
      description: '',
      techStackStr: 'React, Node.js, MongoDB',
      liveUrl: '',
      githubUrl: '',
      metrics: ''
    })
    showToast('New project added to your profile! 🚀')
  }

  const handleRemoveProject = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const updated = {
        ...profile,
        projects: profile.projects.filter((p) => p.id !== id)
      }
      setProfile(updated)
      showToast('Project removed.')
    }
  }

  // Calculate totals
  const totalSkillsCount = Object.values(profile.skills || {}).flat().length
  const totalProjectsCount = (profile.projects || []).length
  const totalExpCount = (profile.experience || []).length

  return (
    <main className="profile-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Row */}
      <div className="profile-top-bar">
        <button
          type="button"
          className="btn btn-back-dashboard"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="top-bar-actions">
          <button
            type="button"
            className="btn btn-secondary-action"
            onClick={handleSyncResume}
            title="Import personal info & skills from your latest created resume"
          >
            <RotateCcw size={14} />
            <span>Sync from Resume</span>
          </button>

          {isEditing ? (
            <button
              type="button"
              className="btn btn-save-action"
              onClick={handleSaveProfile}
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-edit-action"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Hero Banner & Personal Card */}
      {/* ============================================================ */}
      <div className="profile-hero-card">
        <div className="hero-cover-gradient" />

        <div className="hero-main-content">
          <div className="hero-avatar-wrapper">
            <div className="avatar-circle">
              {profile.avatarInitials || profile.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="verified-badge" title="Verified Professional Profile">
              <Check size={13} strokeWidth={3} />
            </div>
          </div>

          <div className="hero-identity">
            <div className="identity-header">
              {isEditing ? (
                <div className="edit-identity-inputs">
                  <input
                    type="text"
                    className="edit-name-input"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Your Full Name"
                  />
                  <input
                    type="text"
                    className="edit-title-input"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    placeholder="Target Role / Headline"
                  />
                </div>
              ) : (
                <>
                  <div className="name-row">
                    <h1 className="user-full-name">{profile.fullName || user?.username || 'Professional Candidate'}</h1>
                    <span className="user-badge">{profile.badge || 'Senior Candidate'}</span>
                  </div>
                  <p className="user-headline">{profile.title || 'Full Stack Software Engineer & Architect'}</p>
                </>
              )}
            </div>

            {/* Contact Pills / Social Links */}
            <div className="contact-links-row">
              {isEditing ? (
                <div className="edit-contact-grid">
                  <div className="edit-field">
                    <Mail size={13} />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="edit-field">
                    <Phone size={13} />
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="edit-field">
                    <MapPin size={13} />
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="Location"
                    />
                  </div>
                  <div className="edit-field">
                    <Globe size={13} />
                    <input
                      type="text"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="Portfolio URL"
                    />
                  </div>
                  <div className="edit-field">
                    <LinkedInIcon size={13} />
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      placeholder="LinkedIn Profile"
                    />
                  </div>
                  <div className="edit-field">
                    <GitHubIcon size={13} />
                    <input
                      type="text"
                      value={profile.github}
                      onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                      placeholder="GitHub Profile"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <span className="contact-pill" title="Email">
                    <Mail size={13} />
                    <span>{profile.email || user?.email || 'user@example.com'}</span>
                  </span>

                  {profile.phone && (
                    <span className="contact-pill" title="Phone">
                      <Phone size={13} />
                      <span>{profile.phone}</span>
                    </span>
                  )}

                  {profile.location && (
                    <span className="contact-pill" title="Location">
                      <MapPin size={13} />
                      <span>{profile.location}</span>
                    </span>
                  )}

                  {profile.linkedin && (
                    <a
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-pill link"
                      title="LinkedIn Profile"
                    >
                      <LinkedInIcon size={13} />
                      <span>LinkedIn</span>
                      <ExternalLink size={10} />
                    </a>
                  )}

                  {profile.github && (
                    <a
                      href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-pill link"
                      title="GitHub Profile"
                    >
                      <GitHubIcon size={13} />
                      <span>GitHub</span>
                      <ExternalLink size={10} />
                    </a>
                  )}

                  {profile.website && (
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-pill link"
                      title="Portfolio Website"
                    >
                      <Globe size={13} />
                      <span>Portfolio</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Highlights KPI Row */}
        <div className="hero-kpi-bar">
          <div className="kpi-box">
            <span className="kpi-value">{profile.yearsExperience || '4+ Years'}</span>
            <span className="kpi-label">Experience</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-box">
            <span className="kpi-value">{totalSkillsCount}</span>
            <span className="kpi-label">Mastered Skills</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-box">
            <span className="kpi-value">{totalProjectsCount}</span>
            <span className="kpi-label">Featured Projects</span>
          </div>
          <div className="kpi-divider" />
          <div className="kpi-box">
            <span className="kpi-value">{profile.atsIndex || '94%'}</span>
            <span className="kpi-label">ATS Readiness</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Navigation Tabs (Overview, Skills, Projects, Experience) */}
      {/* ============================================================ */}
      <div className="profile-nav-tabs">
        <button
          type="button"
          className={`tab-btn${activeTab === 'overview' ? ' active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={15} />
          <span>About Me & Overview</span>
        </button>

        <button
          type="button"
          className={`tab-btn${activeTab === 'skills' ? ' active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Code2 size={15} />
          <span>All Skills ({totalSkillsCount})</span>
        </button>

        <button
          type="button"
          className={`tab-btn${activeTab === 'projects' ? ' active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Layers size={15} />
          <span>Projects ({totalProjectsCount})</span>
        </button>

        <button
          type="button"
          className={`tab-btn${activeTab === 'experience' ? ' active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Briefcase size={15} />
          <span>Experience & Education</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: ABOUT ME (Self Description) & Core Highlights */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || isEditing) && (
        <section className="profile-section about-section">
          <div className="section-header">
            <div className="header-left">
              <div className="section-icon-badge blue">
                <User size={18} />
              </div>
              <div>
                <h2 className="section-title">About Me (Self Description)</h2>
                <p className="section-desc">Comprehensive career bio, architectural philosophy, and engineering vision.</p>
              </div>
            </div>

            {isEditing && (
              <span className="editing-indicator">
                <Edit3 size={13} /> Editing Bio
              </span>
            )}
          </div>

          <div className="about-content-card">
            {isEditing ? (
              <textarea
                className="edit-about-textarea"
                rows={6}
                value={profile.aboutMe}
                onChange={(e) => setProfile({ ...profile, aboutMe: e.target.value })}
                placeholder="Write your detailed self-description and professional background..."
              />
            ) : (
              <div className="about-text-display">
                {profile.aboutMe.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: ALL SKILLS & PROFICIENCIES */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || activeTab === 'skills' || isEditing) && (
        <section className="profile-section skills-section">
          <div className="section-header">
            <div className="header-left">
              <div className="section-icon-badge navy">
                <Code2 size={18} />
              </div>
              <div>
                <h2 className="section-title">Core Skills & Proficiencies</h2>
                <p className="section-desc">Categorized breakdown of technical proficiencies and development toolsets.</p>
              </div>
            </div>

            <span className="skills-count-pill">{totalSkillsCount} Skills Identified</span>
          </div>

          {/* Add Skill Form if Editing */}
          {isEditing && (
            <form className="add-skill-bar" onSubmit={handleAddSkill}>
              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="skill-category-select"
              >
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Skill name (e.g., GraphQL, Docker, Rust)..."
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="skill-name-input"
              />

              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                className="skill-level-select"
              >
                <option value="Expert">Expert</option>
                <option value="Advanced">Advanced</option>
                <option value="Proficient">Proficient</option>
                <option value="Intermediate">Intermediate</option>
              </select>

              <button type="submit" className="btn-add-skill">
                <Plus size={15} />
                <span>Add Skill</span>
              </button>
            </form>
          )}

          {/* Categorized Skills Grid */}
          <div className="skills-category-grid">
            {SKILL_CATEGORIES.map((cat) => {
              const skillList = profile.skills?.[cat.id] || []
              if (skillList.length === 0 && !isEditing) return null

              return (
                <div className="skill-category-card" key={cat.id}>
                  <div className="category-header">
                    <span className="cat-color-dot" style={{ backgroundColor: cat.color }} />
                    <h3 className="category-title">{cat.label}</h3>
                    <span className="cat-count">({skillList.length})</span>
                  </div>

                  <div className="skills-pill-wrap">
                    {skillList.map((skill, sIdx) => (
                      <div className="skill-pill-item" key={sIdx}>
                        <span className="skill-name">{skill.name}</span>
                        {skill.level && (
                          <span className={`skill-level ${skill.level.toLowerCase()}`}>
                            {skill.level}
                          </span>
                        )}
                        {isEditing && (
                          <button
                            type="button"
                            className="btn-remove-skill"
                            onClick={() => handleRemoveSkill(cat.id, sIdx)}
                            title="Remove skill"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: FEATURED PROJECTS */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || activeTab === 'projects' || isEditing) && (
        <section className="profile-section projects-section">
          <div className="section-header">
            <div className="header-left">
              <div className="section-icon-badge blue">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="section-title">Featured Projects</h2>
                <p className="section-desc">Key production software, distributed systems, and user-facing architectures.</p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-new-project"
              onClick={() => setShowAddProject(!showAddProject)}
            >
              <Plus size={15} />
              <span>{showAddProject ? 'Close Form' : 'Add Project'}</span>
            </button>
          </div>

          {/* Add Project Form Drawer */}
          {showAddProject && (
            <form className="add-project-drawer" onSubmit={handleAddProjectSubmit}>
              <h3 className="drawer-title">Add New Project</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Task Engine"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category / Domain</label>
                  <input
                    type="text"
                    placeholder="e.g. Full Stack & AI"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Your Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Architect"
                    value={newProject.role}
                    onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Time Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024 - Present"
                    value={newProject.period}
                    onChange={(e) => setNewProject({ ...newProject, period: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Project Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what you built, architecture decisions, and business impact..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Node.js, Express, PostgreSQL, Redis"
                    value={newProject.techStackStr}
                    onChange={(e) => setNewProject({ ...newProject, techStackStr: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Live Demo / URL</label>
                  <input
                    type="text"
                    placeholder="https://myproject.com"
                    value={newProject.liveUrl}
                    onChange={(e) => setNewProject({ ...newProject, liveUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>GitHub Repository</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={newProject.githubUrl}
                    onChange={(e) => setNewProject({ ...newProject, githubUrl: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Key Impact / Metric</label>
                  <input
                    type="text"
                    placeholder="e.g. Maintained 99.98% uptime with over 10,000 active candidates"
                    value={newProject.metrics}
                    onChange={(e) => setNewProject({ ...newProject, metrics: e.target.value })}
                  />
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddProject(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  <Plus size={15} />
                  <span>Save Project to Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* Projects List */}
          <div className="projects-grid">
            {(profile.projects || []).map((proj) => (
              <div className="project-card" key={proj.id}>
                <div className="project-card-header">
                  <div className="project-title-box">
                    <span className="project-category">{proj.category || 'Engineering'}</span>
                    <h3 className="project-title">{proj.title}</h3>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      className="btn-delete-proj"
                      onClick={() => handleRemoveProject(proj.id)}
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="project-role-meta">
                  <span className="role">{proj.role || 'Software Engineer'}</span>
                  <span className="dot">·</span>
                  <span className="period">{proj.period || '2024'}</span>
                </div>

                <p className="project-description">{proj.description}</p>

                {proj.metrics && (
                  <div className="project-metric-box">
                    <Sparkles size={13} className="sparkle-icon" />
                    <span>{proj.metrics}</span>
                  </div>
                )}

                {/* Tech Stack Pills */}
                <div className="tech-stack-row">
                  {(proj.techStack || []).map((tech, tIdx) => (
                    <span className="tech-pill" key={tIdx}>
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="project-card-footer">
                  <div className="links-group">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl.startsWith('http') ? proj.liveUrl : `https://${proj.liveUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link primary"
                      >
                        <Globe size={13} />
                        <span>Live Demo</span>
                        <ExternalLink size={11} />
                      </a>
                    )}

                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl.startsWith('http') ? proj.githubUrl : `https://${proj.githubUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-link"
                      >
                        <GitHubIcon size={13} />
                        <span>Source Code</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: EXPERIENCE & EDUCATION */}
      {/* ============================================================ */}
      {(activeTab === 'overview' || activeTab === 'experience' || isEditing) && (
        <div className="profile-dual-grid">
          {/* Work Experience */}
          <section className="profile-section experience-section">
            <div className="section-header">
              <div className="header-left">
                <div className="section-icon-badge navy">
                  <Briefcase size={18} />
                </div>
                <div>
                  <h2 className="section-title">Work Experience</h2>
                  <p className="section-desc">Career timeline & achievements.</p>
                </div>
              </div>
            </div>

            <div className="timeline-container">
              {(profile.experience || []).map((exp, idx) => (
                <div className="timeline-item" key={exp.id || idx}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <h4 className="exp-role">{exp.role}</h4>
                      {exp.currentlyWorking && (
                        <span className="current-badge">Present</span>
                      )}
                    </div>

                    <div className="exp-company-row">
                      <span className="company-name">{exp.company}</span>
                      <span className="dot">·</span>
                      <span className="location">{exp.location}</span>
                    </div>

                    <div className="exp-duration">
                      <Calendar size={12} />
                      <span>
                        {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                      </span>
                    </div>

                    <ul className="achievements-list">
                      {(exp.achievements || []).map((ach, aIdx) => (
                        <li key={aIdx}>
                          <span className="bullet-point" />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Certifications */}
          <section className="profile-section education-section">
            <div className="section-header">
              <div className="header-left">
                <div className="section-icon-badge blue">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h2 className="section-title">Education & Credentials</h2>
                  <p className="section-desc">Degrees, certifications, and honors.</p>
                </div>
              </div>
            </div>

            {/* Education Items */}
            <div className="edu-list">
              {(profile.education || []).map((edu, idx) => (
                <div className="edu-card" key={edu.id || idx}>
                  <div className="edu-title-row">
                    <h4 className="degree-title">{edu.degree}</h4>
                    <span className="edu-period">{edu.period}</span>
                  </div>
                  <p className="institution-name">{edu.institution}</p>
                  {edu.grade && <span className="grade-pill">{edu.grade}</span>}
                  {edu.highlights && <p className="edu-highlights">{edu.highlights}</p>}
                </div>
              ))}
            </div>

            {/* Certifications Sub-block */}
            <div className="certifications-block">
              <div className="cert-header">
                <Award size={16} />
                <h3>Licenses & Certifications</h3>
              </div>
              <div className="cert-list">
                {(profile.certifications || []).map((cert, cIdx) => (
                  <div className="cert-item" key={cIdx}>
                    <div className="cert-icon-dot" />
                    <div className="cert-info">
                      <p className="cert-name">{cert.name}</p>
                      <p className="cert-issuer">
                        {cert.issuer} &middot; {cert.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default Profile
