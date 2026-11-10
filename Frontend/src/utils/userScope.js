/**
 * User Scoping Utility
 * General client-side session and storage key helper.
 * All persistent business data (Resumes, Mock Interviews, Credits,
 * Plan Tracking, Profile) is securely stored in MongoDB per authenticated user.
 */

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('career_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  const user = getCurrentUser();
  if (user && (user.id || user._id || user.email || user.username)) {
    return String(user.id || user._id || user.email || user.username);
  }
  return 'anonymous';
}

export function getUserScopedKey(baseKey, customUid = null) {
  const uid = customUid || getCurrentUserId();
  return `${baseKey}_${uid}`;
}

export function ensureUserStorageInitialized() {
  // General no-op migration placeholder (all primary data is securely stored in MongoDB)
}

export const migrateLegacyUserKeysIfNeeded = ensureUserStorageInitialized;
