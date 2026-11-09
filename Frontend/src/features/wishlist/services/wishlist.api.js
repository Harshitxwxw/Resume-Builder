import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/wishlist');

export const fetchWishlistFromDb = async () => {
  const res = await api.get('/');
  return {
    reports: res.data?.reports || [],
    resumes: res.data?.resumes || []
  };
};

export const toggleWishlistInDb = async (type, itemId) => {
  const res = await api.post('/toggle', { type, itemId });
  return res.data;
};

