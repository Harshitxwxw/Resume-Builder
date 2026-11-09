import { getUserScopedKey } from '../../../utils/userScope';
import {
  fetchPlanTracker,
  toggleTrackPlanInDb,
  toggleTaskCompletionInDb,
  awardPlanDayInDb
} from './planTracker.api';

export const TRACKED_PLANS_KEY = 'career_ai_tracked_plan_ids';
export const TRACKED_PLAN_DETAILS_KEY = 'career_ai_tracked_plans_data';
export const COMPLETED_TASKS_PREFIX = 'career_ai_plan_completed_tasks_';

export const syncPlanTrackerFromDb = async () => {
  try {
    const data = await fetchPlanTracker();
    if (data) {
      if (Array.isArray(data.trackedPlanIds)) {
        localStorage.setItem(getUserScopedKey(TRACKED_PLANS_KEY), JSON.stringify(data.trackedPlanIds));
      }
      return data;
    }
  } catch (err) {
    console.warn('Could not sync plan tracker from DB:', err);
  }
  return {
    trackedPlanIds: getTrackedPlanIds(),
    completedTasks: []
  };
};

export const getTrackedPlanIds = () => {
  try {
    const scopedKey = getUserScopedKey(TRACKED_PLANS_KEY);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isPlanTracked = (planId) => {
  if (!planId) return false;
  const ids = getTrackedPlanIds();
  return ids.includes(String(planId));
};

export const setPlanTracked = (report, shouldTrack) => {
  if (!report) return;
  const planId = String(report._id || report.id || 'draft-plan');
  const ids = getTrackedPlanIds();

  let updatedIds;
  if (shouldTrack) {
    updatedIds = Array.from(new Set([...ids, planId]));
  } else {
    updatedIds = ids.filter((id) => id !== planId);
  }

  try {
    const scopedIdsKey = getUserScopedKey(TRACKED_PLANS_KEY);
    localStorage.setItem(scopedIdsKey, JSON.stringify(updatedIds));
    localStorage.setItem(getUserScopedKey(`career_ai_tracked_plan_${planId}`), String(shouldTrack));
  } catch (e) {
    console.warn('Error saving tracked plan ids to localStorage:', e);
  }

  // Also save the report snapshot in details store
  try {
    const scopedDetailsKey = getUserScopedKey(TRACKED_PLAN_DETAILS_KEY);
    const detailsRaw = localStorage.getItem(scopedDetailsKey);
    const details = detailsRaw ? JSON.parse(detailsRaw) : {};
    if (shouldTrack) {
      details[planId] = {
        _id: planId,
        title: report.title || 'Interview Preparation Plan',
        matchscore: report.matchscore ?? report.matchScore ?? 85,
        preparationPlan: report.preparationPlan || [],
        skillGaps: report.skillGaps || [],
        trackedAt: details[planId]?.trackedAt || new Date().toISOString()
      };
    } else {
      delete details[planId];
    }
    localStorage.setItem(scopedDetailsKey, JSON.stringify(details));
  } catch (e) {
    console.warn('Error saving tracked plan details to localStorage:', e);
  }

  // Persist to MongoDB
  toggleTrackPlanInDb(planId, shouldTrack).catch((err) => console.warn('Could not sync tracking to DB:', err));
};

export const getTrackedPlanDetails = () => {
  try {
    const scopedKey = getUserScopedKey(TRACKED_PLAN_DETAILS_KEY);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const getCompletedTasks = (planId) => {
  if (!planId) return {};
  try {
    const scopedKey = getUserScopedKey(`${COMPLETED_TASKS_PREFIX}${planId}`);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const toggleTaskCompleted = (planId, taskId) => {
  if (!planId || !taskId) return {};
  const current = getCompletedTasks(planId);
  const isNowCompleted = !current[taskId];
  const updated = { ...current, [taskId]: isNowCompleted };
  try {
    const scopedKey = getUserScopedKey(`${COMPLETED_TASKS_PREFIX}${planId}`);
    localStorage.setItem(scopedKey, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving completed task to localStorage:', e);
  }

  // Persist task completion to MongoDB
  toggleTaskCompletionInDb(`${planId}_${taskId}`, isNowCompleted).catch((err) =>
    console.warn('Could not sync task completion to DB:', err)
  );

  return updated;
};

// Calculate total tasks and completed tasks for a preparation plan
export const getPlanProgress = (report) => {
  if (!report || !report.preparationPlan || !Array.isArray(report.preparationPlan)) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const planId = report._id || report.id;
  const completedMap = getCompletedTasks(planId);

  let totalTasks = 0;
  let completedCount = 0;

  report.preparationPlan.forEach((day, dayIndex) => {
    if (day.tasks && Array.isArray(day.tasks)) {
      day.tasks.forEach((_, taskIndex) => {
        totalTasks += 1;
        const taskId = `day-${day.day || dayIndex + 1}-task-${taskIndex}`;
        if (completedMap[taskId]) {
          completedCount += 1;
        }
      });
    }
  });

  const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  return { total: totalTasks, completed: completedCount, percent };
};

export const calculatePlanStats = getPlanProgress;
