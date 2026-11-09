import { getUserScopedKey } from '../../../utils/userScope';
import { fetchMockReports, saveMockReportToDb, deleteMockReportFromDb } from './mockInterview.api';

export const MOCK_REPORTS_KEY = 'career_ai_mock_reports';

export async function syncMockReportsFromDb() {
  try {
    const dbReports = await fetchMockReports();
    if (Array.isArray(dbReports)) {
      const normalized = dbReports.map((r) => ({
        ...r,
        id: String(r._id || r.id)
      }));
      localStorage.setItem(getUserScopedKey(MOCK_REPORTS_KEY), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('career_mock_report_saved'));
      return normalized;
    }
  } catch (err) {
    console.warn('Could not sync mock reports from DB:', err);
  }
  return getSavedMockReports();
}

export function getSavedMockReports() {
  try {
    const scopedKey = getUserScopedKey(MOCK_REPORTS_KEY);
    const raw = localStorage.getItem(scopedKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((r) => ({
          ...r,
          id: String(r._id || r.id)
        }));
      }
    }
  } catch (e) {
    console.warn('Error reading saved mock reports:', e);
  }
  return [];
}

export function saveMockReport(report) {
  if (!report) return [];
  const list = getSavedMockReports();
  const id = String(report._id || report.id || `mock-${Date.now()}`);
  const newReport = {
    ...report,
    id,
    createdAt: report.createdAt || new Date().toISOString()
  };

  const updated = [newReport, ...list.filter((r) => String(r.id) !== id)];
  try {
    const scopedKey = getUserScopedKey(MOCK_REPORTS_KEY);
    localStorage.setItem(scopedKey, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('career_mock_report_saved', { detail: newReport }));
  } catch (e) {
    console.warn('Error saving mock report:', e);
  }

  // Persist to MongoDB
  saveMockReportToDb({
    role: newReport.role,
    interviewType: newReport.interviewType,
    score: newReport.score,
    performanceLevel: newReport.performanceLevel,
    totalQuestions: newReport.totalQuestions,
    feedbackSummary: newReport.feedbackSummary,
    answers: newReport.answers
  }).catch((err) => console.warn('Could not save mock report to MongoDB:', err));

  return updated;
}

export function deleteMockReport(id) {
  const list = getSavedMockReports();
  const updated = list.filter((r) => String(r.id) !== String(id));
  try {
    const scopedKey = getUserScopedKey(MOCK_REPORTS_KEY);
    localStorage.setItem(scopedKey, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('career_mock_report_saved'));
  } catch (e) {
    console.warn('Error deleting mock report:', e);
  }

  // Delete from MongoDB
  deleteMockReportFromDb(id).catch((err) => console.warn('Could not delete mock report from MongoDB:', err));

  return updated;
}
