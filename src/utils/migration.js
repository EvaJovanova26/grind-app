// src/utils/migration.js
//
// Migrations from older schemas to current.
// v5 → v6: tabs, weekly/monthly rhythms, commitments, new ritual model
// v6 → v7: weeklyChecks/monthlyChecks values change from boolean to date string
//          (records WHICH day a rhythm was ticked, for Perfect Day attribution)
// v7 → v8: penaltyPaidMonths replaced with itemized penaltyPayments log
//          (preserves historical "paid in full" while allowing partial payments
//          and re-accrual if new penalties are logged after a paid date)

import {
  DEFAULT_RITUALS,
  DEFAULT_INTENTIONS,
  DEFAULT_WORK_RITUALS,
  DEFAULT_WEEKLY_RHYTHMS,
  DEFAULT_MONTHLY_RHYTHMS,
  DEFAULT_COMMITMENTS,
  DEFAULT_PENALTIES,
  DEFAULT_REWARDS,
} from '../data/defaults';

import { CURRENT_SCHEMA_VERSION } from './storage';
import { todayISO } from './dates';

/**
 * Fresh state for a brand-new user. Always at the latest schema version.
 */
export function freshV6State() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    rituals: DEFAULT_RITUALS,
    intentions: DEFAULT_INTENTIONS,
    workRituals: DEFAULT_WORK_RITUALS,
    weeklyRhythms: DEFAULT_WEEKLY_RHYTHMS,
    monthlyRhythms: DEFAULT_MONTHLY_RHYTHMS,
    commitments: DEFAULT_COMMITMENTS,
    penalties: DEFAULT_PENALTIES,
    rewards: DEFAULT_REWARDS,

    ritualChecks: {},
    intentionChecks: {},
    workRitualChecks: {},
    workTodos: {},

    weeklyChecks: {},
    monthlyChecks: {},

    backlog: [],
    deadlines: [],

    penaltyLog: [],
    rewardLog: [],
    penaltyPayments: [],   // v8+: [{ id, monthKey, amount, paidAt }, ...]

    totalEarned: 0,
    totalSpent: 0,
  };
}

// ============================================================
// v5 → v6
// ============================================================

export function migrateV5toV6(v5Data) {
  const v6 = freshV6State();

  v6.penaltyLog = v5Data.penaltyLog || [];
  v6.rewardLog = v5Data.rewardLog || [];
  v6.penaltyPaidMonths = v5Data.penaltyPaidMonths || [];

  const ritualIdMap = {
    'r2': 'r_meds', 'dioncvh': 'r_meds',
    'r4': 'r_teeth', 'r10': 'r_teeth',
    'r6': 'r_cats', 'r11': 'r_cats',
    '1e831eu': 'r_litter', '34qgd2m': 'r_litter',
    'r5': 'r_water', 'r8': 'r_water', '3yxqed0': 'r_water',
    '35u097q': 'r_stretch', 'p8w1so9': 'r_stretch',
    '4pclpxt': 'r_wake',
    '0x7vhzf': 'r_skincare_am',
    'ld49n4e': 'r_skincare_pm',
    'za81f5o': 'r_shower',
    'r3': 'r_breakfast',
    'r7': 'r_lunch',
    'r9': 'r_dinner',
    'feqja0x': 'r_leave_house',
    '5vej63f': 'r_no_screens',
  };

  const newRitualChecks = {};
  for (const [date, checks] of Object.entries(v5Data.ritualChecks || {})) {
    newRitualChecks[date] = {};
    for (const [oldId, checked] of Object.entries(checks)) {
      const newId = ritualIdMap[oldId];
      if (!newId) continue;
      if (!checked) continue;
      newRitualChecks[date][newId] = (newRitualChecks[date][newId] || 0) + 1;
    }
  }
  v6.ritualChecks = newRitualChecks;

  const intentionIdMap = {
    'pd2': 'i_gym', 'pd4': 'i_classpass', 'pd5': 'i_kravmaga',
    'pd3': 'i_walk', 'kvt5azw': 'i_protein',
    'pd10': 'i_book', 'pd1': 'i_duolingo', 'pd7': 'i_learn',
    'pd8': 'i_news', 'pd9': 'i_news',
    's9qnics': 'i_cook', 'j1pbst9': 'i_cook',
    'pd6': 'i_friend', 'l16orgp': 'i_messages', 'pxzgktc': 'i_admin',
  };

  const newIntentionChecks = {};
  for (const [date, checks] of Object.entries(v5Data.perfectDayChecks || {})) {
    newIntentionChecks[date] = {};
    for (const [oldId, checked] of Object.entries(checks)) {
      const newId = intentionIdMap[oldId];
      if (!newId) continue;
      if (!checked) continue;
      newIntentionChecks[date][newId] = true;
    }
  }
  v6.intentionChecks = newIntentionChecks;

  const workRitualIdMap = {
    'zhh235z': 'wr_review',
    'rc3nj71': 'wr_inbox',
    '2i7ywgk': 'wr_messages',
    '997v7tb': 'wr_deepwork',
  };

  const newWorkRitualChecks = {};
  for (const [date, checks] of Object.entries(v5Data.ritualChecks || {})) {
    for (const [oldId, checked] of Object.entries(checks)) {
      if (oldId === 'zhh235z' && checked) {
        if (!newWorkRitualChecks[date]) newWorkRitualChecks[date] = {};
        newWorkRitualChecks[date]['wr_review'] = 1;
      }
    }
  }

  for (const entry of v5Data.workLog || []) {
    const newId = workRitualIdMap[entry.goalId];
    if (!newId) continue;
    if (!newWorkRitualChecks[entry.date]) newWorkRitualChecks[entry.date] = {};
    const current = newWorkRitualChecks[entry.date][newId] || 0;
    const maxTaps = newId === 'wr_deepwork' ? 2 : 1;
    newWorkRitualChecks[entry.date][newId] = Math.min(current + 1, maxTaps);
  }
  v6.workRitualChecks = newWorkRitualChecks;

  for (const entry of v5Data.goalLog || []) {
    if (entry.goalId === 'gnbmdvq') {
      if (!v6.intentionChecks[entry.date]) v6.intentionChecks[entry.date] = {};
      v6.intentionChecks[entry.date]['i_prash'] = true;
    }
  }

  v6.backlog = (v5Data.backlog || []).map(item => ({
    id: item.id,
    name: item.name,
    pts: item.pts,
    addedDate: item.addedDate || todayISO(),
    penaltiesApplied: [],
  }));

  v6.deadlines = v5Data.deadlines || [];

  v6.totalEarned = calculateTotalEarnedV6(v6);
  v6.totalSpent = (v5Data.rewardLog || []).reduce((sum, r) => sum + (r.cost || 0), 0);

  v6.schemaVersion = 6;

  return v6;
}

function calculateTotalEarnedV6(v6Data) {
  let total = 0;
  for (const [, checks] of Object.entries(v6Data.ritualChecks)) {
    for (const [id, taps] of Object.entries(checks)) {
      const ritual = v6Data.rituals.find(r => r.id === id);
      if (!ritual) continue;
      if (ritual.twice) total += (ritual.pts / 2) * taps;
      else total += ritual.pts * (taps ? 1 : 0);
    }
  }
  for (const [, checks] of Object.entries(v6Data.intentionChecks)) {
    for (const [id, checked] of Object.entries(checks)) {
      if (!checked) continue;
      const allIntentions = [
        ...v6Data.intentions.body,
        ...v6Data.intentions.mind,
        ...v6Data.intentions.life,
      ];
      const intention = allIntentions.find(i => i.id === id);
      if (intention) total += intention.pts;
    }
  }
  for (const [, checks] of Object.entries(v6Data.workRitualChecks)) {
    for (const [id, taps] of Object.entries(checks)) {
      const wr = v6Data.workRituals.find(w => w.id === id);
      if (!wr) continue;
      if (wr.twice) total += (wr.pts / 2) * taps;
      else total += wr.pts * (taps ? 1 : 0);
    }
  }
  return Math.round(total);
}

// ============================================================
// v6 → v7: weekly/monthly check values become date strings
// ============================================================

export function migrateV6toV7(v6Data) {
  const v7 = { ...v6Data };

  const newWeeklyChecks = {};
  for (const [weekKey, checks] of Object.entries(v6Data.weeklyChecks || {})) {
    newWeeklyChecks[weekKey] = {};
    for (const [rhythmId, value] of Object.entries(checks)) {
      if (!value) continue;
      newWeeklyChecks[weekKey][rhythmId] =
        typeof value === 'string' ? value : weekKey;
    }
  }
  v7.weeklyChecks = newWeeklyChecks;

  const newMonthlyChecks = {};
  for (const [monthKey, checks] of Object.entries(v6Data.monthlyChecks || {})) {
    newMonthlyChecks[monthKey] = {};
    const monthStart = `${monthKey}-01`;
    for (const [rhythmId, value] of Object.entries(checks)) {
      if (!value) continue;
      newMonthlyChecks[monthKey][rhythmId] =
        typeof value === 'string' ? value : monthStart;
    }
  }
  v7.monthlyChecks = newMonthlyChecks;

  v7.schemaVersion = 7;
  return v7;
}

// ============================================================
// v7 → v8: penaltyPaidMonths becomes itemized penaltyPayments
// ============================================================
//
// Old shape: penaltyPaidMonths: ['2026-04', ...]   (boolean per month)
// New shape: penaltyPayments: [{ id, monthKey, amount, paidAt }, ...]
//
// Migration rule: for each previously-paid month, sum that month's penalties
// at migration time and create a single synthetic "paid in full" payment
// dated today. This preserves the historical truth that those months were
// settled at some point — but if any new penalties get logged with a date
// in those months later, they'll re-accrue and become payable again.
//
// penaltyPaidMonths is removed from the data shape. Going forward,
// "is this month paid?" is a derived check: amountOwed === 0.

export function migrateV7toV8(v7Data) {
  const v8 = { ...v7Data };
  const today = todayISO();

  // Sum each month's penalties so we can record what was paid
  const monthTotals = {};
  for (const p of v7Data.penaltyLog || []) {
    if (!p.date) continue;
    const mk = p.date.slice(0, 7);
    monthTotals[mk] = (monthTotals[mk] || 0) + (p.amount || 0);
  }

  const payments = [];
  for (const monthKey of v7Data.penaltyPaidMonths || []) {
    const amount = monthTotals[monthKey] || 0;
    payments.push({
      id: `pay_migrated_${monthKey}`,
      monthKey,
      amount,
      paidAt: today, // unknown actual date — best we can do
      note: 'migrated from v7',
    });
  }

  v8.penaltyPayments = payments;
  delete v8.penaltyPaidMonths;
  v8.schemaVersion = 8;
  return v8;
}

// ============================================================
// Main entry point
// ============================================================

export function ensureV6Schema(rawData) {
  if (!rawData) {
    const fresh = freshV6State();
    fresh.schemaVersion = CURRENT_SCHEMA_VERSION;
    return fresh;
  }

  let data = rawData;

  if (!data.schemaVersion || data.schemaVersion < 6) {
    console.log('[migration] v5 → v6');
    data = migrateV5toV6(data);
  }

  if (data.schemaVersion < 7) {
    console.log('[migration] v6 → v7');
    data = migrateV6toV7(data);
  }

  if (data.schemaVersion < 8) {
    console.log('[migration] v7 → v8');
    data = migrateV7toV8(data);
  }

  return data;
}
