import { getUserScopedKey } from '../../../utils/userScope';
import { fetchAllResumes, saveResumeToDb, deleteResumeFromDb } from './resume.api';

export const SAVED_RESUMES_KEY = 'career_ai_saved_resumes';
export const ACTIVE_RESUME_ID_KEY = 'career_ai_active_resume_id';
export const CURRENT_RESUME_DATA_KEY = 'career_ai_resume_data';

/**
 * Sync finished resumes from MongoDB to local storage cache,
 * and asynchronously cleans up any ghost/untitled empty resumes.
 */
export const syncResumesFromDb = async () => {
  try {
    const dbResumes = await fetchAllResumes();
    if (Array.isArray(dbResumes)) {
      // Filter out and clean up any ghost untitled resumes or unfinished drafts
      const cleaned = dbResumes.filter((r) => {
        if (r.isFinished === false) return false;
        const fullName = r.data?.personal?.fullName?.trim();
        // If it was created accidentally with no name or title "- Resume"
        if ((r.title === '- Resume' || !r.title) && (!fullName || fullName === 'Full Name')) {
          deleteResumeFromDb(r._id || r.id).catch(() => {});
          return false;
        }
        return true;
      });

      const normalized = cleaned.map((r) => ({
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

/**
 * Returns list of completed / saved resumes from user's local storage.
 * Drafts being edited or ghost "- Resume" items are filtered out.
 */
export const getSavedResumes = () => {
  try {
    const scopedKey = getUserScopedKey(SAVED_RESUMES_KEY);
    const raw = localStorage.getItem(scopedKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((r) => {
            if (r.isFinished === false) return false;
            const fullName = r.data?.personal?.fullName?.trim();
            if ((r.title === '- Resume' || !r.title) && (!fullName || fullName === 'Full Name')) {
              return false;
            }
            return true;
          })
          .map((r) => ({
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
 * Save resume changes.
 * If this is an unsaved draft (not finished and not in saved resumes),
 * it only updates local session draft, NEVER creates duplicates in DB!
 */
export const saveResume = async (resumeItem) => {
  if (!resumeItem || !resumeItem.id) return [];
  const list = getSavedResumes();
  const existingIdx = list.findIndex((r) => String(r.id) === String(resumeItem.id));

  // If this is an uncommitted draft and NOT finished, keep it local only
  if (existingIdx < 0 && resumeItem.isFinished !== true) {
    try {
      localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(resumeItem.data));
      localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), resumeItem.id);
      if (resumeItem.layout) localStorage.setItem(getUserScopedKey('career_ai_resume_layout'), resumeItem.layout);
      if (resumeItem.font) localStorage.setItem(getUserScopedKey('career_ai_resume_font'), resumeItem.font);
    } catch (e) {
      console.warn(e);
    }
    return list;
  }

  let updatedItem = {
    ...resumeItem,
    id: String(resumeItem._id || resumeItem.id),
    updatedAt: new Date().toISOString()
  };

  const dbId = (updatedItem.id && updatedItem.id.length === 24 && !updatedItem.id.startsWith('res-')) 
    ? updatedItem.id 
    : undefined;

  // Persist to MongoDB
  try {
    const savedDb = await saveResumeToDb({
      id: dbId,
      title: updatedItem.title,
      data: updatedItem.data,
      layout: updatedItem.layout,
      font: updatedItem.font,
      isFinished: true
    });
    if (savedDb && (savedDb._id || savedDb.id)) {
      const realId = String(savedDb._id || savedDb.id);
      updatedItem.id = realId;
      updatedItem._id = realId;
    }
  } catch (err) {
    console.warn('Could not persist resume to MongoDB:', err);
  }

  let newList = [...list];
  const finalIdx = newList.findIndex((r) => String(r.id) === String(updatedItem.id));
  if (finalIdx >= 0) {
    newList[finalIdx] = updatedItem;
  } else if (existingIdx >= 0) {
    newList[existingIdx] = updatedItem;
  } else if (updatedItem.isFinished === true) {
    newList = [updatedItem, ...list];
  }

  // Update storage
  try {
    localStorage.setItem(getUserScopedKey(SAVED_RESUMES_KEY), JSON.stringify(newList));
    localStorage.setItem(getUserScopedKey(CURRENT_RESUME_DATA_KEY), JSON.stringify(updatedItem.data));
    localStorage.setItem(getUserScopedKey(ACTIVE_RESUME_ID_KEY), updatedItem.id);
    if (updatedItem.layout) localStorage.setItem(getUserScopedKey('career_ai_resume_layout'), updatedItem.layout);
    if (updatedItem.font) localStorage.setItem(getUserScopedKey('career_ai_resume_font'), updatedItem.font);
    window.dispatchEvent(new CustomEvent('career_resume_saved', { detail: updatedItem }));
  } catch (e) {
    console.warn('Error saving resume to localStorage:', e);
  }

  return newList;
};

/**
 * Finish and permanently save a resume to MongoDB and workspace
 */
export const finishResume = async (resumeItem) => {
  if (!resumeItem || !resumeItem.id) return [];
  const list = getSavedResumes();
  const existingIdx = list.findIndex((r) => String(r.id) === String(resumeItem.id));

  let finishedItem = {
    ...resumeItem,
    id: String(resumeItem._id || resumeItem.id),
    isFinished: true,
    updatedAt: new Date().toISOString()
  };

  const dbId = (finishedItem.id && finishedItem.id.length === 24 && !finishedItem.id.startsWith('res-')) 
    ? finishedItem.id 
    : undefined;

  // Persist to MongoDB
  try {
    const savedDb = await saveResumeToDb({
      id: dbId,
      title: finishedItem.title,
      data: finishedItem.data,
      layout: finishedItem.layout,
      font: finishedItem.font,
      isFinished: true
    });
    if (savedDb && (savedDb._id || savedDb.id)) {
      const realId = String(savedDb._id || savedDb.id);
      finishedItem.id = realId;
      finishedItem._id = realId;
    }
  } catch (err) {
    console.warn('Could not persist resume to MongoDB:', err);
  }

  let newList = [...list];
  const finalIdx = newList.findIndex((r) => String(r.id) === String(finishedItem.id));
  if (finalIdx >= 0) {
    newList[finalIdx] = finishedItem;
  } else if (existingIdx >= 0) {
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
