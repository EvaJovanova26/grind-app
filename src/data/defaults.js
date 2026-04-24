// src/data/defaults.js
//
// All default content for a fresh grind install.
// When you want to tweak default rituals, rhythms, penalties, or rewards,
// this is the file to change.
//
// Note: these are DEFAULTS. Existing users' data is never overwritten
// by changes here — migration only fills in gaps.

// ----------------------------------------------------------------------
// DAILY RITUALS (17 items)
// Non-negotiable daily behaviors. Flat list, no AM/PM sections.
// Items marked `twice: true` can be tapped twice (morning + evening),
// each tap awards half points.
// ----------------------------------------------------------------------

export const DEFAULT_RITUALS = [
  { id: 'r_wake',          name: 'Wake before 9am',            pts: 10, twice: false },
  { id: 'r_meds',          name: 'Meds + supplements',         pts: 10, twice: true },
  { id: 'r_teeth',         name: 'Brush teeth',                pts: 10, twice: true },
  { id: 'r_cats',          name: 'Feed cats',                  pts: 10, twice: true },
  { id: 'r_litter',        name: 'Clean litter box',           pts: 10, twice: true },
  { id: 'r_skincare_am',   name: 'Morning skincare',           pts: 10, twice: false },
  { id: 'r_skincare_pm',   name: 'Evening skincare',           pts: 10, twice: false },
  { id: 'r_shower',        name: 'Shower',                     pts: 15, twice: false },
  { id: 'r_water',         name: 'Water (2L)',                 pts: 8,  twice: false, water: true },
  { id: 'r_stretch',       name: 'Stretch (10min)',            pts: 10, twice: true },
  { id: 'r_breakfast',     name: 'Breakfast',                  pts: 15, twice: false },
  { id: 'r_lunch',         name: 'Lunch',                      pts: 5,  twice: false },
  { id: 'r_dinner',        name: 'Dinner',                     pts: 5,  twice: false },
  { id: 'r_leave_house',   name: 'Leave the house (10min)',    pts: 10, twice: false },
  { id: 'r_no_screens',    name: 'No screens after midnight',  pts: 20, twice: false },
];

// ----------------------------------------------------------------------
// INTENTIONS — Life / Body / Mind (5 each)
// Daily aspirations. Missing them isn't failure.
// ----------------------------------------------------------------------

export const DEFAULT_INTENTIONS = {
  body: [
    { id: 'i_gym',       name: 'Gym session',          pts: 30 },
    { id: 'i_classpass', name: 'ClassPass class',      pts: 30 },
    { id: 'i_kravmaga',  name: 'Krav Maga',            pts: 35 },
    { id: 'i_walk',      name: 'Walk in the park',     pts: 20 },
    { id: 'i_protein',   name: 'Protein shake',        pts: 10 },
  ],
  mind: [
    { id: 'i_book',      name: 'Read a book (30min+)',                     pts: 20 },
    { id: 'i_duolingo',  name: 'Duolingo / language learning',             pts: 25 },
    { id: 'i_learn',     name: 'Learn something new (Paladin, coding…)',   pts: 20 },
    { id: 'i_creative',  name: 'Creative output (standup, writing, puzzle)', pts: 25 },
    { id: 'i_news',      name: 'Read news / Tagesschau',                   pts: 15 },
  ],
  life: [
    { id: 'i_cook',      name: 'Cook a proper meal',          pts: 25 },
    { id: 'i_prash',     name: 'Quality time with Prash',     pts: 25 },
    { id: 'i_friend',    name: 'Catch up with friend/family', pts: 25 },
    { id: 'i_messages',  name: 'Respond to all messages',     pts: 20 },
    { id: 'i_admin',     name: 'Deal with one admin task',    pts: 20 },
  ],
};

// ----------------------------------------------------------------------
// WORK RITUALS (4 items) — daily work habits
// ----------------------------------------------------------------------

export const DEFAULT_WORK_RITUALS = [
  { id: 'wr_review',    name: 'Review daily tasks / to-do',  pts: 10, twice: false },
  { id: 'wr_inbox',     name: 'Inbox clearing',              pts: 10, twice: false },
  { id: 'wr_messages',  name: 'Respond to all messages',     pts: 10, twice: false },
  { id: 'wr_deepwork',  name: '2× deep work blocks',         pts: 10, twice: true },
];

// ----------------------------------------------------------------------
// WEEKLY RHYTHMS (10 items)
// Reset Monday. Unfinished items carry over with amber visual.
// Penalty £ applies if missed by week's end.
// ----------------------------------------------------------------------

export const DEFAULT_WEEKLY_RHYTHMS = [
  { id: 'w_laundry',     name: 'Laundry (washed, dried, put away)', pts: 40, penalty: 3 },
  { id: 'w_deepclean',   name: 'Deep clean flat (30min+)',          pts: 30, penalty: 3 },
  { id: 'w_garbage',     name: 'Take garbage out',                  pts: 15, penalty: 2 },
  { id: 'w_prash_plan',  name: 'Plan a date/experience with Prash', pts: 30, penalty: 0 },
  { id: 'w_social',      name: 'Attend social/networking/cultural event', pts: 50, penalty: 3 },
  { id: 'w_linkedin',    name: 'LinkedIn / recruiter outreach',     pts: 25, penalty: 3 },
  { id: 'w_jobs',        name: 'Apply to 5+ jobs',                  pts: 25, penalty: 5 },
  { id: 'w_industry',    name: 'Read industry people & news',       pts: 20, penalty: 2 },
  { id: 'w_colleague',   name: 'Check in on a colleague',           pts: 20, penalty: 2 },
  { id: 'w_skincare_dev', name: 'Use skincare device',              pts: 20, penalty: 0 },
];

// ----------------------------------------------------------------------
// MONTHLY RHYTHMS (4 items)
// Reset 1st of month. Penalty £ if missed.
// ----------------------------------------------------------------------

export const DEFAULT_MONTHLY_RHYTHMS = [
  { id: 'm_finance',      name: 'Financial / budget review',             pts: 50, penalty: 10 },
  { id: 'm_investment',   name: 'Research one investment opportunity',   pts: 30, penalty: 5 },
  { id: 'm_journal',      name: 'Write in investment journal',           pts: 30, penalty: 5 },
  { id: 'm_subscriptions', name: 'Review all subscriptions',             pts: 30, penalty: 10 },
];

// ----------------------------------------------------------------------
// COMMITMENTS (2-3 quarterly themes)
// Longer-arc focus areas. Displayed on Tasks tab. No daily points.
// ----------------------------------------------------------------------

export const DEFAULT_COMMITMENTS = [
  {
    id: 'c_nextrole',
    name: 'Find the next role',
    why: 'Progress applications, networking, and interview prep this quarter',
  },
  {
    id: 'c_finance',
    name: 'Financial discipline',
    why: 'Build the habit of saving daily, investing monthly, reviewing spending',
  },
  {
    id: 'c_sidehustle',
    name: 'Side-hustle exploration',
    why: 'Validate one idea and take first real steps toward it',
  },
];

// ----------------------------------------------------------------------
// PENALTIES (unchanged from current app — £ amounts preserved)
// ----------------------------------------------------------------------

export const DEFAULT_PENALTIES = [
  { id: 'p_gaming',         name: 'Mobile gaming (per hour)',                              amount: 2 },
  { id: 'p_skip_breakfast', name: 'Skipped breakfast',                                     amount: 1 },
  { id: 'p_bed_noon',       name: 'Stayed in bed past noon',                               amount: 2 },
  { id: 'p_doomscroll',     name: 'Doom-scrolled (per hour)',                              amount: 1.5 },
  { id: 'p_adhd_meds',      name: 'Took too much ADHD meds',                               amount: 3 },
  { id: 'p_ingame',         name: 'In-game purchase (any amount)',                         amount: 5 },
  { id: 'p_gaming_binge',   name: 'Gaming for 5+ hours (binging)',                         amount: 10 },
  { id: 'p_phone_bed',      name: 'Phone in bed after lights out',                         amount: 1.5 },
  { id: 'p_skip_lunch',     name: 'Skipped lunch (only)',                                  amount: 1 },
  { id: 'p_ignore_all',     name: 'Ignored all messages all day',                          amount: 2 },
  { id: 'p_ignore_friend',  name: 'Ignored a friend\'s message for 3+ days',               amount: 5 },
  { id: 'p_cancel_social',  name: 'Cancelled a social plan',                               amount: 3 },
  { id: 'p_no_house',       name: 'Didn\'t leave the house all day',                       amount: 5 },
  { id: 'p_no_food_3pm',    name: 'No food until 3pm',                                     amount: 5 },
  { id: 'p_no_movement',    name: 'No movement at all (even walking)',                     amount: 3 },
  { id: 'p_up_2am',         name: 'Stayed up past 2am',                                    amount: 3 },
  { id: 'p_up_3am',         name: 'Stayed up past 3am',                                    amount: 5 },
  { id: 'p_impulse_beauty', name: 'Impulse skincare/beauty buy (unplanned, £50+)',         amount: 7 },
  { id: 'p_lazy_delivery',  name: 'Ordered delivery food out of laziness (not tiredness)', amount: 7 },
  { id: 'p_no_deepwork',    name: 'Full workday with zero deep work',                      amount: 5 },
  { id: 'p_ignore_lead',    name: 'Ignored Leadership message for 24+h',                   amount: 3 },
  { id: 'p_impulse_shop',   name: 'Impulse shopping (unplanned, £100+)',                   amount: 10 },
  { id: 'p_ignore_cats',    name: 'Ignored kittens all day',                               amount: 15 },
  { id: 'p_binge_tv',       name: 'Binge-watched TV for 3+ hours',                         amount: 3 },
];

// ----------------------------------------------------------------------
// REWARDS (unchanged from current app)
// ----------------------------------------------------------------------

export const DEFAULT_REWARDS = [
  { id: 'rw_gaming',      name: '1hr guilt-free gaming',                                   cost: 300 },
  { id: 'rw_deliveroo',   name: 'Deliveroo treat',                                         cost: 800 },
  { id: 'rw_write_off',   name: 'Write off £10 debt (penalty jar)',                        cost: 800 },
  { id: 'rw_restaurant',  name: 'Restaurant date / eating out',                            cost: 1200 },
  { id: 'rw_nails',       name: 'Nail appointment',                                        cost: 1500 },
  { id: 'rw_shopping',    name: 'Shopping session (£150 budget)',                          cost: 1800 },
  { id: 'rw_skincare',    name: 'Skincare/beauty session (cosmetic salon)',                cost: 2000 },
  { id: 'rw_lsd',         name: 'LSD trip',                                                cost: 3500 },
  { id: 'rw_investment',  name: 'Major personal investment (course, device, wardrobe…)',   cost: 4000 },
  { id: 'rw_weird_sex',   name: 'Weird sexual experience',                                 cost: 5000 },
];

// ----------------------------------------------------------------------
// BACKLOG AGING (new mechanic)
// Penalty-on-aging, not bonus-on-aging.
// ----------------------------------------------------------------------

export const BACKLOG_AGING = {
  warningDays: 7,     // item turns amber
  firstPenaltyDays: 14, // £2 added
  secondPenaltyDays: 21, // £5 added, prompt to drop
  firstPenaltyAmount: 2,
  secondPenaltyAmount: 5,
};