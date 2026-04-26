// src/utils/points.js
//
// All point calculations. Pure functions.

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

/**
 * Points from weekly rhythms ticked specifically on `date`.
 * v7+ schema: weeklyChecks[weekKey][rhythmId] = the ISO date the tick happened on.
 * Walk all weeks, find rhythm ticks whose date matches, sum the points.
 */
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

/**
 * Same logic for monthly rhythms.
 */
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

/**
 * Total points "earned on" a given date. Includes all per-day sources
 * AND weekly/monthly rhythms attributed to that day via tick-date.
 */
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

export function currentMonthPenalties(data, monthKey) {
  return (data.penaltyLog || [])
    .filter(p => p.date && p.date.startsWith(monthKey))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function ritualsCompletedCount(data, date) {
  const checks = data.ritualChecks[date] || {};
  return Object.values(checks).filter(v => v > 0).length;
}

export function intentionsCompletedCount(data, date) {
  const checks = data.intentionChecks[date] || {};
  return Object.values(checks).filter(Boolean).length;
}
