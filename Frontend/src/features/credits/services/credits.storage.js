import { getUserScopedKey } from '../../../utils/userScope';
import { fetchUserCredits, deductCreditsFromDb, awardCreditsToDb } from './credits.api';

export const CREDITS_KEY = 'career_ai_user_credits';
export const CREDITS_HISTORY_KEY = 'career_ai_credits_history';
export const AWARDED_PLAN_DAYS_KEY = 'career_ai_awarded_prep_days';

export const DEFAULT_INITIAL_CREDITS = 100;
export const MOCK_INTERVIEW_COST = 50;
export const ATS_CALCULATOR_COST = 10;
export const ATS_ENHANCER_COST = 15;
export const PREP_DAY_COMPLETION_REWARD = 15;
export const HIGH_SCORE_MOCK_REWARD = 25;

export async function syncCreditsFromDb() {
  try {
    const data = await fetchUserCredits();
    if (typeof data.credits === 'number') {
      const scopedKey = getUserScopedKey(CREDITS_KEY);
      localStorage.setItem(scopedKey, String(data.credits));
      if (Array.isArray(data.history)) {
        localStorage.setItem(getUserScopedKey(CREDITS_HISTORY_KEY), JSON.stringify(data.history));
      }
      window.dispatchEvent(
        new CustomEvent('career_credits_updated', {
          detail: { credits: data.credits }
        })
      );
      return data.credits;
    }
  } catch (err) {
    console.warn('Could not sync credits from DB:', err);
  }
  return getUserCredits();
}

/**
 * Get current credits for the logged-in user
 */
export function getUserCredits() {
  try {
    const scopedKey = getUserScopedKey(CREDITS_KEY);
    const raw = localStorage.getItem(scopedKey);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return Math.max(0, parsed);
    }
    return DEFAULT_INITIAL_CREDITS;
  } catch (e) {
    console.warn('Error reading credits from localStorage:', e);
    return DEFAULT_INITIAL_CREDITS;
  }
}

/**
 * Check if user has sufficient credits
 */
export function hasSufficientCredits(amount) {
  return getUserCredits() >= amount;
}

/**
 * Deduct credits for an action (e.g. 50 for Mock Interview)
 */
export function deductCredits(amount, reason = 'Credits used') {
  const current = getUserCredits();
  if (current < amount) {
    return {
      success: false,
      current,
      needed: amount,
      shortage: amount - current
    };
  }

  const newBalance = current - amount;
  try {
    const scopedKey = getUserScopedKey(CREDITS_KEY);
    localStorage.setItem(scopedKey, String(newBalance));
    recordCreditHistory({
      type: 'spent',
      amount,
      reason,
      balance: newBalance
    });

    window.dispatchEvent(
      new CustomEvent('career_credits_updated', {
        detail: { credits: newBalance, change: -amount, reason }
      })
    );
  } catch (e) {
    console.warn('Error saving credits to localStorage:', e);
  }

  // Persist deduction to MongoDB
  deductCreditsFromDb(amount, reason)
    .then((res) => {
      if (res && typeof res.balance === 'number') {
        const scopedKey = getUserScopedKey(CREDITS_KEY);
        localStorage.setItem(scopedKey, String(res.balance));
      }
    })
    .catch((err) => console.warn('Could not deduct credits in DB:', err));

  return {
    success: true,
    newBalance
  };
}

/**
 * Add credits for milestones/rewards
 */
export function addCredits(amount, reason = 'Credits earned') {
  const current = getUserCredits();
  const newBalance = current + amount;

  try {
    const scopedKey = getUserScopedKey(CREDITS_KEY);
    localStorage.setItem(scopedKey, String(newBalance));
    recordCreditHistory({
      type: 'earned',
      amount,
      reason,
      balance: newBalance
    });

    window.dispatchEvent(
      new CustomEvent('career_credits_updated', {
        detail: { credits: newBalance, change: amount, reason }
      })
    );
  } catch (e) {
    console.warn('Error saving credits to localStorage:', e);
  }

  // Persist award to MongoDB
  awardCreditsToDb(amount, reason)
    .then((res) => {
      if (res && typeof res.balance === 'number') {
        const scopedKey = getUserScopedKey(CREDITS_KEY);
        localStorage.setItem(scopedKey, String(res.balance));
      }
    })
    .catch((err) => console.warn('Could not award credits in DB:', err));

  return {
    success: true,
    newBalance
  };
}

/**
 * Record a credit transaction in history
 */
export function recordCreditHistory(entry) {
  try {
    const scopedKey = getUserScopedKey(CREDITS_HISTORY_KEY);
    const raw = localStorage.getItem(scopedKey);
    const history = raw ? JSON.parse(raw) : [];
    const item = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString(),
      ...entry
    };
    const updated = [item, ...history].slice(0, 30);
    localStorage.setItem(scopedKey, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error recording credit history:', e);
  }
}

/**
 * Get all credit transaction history for the logged-in user
 */
export function getCreditHistory() {
  try {
    const scopedKey = getUserScopedKey(CREDITS_HISTORY_KEY);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a plan day's +15 credits reward has already been claimed
 */
export function isPrepDayAwarded(planId, dayNum) {
  if (!planId || dayNum === undefined) return false;
  try {
    const scopedKey = getUserScopedKey(AWARDED_PLAN_DAYS_KEY);
    const raw = localStorage.getItem(scopedKey);
    const list = raw ? JSON.parse(raw) : [];
    return list.includes(`${planId}_day_${dayNum}`);
  } catch {
    return false;
  }
}

/**
 * Award +15 credits for completing a preparation plan day's tasks
 */
export function awardPrepDayCredits(planId, dayNum, dayTitle = '') {
  if (!planId || dayNum === undefined) return { awarded: false };

  const rewardKey = `${planId}_day_${dayNum}`;
  if (isPrepDayAwarded(planId, dayNum)) {
    return { awarded: false, message: 'Already awarded for this day' };
  }

  try {
    const scopedKey = getUserScopedKey(AWARDED_PLAN_DAYS_KEY);
    const raw = localStorage.getItem(scopedKey);
    const list = raw ? JSON.parse(raw) : [];
    const updated = [...list, rewardKey];
    localStorage.setItem(scopedKey, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }

  const reason = `Completed Day ${dayNum} Tasks: ${dayTitle || 'Daily Prep Plan'}`;
  const res = addCredits(PREP_DAY_COMPLETION_REWARD, reason);

  return {
    awarded: true,
    amount: PREP_DAY_COMPLETION_REWARD,
    newBalance: res.newBalance
  };
}
