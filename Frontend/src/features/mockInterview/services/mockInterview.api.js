import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/mock-interview');

export const setupMockInterviewApi = async ({ role, experience, interviewType, resumePdfFile, resumeData }) => {
  const formData = new FormData();
  if (role) formData.append('role', role);
  if (experience) formData.append('experience', experience);
  if (interviewType) formData.append('interviewType', interviewType);
  if (resumePdfFile) formData.append('resumePdf', resumePdfFile);
  if (resumeData) formData.append('resumeData', JSON.stringify(resumeData));

  const res = await api.post('/setup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data?.result || res.data;
};

export const evaluateAnswerApi = async ({ question, answer, role, interviewType }) => {
  const res = await api.post('/evaluate', { question, answer, role, interviewType });
  return res.data?.result || res.data;
};

export const generateInterviewReportApi = async ({ sessionResults, role, interviewType }) => {
  const res = await api.post('/report', { sessionResults, role, interviewType });
  return res.data?.result || res.data;
};

// Database persistence APIs
export const fetchMockReports = async () => {
  const res = await api.get('/reports');
  return res.data?.mockReports || res.data || [];
};

export const saveMockReportToDb = async (reportData) => {
  const res = await api.post('/reports', reportData);
  return res.data?.report || res.data;
};

export const deleteMockReportFromDb = async (id) => {
  const res = await api.delete(`/reports/${id}`);
  return res.data;
};
