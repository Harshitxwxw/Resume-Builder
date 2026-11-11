import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import '../styles/resume.scss'
import { COUNTRY_CODES } from '../data/countryCodes'
import DateInputWithCalendar from '../components/DateInputWithCalendar'
import {
  saveResume,
  getSavedResumes,
  syncResumesFromDb,
  finishResume,
  ACTIVE_RESUME_ID_KEY
} from '../services/resume.storage'
import { getUserScopedKey } from '../../../utils/userScope'
import {
  downloadResumeAsPdf,
  downloadResumeAsDocx
} from '../services/resumeExport'
import {
  ArrowLeft,
  Download,
  Lock,
  Eye,
  LayoutTemplate,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Calendar,
  Check,
  X,
  Type,
  Search,
  GraduationCap,
  FolderGit2,
  FileText,
  FileEdit,
  Wand2
} from 'lucide-react'

const LinkedInIcon = ({ size = 14, className, ...props }) => (
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

const DEFAULT_ACCENT_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Ruby Rose', hex: '#e11d48' },
  { name: 'Ocean Teal', hex: '#0d9488' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Midnight', hex: '#1e293b' }
]

// Recommended, Industry-Standard Resume Layouts
const LAYOUT_OPTIONS = [
  {
    id: 'single',
    name: 'Modern Single Column',
    tag: 'Recommended ★',
    tagType: 'badge-recommended',
    description: 'Clean vertical hierarchy. 100% ATS-friendly & preferred by top tech recruiters.'
  },
  {
    id: 'two-column',
    name: 'Two-Column Split',
    tag: 'Popular for Tech',
    tagType: 'badge-popular',
    description: 'Sidebar for contact, education & skills with main column for experience. Maximizes space.'
  },
  {
    id: 'minimal',
    name: 'Minimalist Clean',
    tag: 'High White-Space',
    tagType: 'badge-neutral',
    description: 'Refined typography with subtle hairline dividers. Clean executive aesthetic.'
  },
  {
    id: 'banner',
    name: 'Executive Accent Banner',
    tag: 'High Contrast',
    tagType: 'badge-neutral',
    description: 'Bold colored header banner. Makes a memorable visual statement for leadership roles.'
  }
]

// Complete Professional & ATS-Friendly Font Library (22 Curated Fonts)
const FONT_OPTIONS = [
  // --- Modern Sans-Serif (ATS Standards) ---
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter', system-ui, sans-serif",
    sample: 'Aa',
    category: 'Modern Sans (ATS Standard #1)'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    fontFamily: "'Roboto', sans-serif",
    sample: 'Aa',
    category: 'Neutral & High-Clarity Sans'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    fontFamily: "'Open Sans', sans-serif",
    sample: 'Aa',
    category: 'Universal Humanist Sans'
  },
  {
    id: 'lato',
    name: 'Lato',
    fontFamily: "'Lato', sans-serif",
    sample: 'Aa',
    category: 'Warm Corporate Sans'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    fontFamily: "'Montserrat', sans-serif",
    sample: 'Aa',
    category: 'Geometric Editorial Sans'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    fontFamily: "'Poppins', sans-serif",
    sample: 'Aa',
    category: 'Trendy Product & UI Sans'
  },
  {
    id: 'raleway',
    name: 'Raleway',
    fontFamily: "'Raleway', sans-serif",
    sample: 'Aa',
    category: 'Elegant Thin-Line Sans'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    fontFamily: "'Nunito', sans-serif",
    sample: 'Aa',
    category: 'Soft Rounded Friendly Sans'
  },
  {
    id: 'source-sans',
    name: 'Source Sans 3',
    fontFamily: "'Source Sans 3', sans-serif",
    sample: 'Aa',
    category: 'Crisp Technical Sans'
  },
  {
    id: 'ubuntu',
    name: 'Ubuntu',
    fontFamily: "'Ubuntu', sans-serif",
    sample: 'Aa',
    category: 'Modern Open-Source Tech'
  },
  {
    id: 'system-sans',
    name: 'System Default',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sample: 'Aa',
    category: 'Native OS Clean Standard'
  },

  // --- Editorial & Classic Serifs ---
  {
    id: 'georgia',
    name: 'Georgia',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    sample: 'Aa',
    category: 'Classic Editorial Serif'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    fontFamily: "'Merriweather', serif",
    sample: 'Aa',
    category: 'Highly Legible Academic Serif'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    fontFamily: "'Playfair Display', serif",
    sample: 'Aa',
    category: 'High-Contrast Luxury Serif'
  },
  {
    id: 'lora',
    name: 'Lora',
    fontFamily: "'Lora', serif",
    sample: 'Aa',
    category: 'Contemporary Book Serif'
  },
  {
    id: 'baskerville',
    name: 'Libre Baskerville',
    fontFamily: "'Libre Baskerville', serif",
    sample: 'Aa',
    category: 'Executive Formal Serif'
  },
  {
    id: 'garamond',
    name: 'Garamond',
    fontFamily: "'Garamond', 'Georgia', serif",
    sample: 'Aa',
    category: 'Prestigious University Serif'
  },
  {
    id: 'cambria',
    name: 'Cambria',
    fontFamily: "'Cambria', 'Georgia', serif",
    sample: 'Aa',
    category: 'Corporate Enterprise Serif'
  },

  // --- Technical Monospace ---
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', monospace",
    sample: '{ }',
    category: 'Developer & Code Monospace'
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: "'Fira Code', monospace",
    sample: '=>',
    category: 'Engineering & Ligature Mono'
  },
  {
    id: 'consolas',
    name: 'Consolas',
    fontFamily: "'Consolas', monospace",
    sample: '{ }',
    category: 'Technical Systems Monospace'
  },
  {
    id: 'courier-new',
    name: 'Courier New',
    fontFamily: "'Courier New', monospace",
    sample: 'Aa',
    category: 'Classic Typewriter Monospace'
  }
]

const SKILL_SUGGESTIONS = [
  'React JS', 'Node JS', 'TypeScript', 'MongoDB', 'Express',
  'Next.js', 'Python', 'Tailwind CSS', 'Docker', 'AWS',
  'Git', 'System Design', 'RESTful APIs', 'PostgreSQL', 'Redux'
]

export const DEMO_RESUME_DATA = {
  personal: {
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone No',
    countryCode: '+91',
    location: 'City, Country',
    profession: 'Software Engineer',
    linkedin: 'www.linkedin.com',
    website: 'www.portfolio.dev'
  },
  summary:
    'Proactive and results-driven software engineer with extensive experience in architecting modern web applications, optimizing distributed backend systems, and crafting responsive user experiences.',
  experience: [
    {
      id: 'demo-exp-1',
      company: 'Tech Solutions Inc.',
      role: 'Full Stack Engineer',
      startDate: 'Jan 2023',
      endDate: 'Present',
      currentlyWorking: true,
      description:
        'Engineered high-scale web applications with React and Node.js. Improved query efficiency by 35% and mentored junior developers.'
    }
  ],
  education: [
    {
      id: 'demo-edu-1',
      institution: 'Institute of Technology',
      degree: "Bachelor of Science",
      field: 'Computer Science',
      date: '2019 - 2023',
      gpa: '3.8 / 4.0'
    }
  ],
  projects: [
    {
      id: 'demo-proj-1',
      name: 'AI Career Platform',
      type: 'Full Stack App',
      description:
        'Architected a career readiness system featuring live ATS scoring and AI interview preparation roadmaps.'
    }
  ],
  skills: ['React JS', 'Node JS', 'TypeScript', 'MongoDB', 'Tailwind CSS', 'Docker', 'RESTful APIs']
}

export const EMPTY_RESUME_DATA = {
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

const isDummyData = (data) => {
  if (!data || !data.personal) return true
  const name = data.personal.fullName?.trim()
  const email = data.personal.email?.trim()
  return name === 'Full Name' && (email === 'Email Address' || !email)
}

const STEPS = [
  { id: 'personal', title: 'Personal Information', subtitle: 'Add your personal contact details' },
  { id: 'summary', title: 'Professional Summary', subtitle: 'Add summary for your resume here' },
  { id: 'experience', title: 'Professional Experience', subtitle: 'Add your job experience' },
  { id: 'education', title: 'Education', subtitle: 'Add your education details' },
  { id: 'projects', title: 'Projects', subtitle: 'Add your projects' },
  { id: 'skills', title: 'Skills', subtitle: 'Add your technical and soft skills' }
]

const ResumeCreator = () => {
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Persistent Resume Data State
  const [resumeData, setResumeData] = useState(() => {
    try {
      const activeId = localStorage.getItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY))
      if (activeId) {
        const list = getSavedResumes()
        const found = list.find((r) => r.id === activeId)
        if (found && found.data) {
          return isDummyData(found.data) ? EMPTY_RESUME_DATA : found.data
        }
      }
      const saved = localStorage.getItem(getUserScopedKey('career_ai_resume_data'))
      if (saved) {
        const parsed = JSON.parse(saved)
        return isDummyData(parsed) ? EMPTY_RESUME_DATA : parsed
      }
      return EMPTY_RESUME_DATA
    } catch {
      return EMPTY_RESUME_DATA
    }
  })

  const [activeStep, setActiveStep] = useState(0)
  const [accentColor, setAccentColor] = useState('#2563eb')
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(getUserScopedKey('career_ai_resume_layout')) || 'single'
    } catch {
      return 'single'
    }
  })
  const [fontStyle, setFontStyle] = useState(() => {
    try {
      return localStorage.getItem(getUserScopedKey('career_ai_resume_font')) || 'inter'
    } catch {
      return 'inter'
    }
  })
  const [fontSearchQuery, setFontSearchQuery] = useState('')
  const filteredFonts = FONT_OPTIONS.filter((f) => {
    if (!fontSearchQuery.trim()) return true
    const q = fontSearchQuery.toLowerCase().trim()
    return (
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q)
    )
  })
  const [activeTemplateTab, setActiveTemplateTab] = useState('layout')
  const [isPrivate, setIsPrivate] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [showFinishedModal, setShowFinishedModal] = useState(false)
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)
  const downloadDropdownRef = useRef(null)

  const handleSelectLayout = (layoutId) => {
    setLayout(layoutId)
    try {
      localStorage.setItem(getUserScopedKey('career_ai_resume_layout'), layoutId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectFont = (fontId) => {
    setFontStyle(fontId)
    try {
      localStorage.setItem(getUserScopedKey('career_ai_resume_font'), fontId)
    } catch (e) {
      console.error(e)
    }
  }

  // Recent 5 selected colors
  const [recentColors, setRecentColors] = useState(() => {
    try {
      const saved = localStorage.getItem(getUserScopedKey('career_ai_recent_accent_colors'))
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Country Code Picker State
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const countryPickerRef = useRef(null)

  const filteredCountries = COUNTRY_CODES.filter((c) => {
    if (!countrySearchQuery.trim()) return true
    const q = countrySearchQuery.toLowerCase().trim()
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    )
  })

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.dialCode === (resumeData.personal.countryCode || '+91')) ||
    COUNTRY_CODES[0]

  const handleSelectCountry = (country) => {
    setResumeData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        countryCode: country.dialCode
      }
    }))
    setShowCountryPicker(false)
    setCountrySearchQuery('')
  }

  const popoverRef = useRef(null)

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowColorPicker(false)
        setShowTemplatePicker(false)
      }
      if (countryPickerRef.current && !countryPickerRef.current.contains(e.target)) {
        setShowCountryPicker(false)
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target)) {
        setShowDownloadDropdown(false)
      }
    }
    if (showColorPicker || showTemplatePicker || showCountryPicker || showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColorPicker, showTemplatePicker, showCountryPicker, showDownloadDropdown])

  // Select accent color & track in recent 5 list
  const handleSelectAccent = (colorHex) => {
    if (!colorHex) return
    const formatted = colorHex.startsWith('#') ? colorHex : `#${colorHex}`
    setAccentColor(formatted)

    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== formatted.toLowerCase())
      const updated = [formatted, ...filtered].slice(0, 5)
      try {
        localStorage.setItem(getUserScopedKey('career_ai_recent_accent_colors'), JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      return updated
    })
  }

  // Handle typing hex input directly
  const handleHexInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '')
    if (raw.length <= 6) {
      const formatted = `#${raw}`
      setAccentColor(formatted)
      if (raw.length === 6 || raw.length === 3) {
        handleSelectAccent(formatted)
      }
    }
  }

  // Clear recent colors
  const handleClearRecentColors = () => {
    setRecentColors([])
    try {
      localStorage.removeItem(getUserScopedKey('career_ai_recent_accent_colors'))
    } catch (err) {
      console.error(err)
    }
  }

  // Reload resume data when logged in user changes
  useEffect(() => {
    const applyUserResumes = (list) => {
      try {
        const activeId = localStorage.getItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY))
        if (activeId) {
          const found = list.find((r) => r.id === activeId)
          if (found && found.data) {
            setResumeData(isDummyData(found.data) ? EMPTY_RESUME_DATA : found.data)
            return
          }
        }
        if (list && list.length > 0 && list[0].data) {
          setResumeData(isDummyData(list[0].data) ? EMPTY_RESUME_DATA : list[0].data)
          return
        }
        const saved = localStorage.getItem(getUserScopedKey('career_ai_resume_data'))
        if (saved) {
          const parsed = JSON.parse(saved)
          setResumeData(isDummyData(parsed) ? EMPTY_RESUME_DATA : parsed)
        } else {
          setResumeData({
            ...EMPTY_RESUME_DATA,
            personal: {
              ...EMPTY_RESUME_DATA.personal,
              fullName: user?.username || '',
              email: user?.email || ''
            }
          })
        }
      } catch {
        setResumeData(EMPTY_RESUME_DATA)
      }
    }

    applyUserResumes(getSavedResumes())
    syncResumesFromDb().then((fresh) => {
      if (Array.isArray(fresh)) {
        applyUserResumes(fresh)
      }
    })
  }, [user?.id, user?.email])

  // Toast notification timer
  // Load specific resume if ?id= query param is present
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const resumeId = params.get('id')
    if (resumeId) {
      const list = getSavedResumes()
      const found = list.find((r) => r.id === resumeId)
      if (found && found.data) {
        const cleanData = isDummyData(found.data) ? EMPTY_RESUME_DATA : found.data
        setResumeData(cleanData)
        if (found.layout) setLayout(found.layout)
        if (found.font) setFontStyle(found.font)
        if (found.accentColor) setAccentColor(found.accentColor)
        localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), resumeId)
        localStorage.setItem(getUserScopedKey('career_ai_resume_data'), JSON.stringify(cleanData))
      }
    }
  }, [location.search])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Save changes handler (auto-saves silently without repetitive toast)
  const handleSave = (showToast = false) => {
    try {
      localStorage.setItem(getUserScopedKey('career_ai_resume_data'), JSON.stringify(resumeData))
      const activeId = localStorage.getItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY)) || 'res-default'
      const name = resumeData.personal?.fullName?.trim()
      const prof = resumeData.personal?.profession?.trim()
      const title = name && name !== 'Full Name'
        ? `${name} - ${prof && prof !== 'Profession' ? prof : 'Resume'}`
        : 'My ATS Resume'

      saveResume({
        id: activeId,
        title,
        data: resumeData,
        layout,
        font: fontStyle,
        accentColor
      })
      if (showToast) {
        setToastMessage('Changes saved successfully!')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Finish and permanently commit resume
  const handleFinishResume = () => {
    try {
      localStorage.setItem(getUserScopedKey('career_ai_resume_data'), JSON.stringify(resumeData))
      const activeId = localStorage.getItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY)) || `res-${Date.now()}`
      const name = resumeData.personal?.fullName?.trim()
      const prof = resumeData.personal?.profession?.trim()
      const title = name && name !== 'Full Name'
        ? `${name} - ${prof && prof !== 'Profession' ? prof : 'Resume'}`
        : 'My ATS Resume'

      finishResume({
        id: activeId,
        title,
        data: resumeData,
        layout,
        font: fontStyle,
        accentColor,
        isFinished: true
      })
      setToastMessage('🎉 Resume finished and saved to workspace!')
      setShowFinishedModal(true)
    } catch (e) {
      console.error(e)
    }
  }

  // Navigation between steps: auto-saves silently on next & previous
  const handleNext = () => {
    handleSave(false)
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    handleSave(false)
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1)
    }
  }

  // Personal info update
  const handlePersonalChange = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }))
  }

  // AI enhance mock/smart prompt
  const handleAiEnhanceSummary = () => {
    const enhanced =
      'Dynamic and results-driven Software Engineer with extensive expertise in full-stack architecture, modern React frameworks, and resilient Node.js backends. Proven record of optimizing performance by 35% and delivering high-value products that align with organizational objectives.'
    setResumeData((prev) => ({ ...prev, summary: enhanced }))
    setToastMessage('Summary enhanced with AI!')
  }

  const handleAiEnhanceExp = (id) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id
          ? {
            ...exp,
            description:
              '• Spearheaded cross-functional initiatives to build scalable cloud-native architectures.\n• Streamlined code reliability and reduced latency by 40% using MongoDB optimizations.\n• Mentored engineering peers and drove agile sprint deliveries with 99.9% uptime.'
          }
          : exp
      )
    }))
    setToastMessage('Job description enhanced with AI!')
  }

  // Experience handlers
  const handleAddExperience = () => {
    const newExp = {
      id: Date.now(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      description: ''
    }
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
  }

  const handleRemoveExperience = (id) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id)
    }))
    setToastMessage('Experience field removed')
  }

  const handleUpdateExperience = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  // Education handlers
  const handleAddEducation = () => {
    const newEdu = {
      id: Date.now(),
      institution: '',
      degree: '',
      field: '',
      date: '',
      gpa: ''
    }
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const handleRemoveEducation = (id) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id)
    }))
    setToastMessage('Education field removed')
  }

  const handleUpdateEducation = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  // Project handlers
  const handleAddProject = () => {
    const newProj = {
      id: Date.now(),
      name: '',
      type: '',
      description: ''
    }
    setResumeData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }))
  }

  const handleRemoveProject = (id) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id)
    }))
    setToastMessage('Project field removed')
  }

  const handleUpdateProject = (id, field, value) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }))
  }

  // Skills handlers
  const handleAddSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !resumeData.skills.includes(trimmed)) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }))
  }

  // Download / Print
  const handleDownload = () => {
    window.print()
  }

  const currentStep = STEPS[activeStep]
  const progressPercent = ((activeStep + 1) / STEPS.length) * 100

  return (
    <div
      className="resume-creator-page"
      style={{ '--accent-color': accentColor }}
    >
      {/* ---- Subheader Action Bar ---- */}
      <div className="rc-action-bar">
        <button className="rc-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>Back to Dashboard</span>
        </button>

        <div className="rc-right-actions">
          <button
            className="rc-pill-btn private"
            onClick={() => setIsPrivate((p) => !p)}
            title="Toggle resume visibility"
          >
            {isPrivate ? <Lock size={15} /> : <Eye size={15} />}
            <span>{isPrivate ? 'Private' : 'Public'}</span>
          </button>

          {/* Download Dropdown (PDF & Word DOCX) */}
          <div className="rc-download-dropdown-wrap" ref={downloadDropdownRef}>
            <button
              type="button"
              className={`rc-pill-btn download ${showDownloadDropdown ? 'active' : ''}`}
              onClick={() => setShowDownloadDropdown((p) => !p)}
              title="Download resume as PDF or Word (.docx)"
            >
              <Download size={15} strokeWidth={2.2} />
              <span>Download</span>
              <ChevronDown size={13} className={`rc-download-chevron ${showDownloadDropdown ? 'open' : ''}`} />
            </button>

            {showDownloadDropdown && (
              <div className="rc-download-popover">
                <div className="rc-download-popover-header">
                  <span>Export Format</span>
                </div>

                <button
                  type="button"
                  className="rc-download-option"
                  onClick={() => {
                    setShowDownloadDropdown(false)
                    downloadResumeAsPdf(resumeData)
                    setToastMessage('Opening PDF print preview...')
                  }}
                >
                  <div className="rc-dl-icon-box pdf">
                    <FileText size={16} />
                  </div>
                  <div className="rc-dl-info">
                    <span className="rc-dl-title">Download as PDF (.pdf)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="rc-download-option"
                  onClick={() => {
                    setShowDownloadDropdown(false)
                    downloadResumeAsDocx(resumeData, { accentColor })
                    setToastMessage('Word document (.docx) downloaded!')
                  }}
                >
                  <div className="rc-dl-icon-box docx">
                    <FileEdit size={16} />
                  </div>
                  <div className="rc-dl-info">
                    <span className="rc-dl-title">Download as Word (.docx)</span>                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Main Split Workspace ---- */}
      <div className="rc-workspace">
        {/* Left Column: Form Editor Card */}
        <div className="rc-form-card">
          {/* Top Progress Line */}
          <div className="rc-progress-track">
            <div
              className="rc-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Navigation Controls Bar */}
          <div className="rc-card-nav-row">
            <div className="rc-nav-left">
              <button
                type="button"
                className="rc-nav-btn template-btn"
                onClick={() => {
                  setShowTemplatePicker((p) => !p)
                  setShowColorPicker(false)
                }}
              >
                <LayoutTemplate size={14} />
                <span>Template</span>
              </button>

              <button
                type="button"
                className="rc-nav-btn accent-btn"
                onClick={() => {
                  setShowColorPicker((p) => !p)
                  setShowTemplatePicker(false)
                }}
              >
                <Palette size={14} />
                <span>Theme</span>
              </button>
            </div>

            <div className="rc-step-nav">
              <button
                type="button"
                className="rc-step-arrow"
                disabled={activeStep === 0}
                onClick={handlePrev}
              >
                <ChevronLeft size={15} strokeWidth={2.2} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="rc-step-arrow"
                disabled={activeStep === STEPS.length - 1}
                onClick={handleNext}
              >
                <span>Next</span>
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Accent Color Picker Popover */}
          {showColorPicker && (
            <div className="rc-popover-menu accent-popover" ref={popoverRef}>
              {/* Custom Color Spectrum */}
              <div>
                <div className="rc-popover-title">Custom Color Spectrum</div>
                <div className="rc-spectrum-row">
                  <div className="rc-spectrum-btn" title="Open Color Spectrum Wheel">
                    <input
                      type="color"
                      value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#2563eb'}
                      onChange={(e) => handleSelectAccent(e.target.value)}
                    />
                  </div>
                  <div className="rc-hex-input-wrap">
                    <span>#</span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="2563EB"
                      value={accentColor.replace('#', '')}
                      onChange={handleHexInputChange}
                    />
                  </div>
                  <div
                    className="rc-current-swatch"
                    style={{ backgroundColor: accentColor }}
                    title={`Current: ${accentColor}`}
                  />
                </div>
              </div>

              {/* Show Recent Colors in place of defaults; if none, show Default Colors */}
              <div className="rc-color-section">
                <div className="rc-popover-title">
                  <span>{recentColors.length > 0 ? 'Recent Colors' : 'Default Colors'}</span>
                  {recentColors.length > 0 && (
                    <button
                      type="button"
                      className="rc-clear-btn"
                      onClick={handleClearRecentColors}
                      title="Reset to default colors"
                    >
                      Reset Defaults
                    </button>
                  )}
                </div>
                <div className="rc-color-grid">
                  {recentColors.length > 0
                    ? recentColors.map((hex, idx) => (
                      <button
                        key={`${hex}-${idx}`}
                        type="button"
                        className={`rc-color-swatch ${accentColor.toLowerCase() === hex.toLowerCase() ? 'active' : ''}`}
                        style={{ backgroundColor: hex }}
                        onClick={() => handleSelectAccent(hex)}
                        title={hex}
                      />
                    ))
                    : DEFAULT_ACCENT_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        className={`rc-color-swatch ${accentColor.toLowerCase() === col.hex.toLowerCase() ? 'active' : ''}`}
                        style={{ backgroundColor: col.hex }}
                        onClick={() => handleSelectAccent(col.hex)}
                        title={col.name}
                      />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Template & Font Style Popover */}
          {showTemplatePicker && (
            <div className="rc-popover-menu template-popover" ref={popoverRef}>
              <div className="rc-tab-switch">
                <button
                  type="button"
                  className={`rc-tab-btn ${activeTemplateTab === 'layout' ? 'active' : ''}`}
                  onClick={() => setActiveTemplateTab('layout')}
                >
                  <LayoutTemplate size={13} />
                  <span>Layout ({LAYOUT_OPTIONS.length})</span>
                </button>
                <button
                  type="button"
                  className={`rc-tab-btn ${activeTemplateTab === 'font' ? 'active' : ''}`}
                  onClick={() => setActiveTemplateTab('font')}
                >
                  <Type size={13} />
                  <span>Font Style ({FONT_OPTIONS.length})</span>
                </button>
              </div>

              {activeTemplateTab === 'layout' ? (
                <div className="rc-layout-list">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`rc-layout-card ${layout === opt.id ? 'active' : ''}`}
                      onClick={() => handleSelectLayout(opt.id)}
                    >
                      <div className="rc-layout-top">
                        <span className="rc-layout-name">{opt.name}</span>
                        <span className={`rc-badge ${opt.tagType}`}>{opt.tag}</span>
                      </div>
                      <p className="rc-layout-desc">{opt.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Search Bar for Font Styles */}
                  <div className="rc-font-search-wrap">
                    <Search size={14} className="rc-search-icon" />
                    <input
                      type="text"
                      placeholder="Search font style (e.g. Roboto, Serif, Mono)..."
                      value={fontSearchQuery}
                      onChange={(e) => setFontSearchQuery(e.target.value)}
                    />
                    {fontSearchQuery && (
                      <button
                        type="button"
                        className="rc-search-clear"
                        onClick={() => setFontSearchQuery('')}
                        title="Clear font search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="rc-font-search-status">
                    <span>Font Library</span>
                    <span>{filteredFonts.length} of {FONT_OPTIONS.length} fonts</span>
                  </div>

                  {filteredFonts.length === 0 ? (
                    <div className="rc-no-fonts-found">
                      <p>No font styles match "{fontSearchQuery}"</p>
                      <button type="button" onClick={() => setFontSearchQuery('')}>
                        Show All Fonts
                      </button>
                    </div>
                  ) : (
                    <div className="rc-font-list">
                      {filteredFonts.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`rc-font-card ${fontStyle === f.id ? 'active' : ''}`}
                          onClick={() => handleSelectFont(f.id)}
                        >
                          <div
                            className="rc-font-sample-box"
                            style={{ fontFamily: f.fontFamily }}
                          >
                            {f.sample}
                          </div>
                          <div className="rc-font-info">
                            <div
                              className="rc-font-name"
                              style={{ fontFamily: f.fontFamily }}
                            >
                              {f.name}
                            </div>
                            <div className="rc-font-cat">{f.category}</div>
                          </div>
                          {fontStyle === f.id && (
                            <Check size={15} color="#2563eb" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Form Content Body */}
          <div className="rc-form-body">
            {/* Step Section Header */}
            <div className="rc-section-header">
              <div className="rc-title-wrap">
                <h2>{currentStep.title}</h2>
                <p>{currentStep.subtitle}</p>
              </div>

              {activeStep === 1 && (
                <button
                  type="button"
                  className="rc-ai-btn"
                  onClick={handleAiEnhanceSummary}
                >
                  <Sparkles size={14} />
                  <span>AI Enhance</span>
                </button>
              )}

              {activeStep === 2 && (
                <button
                  type="button"
                  className="rc-add-btn"
                  onClick={handleAddExperience}
                >
                  <Plus size={14} />
                  <span>Add Experience</span>
                </button>
              )}

              {activeStep === 3 && (
                <button
                  type="button"
                  className="rc-add-btn"
                  onClick={handleAddEducation}
                >
                  <Plus size={14} />
                  <span>Add Education</span>
                </button>
              )}

              {activeStep === 4 && (
                <button
                  type="button"
                  className="rc-add-btn"
                  onClick={handleAddProject}
                >
                  <Plus size={14} />
                  <span>Add Project</span>
                </button>
              )}
            </div>

            {/* STEP 0: PERSONAL INFORMATION */}
            {activeStep === 0 && (
              <>
                <div className="rc-field">
                  <label>
                    <User size={14} />
                    <span>Full Name</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Name"
                    value={resumeData.personal.fullName}
                    onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                  />
                </div>

                <div className="rc-field">
                  <label>
                    <Mail size={14} />
                    <span>Email Address</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter Your Email"
                    value={resumeData.personal.email}
                    onChange={(e) => handlePersonalChange('email', e.target.value)}
                  />
                </div>

                <div className="rc-field rc-phone-field">
                  <label>
                    <Phone size={14} />
                    <span>Phone Number</span>
                    <span className="required">*</span>
                  </label>
                  <div className="rc-phone-input-group">
                    {/* Country Code Trigger */}
                    <div className="rc-country-dropdown-wrap" ref={countryPickerRef}>
                      <button
                        type="button"
                        className={`rc-country-trigger ${showCountryPicker ? 'active' : ''}`}
                        onClick={() => setShowCountryPicker((p) => !p)}
                        title="Select Country Code"
                      >
                        <span className="rc-country-flag">{selectedCountry?.flag || '🌐'}</span>
                        <span className="rc-country-dial">{resumeData.personal.countryCode || '+91'}</span>
                        <ChevronDown size={14} className={`rc-country-chevron ${showCountryPicker ? 'open' : ''}`} />
                      </button>

                      {/* Country Code Search & Picker Popover */}
                      {showCountryPicker && (
                        <div className="rc-country-picker-popover">
                          <div className="rc-country-search-box">
                            <Search size={13} className="rc-country-search-icon" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search country or code (+91, US)..."
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                            />
                            {countrySearchQuery && (
                              <button
                                type="button"
                                className="rc-country-search-clear"
                                onClick={() => setCountrySearchQuery('')}
                                title="Clear search"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          <div className="rc-country-list">
                            {filteredCountries.length === 0 ? (
                              <div className="rc-country-empty">
                                No countries match "{countrySearchQuery}"
                              </div>
                            ) : (
                              filteredCountries.map((c, idx) => {
                                const isSelected = (resumeData.personal.countryCode || '+91') === c.dialCode
                                return (
                                  <button
                                    key={`${c.code}-${c.dialCode}-${idx}`}
                                    type="button"
                                    className={`rc-country-item ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelectCountry(c)}
                                  >
                                    <span className="rc-item-flag">{c.flag}</span>
                                    <span className="rc-item-name">{c.name}</span>
                                    <span className="rc-item-dial">{c.dialCode}</span>
                                    {isSelected && <Check size={13} className="rc-item-check" />}
                                  </button>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      className="rc-phone-input"
                      placeholder="Enter Mobile No."
                      value={resumeData.personal.phone}
                      onChange={(e) => handlePersonalChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="rc-field">
                  <label>
                    <MapPin size={14} />
                    <span>Address</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Your Address"
                    value={resumeData.personal.location}
                    onChange={(e) => handlePersonalChange('location', e.target.value)}
                  />
                </div>

                <div className="rc-field">
                  <label>
                    <Briefcase size={14} />
                    <span>Profession</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your profession"
                    value={resumeData.personal.profession}
                    onChange={(e) => handlePersonalChange('profession', e.target.value)}
                  />
                </div>

                <div className="rc-field">
                  <label>
                    <LinkedInIcon size={14} />
                    <span>LinkedIn Profile</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your linkedin url"
                    value={resumeData.personal.linkedin}
                    onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                  />
                </div>

                <div className="rc-field">
                  <label>
                    <Globe size={14} />
                    <span>Personal Website</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your website url"
                    value={resumeData.personal.website}
                    onChange={(e) => handlePersonalChange('website', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* STEP 1: PROFESSIONAL SUMMARY */}
            {activeStep === 1 && (
              <>
                <div className="rc-field">
                  <textarea
                    rows={6}
                    placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
                    value={resumeData.summary}
                    onChange={(e) =>
                      setResumeData((prev) => ({ ...prev, summary: e.target.value }))
                    }
                  />
                </div>
                <div className="rc-tip-box">
                  Tip: Keep it concise (3-4 sentences) and focus on your most relevant achievements and skills.
                </div>
              </>
            )}

            {/* STEP 2: PROFESSIONAL EXPERIENCE */}
            {activeStep === 2 && (
              <>
                {resumeData.experience.length === 0 ? (
                  <div className="rc-empty-step-state">
                    <div className="rc-empty-icon-wrap">
                      <Briefcase size={26} />
                    </div>
                    <h4>No Experience Added</h4>
                    <p>
                      If you are a fresher or student without formal work history, you can proceed without adding experience.
                    </p>
                  </div>
                ) : (
                  resumeData.experience.map((exp, index) => (
                    <div className="rc-item-card" key={exp.id}>
                      <div className="rc-item-header">
                        <h4>Experience #{index + 1}</h4>
                        <button
                          type="button"
                          className="rc-delete-btn"
                          onClick={() => handleRemoveExperience(exp.id)}
                          title="Delete Experience"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="rc-grid-2">
                        <div className="rc-field">
                          <input
                            type="text"
                            placeholder="Company Name"
                            value={exp.company}
                            onChange={(e) =>
                              handleUpdateExperience(exp.id, 'company', e.target.value)
                            }
                          />
                        </div>
                        <div className="rc-field">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.role}
                            onChange={(e) =>
                              handleUpdateExperience(exp.id, 'role', e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="rc-grid-2">
                        <div className="rc-field rc-date-field">
                          <DateInputWithCalendar
                            value={exp.startDate}
                            onChange={(val) =>
                              handleUpdateExperience(exp.id, 'startDate', val)
                            }
                            placeholder="Start Date (e.g. Jun 2022)"
                          />
                        </div>
                        <div className="rc-field rc-date-field rc-date-align-right">
                          <DateInputWithCalendar
                            value={exp.currentlyWorking ? 'Present' : exp.endDate}
                            onChange={(val) =>
                              handleUpdateExperience(exp.id, 'endDate', val)
                            }
                            align="right"
                            placeholder={exp.currentlyWorking ? 'Present' : 'End Date (e.g. Present)'}
                            disabled={exp.currentlyWorking}
                          />
                        </div>
                      </div>

                      <label className="rc-checkbox-row">
                        <input
                          type="checkbox"
                          checked={exp.currentlyWorking}
                          onChange={(e) =>
                            handleUpdateExperience(
                              exp.id,
                              'currentlyWorking',
                              e.target.checked
                            )
                          }
                        />
                        <span>Currently working here</span>
                      </label>

                      <div className="rc-field">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Job Description</span>
                          <button
                            type="button"
                            className="rc-ai-inline-btn"
                            onClick={() => handleAiEnhanceExp(exp.id)}
                          >
                            <Sparkles size={12} />
                            <span>Enhance with AI</span>
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          placeholder="Describe your key responsibilities and achievements..."
                          value={exp.description}
                          onChange={(e) =>
                            handleUpdateExperience(exp.id, 'description', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* STEP 3: EDUCATION */}
            {activeStep === 3 && (
              <>
                {resumeData.education.length === 0 ? (
                  <div className="rc-empty-step-state">
                    <div className="rc-empty-icon-wrap">
                      <GraduationCap size={26} />
                    </div>
                    <h4>No Education Added</h4>
                    <p>
                      Add your educational qualifications to highlight your academic achievements and credentials.
                    </p>
                    {/* <button
                      type="button"
                      className="rc-add-field-btn"
                      onClick={handleAddEducation}
                    >
                      <Plus size={14} />
                      <span> Add Education</span>
                    </button> */}
                  </div>
                ) : (
                  resumeData.education.map((edu, index) => (
                    <div className="rc-item-card" key={edu.id}>
                      <div className="rc-item-header">
                        <h4>Education #{index + 1}</h4>
                        <button
                          type="button"
                          className="rc-delete-btn"
                          onClick={() => handleRemoveEducation(edu.id)}
                          title="Delete Education"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="rc-grid-2">
                        <div className="rc-field">
                          <input
                            type="text"
                            placeholder="Institution Name"
                            value={edu.institution}
                            onChange={(e) =>
                              handleUpdateEducation(edu.id, 'institution', e.target.value)
                            }
                          />
                        </div>
                        <div className="rc-field">
                          <input
                            type="text"
                            placeholder="Degree (e.g., Bachelor's, Master's)"
                            value={edu.degree}
                            onChange={(e) =>
                              handleUpdateEducation(edu.id, 'degree', e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="rc-grid-2">
                        <div className="rc-field">
                          <input
                            type="text"
                            placeholder="Field of Study"
                            value={edu.field}
                            onChange={(e) =>
                              handleUpdateEducation(edu.id, 'field', e.target.value)
                            }
                          />
                        </div>
                        <div className="rc-field rc-date-field rc-date-align-right">
                          <DateInputWithCalendar
                            value={edu.date}
                            onChange={(val) =>
                              handleUpdateEducation(edu.id, 'date', val)
                            }
                            align="right"
                            placeholder="Graduation Date (e.g. May 2024)"
                          />
                        </div>
                      </div>

                      <div className="rc-field">
                        <input
                          type="text"
                          placeholder="GPA (optional)"
                          value={edu.gpa}
                          onChange={(e) =>
                            handleUpdateEducation(edu.id, 'gpa', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* STEP 4: PROJECTS */}
            {activeStep === 4 && (
              <>
                {resumeData.projects.length === 0 ? (
                  <div className="rc-empty-step-state">
                    <div className="rc-empty-icon-wrap">
                      <FolderGit2 size={26} />
                    </div>
                    <h4>No Projects Added</h4>
                    <p>
                      If you have any projects from your academic or professional life, you can add them here.
                    </p>
                    {/* <button
                      type="button"
                      className="rc-add-field-btn"
                      onClick={handleAddProject}
                    >
                      <Plus size={14} />
                      <span> Add Project</span>
                    </button> */}
                  </div>
                ) : (
                  resumeData.projects.map((proj, index) => (
                    <div className="rc-item-card" key={proj.id}>
                      <div className="rc-item-header">
                        <h4>Project #{index + 1}</h4>
                        <button
                          type="button"
                          className="rc-delete-btn"
                          onClick={() => handleRemoveProject(proj.id)}
                          title="Delete Project"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="rc-field">
                        <input
                          type="text"
                          placeholder="Project Name"
                          value={proj.name}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, 'name', e.target.value)
                          }
                        />
                      </div>

                      <div className="rc-field">
                        <input
                          type="text"
                          placeholder="Project Type"
                          value={proj.type}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, 'type', e.target.value)
                          }
                        />
                      </div>

                      <div className="rc-field">
                        <textarea
                          rows={3}
                          placeholder="Describe your project..."
                          value={proj.description}
                          onChange={(e) =>
                            handleUpdateProject(proj.id, 'description', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* STEP 5: SKILLS */}
            {activeStep === 5 && (
              <div className="rc-skills-wrap">
                <div className="rc-skills-chip-box">
                  {resumeData.skills.map((skill) => (
                    <span className="rc-skill-chip" key={skill}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        title="Remove skill"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="rc-skill-input"
                    placeholder="Type skill & press Enter..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleAddSkill(skillInput)
                      }
                    }}
                  />
                </div>

                <div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 8px' }}>
                    Quick suggestions (click to add):
                  </p>
                  <div className="rc-skill-suggestions">
                    {SKILL_SUGGESTIONS.filter((s) => !resumeData.skills.includes(s)).map(
                      (sug) => (
                        <button
                          key={sug}
                          type="button"
                          className="rc-sugg-pill"
                          onClick={() => handleAddSkill(sug)}
                        >
                          + {sug}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Row: Finish Resume on Bottom Right (Only on last page: skills) */}
            {STEPS[activeStep]?.id === 'skills' && (
              <div className="rc-card-bottom-actions">
                <button
                  type="button"
                  className="rc-finish-btn-bottom"
                  onClick={handleFinishResume}
                  title="Finish and save resume to workspace"
                >
                  <CheckCircle2 size={15} strokeWidth={2.2} />
                  <span>Finish Resume</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compute live preview data: fallback to demo formatting if field/section is empty */}
        {(() => {
          const hasUserPersonal = Boolean(
            resumeData.personal?.fullName?.trim() ||
            resumeData.personal?.profession?.trim() ||
            resumeData.personal?.email?.trim() ||
            resumeData.personal?.phone?.trim() ||
            resumeData.personal?.location?.trim() ||
            resumeData.personal?.linkedin?.trim() ||
            resumeData.personal?.website?.trim()
          )

          const previewPersonal = {
            fullName: resumeData.personal?.fullName?.trim() || DEMO_RESUME_DATA.personal.fullName,
            profession: resumeData.personal?.profession?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.profession : ''),
            email: resumeData.personal?.email?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.email : ''),
            phone: resumeData.personal?.phone?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.phone : ''),
            countryCode: resumeData.personal?.countryCode || '+91',
            location: resumeData.personal?.location?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.location : ''),
            linkedin: resumeData.personal?.linkedin?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.linkedin : ''),
            website: resumeData.personal?.website?.trim() || (!hasUserPersonal ? DEMO_RESUME_DATA.personal.website : '')
          }

          const previewSummary = resumeData.summary?.trim() || DEMO_RESUME_DATA.summary

          const userValidExp = Array.isArray(resumeData.experience)
            ? resumeData.experience.filter((e) => e.role?.trim() || e.company?.trim() || e.description?.trim())
            : []
          const hasExpFields = Array.isArray(resumeData.experience) && resumeData.experience.length > 0
          const previewExperience = !hasExpFields
            ? []
            : userValidExp.length > 0
              ? userValidExp
              : DEMO_RESUME_DATA.experience

          const userValidEdu = Array.isArray(resumeData.education)
            ? resumeData.education.filter((e) => e.institution?.trim() || e.degree?.trim() || e.field?.trim())
            : []
          const hasEduFields = Array.isArray(resumeData.education) && resumeData.education.length > 0
          const previewEducation = !hasEduFields
            ? []
            : userValidEdu.length > 0
              ? userValidEdu
              : DEMO_RESUME_DATA.education

          const userValidProj = Array.isArray(resumeData.projects)
            ? resumeData.projects.filter((p) => p.name?.trim() || p.description?.trim())
            : []
          const hasProjFields = Array.isArray(resumeData.projects) && resumeData.projects.length > 0
          const previewProjects = !hasProjFields
            ? []
            : userValidProj.length > 0
              ? userValidProj
              : DEMO_RESUME_DATA.projects

          const previewSkills = Array.isArray(resumeData.skills) && resumeData.skills.length > 0
            ? resumeData.skills
            : DEMO_RESUME_DATA.skills

          return (
            /* Right Column: Live Resume Preview Sheet */
            <div className="rc-preview-column">
              <div
                className={`rc-resume-sheet layout-${layout} font-${fontStyle}`}
                style={{
                  '--accent-color': accentColor,
                  fontFamily: FONT_OPTIONS.find((f) => f.id === fontStyle)?.fontFamily || 'inherit'
                }}
              >
                {/* Header */}
                <div className="rs-header">
                  <h1 className="rs-name">
                    {previewPersonal.fullName}
                  </h1>
                  {previewPersonal.profession && (
                    <div className="rs-profession">
                      {previewPersonal.profession}
                    </div>
                  )}

                  <div className="rs-contact-row">
                    {previewPersonal.email && (
                      <span className="rs-contact-item">
                        <Mail size={13} />
                        <span>{previewPersonal.email}</span>
                      </span>
                    )}
                    {previewPersonal.phone && (
                      <span className="rs-contact-item">
                        <Phone size={13} />
                        <span>
                          {previewPersonal.phone.startsWith('+')
                            ? previewPersonal.phone
                            : `${previewPersonal.countryCode || '+91'} ${previewPersonal.phone}`}
                        </span>
                      </span>
                    )}
                    {previewPersonal.location && (
                      <span className="rs-contact-item">
                        <MapPin size={13} />
                        <span>{previewPersonal.location}</span>
                      </span>
                    )}
                    {previewPersonal.linkedin && (
                      <span className="rs-contact-item">
                        <LinkedInIcon size={13} />
                        <span>{previewPersonal.linkedin}</span>
                      </span>
                    )}
                  </div>

                  {previewPersonal.website && (
                    <div className="rs-website-row">
                      <Globe size={13} />
                      <span>{previewPersonal.website}</span>
                    </div>
                  )}

                  <div className="rs-divider-line" />
                </div>

                {/* Layout Specific Rendering */}
                {layout === 'two-column' ? (
                  <div className="rs-two-col-grid">
                    <div className="rs-side-column">
                      {/* Skills Section */}
                      {previewSkills.length > 0 && (
                        <div className="rs-section">
                          <h3 className="rs-section-title">Skills</h3>
                          <div className="rs-skills-grid">
                            {previewSkills.map((skill) => (
                              <span className="rs-skill-badge" key={skill}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education Section */}
                      {previewEducation.length > 0 && (
                        <div className="rs-section">
                          <h3 className="rs-section-title">Education</h3>
                          <div className="rs-items-list">
                            {previewEducation.map((edu) => (
                              <div className="rs-item" key={edu.id || edu.institution}>
                                <div className="rs-item-top">
                                  <span className="rs-item-title">
                                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                                  </span>
                                  {edu.date && (
                                    <span className="rs-item-date">{edu.date}</span>
                                  )}
                                </div>
                                {edu.institution && (
                                  <div className="rs-item-sub">{edu.institution}</div>
                                )}
                                {edu.gpa && (
                                  <p className="rs-item-desc">GPA: {edu.gpa}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rs-main-column">
                      {/* Summary Section */}
                      {previewSummary && (
                        <div className="rs-section">
                          <h3 className="rs-section-title">Professional Summary</h3>
                          <p className="rs-summary-text">{previewSummary}</p>
                        </div>
                      )}

                      {/* Experience Section */}
                      {previewExperience.length > 0 && (
                        <div className="rs-section">
                          <h3 className="rs-section-title">Professional Experience</h3>
                          <div className="rs-items-list">
                            {previewExperience.map((exp) => (
                              <div className="rs-item" key={exp.id || exp.role}>
                                <div className="rs-item-top">
                                  <span className="rs-item-title">
                                    {exp.role || 'Job Title'}
                                  </span>
                                  {(exp.startDate || exp.endDate) && (
                                    <span className="rs-item-date">
                                      {exp.startDate} -{' '}
                                      {exp.currentlyWorking ? 'Present' : exp.endDate}
                                    </span>
                                  )}
                                </div>
                                {exp.company && (
                                  <div className="rs-item-sub">{exp.company}</div>
                                )}
                                {exp.description && (
                                  <p className="rs-item-desc">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects Section */}
                      {previewProjects.length > 0 && (
                        <div className="rs-section">
                          <h3 className="rs-section-title">Projects</h3>
                          <div className="rs-items-list">
                            {previewProjects.map((proj) => (
                              <div className="rs-item" key={proj.id || proj.name}>
                                <div className="rs-item-top">
                                  <span className="rs-item-title">{proj.name}</span>
                                  {proj.type && (
                                    <span className="rs-item-date">{proj.type}</span>
                                  )}
                                </div>
                                {proj.description && (
                                  <p className="rs-item-desc">{proj.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rs-single-col" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {/* Summary Section */}
                    {previewSummary && (
                      <div className="rs-section">
                        <h3 className="rs-section-title">Professional Summary</h3>
                        <p className="rs-summary-text">{previewSummary}</p>
                      </div>
                    )}

                    {/* Experience Section */}
                    {previewExperience.length > 0 && (
                      <div className="rs-section">
                        <h3 className="rs-section-title">Professional Experience</h3>
                        <div className="rs-items-list">
                          {previewExperience.map((exp) => (
                            <div className="rs-item" key={exp.id || exp.role}>
                              <div className="rs-item-top">
                                <span className="rs-item-title">
                                  {exp.role || 'Job Title'}
                                </span>
                                {(exp.startDate || exp.endDate) && (
                                  <span className="rs-item-date">
                                    {exp.startDate} -{' '}
                                    {exp.currentlyWorking ? 'Present' : exp.endDate}
                                  </span>
                                )}
                              </div>
                              {exp.company && (
                                <div className="rs-item-sub">{exp.company}</div>
                              )}
                              {exp.description && (
                                <p className="rs-item-desc">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education Section */}
                    {previewEducation.length > 0 && (
                      <div className="rs-section">
                        <h3 className="rs-section-title">Education</h3>
                        <div className="rs-items-list">
                          {previewEducation.map((edu) => (
                            <div className="rs-item" key={edu.id || edu.institution}>
                              <div className="rs-item-top">
                                <span className="rs-item-title">
                                  {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                                </span>
                                {edu.date && (
                                  <span className="rs-item-date">{edu.date}</span>
                                )}
                              </div>
                              {edu.institution && (
                                <div className="rs-item-sub">{edu.institution}</div>
                              )}
                              {edu.gpa && (
                                <p className="rs-item-desc">GPA: {edu.gpa}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects Section */}
                    {previewProjects.length > 0 && (
                      <div className="rs-section">
                        <h3 className="rs-section-title">Projects</h3>
                        <div className="rs-items-list">
                          {previewProjects.map((proj) => (
                            <div className="rs-item" key={proj.id || proj.name}>
                              <div className="rs-item-top">
                                <span className="rs-item-title">{proj.name}</span>
                                {proj.type && (
                                  <span className="rs-item-date">{proj.type}</span>
                                )}
                              </div>
                              {proj.description && (
                                <p className="rs-item-desc">{proj.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills Section */}
                    {previewSkills.length > 0 && (
                      <div className="rs-section">
                        <h3 className="rs-section-title">Skills</h3>
                        <div className="rs-skills-grid">
                          {previewSkills.map((skill) => (
                            <span className="rs-skill-badge" key={skill}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Resume Finished Celebration Modal */}
      {showFinishedModal && (
        <div className="rc-modal-backdrop" onClick={() => setShowFinishedModal(false)}>
          <div className="rc-modal-card rc-finished-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-badge-icon">
              <CheckCircle2 size={34} strokeWidth={2.4} />
            </div>

            <h3>Resume Created Successfully!</h3>
            <p>
              Your resume{' '}
              <strong>
                {resumeData.personal?.fullName ? `${resumeData.personal.fullName}'s Resume` : 'My ATS Resume'}
              </strong>{' '}
              is now saved to your dashboard workspace and ready for ATS analysis.
            </p>

            <div className="rc-modal-summary-box">
              <div className="rc-modal-stat-pill">
                <User size={14} />
                <span>{resumeData.personal?.fullName || 'Full Name'}</span>
              </div>
              <div className="rc-modal-stat-pill">
                <Briefcase size={14} />
                <span>{resumeData.personal?.profession || 'Software Engineer'}</span>
              </div>
              <div className="rc-modal-stat-pill">
                <LayoutTemplate size={14} />
                <span>{layout === 'two-column' ? 'Modern 2-Column' : 'Classic 1-Column'}</span>
              </div>
              <div className="rc-modal-stat-pill ats-pill">
                <Wand2 size={14} />
                <span>ATS Ready</span>
              </div>
            </div>

            <div className="rc-modal-actions-grid">
              <button
                type="button"
                className="rc-modal-btn primary"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft size={16} />
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                className="rc-modal-btn secondary"
                onClick={() => navigate('/ats-calculator')}
              >
                <Sparkles size={16} />
                <span>Check ATS Score</span>
              </button>

              <button
                type="button"
                className="rc-modal-btn outline enhancer-btn"
                onClick={() => navigate('/ats-enhancer')}
              >
                <Wand2 size={16} />
                <span>Enhance ATS</span>
              </button>

              <button
                type="button"
                className="rc-modal-btn outline"
                onClick={() => downloadResumeAsPdf(resumeData)}
              >
                <FileText size={16} />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                className="rc-modal-btn outline docx-btn"
                onClick={() => downloadResumeAsDocx(resumeData, { accentColor })}
              >
                <FileEdit size={16} />
                <span>Download Word (.docx)</span>
              </button>
            </div>

            <button
              type="button"
              className="rc-modal-close-link"
              onClick={() => setShowFinishedModal(false)}
            >
              Continue editing resume
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="rc-toast">
          <Check size={18} className="check-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default ResumeCreator
