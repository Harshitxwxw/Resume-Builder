// Storage service for Wishlist / Bookmarked Reports and Resumes
import { getUserScopedKey } from '../../../utils/userScope'
import { fetchWishlistFromDb, toggleWishlistInDb } from './wishlist.api'

const WISHLIST_REPORTS_KEY = 'career_ai_wishlist_reports'
const WISHLIST_RESUMES_KEY = 'career_ai_wishlist_resumes'
const WISHLIST_MOCK_REPORTS_KEY = 'career_ai_wishlist_mock_reports'
const WISHLIST_EVENT_NAME = 'career_wishlist_updated'

export const syncWishlistFromDb = async () => {
  try {
    const data = await fetchWishlistFromDb();
    if (data) {
      if (Array.isArray(data.reports)) {
        localStorage.setItem(getUserScopedKey(WISHLIST_REPORTS_KEY), JSON.stringify(data.reports));
      }
      if (Array.isArray(data.resumes)) {
        localStorage.setItem(getUserScopedKey(WISHLIST_RESUMES_KEY), JSON.stringify(data.resumes));
      }
      if (Array.isArray(data.mockReports)) {
        localStorage.setItem(getUserScopedKey(WISHLIST_MOCK_REPORTS_KEY), JSON.stringify(data.mockReports));
      }
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT_NAME));
      return data;
    }
  } catch (err) {
    console.warn('Could not sync wishlist from DB:', err);
  }
  return {
    reports: getWishlistReports(),
    resumes: getWishlistResumes(),
    mockReports: getWishlistMockReports()
  };
};

/**
 * Dispatch update event so any listening component refreshes
 */
const notifyWishlistChange = () => {
  try {
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT_NAME))
  } catch (e) {
    console.warn('Could not dispatch wishlist event:', e)
  }
}

/**
 * Get all wishlisted interview reports for the active user
 */
export const getWishlistReports = () => {
  try {
    const scopedKey = getUserScopedKey(WISHLIST_REPORTS_KEY)
    const raw = localStorage.getItem(scopedKey)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to read wishlist reports:', err)
    return []
  }
}

/**
 * Check if a specific report is wishlisted
 */
export const isReportWishlisted = (reportId) => {
  if (!reportId) return false
  const list = getWishlistReports()
  return list.some((item) => (item._id || item.id) === reportId)
}

/**
 * Toggle an interview report in the wishlist
 */
export const toggleReportWishlist = (report) => {
  if (!report) return false
  const reportId = report._id || report.id
  if (!reportId) return false

  const list = getWishlistReports()
  const exists = list.some((item) => (item._id || item.id) === reportId)

  let updated = []
  let isNowWishlisted = false

  if (exists) {
    // Remove from wishlist
    updated = list.filter((item) => (item._id || item.id) !== reportId)
    isNowWishlisted = false
  } else {
    // Add snapshot to wishlist
    const snapshot = {
      _id: reportId,
      id: reportId,
      title: report.title || 'Technical Interview Report',
      matchscore: report.matchscore ?? report.matchScore ?? 85,
      matchScore: report.matchscore ?? report.matchScore ?? 85,
      createdAt: report.createdAt || new Date().toISOString(),
      preparationPlan: report.preparationPlan || [],
      technicalQuestions: report.technicalQuestions || [],
      behavioralQuestions: report.behavioralQuestions || [],
      skillGaps: report.skillGaps || [],
      isTracked: Boolean(report.isTracked),
      wishlistedAt: new Date().toISOString()
    }
    updated = [snapshot, ...list]
    isNowWishlisted = true
  }

  try {
    const scopedKey = getUserScopedKey(WISHLIST_REPORTS_KEY)
    localStorage.setItem(scopedKey, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save wishlist reports:', err)
  }

  toggleWishlistInDb('report', reportId).catch((err) => console.warn('Could not sync wishlist to DB:', err))

  notifyWishlistChange()
  return isNowWishlisted
}

/**
 * Get all wishlisted resumes for the active user
 */
export const getWishlistResumes = () => {
  try {
    const scopedKey = getUserScopedKey(WISHLIST_RESUMES_KEY)
    const raw = localStorage.getItem(scopedKey)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to read wishlist resumes:', err)
    return []
  }
}

/**
 * Check if a specific resume is wishlisted
 */
export const isResumeWishlisted = (resumeId) => {
  if (!resumeId) return false
  const list = getWishlistResumes()
  return list.some((item) => item.id === resumeId)
}

/**
 * Toggle a resume in the wishlist
 */
export const toggleResumeWishlist = (resume) => {
  if (!resume || !resume.id) return false
  const resumeId = resume.id

  const list = getWishlistResumes()
  const exists = list.some((item) => item.id === resumeId)

  let updated = []
  let isNowWishlisted = false

  if (exists) {
    // Remove
    updated = list.filter((item) => item.id !== resumeId)
    isNowWishlisted = false
  } else {
    // Add snapshot
    const snapshot = {
      id: resumeId,
      title: resume.title || resume.data?.personal?.fullName || 'ATS Resume',
      updatedAt: resume.updatedAt || new Date().toISOString(),
      layout: resume.layout || 'single-column',
      font: resume.font || 'Inter',
      data: resume.data || {},
      wishlistedAt: new Date().toISOString()
    }
    updated = [snapshot, ...list]
    isNowWishlisted = true
  }

  try {
    const scopedKey = getUserScopedKey(WISHLIST_RESUMES_KEY)
    localStorage.setItem(scopedKey, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save wishlist resumes:', err)
  }

  toggleWishlistInDb('resume', resumeId).catch((err) => console.warn('Could not sync wishlist to DB:', err))

  notifyWishlistChange()
  return isNowWishlisted
}

/**
 * Remove an item directly
 */
export const removeWishlistReport = (reportId) => {
  const list = getWishlistReports()
  const updated = list.filter((item) => (item._id || item.id) !== reportId)
  localStorage.setItem(getUserScopedKey(WISHLIST_REPORTS_KEY), JSON.stringify(updated))
  notifyWishlistChange()
  return updated
}

export const removeWishlistResume = (resumeId) => {
  const list = getWishlistResumes()
  const updated = list.filter((item) => item.id !== resumeId)
  localStorage.setItem(getUserScopedKey(WISHLIST_RESUMES_KEY), JSON.stringify(updated))
  notifyWishlistChange()
  return updated
}

/**
 * Get all wishlisted mock interview reports for the active user
 */
export const getWishlistMockReports = () => {
  try {
    const scopedKey = getUserScopedKey(WISHLIST_MOCK_REPORTS_KEY)
    const raw = localStorage.getItem(scopedKey)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to read wishlist mock reports:', err)
    return []
  }
}

/**
 * Check if a specific mock report is wishlisted
 */
export const isMockReportWishlisted = (mockId) => {
  if (!mockId) return false
  const list = getWishlistMockReports()
  return list.some((item) => (item.id || item._id) === mockId)
}

/**
 * Toggle a mock interview report in the wishlist
 */
export const toggleMockReportWishlist = (mock) => {
  if (!mock) return false
  const mockId = mock.id || mock._id
  if (!mockId) return false

  const list = getWishlistMockReports()
  const exists = list.some((item) => (item.id || item._id) === mockId)

  let updated = []
  let isNowWishlisted = false

  if (exists) {
    updated = list.filter((item) => (item.id || item._id) !== mockId)
    isNowWishlisted = false
  } else {
    const snapshot = {
      id: mockId,
      _id: mockId,
      role: mock.role || 'Software Engineer',
      level: mock.level || mock.experience || 'Intermediate',
      interviewType: mock.interviewType || 'Technical',
      overallScore: mock.overallScore ?? mock.score ?? 8.0,
      createdAt: mock.createdAt || new Date().toISOString(),
      qaCount: mock.qaCount || (mock.transcript ? mock.transcript.length : 5),
      wishlistedAt: new Date().toISOString()
    }
    updated = [snapshot, ...list]
    isNowWishlisted = true
  }

  try {
    const scopedKey = getUserScopedKey(WISHLIST_MOCK_REPORTS_KEY)
    localStorage.setItem(scopedKey, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save wishlist mock reports:', err)
  }

  toggleWishlistInDb('mockReport', mockId).catch((err) => console.warn('Could not sync wishlist to DB:', err))

  notifyWishlistChange()
  return isNowWishlisted
}

export const removeWishlistMockReport = (mockId) => {
  const list = getWishlistMockReports()
  const updated = list.filter((item) => (item.id || item._id) !== mockId)
  localStorage.setItem(getUserScopedKey(WISHLIST_MOCK_REPORTS_KEY), JSON.stringify(updated))
  notifyWishlistChange()
  return updated
}

/**
 * Get quick count stats
 */
export const getWishlistCounts = () => {
  const reports = getWishlistReports()
  const resumes = getWishlistResumes()
  const mockReports = getWishlistMockReports()
  return {
    reports: reports.length,
    resumes: resumes.length,
    mockReports: mockReports.length,
    total: reports.length + resumes.length + mockReports.length
  }
}
