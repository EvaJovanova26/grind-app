// src/utils/points.js
//
// All point calculations. Pure functions — give them data, they give you numbers.
// No state, no side effects. This makes them easy to test and easy to trust.

/**
 * Calculate points earned from rituals on a given date.
 * Handles the 2x-tap mechanic: twice: true items give half points per tap.
 */
export function ritualPointsForDate(data, date) {
  const checks = data.ritualChecks[date] || {};
  let total = 0;

  for (const [id, taps] of Object.entries(checks)) {
    if (!taps) continue;
    const ritual = data.rituals.find(r => r.id === id);
    if (!ritual) continue;

    if (ritual.twice) {
      // Half points per tap, max 2 taps = full points
      total += (ritual.pts / 2) * taps;
    } else if (ritual.water) {
      // Water: 4 increments of 500ml, 2 pts each
      total += 2 * taps;
    } else {
      // Regular ritual: on or off
      total += taps > 0 ? ritual.pts : 0;
    }
  }

  return Math.round(total);
}

/**
 * Calculate points earned from intentions (Body/Mind/Life) on a given date.
 */
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

/**
 * Calculate points earned from work rituals on a given date.
 */
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

/**
 * Calculate points from work todos completed on a given date.
 */
export function workTodoPointsForDate(data, date) {
  const todos = data.workTodos[date] || [];
  return todos.filter(t => t.done).reduce((sum, t) => sum + (t.pts || 0), 0);
}

/**
 * Total points earned on a specific date (rituals + intentions + work).
 */
export function totalPointsForDate(data, date) {
  return (
    ritualPointsForDate(data, date) +
    intentionPointsForDate(data, date) +
    workRitualPointsForDate(data, date) +
    workTodoPointsForDate(data, date)
  );
}

/**
 * Current point balance = totalEarned - totalSpent.
 * This is what the user "has" to spend on rewards.
 */
export function currentBalance(data) {
  return (data.totalEarned || 0) - (data.totalSpent || 0);
}

/**
 * Sum of penalties logged in the current month.
 * Used for the Penalty Jar display.
 */
export function currentMonthPenalties(data, monthKey) {
  return (data.penaltyLog || [])
    .filter(p => p.date && p.date.startsWith(monthKey))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
}

/**
 * Count of ritual items completed on a date (for "3/17" progress display).
 * An item counts as completed if it has any taps.
 */
export function ritualsCompletedCount(data, date) {
  const checks = data.ritualChecks[date] || {};
  return Object.values(checks).filter(v => v > 0).length;
}

/**
 * Same for intentions.
 */
export function intentionsCompletedCount(data, date) {
  const checks = data.intentionChecks[date] || {};
  return Object.values(checks).filter(Boolean).length;
}