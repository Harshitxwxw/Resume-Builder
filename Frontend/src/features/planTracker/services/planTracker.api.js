import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/plan-tracker');

export const fetchPlanTracker = async () => {
  const res = await api.get('/');
  return {
    trackedPlanIds: res.data?.trackedPlanIds || [],
    completedTasks: res.data?.completedTasks || [],
    awardedDays: res.data?.awardedDays || []
  };
};

export const toggleTrackPlanInDb = async (planId, shouldTrack) => {
  const res = await api.post('/track', { planId, shouldTrack });
  return res.data;
};

export const toggleTaskCompletionInDb = async (taskId, completed) => {
  const res = await api.post('/task', { taskId, completed });
  return res.data;
};

export const awardPlanDayInDb = async (planId, dayNum, dayTitle) => {
  const res = await api.post('/award-day', { planId, dayNum, dayTitle });
  return res.data;
};

