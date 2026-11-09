import { getUserScopedKey } from '../../../utils/userScope';
import { fetchAllResumes, saveResumeToDb, deleteResumeFromDb } from './resume.api';

export const SAVED_RESUMES_KEY = 'career_ai_saved_resumes';
export const ACTIVE_RESUME_ID_KEY = 'career_ai_active_resume_id';
export const CURRENT_RESUME_DATA_KEY = 'career_ai_resume_data';

export const syncResumesFromDb = async () => {
  try {
    const dbResumes = await fetchAllResumes();
    if (Array.isArray(dbResumes)) {
      const normalized = dbResumes.map((r) => ({
        ...r,
        id: String(r._id || r.id)
      }));
      localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent('career_resume_saved'));
      return normalized;
    }
  } catch (err) {
    console.warn('Could not sync resumes from DB:', err);
  }
  return getSavedResumes();
};

export const getSavedResumes = () => {
  try {
    const scopedKey = getUserScopedKey(SAVED_RESUMES_KEY);
    const raw = localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r.isFinished !== false).map((r) => ({
          ...r,
          id: String(r._id || r.id)
        }));
      }
    }
  } catch (e) {
    console.warn('Error reading saved resumes from storage:', e);
  }

  return [];
};

/**
 * Save resume changes (updates active draft or existing resume and syncs to MongoDB)
 */
export const saveResume = (resumeItem) => {
  if (!resumeItem || !resumeItem.id) return [];
  const list = getSavedResumes();
  const existingIdx = list.findIndex((r) => String(r.id) === String(resumeItem.id));
  const updatedItem = {
    ...resumeItem,
    id: String(resumeItem._id || resumeItem.id),
    updatedAt: new Date().toISOString()
  };

  let newList = [...list];

  if (existingIdx >= 0) {
    newList[existingIdx] = updatedItem;
    try {
      localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(newList));
    } catch (e) {
      console.warn(e);
    }
  } else if (updatedItem.isFinished === true) {
    newList = [updatedItem, ...list];
    try {
      localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(newList));
    } catch (e) {
      console.warn(e);
    }
  }

  // Always update working draft
  try {
    localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(updatedItem.data));
    localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), updatedItem.id);
    if (updatedItem.layout) localStorage.setItem(getUserScopedKey('career_ai_resume_layout'), updatedItem.layout);
    if (updatedItem.font) localStorage.setItem(getUserScopedKey('career_ai_resume_font'), updatedItem.font);
  } catch (e) {
    console.warn('Error saving resume to localStorage:', e);
  }

  // Persist to MongoDB
  saveResumeToDb({
    id: updatedItem.id.startsWith('res-') ? undefined : updatedItem.id,
    title: updatedItem.title,
    data: updatedItem.data,
    layout: updatedItem.layout,
    font: updatedItem.font,
    isFinished: updatedItem.isFinished
  }).catch((err) => console.warn('Could not persist resume to MongoDB:', err));

  return newList;
};

/**
 * Finish and permanently save a resume to MongoDB and local cache
 */
export const finishResume = (resumeItem) => {
  if (!resumeItem || !resumeItem.id) return [];
  const list = getSavedResumes();
  const existingIdx = list.findIndex((r) => String(r.id) === String(resumeItem.id));

  const finishedItem = {
    ...resumeItem,
    id: String(resumeItem._id || resumeItem.id),
    isFinished: true,
    updatedAt: new Date().toISOString()
  };

  let newList;
  if (existingIdx >= 0) {
    newList = [...list];
    newList[existingIdx] = finishedItem;
  } else {
    newList = [finishedItem, ...list];
  }

  try {
    localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(newList));
    localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(finishedItem.data));
    localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), finishedItem.id);
    if (finishedItem.layout) localStorage.setItem(getUserScopedKey('career_ai_resume_layout'), finishedItem.layout);
    if (finishedItem.font) localStorage.setItem(getUserScopedKey('career_ai_resume_font'), finishedItem.font);
    window.dispatchEvent(new CustomEvent('career_resume_saved', { detail: finishedItem }));
  } catch (e) {
    console.warn('Error finishing resume:', e);
  }

  // Persist to MongoDB
  saveResumeToDb({
    id: finishedItem.id.startsWith('res-') ? undefined : finishedItem.id,
    title: finishedItem.title,
    data: finishedItem.data,
    layout: finishedItem.layout,
    font: finishedItem.font,
    isFinished: true
  }).catch((err) => console.warn('Could not persist resume to MongoDB:', err));

  return newList;
};

export const deleteResume = (id) => {
  const list = getSavedResumes();
  const newList = list.filter((r) => String(r.id) !== String(id));
  try {
    localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(newList));
    if (localStorage.getItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY)) === String(id)) {
      if (newList.length > 0) {
        localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), newList[0].id);
        localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(newList[0].data));
      } else {
        localStorage.removeItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY));
      }
    }
    window.dispatchEvent(new CustomEvent('career_resume_saved'));
  } catch (e) {
    console.warn('Error deleting resume from storage:', e);
  }

  // Delete from MongoDB
  deleteResumeFromDb(id).catch((err) => console.warn('Could not delete resume from MongoDB:', err));

  return newList;
};

export const createNewResume = (templateData, customTitle, shouldSave = false) => {
  const newId = `res-${Date.now()}`;
  const data = templateData || {
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
  };

  const newResume = {
    id: newId,
    title: customTitle || 'New ATS Resume',
    updatedAt: new Date().toISOString(),
    data,
    layout: 'single',
    font: 'inter',
    accentColor: '#2563eb',
    isFinished: Boolean(shouldSave)
  };

  if (shouldSave) {
    finishResume(newResume);
  } else {
    try {
      localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), newResume.id);
      localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(data));
    } catch (e) {
      console.warn(e);
    }
  }

  return newResume;
};
