// src/utils/points.js
//
// All point calculations. Pure functions.

export const PERFECT_DAY_THRESHOLD = 250;

export function ritualPointsForDate(data, date) {
  const checks = data.ritualChecks[date] || {};
  let total = 0;

  for (const [id, taps] of Object.entries(checks)) {
    if (!taps) continue;
    const ritual = data.rituals.find(r => r.id === id);
    if (!ritual) continue;

    if (ritual.twice) {
      total += (ritual.pts / 2) * taps;
    } else if (ritual.water) {
      total += 2 * taps;
    } else {
      total += taps > 0 ? ritual.pts : 0;
    }
  }

  return Math.round(total);
}

export function intentionPointsForDate(data, date) {
  const checks = data.intentionChecks[date] || {};
  const all = [...data.intentions.body, ...data.intentions.mind, ...data.intentions.life];
  let total = 0;

  for (const [id, checked] of Object.entries(checks)) {
    if (!checked) continue;
    const intention = all.find(i => i.id === id);
    if (intention) total += intention.pts;
  }

  return total;
}

export function workRitualPointsForDate(data, date) {
  const checks = data.workRitualChecks[date] || {};
  let total = 0;

  for (const [id, taps] of Object.entries(checks)) {
    if (!taps) continue;
    const wr = data.workRituals.find(w => w.id === id);
    if (!wr) continue;

    if (wr.twice) {
      total += (wr.pts / 2) * taps;
    } else {
      total += taps > 0 ? wr.pts : 0;
    }
  }

  return total;
}

export function workTodoPointsForDate(data, date) {
  const todos = data.workTodos[date] || [];
  return todos.filter(t => t.done).reduce((sum, t) => sum + (t.pts || 0), 0);
}

export function weeklyRhythmPointsForDate(data, date) {
  let total = 0;
  for (const checks of Object.values(data.weeklyChecks || {})) {
    for (const [rhythmId, tickDate] of Object.entries(checks)) {
      if (tickDate !== date) continue;
      const rhythm = data.weeklyRhythms.find(r => r.id === rhythmId);
      if (rhythm) total += rhythm.pts;
    }
  }
  return total;
}

export function monthlyRhythmPointsForDate(data, date) {
  let total = 0;
  for (const checks of Object.values(data.monthlyChecks || {})) {
    for (const [rhythmId, tickDate] of Object.entries(checks)) {
      if (tickDate !== date) continue;
      const rhythm = data.monthlyRhythms.find(r => r.id === rhythmId);
      if (rhythm) total += rhythm.pts;
    }
  }
  return total;
}

export function totalPointsForDate(data, date) {
  return (
    ritualPointsForDate(data, date) +
    intentionPointsForDate(data, date) +
    workRitualPointsForDate(data, date) +
    workTodoPointsForDate(data, date) +
    weeklyRhythmPointsForDate(data, date) +
    monthlyRhythmPointsForDate(data, date)
  );
}

export function currentBalance(data) {
  return (data.totalEarned || 0) - (data.totalSpent || 0);
}

// ============================================================
// PENALTY JAR
// ============================================================

export function currentMonthPenalties(data, monthKey) {
  return (data.penaltyLog || [])
    .filter(p => p.date && p.date.startsWith(monthKey))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function paymentsForMonth(data, monthKey) {
  return (data.penaltyPayments || [])
    .filter(p => p.monthKey === monthKey)
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function jarOwedForMonth(data, monthKey) {
  const total = currentMonthPenalties(data, monthKey);
  const paid = paymentsForMonth(data, monthKey);
  return Math.round((total - paid) * 100) / 100;
}

export function jarIsSettled(data, monthKey) {
  const owed = jarOwedForMonth(data, monthKey);
  const hasPayment = (data.penaltyPayments || []).some(p => p.monthKey === monthKey);
  return owed <= 0 && hasPayment;
}

export function ritualsCompletedCount(data, date) {
  const checks = data.ritualChecks[date] || {};
  return Object.values(checks).filter(v => v > 0).length;
}

export function intentionsCompletedCount(data, date) {
  const checks = data.intentionChecks[date] || {};
  return Object.values(checks).filter(Boolean).length;
}

// ============================================================
// PERFECT DAY (retroactive)
// ============================================================
//
// Recomputes the live Perfect-Day criteria for any historical date:
//   1. ≥75% of daily rituals fully done
//   2. 3+ intentions ticked
//   3. (weekdays only) all work rituals done AND all todos done (or none exist)
//   AND points ≥ threshold
//
// Stays in sync with TodayTab's live ring — same rules, same numbers.

function isWeekendDate(date) {
  const d = new Date(date + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isPerfectDay(data, date) {
  const points = totalPointsForDate(data, date);
  if (points < PERFECT_DAY_THRESHOLD) return false;

  const ritualsDone = ritualsCompletedCount(data, date);
  const ritualsTotal = data.rituals.length;
  const ritualsMet = ritualsTotal > 0 && (ritualsDone / ritualsTotal) >= 0.75;
  if (!ritualsMet) return false;

  if (intentionsCompletedCount(data, date) < 3) return false;

  // Weekend: work criterion auto-passes
  if (isWeekendDate(date)) return true;

  // Weekday: all work rituals fully tapped + all todos done (or none exist)
  const workChecks = data.workRitualChecks[date] || {};
  const workRitualsDone = data.workRituals.filter(wr => {
    const taps = workChecks[wr.id] || 0;
    const maxTaps = wr.twice ? 2 : 1;
    return taps >= maxTaps;
  }).length;
  const workRitualsTotal = data.workRituals.length;
  const allWorkRituals = workRitualsTotal > 0 && workRitualsDone === workRitualsTotal;

  const todos = data.workTodos[date] || [];
  const allTodos = todos.length === 0 || todos.every(t => t.done);

  return allWorkRituals && allTodos;
}
