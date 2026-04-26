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
//
// "Owed" for a given month = sum of penalties dated to that month
// minus sum of payments recorded against that month. Can go negative
// briefly if you overpay (rare, but allowed).
//
// "Settled" = owed has been brought to zero (or below). The PAID tag
// is shown when there's at least one payment AND owed is zero or less.
// Re-accrual is automatic: log a new penalty in a settled month and
// it goes back into the red until you record another payment.

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
  // Round to 2dp to avoid float drift like 0.0000001 left over
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
