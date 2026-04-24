// src/utils/migration.js
//
// One-time migration from v5 schema (single flat list) to v6 schema
// (tabs, weekly/monthly rhythms, commitments, new ritual model).
//
// This runs once on first app load after upgrade. The schemaVersion
// flag on the data object prevents it from running twice.
//
// If anything here breaks, the user can restore from their JSON export.

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
 * The fresh state for a brand-new user (no prior data).
 * This is what the app looks like if someone installs for the first time.
 */
export function freshV6State() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    // Content definitions (what items exist)
    rituals: DEFAULT_RITUALS,
    intentions: DEFAULT_INTENTIONS,
    workRituals: DEFAULT_WORK_RITUALS,
    weeklyRhythms: DEFAULT_WEEKLY_RHYTHMS,
    monthlyRhythms: DEFAULT_MONTHLY_RHYTHMS,
    commitments: DEFAULT_COMMITMENTS,
    penalties: DEFAULT_PENALTIES,
    rewards: DEFAULT_REWARDS,

    // User data keyed by date (YYYY-MM-DD)
    ritualChecks: {},      // { '2026-04-24': { r_meds: 2, r_teeth: 1 } } — numbers not bools (supports 2x-tap)
    intentionChecks: {},   // { '2026-04-24': { i_gym: true } }
    workRitualChecks: {},  // { '2026-04-24': { wr_deepwork: 2 } }
    workTodos: {},         // { '2026-04-24': [{ id, name, pts, done }] }

    // Weekly/monthly rhythm checks, keyed by week start (Monday) / month
    weeklyChecks: {},      // { '2026-04-20': { w_laundry: true } }
    monthlyChecks: {},     // { '2026-04': { m_finance: true } }

    // Tasks & deadlines
    backlog: [],           // [{ id, name, pts, addedDate, penaltiesApplied: [] }]
    deadlines: [],         // [{ id, name, pts, dueDate }]

    // Logs
    penaltyLog: [],        // historical, each entry: { id, name, amount, date, logId }
    rewardLog: [],         // historical, each entry: { id, name, cost, date, logId }
    penaltyPaidMonths: [], // ['2026-04', ...]

    // Score totals
    totalEarned: 0,
    totalSpent: 0,
  };
}

/**
 * Transform v5 data into v6 shape.
 * Called with the raw data loaded from localStorage (v5 shape).
 * Returns fully-formed v6 data ready to save.
 */
export function migrateV5toV6(v5Data) {
  // Start from a fresh v6 state — we'll fill in what we can preserve from v5.
  const v6 = freshV6State();

  // --- 1. PRESERVE HISTORICAL LOGS (most important — your reward history)
  v6.penaltyLog = v5Data.penaltyLog || [];
  v6.rewardLog = v5Data.rewardLog || [];
  v6.penaltyPaidMonths = v5Data.penaltyPaidMonths || [];

  // --- 2. PRESERVE HISTORICAL CHECKS, MAPPING OLD IDS → NEW IDS
  //
  // v5 had rituals like r2 ("Take meds + vitamins") and dioncvh
  // ("Take supplements + meds"). In v6 both collapse into r_meds.
  // We map old IDs to new IDs so your historical checks don't get lost.
  //
  // If an old ID has no new equivalent (e.g. the behavior was cut),
  // the check is dropped — that's expected.

  const ritualIdMap = {
    // Meds — old AM + PM merge into single 2x-tappable item
    'r2': 'r_meds',
    'dioncvh': 'r_meds',
    // Teeth
    'r4': 'r_teeth',
    'r10': 'r_teeth',
    // Cats
    'r6': 'r_cats',
    'r11': 'r_cats',
    // Litter
    '1e831eu': 'r_litter',
    '34qgd2m': 'r_litter',
    // Water (all three water rituals collapse into one with 2L target)
    'r5': 'r_water',
    'r8': 'r_water',
    '3yxqed0': 'r_water',
    // Stretch
    '35u097q': 'r_stretch',
    'p8w1so9': 'r_stretch',
    // Other kept rituals
    '4pclpxt': 'r_wake',
    '0x7vhzf': 'r_skincare_am',
    'ld49n4e': 'r_skincare_pm',
    'za81f5o': 'r_shower',
    'r3': 'r_breakfast',
    'r7': 'r_lunch',
    'r9': 'r_dinner',
    'feqja0x': 'r_leave_house',
    '5vej63f': 'r_no_screens',
    // CUT (moved elsewhere): r_review → work rituals, r_garbage → weekly
    // Their historical checks are dropped intentionally.
  };

  // Convert v5 ritualChecks {date: {oldId: bool}} to v6 {date: {newId: number}}
  // where number represents tap count (0, 1, or 2).
  const newRitualChecks = {};
  for (const [date, checks] of Object.entries(v5Data.ritualChecks || {})) {
    newRitualChecks[date] = {};
    for (const [oldId, checked] of Object.entries(checks)) {
      const newId = ritualIdMap[oldId];
      if (!newId) continue; // dropped ritual, skip
      if (!checked) continue; // false values — skip

      // If two old rituals map to the same new ID (e.g. AM + PM teeth),
      // increment the count instead of overwriting.
      newRitualChecks[date][newId] = (newRitualChecks[date][newId] || 0) + 1;
    }
  }
  v6.ritualChecks = newRitualChecks;

  // --- 3. MIGRATE PERFECT DAY → INTENTIONS
  //
  // v5 had a flat perfectDay list of 21 items. v6 splits into Body/Mind/Life.
  // Map old IDs to new IDs where behavior carries forward.

  const intentionIdMap = {
    // Body
    'pd2': 'i_gym',
    'pd4': 'i_classpass',
    'pd5': 'i_kravmaga',
    'pd3': 'i_walk',
    'kvt5azw': 'i_protein',
    // Mind
    'pd10': 'i_book',
    'pd1': 'i_duolingo',
    'pd7': 'i_learn',
    // Creative is new — no old equivalent
    'pd8': 'i_news',
    'pd9': 'i_news', // Tagesschau merged with news
    // Life
    's9qnics': 'i_cook',
    'j1pbst9': 'i_cook', // breakfast and lunch/dinner merged into one "cook a proper meal"
    'pd6': 'i_friend',
    'l16orgp': 'i_messages',
    'pxzgktc': 'i_admin',
    // CUT (moved to weekly): pd5 social event, 503yesv plan date, qdkmf22 clean,
    // fyno8sq laundry, g80stvn organize, qqovlsf attend social, 6otkfx1 skincare device
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

  // --- 4. MIGRATE WORK → WORK RITUALS + WORK TODOS
  //
  // v5's work array mixed daily habits with specific tasks.
  // We split: habits become workRituals, tasks get dropped (user re-adds as todos).

  const workRitualIdMap = {
    'zhh235z': 'wr_review',   // "Review daily tasks" from old rituals
    'rc3nj71': 'wr_inbox',
    '2i7ywgk': 'wr_messages',
    '997v7tb': 'wr_deepwork',
  };

  const newWorkRitualChecks = {};

  // workLog in v5 was the completion log. Also check ritualChecks for 'zhh235z'.
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
    // Deep work is 2x-tappable; others max at 1
    const maxTaps = newId === 'wr_deepwork' ? 2 : 1;
    newWorkRitualChecks[entry.date][newId] = Math.min(current + 1, maxTaps);
  }
  v6.workRitualChecks = newWorkRitualChecks;

  // --- 5. MIGRATE ACTIVE GOALS → COMMITMENTS + DAILY INTENTION (Prash)
  //
  // v5 active goals were a mix of daily behaviors, monthly habits, and
  // true commitments. We use defaults for commitments (already matches
  // your 3 themes); the daily £30 aside can be surfaced later via
  // Settings. Prash is already in v6 as a Life intention.
  //
  // goalLog entries for daily behaviors: check if date matches "Quality time
  // with Prash" and preserve as intention check.

  for (const entry of v5Data.goalLog || []) {
    // gnbmdvq = "Quality time with Prash <3"
    if (entry.goalId === 'gnbmdvq') {
      if (!v6.intentionChecks[entry.date]) v6.intentionChecks[entry.date] = {};
      v6.intentionChecks[entry.date]['i_prash'] = true;
    }
  }

  // --- 6. MIGRATE BACKLOG (preserve all, with aging dates)
  //
  // v5 backlog items have `addedDate` already. Preserve them as-is.
  // New field `penaltiesApplied` starts empty — penalties will be applied
  // going forward based on current date vs addedDate.

  v6.backlog = (v5Data.backlog || []).map(item => ({
    id: item.id,
    name: item.name,
    pts: item.pts,
    addedDate: item.addedDate || todayISO(),
    penaltiesApplied: [], // will accrue as days pass
  }));

  // --- 7. MIGRATE DEADLINES (as-is)
  v6.deadlines = v5Data.deadlines || [];

  // --- 8. TOTALS
  //
  // v5 had a bug where totalEarned (425) didn't match totalSpent (900).
  // Recalculate from logs as source of truth.

  v6.totalEarned = calculateTotalEarned(v6);
  v6.totalSpent = (v5Data.rewardLog || []).reduce((sum, r) => sum + (r.cost || 0), 0);

  return v6;
}

/**
 * Recalculate totalEarned from the historical check logs.
 * Used during migration to fix the v5 totals bug.
 */
function calculateTotalEarned(v6Data) {
  let total = 0;

  // Points from rituals
  for (const [_date, checks] of Object.entries(v6Data.ritualChecks)) {
    for (const [id, taps] of Object.entries(checks)) {
      const ritual = v6Data.rituals.find(r => r.id === id);
      if (!ritual) continue;
      if (ritual.twice) {
        // Half points per tap
        total += (ritual.pts / 2) * taps;
      } else {
        total += ritual.pts * (taps ? 1 : 0);
      }
    }
  }

  // Points from intentions
  for (const [_date, checks] of Object.entries(v6Data.intentionChecks)) {
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

  // Points from work rituals
  for (const [_date, checks] of Object.entries(v6Data.workRitualChecks)) {
    for (const [id, taps] of Object.entries(checks)) {
      const wr = v6Data.workRituals.find(w => w.id === id);
      if (!wr) continue;
      if (wr.twice) {
        total += (wr.pts / 2) * taps;
      } else {
        total += wr.pts * (taps ? 1 : 0);
      }
    }
  }

  return Math.round(total);
}

/**
 * The main entry point. Called on every app load.
 * Checks if migration is needed, runs it if so, returns final v6 data.
 */
export function ensureV6Schema(rawData) {
  // Brand new user — no data at all
  if (!rawData) {
    return freshV6State();
  }

  // Already v6 — return as-is
  if (rawData.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return rawData;
  }

  // v5 or earlier — migrate
  console.log('[migration] Detected older schema, migrating to v6…');
  const migrated = migrateV5toV6(rawData);
  console.log('[migration] Migration complete.');
  return migrated;
}