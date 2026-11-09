import { createApiClient } from '../../../services/apiClient';

const api = createApiClient('/profile');

export const fetchProfileFromDb = async () => {
  const res = await api.get('/');
  return res.data?.profile;
};

export const updateProfileInDb = async (profileData) => {
  const res = await api.put('/', profileData);
  return res.data?.profile;
};

