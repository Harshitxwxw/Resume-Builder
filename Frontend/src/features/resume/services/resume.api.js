import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/resumes');

export const fetchAllResumes = async () => {
  const res = await api.get('/');
  return res.data?.resumes || [];
};

export const fetchResumeById = async (id) => {
  const res = await api.get(`/${id}`);
  return res.data?.resume;
};

export const saveResumeToDb = async (resumeData) => {
  const res = await api.post('/', resumeData);
  return res.data?.resume;
};

export const deleteResumeFromDb = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};

