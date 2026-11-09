import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/credits');

export const fetchUserCredits = async () => {
  const res = await api.get('/');
  return {
    credits: typeof res.data?.credits === 'number' ? res.data.credits : 100,
    history: res.data?.history || []
  };
};

export const deductCreditsFromDb = async (amount, reason) => {
  const res = await api.post('/deduct', { amount, reason });
  return res.data;
};

export const awardCreditsToDb = async (amount, reason) => {
  const res = await api.post('/award', { amount, reason });
  return res.data;
};

