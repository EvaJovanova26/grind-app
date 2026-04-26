// src/utils/migration.js
//
// Migrations from older schemas to current.
// v5 → v6: tabs, weekly/monthly rhythms, commitments, new ritual model
// v6 → v7: weeklyChecks/monthlyChecks values change from boolean to date string
//          (records WHICH day a rhythm was ticked, for Perfect Day attribution)

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

    weeklyChecks: {},      // v7+: { weekKey: { rhythmId: 'YYYY-MM-DD' } }
    monthlyChecks: {},     // v7+: { monthKey: { rhythmId: 'YYYY-MM-DD' } }

    backlog: [],
    deadlines: [],

    penaltyLog: [],
    rewardLog: [],
    penaltyPaidMonths: [],

    totalEarned: 0,
    totalSpent: 0,
  };
}

// ============================================================
// v5 → v6 (existing migration, unchanged)
// ============================================================

export function migrateV5toV6(v5Data) {
  const v6 = freshV6State();
  // After this we still need v6→v7 for the rhythm checks, so we won't bake
  // schemaVersion here — ensureV6Schema handles the chain.

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

  // Mark this as v6 — the v6→v7 migration handles the rest
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
//
// Old shape: weeklyChecks: { '2026-04-20': { w_laundry: true } }
// New shape: weeklyChecks: { '2026-04-20': { w_laundry: '2026-04-20' } }
//
// The `true` values become the week-start (or month-start) date as a
// best-effort attribution. We don't know the actual tick day, so this
// is "lumpy" — historical weekly ticks all attribute to Monday, and
// historical monthly ticks all attribute to the 1st.
//
// Going forward, ticks will record the actual day they happened on.

export function migrateV6toV7(v6Data) {
  const v7 = { ...v6Data };

  // Convert weeklyChecks
  const newWeeklyChecks = {};
  for (const [weekKey, checks] of Object.entries(v6Data.weeklyChecks || {})) {
    newWeeklyChecks[weekKey] = {};
    for (const [rhythmId, value] of Object.entries(checks)) {
      if (!value) continue;
      // If already a string (date), keep it. If true, convert to weekKey.
      newWeeklyChecks[weekKey][rhythmId] =
        typeof value === 'string' ? value : weekKey;
    }
  }
  v7.weeklyChecks = newWeeklyChecks;

  // Convert monthlyChecks — month-start = first day of the month
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
// Main entry point
// ============================================================

export function ensureV6Schema(rawData) {
  // Brand new user
  if (!rawData) {
    const fresh = freshV6State();
    fresh.schemaVersion = CURRENT_SCHEMA_VERSION;
    return fresh;
  }

  let data = rawData;

  // Ladder: v5/older → v6 → v7 → ...
  // Each step bumps schemaVersion and we re-check against current.

  if (!data.schemaVersion || data.schemaVersion < 6) {
    console.log('[migration] v5 → v6');
    data = migrateV5toV6(data);
  }

  if (data.schemaVersion < 7) {
    console.log('[migration] v6 → v7');
    data = migrateV6toV7(data);
  }

  // Future migrations chain here.

  return data;
}
