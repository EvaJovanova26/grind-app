import { useState, useEffect, useCallback } from "react";

const APP_KEY = "grind_app_data"; // permanent key — never change this
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);
const daysAgo = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));
const daysUntil = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const defaultRituals = [
  { id: "r1", name: "Shower", period: "morning", pts: 5 },
  { id: "r2", name: "Take vitamins", period: "morning", pts: 5 },
  { id: "r3", name: "Eat breakfast", period: "morning", pts: 5 },
  { id: "r4", name: "Brush teeth (AM)", period: "morning", pts: 5 },
  { id: "r5", name: "Drink water (500ml)", period: "morning", pts: 5 },
  { id: "r6", name: "Feed cats", period: "morning", pts: 10 },
  { id: "r7", name: "Eat lunch", period: "afternoon", pts: 5 },
  { id: "r8", name: "Drink water (1L)", period: "afternoon", pts: 5 },
  { id: "r9", name: "Eat dinner", period: "evening", pts: 5 },
  { id: "r10", name: "Brush teeth (PM)", period: "evening", pts: 5 },
  { id: "r11", name: "Feed cats (PM)", period: "evening", pts: 10 },
];

const defaultPerfectDay = [
  { id: "pd1", name: "Duolingo / language learning", pts: 25 },
  { id: "pd2", name: "Gym session", pts: 30 },
  { id: "pd3", name: "Walk in the park", pts: 20 },
  { id: "pd4", name: "ClassPass class", pts: 30 },
  { id: "pd5", name: "Krav Maga", pts: 35 },
  { id: "pd6", name: "Catch up with a friend", pts: 25 },
  { id: "pd7", name: "Learn something new (Paladin, coding, etc.)", pts: 20 },
  { id: "pd8", name: "Read 5+ news articles (Economist/FT)", pts: 20 },
  { id: "pd9", name: "Listen to Tagesschau", pts: 15 },
  { id: "pd10", name: "Read a book (30min+)", pts: 20 },
];

const defaultWork = [
  { id: "w1", name: "Apply for a job", pts: 40 },
  { id: "w2", name: "Update CV / portfolio", pts: 30 },
  { id: "w3", name: "Research companies", pts: 20 },
  { id: "w4", name: "Reply to recruiter / follow up", pts: 25 },
  { id: "w5", name: "LinkedIn networking (message someone)", pts: 20 },
  { id: "w6", name: "Work on a project / skill-building", pts: 30 },
];

const defaultPenalties = [
  { id: "p1", name: "Mobile gaming (per hour)", amount: 2 },
  { id: "p2", name: "Skipped a meal", amount: 1 },
  { id: "p3", name: "Stayed in bed past noon", amount: 2 },
  { id: "p4", name: "Didn't leave the house", amount: 1.5 },
  { id: "p5", name: "Doom-scrolled 1hr+", amount: 1.5 },
];

const defaultRewards = [
  { id: "rw1", name: "Guilt-free coffee", cost: 500 },
  { id: "rw2", name: "Nail appointment", cost: 1500 },
  { id: "rw3", name: "Skincare product", cost: 2000 },
  { id: "rw4", name: "Takeaway treat", cost: 800 },
  { id: "rw5", name: "1hr guilt-free gaming", cost: 300 },
];

const defaultState = {
  rituals: defaultRituals, perfectDay: defaultPerfectDay, work: defaultWork,
  ritualChecks: {}, perfectDayChecks: {},
  penalties: defaultPenalties, penaltyLog: [], penaltyPaidMonths: [],
  rewards: defaultRewards, rewardLog: [],
  activeGoals: [], backlog: [], deadlines: [],
  goalLog: [], workLog: [],
  totalEarned: 0, totalSpent: 0,
};

function load() {
  try { const d = localStorage.getItem(APP_KEY); return d ? { ...defaultState, ...JSON.parse(d) } : defaultState; }
  catch { return defaultState; }
}
function save(s) { localStorage.setItem(APP_KEY, JSON.stringify(s)); }

function getStreak(goalId, log) {
  let streak = 0, d = new Date();
  for (let i = 0; i < 60; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (log.some(e => e.goalId === goalId && e.date === ds)) streak++;
    else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function streakMult(s) { return s >= 7 ? 3 : s >= 3 ? 2 : 1; }

function getWeekDates() {
  const now = new Date(); const day = now.getDay();
  const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); dates.push(d.toISOString().slice(0, 10)); }
  return dates;
}

const I = {
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  flame: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2c.5 4-3 6-3 10a5 5 0 0 0 10 0c0-4-4-5-4-8-1 1-2.5 2-3 2z"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  clock: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  gear: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  star: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  gift: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  warn: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  coin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" fontWeight="bold">£</text></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  undo: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  chart: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  move: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  heart: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};

const C = {
  bg: "#0c0c0c", surface: "#141414", border: "#1f1f1f", borderLight: "#292929",
  text: "#e5e0da", textMuted: "#706b64", textDim: "#4a4640",
  accent: "#dea058", accentDim: "#dea05822", accentBg: "#1c1710",
  green: "#5aad5a", greenDim: "#5aad5a22", greenBg: "#121c12",
  red: "#c9504c", redDim: "#c9504c22", redBg: "#1c1212",
  blue: "#52b0cb", blueDim: "#52b0cb22", blueBg: "#101a1e",
  purple: "#a67eec", purpleDim: "#a67eec22", purpleBg: "#18121e",
  gold: "#d4af37", goldDim: "#d4af3722", goldBg: "#1c1a10",
  teal: "#4db6ac", tealDim: "#4db6ac22", tealBg: "#101c1a",
};
const FONT = `'DM Sans', system-ui, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', monospace`;

/* ══════ MAIN APP ══════ */
export default function App() {
  const [state, setState] = useState(load);
  const [view, setView] = useState("main"); // main | settings | stats
  const [addingGoal, setAddingGoal] = useState(false);
  const [addingBacklog, setAddingBacklog] = useState(false);
  const [addingDeadline, setAddingDeadline] = useState(false);
  const [addingWork, setAddingWork] = useState(false);
  const [toast, setToast] = useState(null);
  const [moveMenu, setMoveMenu] = useState(null); // {id, from}
  const [confirmReward, setConfirmReward] = useState(null);
  const [activeDate, setActiveDate] = useState(today);

  const p = useCallback((fn) => setState(prev => { const n = typeof fn === "function" ? fn(prev) : fn; save(n); return n; }), []);
  const todayStr = today();
  const isViewingPast = activeDate !== todayStr;
  const tc = state.ritualChecks[activeDate] || {};
  const pdc = (state.perfectDayChecks || {})[activeDate] || {};

  const showToast = (msg, dur = 2500) => { setToast(msg); setTimeout(() => setToast(null), dur); };

  // Points calc
  const totalRitualPts = Object.entries(state.ritualChecks).reduce((t, [, ch]) =>
    t + state.rituals.filter(r => ch[r.id]).reduce((s, r) => s + r.pts, 0), 0);
  const totalPerfectPts = Object.entries(state.perfectDayChecks || {}).reduce((t, [, ch]) =>
    t + (state.perfectDay || []).filter(pd => ch[pd.id]).reduce((s, pd) => s + pd.pts, 0), 0);
  const balance = totalRitualPts + totalPerfectPts + state.totalEarned - state.totalSpent;

  const ritualPtsToday = state.rituals.filter(r => tc[r.id]).reduce((s, r) => s + r.pts, 0);
  const perfectPtsToday = (state.perfectDay || []).filter(pd => pdc[pd.id]).reduce((s, pd) => s + pd.pts, 0);

  const curMonth = todayStr.slice(0, 7);
  const monthPens = state.penaltyLog.filter(pl => pl.date.startsWith(curMonth));
  const monthPenTotal = monthPens.reduce((s, pl) => s + pl.amount, 0);
  const isPaid = state.penaltyPaidMonths.includes(curMonth);

  const allPerfectDone = (state.perfectDay || []).length > 0 && (state.perfectDay || []).every(pd => pdc[pd.id]);
  const perfectDayCount = (state.perfectDay || []).filter(pd => pdc[pd.id]).length;
  const perfectDayTotal = (state.perfectDay || []).length;

  // Actions
  const toggleRitual = (id) => p(s => {
    const dc = { ...s.ritualChecks }; const t = { ...(dc[activeDate] || {}) }; t[id] = !t[id]; dc[activeDate] = t;
    return { ...s, ritualChecks: dc };
  });

  const togglePerfectDay = (id) => p(s => {
    const dc = { ...(s.perfectDayChecks || {}) }; const t = { ...(dc[activeDate] || {}) }; t[id] = !t[id]; dc[activeDate] = t;
    const prevAllDone = (s.perfectDay || []).every(pd => ((s.perfectDayChecks || {})[activeDate] || {})[pd.id]);
    const newAllDone = (s.perfectDay || []).every(pd => t[pd.id]);
    let bonus = 0;
    if (newAllDone && !prevAllDone) { bonus = 100; setTimeout(() => showToast("✨ Perfect day! +100 bonus!"), 100); }
    return { ...s, perfectDayChecks: dc, totalEarned: s.totalEarned + bonus };
  });

  const logPenalty = (pe) => {
    p(s => ({ ...s, penaltyLog: [...s.penaltyLog, { ...pe, date: todayStr, logId: uid() }] }));
    showToast(`-£${pe.amount} logged`);
  };

  const undoPenalty = (logId) => {
    p(s => ({ ...s, penaltyLog: s.penaltyLog.filter(x => x.logId !== logId) }));
    showToast("Penalty removed");
  };

  const completeGoal = (g) => {
    const streak = getStreak(g.id, state.goalLog || []) + 1;
    const mult = streakMult(streak);
    const pts = (g.pts || 20) * mult;
    p(s => ({ ...s, goalLog: [...(s.goalLog || []), { goalId: g.id, date: activeDate }], totalEarned: s.totalEarned + pts }));
    showToast(`+${pts} pts! ${streak > 1 ? `🔥 ${streak}d streak` : ""}`);
  };

  const completeWork = (w) => {
    const streak = getStreak(w.id, state.workLog || []) + 1;
    const mult = streakMult(streak);
    const pts = (w.pts || 25) * mult;
    p(s => ({ ...s, workLog: [...(s.workLog || []), { goalId: w.id, date: activeDate }], totalEarned: s.totalEarned + pts }));
    showToast(`+${pts} pts! ${streak > 1 ? `🔥 ${streak}d streak` : ""}`);
  };

  const completeBacklog = (b) => {
    const age = daysAgo(b.addedDate); const bonus = Math.min(age * 2, 200); const pts = (b.pts || 50) + bonus;
    p(s => ({ ...s, backlog: s.backlog.filter(x => x.id !== b.id), totalEarned: s.totalEarned + pts }));
    showToast(`+${pts} pts! Backlog cleared 💪`);
  };

  const completeDeadline = (dl) => {
    const rem = daysUntil(dl.dueDate); const earlyBonus = rem > 0 ? Math.min(rem * 10, 100) : 0;
    const pts = (dl.pts || 50) + earlyBonus;
    p(s => ({ ...s, deadlines: s.deadlines.filter(x => x.id !== dl.id), totalEarned: s.totalEarned + pts }));
    showToast(`+${pts} pts! ${earlyBonus > 0 ? "Early bonus! 🎯" : "Done! ✓"}`);
  };

  const claimReward = (rw) => {
    if (balance < rw.cost) return;
    p(s => ({ ...s, totalSpent: s.totalSpent + rw.cost, rewardLog: [...s.rewardLog, { ...rw, date: todayStr, logId: uid() }] }));
    setConfirmReward(null);
    showToast(`🎉 Claimed: ${rw.name}!`);
  };

  // Move items between sections
  const moveItem = (id, from, to) => {
    p(s => {
      const item = (s[from] || []).find(x => x.id === id);
      if (!item) return s;
      const newItem = { ...item, id: uid() };
      if (to === "backlog") newItem.addedDate = todayStr;
      return { ...s, [from]: (s[from] || []).filter(x => x.id !== id), [to]: [...(s[to] || []), newItem] };
    });
    setMoveMenu(null);
    showToast(`Moved to ${to === "activeGoals" ? "Active Goals" : to === "backlog" ? "Backlog" : "Work"}`);
  };

  // Today's summary data
  const todayRituals = state.rituals.filter(r => tc[r.id]);
  const todayPerfect = (state.perfectDay || []).filter(pd => pdc[pd.id]);
  const todayGoals = (state.goalLog || []).filter(e => e.date === activeDate);
  const todayWorkDone = (state.workLog || []).filter(e => e.date === activeDate);
  const todayPenalties = state.penaltyLog.filter(pl => pl.date === activeDate);
  const todayRewards = state.rewardLog.filter(rl => rl.date === activeDate);
  const todayTotal = ritualPtsToday + perfectPtsToday;
  const todayCount = todayRituals.length + todayPerfect.length + todayGoals.length + todayWorkDone.length;

  if (view === "settings") return <Settings state={state} p={p} onBack={() => setView("main")} />;
  if (view === "stats") return <Stats state={state} onBack={() => setView("main")} />;

  const allRitualsDone = state.rituals.every(r => tc[r.id]);
  const ritualProg = state.rituals.length > 0 ? state.rituals.filter(r => tc[r.id]).length / state.rituals.length : 0;
  const perfectProg = perfectDayTotal > 0 ? perfectDayCount / perfectDayTotal : 0;

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT, minHeight: "100vh", padding: "16px 20px 80px", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, color: C.text, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }}>
          {toast}
        </div>
      )}

      {/* Move menu overlay */}
      {moveMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setMoveMenu(null)}>
          <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: 20, minWidth: 240 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Move to...</div>
            {moveMenu.from !== "activeGoals" && <button onClick={() => moveItem(moveMenu.id, moveMenu.from, "activeGoals")} style={moveBtn}>Active Goals</button>}
            {moveMenu.from !== "work" && <button onClick={() => moveItem(moveMenu.id, moveMenu.from, "work")} style={moveBtn}>Work</button>}
            {moveMenu.from !== "backlog" && <button onClick={() => moveItem(moveMenu.id, moveMenu.from, "backlog")} style={moveBtn}>Backlog</button>}
            <button onClick={() => setMoveMenu(null)} style={{ ...moveBtn, color: C.textMuted, borderColor: C.border, marginTop: 6 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Reward confirm */}
      {confirmReward && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmReward(null)}>
          <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 16, padding: 20, minWidth: 260, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{I.gift}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Claim {confirmReward.name}?</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>This will deduct <span style={{ color: C.accent, fontFamily: MONO, fontWeight: 600 }}>{confirmReward.cost} pts</span> from your balance</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmReward(null)} style={{ flex: 1, padding: "10px 0", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.textMuted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
              <button onClick={() => claimReward(confirmReward)} style={{ flex: 1, padding: "10px 0", background: C.accent, border: "none", borderRadius: 10, color: C.bg, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Claim it!</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}><span style={{ color: C.accent }}>grind</span></h1>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setView("stats")} style={btnS({ color: C.textMuted })}>{I.chart}</button>
          <button onClick={() => setView("settings")} style={btnS({ color: C.textMuted })}>{I.gear}</button>
        </div>
      </div>

      {/* Date navigator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18, background: isViewingPast ? C.accentBg : C.surface, border: `1px solid ${isViewingPast ? C.accent + "44" : C.border}`, borderRadius: 12, padding: "8px 12px" }}>
        <button onClick={() => { const d = new Date(activeDate); d.setDate(d.getDate() - 1); setActiveDate(d.toISOString().slice(0, 10)); }}
          style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, padding: "2px 8px", fontFamily: FONT }}>‹</button>
        <input type="date" value={activeDate} max={todayStr} onChange={e => e.target.value && setActiveDate(e.target.value)}
          style={{ background: "none", border: "none", color: isViewingPast ? C.accent : C.text, fontFamily: MONO, fontSize: 14, fontWeight: 600, textAlign: "center", outline: "none", colorScheme: "dark", cursor: "pointer" }} />
        <button onClick={() => { const d = new Date(activeDate); d.setDate(d.getDate() + 1); const next = d.toISOString().slice(0, 10); if (next <= todayStr) setActiveDate(next); }}
          style={{ background: "none", border: "none", color: activeDate === todayStr ? C.textDim : C.textMuted, cursor: activeDate === todayStr ? "default" : "pointer", fontSize: 18, padding: "2px 8px", fontFamily: FONT }}>›</button>
        {isViewingPast && (
          <button onClick={() => setActiveDate(todayStr)}
            style={{ background: C.accent, border: "none", borderRadius: 6, color: C.bg, fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer", fontFamily: FONT, marginLeft: 4 }}>Today</button>
        )}
      </div>

      {/* Score bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        <Chip icon={I.star} label="Points" value={balance} color={C.accent} bg={C.accentBg} />
        <Chip icon={I.coin} label="Penalty Jar" value={`£${monthPenTotal.toFixed(2)}`} color={C.red} bg={C.redBg} />
        <Chip icon={I.flame} label={isViewingPast ? new Date(activeDate + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Today"} value={`+${ritualPtsToday + perfectPtsToday}`} color={C.green} bg={C.greenBg} />
      </div>

      {/* DAILY RITUALS */}
      <Sec title="Daily Rituals" sub={allRitualsDone ? "All done ✓" : `${state.rituals.filter(r => tc[r.id]).length}/${state.rituals.length}`} color={C.green}>
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ height: 3, background: C.border }}><div style={{ height: "100%", width: `${ritualProg * 100}%`, background: C.green, transition: "width 0.3s", borderRadius: 3 }} /></div>
          {["morning", "afternoon", "evening"].map(per => {
            const items = state.rituals.filter(r => r.period === per);
            if (!items.length) return null;
            return (<div key={per}>
              <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: C.textDim }}>{per}</div>
              {items.map(r => <CheckRow key={r.id} checked={!!tc[r.id]} onToggle={() => toggleRitual(r.id)} label={r.name} pts={r.pts} color={C.green} />)}
            </div>);
          })}
        </div>
      </Sec>

      {/* PERFECT DAY */}
      <Sec title="Perfect Day" sub={allPerfectDone ? "PERFECT! +100 bonus ✨" : `${perfectDayCount}/${perfectDayTotal}`} color={C.gold}>
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${allPerfectDone ? C.gold + "44" : C.border}`, overflow: "hidden", transition: "border-color 0.3s" }}>
          <div style={{ height: 3, background: C.border }}><div style={{ height: "100%", width: `${perfectProg * 100}%`, background: allPerfectDone ? C.gold : C.accent, transition: "width 0.3s", borderRadius: 3 }} /></div>
          {allPerfectDone && (
            <div style={{ background: C.goldBg, borderBottom: `1px solid ${C.goldDim}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.gold, fontWeight: 600 }}>
              {I.trophy} Perfect day! +100 bonus points
            </div>
          )}
          {(state.perfectDay || []).map(pd => <CheckRow key={pd.id} checked={!!pdc[pd.id]} onToggle={() => togglePerfectDay(pd.id)} label={pd.name} pts={pd.pts} color={C.gold} />)}
        </div>
      </Sec>

      {/* WORK */}
      <Sec title="Work" sub={`${(state.work || []).length} goals`} color={C.teal}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(state.work || []).map(w => {
            const streak = getStreak(w.id, state.workLog || []);
            const mult = streakMult(streak);
            const doneToday = (state.workLog || []).some(e => e.goalId === w.id && e.date === activeDate);
            return (
              <div key={w.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: doneToday ? 0.45 : 1 }}>
                <CircleBtn done={doneToday} color={doneToday ? C.green : C.teal} onClick={() => !doneToday && completeWork(w)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                  {streak > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.teal, marginTop: 2 }}>{I.flame} {streak}d {mult > 1 && <span style={{ background: C.tealDim, padding: "0 6px", borderRadius: 4, fontWeight: 600 }}>×{mult}</span>}</div>}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.teal }}>+{(w.pts || 25) * mult}</span>
                <button onClick={() => setMoveMenu({ id: w.id, from: "work" })} style={btnS({ color: C.textDim })}>{I.move}</button>
                <button onClick={() => p(s => ({ ...s, work: (s.work || []).filter(x => x.id !== w.id) }))} style={btnS({ color: C.textDim })}>{I.trash}</button>
              </div>
            );
          })}
          {addingWork
            ? <QuickAdd placeholder="Work goal" defPts={25} onAdd={(n, pt) => { p(s => ({ ...s, work: [...(s.work || []), { id: uid(), name: n, pts: pt }] })); setAddingWork(false); }} onCancel={() => setAddingWork(false)} />
            : <DashedBtn label="Add work goal" onClick={() => setAddingWork(true)} />
          }
        </div>
      </Sec>

      {/* PENALTY JAR — today only */}
      {!isViewingPast && (
      <Sec title="Penalty Jar" sub={`£${monthPenTotal.toFixed(2)} this month`} color={C.red}>
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
          {monthPenTotal > 0 && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redDim}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.red, fontSize: 13, fontWeight: 600 }}>{I.warn} Running total</div>
              <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.red }}>£{monthPenTotal.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {state.penalties.map(pe => (
              <button key={pe.id} onClick={() => logPenalty(pe)} style={{
                background: C.redBg, border: `1px solid ${C.redDim}`, borderRadius: 10, padding: "8px 14px",
                color: C.text, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT,
              }}>{pe.name} <span style={{ fontFamily: MONO, color: C.red, fontWeight: 600 }}>£{pe.amount}</span></button>
            ))}
          </div>
          {monthPens.length > 0 && (
            <div style={{ marginTop: 10, maxHeight: 120, overflow: "auto" }}>
              {monthPens.slice().reverse().slice(0, 8).map(pe => (
                <div key={pe.logId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: C.textMuted, padding: "4px 0", borderBottom: `1px solid ${C.border}08` }}>
                  <span>{pe.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: C.red }}>-£{pe.amount}</span>
                    <button onClick={() => undoPenalty(pe.logId)} style={{ ...btnS({ color: C.textDim }), fontSize: 10 }} title="Undo">{I.undo}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {monthPenTotal > 0 && !isPaid && (
            <button onClick={() => p(s => ({ ...s, penaltyPaidMonths: [...s.penaltyPaidMonths, curMonth] }))}
              style={{ width: "100%", marginTop: 10, padding: "8px 0", background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 10, color: C.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
              Mark as paid
            </button>
          )}
          {isPaid && <div style={{ textAlign: "center", fontSize: 12, color: C.green, marginTop: 8 }}>✓ Paid for {curMonth}</div>}
        </div>
      </Sec>
      )}

      {/* ACTIVE GOALS */}
      <Sec title="Active Goals" sub={`${state.activeGoals.length}/7`} color={C.accent}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.activeGoals.map(g => {
            const streak = getStreak(g.id, state.goalLog || []);
            const mult = streakMult(streak);
            const doneToday = (state.goalLog || []).some(e => e.goalId === g.id && e.date === activeDate);
            return (
              <div key={g.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: doneToday ? 0.45 : 1 }}>
                <CircleBtn done={doneToday} color={doneToday ? C.green : C.accent} onClick={() => !doneToday && completeGoal(g)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  {streak > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: C.accent, marginTop: 2 }}>{I.flame} {streak}d {mult > 1 && <span style={{ background: C.accentDim, padding: "0 6px", borderRadius: 4, fontWeight: 600 }}>×{mult}</span>}</div>}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.accent }}>+{(g.pts || 20) * mult}</span>
                <button onClick={() => setMoveMenu({ id: g.id, from: "activeGoals" })} style={btnS({ color: C.textDim })}>{I.move}</button>
                <button onClick={() => p(s => ({ ...s, activeGoals: s.activeGoals.filter(x => x.id !== g.id) }))} style={btnS({ color: C.textDim })}>{I.trash}</button>
              </div>
            );
          })}
          {state.activeGoals.length < 7 && (
            addingGoal
              ? <QuickAdd placeholder="Goal name" defPts={20} onAdd={(n, pt) => { p(s => ({ ...s, activeGoals: [...s.activeGoals, { id: uid(), name: n, pts: pt }] })); setAddingGoal(false); }} onCancel={() => setAddingGoal(false)} />
              : <DashedBtn label="Add goal" onClick={() => setAddingGoal(true)} />
          )}
        </div>
      </Sec>

      {/* BACKLOG */}
      <Sec title="Backlog" sub={`${state.backlog.length} waiting`} color={C.purple}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.backlog.map(b => {
            const age = daysAgo(b.addedDate); const bonus = Math.min(age * 2, 200); const total = (b.pts || 50) + bonus;
            return (
              <div key={b.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <CircleBtn color={C.purple} onClick={() => completeBacklog(b)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{age > 0 ? `${age}d in backlog` : "Today"} {bonus > 0 && <span style={{ color: C.purple }}>+{bonus} bonus</span>}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.purple }}>{total}</span>
                <button onClick={() => setMoveMenu({ id: b.id, from: "backlog" })} style={btnS({ color: C.textDim })}>{I.move}</button>
                <button onClick={() => p(s => ({ ...s, backlog: s.backlog.filter(x => x.id !== b.id) }))} style={btnS({ color: C.textDim })}>{I.trash}</button>
              </div>
            );
          })}
          {addingBacklog
            ? <QuickAdd placeholder="Backlog item" defPts={50} onAdd={(n, pt) => { p(s => ({ ...s, backlog: [...s.backlog, { id: uid(), name: n, pts: pt, addedDate: todayStr }] })); setAddingBacklog(false); }} onCancel={() => setAddingBacklog(false)} />
            : <DashedBtn label="Add to backlog" onClick={() => setAddingBacklog(true)} />
          }
        </div>
      </Sec>

      {/* DEADLINES */}
      <Sec title="Deadlines" sub={`${state.deadlines.length} active`} color={C.blue}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(dl => {
            const rem = daysUntil(dl.dueDate); const urgent = rem <= 3; const overdue = rem < 0;
            const earlyBonus = rem > 0 ? Math.min(rem * 10, 100) : 0;
            const bc = overdue ? C.red : urgent ? C.accent : C.blue;
            return (
              <div key={dl.id} style={{ background: C.surface, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${overdue ? C.red + "55" : urgent ? C.accent + "44" : C.border}` }}>
                <CircleBtn color={bc} onClick={() => completeDeadline(dl)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dl.name}</div>
                  <div style={{ fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 3, color: overdue ? C.red : urgent ? C.accent : C.textMuted }}>
                    {I.clock} {overdue ? `${Math.abs(rem)}d overdue` : rem === 0 ? "Due today!" : `${rem}d left`}
                    {earlyBonus > 0 && <span style={{ color: C.blue }}> +{earlyBonus} early</span>}
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, color: bc }}>{(dl.pts || 50) + earlyBonus}</span>
                <button onClick={() => p(s => ({ ...s, deadlines: s.deadlines.filter(x => x.id !== dl.id) }))} style={btnS({ color: C.textDim })}>{I.trash}</button>
              </div>
            );
          })}
          {addingDeadline
            ? <DeadlineAdd onAdd={(n, pt, d) => { p(s => ({ ...s, deadlines: [...s.deadlines, { id: uid(), name: n, pts: pt, dueDate: d }] })); setAddingDeadline(false); }} onCancel={() => setAddingDeadline(false)} />
            : <DashedBtn label="Add deadline" onClick={() => setAddingDeadline(true)} />
          }
        </div>
      </Sec>

      {/* REWARDS — today only */}
      {!isViewingPast && (
      <Sec title="Rewards" sub={`${balance} pts available`} color={C.accent}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {state.rewards.map(rw => {
            const ok = balance >= rw.cost;
            return (
              <button key={rw.id} onClick={() => ok && setConfirmReward(rw)} style={{
                background: ok ? C.accentBg : C.surface, border: `1px solid ${ok ? C.accentDim : C.border}`,
                borderRadius: 12, padding: "10px 14px", cursor: ok ? "pointer" : "default", color: C.text,
                textAlign: "left", opacity: ok ? 1 : 0.4, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontFamily: FONT,
              }}>
                {I.gift} {rw.name} <span style={{ fontFamily: MONO, color: C.accent, fontWeight: 600, marginLeft: "auto", paddingLeft: 10 }}>{rw.cost}</span>
              </button>
            );
          })}
        </div>
        {/* Reward history */}
        {state.rewardLog.length > 0 && (
          <div style={{ marginTop: 12, background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Claimed rewards</div>
            {state.rewardLog.slice(-8).reverse().map(rl => (
              <div key={rl.logId} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textMuted, padding: "3px 0" }}>
                <span>{rl.name}</span>
                <span style={{ color: C.textDim }}>{rl.date} · {rl.cost} pts</span>
              </div>
            ))}
          </div>
        )}
      </Sec>
      )}

      {/* TODAY'S SUMMARY */}
      {todayCount > 0 && (
        <Sec title={isViewingPast ? `Summary for ${new Date(activeDate + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : "Today's Summary"} sub="" color={C.green}>
          <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
              <MiniStat label="Things done" value={todayCount} color={C.green} />
              <MiniStat label="Points earned" value={`+${todayTotal}`} color={C.accent} />
              {todayPenalties.length > 0 && <MiniStat label="Penalties" value={todayPenalties.length} color={C.red} />}
              {todayRewards.length > 0 && <MiniStat label="Rewards claimed" value={todayRewards.length} color={C.gold} />}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
              {todayRituals.length > 0 && <div>✓ {todayRituals.length} ritual{todayRituals.length > 1 ? "s" : ""} completed</div>}
              {todayPerfect.length > 0 && <div>✓ {todayPerfect.length} perfect day item{todayPerfect.length > 1 ? "s" : ""}</div>}
              {todayWorkDone.length > 0 && <div>✓ {todayWorkDone.length} work task{todayWorkDone.length > 1 ? "s" : ""}</div>}
              {todayGoals.length > 0 && <div>✓ {todayGoals.length} goal{todayGoals.length > 1 ? "s" : ""} hit</div>}
              {todayRewards.length > 0 && <div style={{ color: C.gold }}>🎁 {todayRewards.map(r => r.name).join(", ")}</div>}
            </div>
            {todayCount >= 5 && <div style={{ marginTop: 10, fontSize: 13, color: C.green, fontWeight: 600 }}>{I.heart} Good day. You showed up.</div>}
          </div>
        </Sec>
      )}

      </div>
    </div>
  );
}

/* ── Shared ── */
function btnS(extra = {}) { return { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", ...extra }; }
const moveBtn = { width: "100%", padding: "10px 0", background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, color: C.text, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 6, fontFamily: FONT };

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function Chip({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 12, padding: "10px 14px", flex: 1, minWidth: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: color + "99", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{icon} {label}</div>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Sec({ title, sub, color, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 3, height: 16, background: color, borderRadius: 2, display: "inline-block" }} />{title}
        </h2>
        {sub && <span style={{ fontSize: 12, color: C.textMuted }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ checked, onToggle, label, pts, color }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: "pointer", borderBottom: `1px solid ${C.border}08`, opacity: checked ? 0.45 : 1, transition: "opacity 0.2s" }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? color : C.borderLight}`, background: checked ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0, color: "#fff" }}>{checked && I.check}</div>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ display: "none" }} />
      <span style={{ flex: 1, fontSize: 14, textDecoration: checked ? "line-through" : "none" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12, color }}>{checked ? "✓" : `+${pts}`}</span>
    </label>
  );
}

function CircleBtn({ done, color, onClick }) {
  return (
    <button onClick={onClick} disabled={done} style={{ width: 30, height: 30, borderRadius: 8, border: `2px solid ${color}`, flexShrink: 0, background: done ? color : "transparent", color: done ? "#fff" : color, display: "flex", alignItems: "center", justifyContent: "center", cursor: done ? "default" : "pointer" }}>{I.check}</button>
  );
}

function DashedBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", background: C.surface, border: `1px dashed ${C.border}`, borderRadius: 12, color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>{I.plus} {label}</button>
  );
}

function QuickAdd({ placeholder, defPts, onAdd, onCancel }) {
  const [n, setN] = useState(""); const [pt, setPt] = useState(defPts);
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input autoFocus value={n} onChange={e => setN(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === "Enter" && n.trim() && onAdd(n.trim(), pt)}
        style={{ flex: 1, minWidth: 120, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: FONT, outline: "none" }} />
      <input value={pt} onChange={e => setPt(Number(e.target.value) || 0)} type="number"
        style={{ width: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.accent, fontFamily: MONO, fontSize: 14, textAlign: "center", outline: "none" }} />
      <button onClick={() => n.trim() && onAdd(n.trim(), pt)} style={{ padding: "8px 16px", background: C.accent, border: "none", borderRadius: 8, color: C.bg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "8px 12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, fontSize: 13, cursor: "pointer" }}>✕</button>
    </div>
  );
}

function DeadlineAdd({ onAdd, onCancel }) {
  const [n, setN] = useState(""); const [pt, setPt] = useState(50); const [d, setD] = useState("");
  return (
    <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input autoFocus value={n} onChange={e => setN(e.target.value)} placeholder="Deadline name"
        style={{ flex: 1, minWidth: 120, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: FONT, outline: "none" }} />
      <input value={d} onChange={e => setD(e.target.value)} type="date"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: FONT, outline: "none", colorScheme: "dark" }} />
      <input value={pt} onChange={e => setPt(Number(e.target.value) || 0)} type="number"
        style={{ width: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.accent, fontFamily: MONO, fontSize: 14, textAlign: "center", outline: "none" }} />
      <button onClick={() => n.trim() && d && onAdd(n.trim(), pt, d)} style={{ padding: "8px 16px", background: C.accent, border: "none", borderRadius: 8, color: C.bg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "8px 12px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, fontSize: 13, cursor: "pointer" }}>✕</button>
    </div>
  );
}

/* ══════ STATS ══════ */
function Stats({ state, onBack }) {
  const todayStr = today();
  const weekDates = getWeekDates();
  const curMonth = todayStr.slice(0, 7);

  // Weekly ritual completion
  const weekRitualData = weekDates.map(d => {
    const ch = state.ritualChecks[d] || {};
    const done = state.rituals.filter(r => ch[r.id]).length;
    return { date: d, done, total: state.rituals.length, pct: state.rituals.length > 0 ? Math.round((done / state.rituals.length) * 100) : 0 };
  });
  const weekAvg = weekRitualData.length > 0 ? Math.round(weekRitualData.reduce((s, d) => s + d.pct, 0) / weekRitualData.length) : 0;

  // Weekly points
  const weekRitualPts = weekDates.reduce((t, d) => {
    const ch = state.ritualChecks[d] || {};
    return t + state.rituals.filter(r => ch[r.id]).reduce((s, r) => s + r.pts, 0);
  }, 0);
  const weekPerfectPts = weekDates.reduce((t, d) => {
    const ch = (state.perfectDayChecks || {})[d] || {};
    return t + (state.perfectDay || []).filter(pd => ch[pd.id]).reduce((s, pd) => s + pd.pts, 0);
  }, 0);

  // Month penalties
  const monthPens = state.penaltyLog.filter(pl => pl.date.startsWith(curMonth));
  const monthPenTotal = monthPens.reduce((s, pl) => s + pl.amount, 0);

  // Top penalties
  const penCounts = {};
  monthPens.forEach(pl => { penCounts[pl.name] = (penCounts[pl.name] || 0) + 1; });
  const topPens = Object.entries(penCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Best streaks
  const allGoals = [...(state.activeGoals || []), ...(state.work || [])];
  const streaks = allGoals.map(g => ({
    name: g.name,
    streak: getStreak(g.id, [...(state.goalLog || []), ...(state.workLog || [])]),
  })).filter(s => s.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5);

  // Rewards claimed this month
  const monthRewards = state.rewardLog.filter(r => r.date.startsWith(curMonth));
  const monthRewardPts = monthRewards.reduce((s, r) => s + r.cost, 0);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT, minHeight: "100vh", padding: "16px 20px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Weekly Stats</h1>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>← Back</button>
      </div>

      {/* Ritual completion chart */}
      <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Ritual Completion</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.green }}>{weekAvg}% avg</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "end", height: 100 }}>
          {weekRitualData.map((d, i) => {
            const isToday = d.date === todayStr;
            return (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 10, fontFamily: MONO, color: d.pct === 100 ? C.green : C.textMuted }}>{d.pct}%</div>
                <div style={{ width: "100%", background: C.border, borderRadius: 6, height: 60, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", bottom: 0, width: "100%", height: `${d.pct}%`, background: d.pct === 100 ? C.green : C.accent, borderRadius: 6, transition: "height 0.3s" }} />
                </div>
                <div style={{ fontSize: 10, color: isToday ? C.accent : C.textDim, fontWeight: isToday ? 700 : 400 }}>{days[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Points summary */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Week pts earned</div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.accent }}>{weekRitualPts + weekPerfectPts}</div>
        </div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Month penalties</div>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.red }}>£{monthPenTotal.toFixed(2)}</div>
        </div>
      </div>

      {/* Reward spend */}
      {monthRewards.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Rewards Claimed This Month</div>
          {monthRewards.map(r => (
            <div key={r.logId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textMuted, padding: "4px 0" }}>
              <span>{r.name}</span>
              <span style={{ fontFamily: MONO, color: C.accent }}>{r.cost} pts</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: C.text, borderTop: `1px solid ${C.border}`, marginTop: 8, paddingTop: 8 }}>
            <span>Total spent</span>
            <span style={{ fontFamily: MONO, color: C.accent }}>{monthRewardPts} pts</span>
          </div>
        </div>
      )}

      {/* Top penalties */}
      {topPens.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Top Penalties This Month</div>
          {topPens.map(([name, count]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.textMuted, padding: "4px 0" }}>
              <span>{name}</span>
              <span style={{ fontFamily: MONO, color: C.red }}>{count}×</span>
            </div>
          ))}
        </div>
      )}

      {/* Best streaks */}
      {streaks.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Active Streaks</div>
          {streaks.map(s => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.textMuted, padding: "4px 0" }}>
              <span>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.accent }}>{I.flame} <span style={{ fontFamily: MONO, fontWeight: 600 }}>{s.streak}d</span></div>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
}

/* ══════ SETTINGS ══════ */
function Settings({ state, p, onBack }) {
  const [tab, setTab] = useState("rituals");
  const [newName, setNewName] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newPeriod, setNewPeriod] = useState("morning");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editVal, setEditVal] = useState("");
  const [editPeriod, setEditPeriod] = useState("morning");

  const tabs = [
    { id: "rituals", label: "Rituals", color: C.green },
    { id: "perfectDay", label: "Perfect Day", color: C.gold },
    { id: "work", label: "Work", color: C.teal },
    { id: "penalties", label: "Penalties", color: C.red },
    { id: "rewards", label: "Rewards", color: C.accent },
    { id: "data", label: "Data", color: C.textMuted },
  ];

  const items = tab === "rituals" ? state.rituals : tab === "perfectDay" ? (state.perfectDay || []) : tab === "work" ? (state.work || []) : tab === "penalties" ? state.penalties : tab === "rewards" ? state.rewards : [];
  const valKey = tab === "penalties" ? "amount" : tab === "rewards" ? "cost" : "pts";
  const defVal = tab === "penalties" ? 1 : tab === "rewards" ? 500 : tab === "work" ? 25 : tab === "perfectDay" ? 25 : 5;

  const addItem = () => {
    if (!newName.trim()) return;
    const v = Number(newVal) || defVal;
    const item = { id: uid(), name: newName.trim(), [valKey]: v };
    if (tab === "rituals") item.period = newPeriod;
    p(s => ({ ...s, [tab]: [...(s[tab] || []), item] }));
    setNewName(""); setNewVal("");
  };

  const startEdit = (item) => { setEditingId(item.id); setEditName(item.name); setEditVal(item[valKey]); if (item.period) setEditPeriod(item.period); };

  const saveEdit = (id) => {
    p(s => ({ ...s, [tab]: (s[tab] || []).map(x => x.id === id ? { ...x, name: editName.trim() || x.name, [valKey]: Number(editVal) || x[valKey], ...(tab === "rituals" ? { period: editPeriod } : {}) } : x) }));
    setEditingId(null);
  };

  const removeItem = (id) => p(s => ({ ...s, [tab]: (s[tab] || []).filter(x => x.id !== id) }));

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT, minHeight: "100vh", padding: "16px 20px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Settings</h1>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 16px", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>← Back</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setEditingId(null); }} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", fontFamily: FONT,
            ...(tab === t.id ? { background: t.color + "18", color: t.color, borderColor: t.color + "33" } : { background: C.surface, color: C.textMuted, borderColor: C.border }),
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "data" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Export */}
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Export Data</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Download all your data as a file. Use this as a backup or to transfer to another device.</div>
            <button onClick={() => {
              const data = localStorage.getItem(APP_KEY);
              if (!data) return;
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `grind-backup-${today()}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
              style={{ padding: "8px 16px", background: C.accentBg, border: `1px solid ${C.accent}44`, borderRadius: 8, color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
              Download backup
            </button>
          </div>

          {/* Import */}
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Import Data</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Load data from a backup file. This will replace all current data.</div>
            <label style={{ display: "inline-block", padding: "8px 16px", background: C.blueBg, border: `1px solid ${C.blue}44`, borderRadius: 8, color: C.blue, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
              Choose backup file
              <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(ev.target.result);
                    if (confirm("This will replace all your current data with the backup. Continue?")) {
                      const merged = { ...defaultState, ...parsed };
                      localStorage.setItem(APP_KEY, JSON.stringify(merged));
                      location.reload();
                    }
                  } catch { alert("Invalid backup file. Please use a file exported from this app."); }
                };
                reader.readAsText(file);
              }} />
            </label>
          </div>

          {/* Reset */}
          <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Reset All Data</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Wipes everything and starts fresh. Cannot be undone — export first!</div>
            <button onClick={() => { if (confirm("Are you sure? This deletes everything. Did you export a backup first?")) { localStorage.removeItem(APP_KEY); location.reload(); } }}
              style={{ padding: "8px 16px", background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 8, color: C.red, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>
              Reset everything
            </button>
          </div>
        </div>
      ) : (
        <>
          {items.map(item => (
            editingId === item.id ? (
              <div key={item.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.borderLight}`, padding: 12, marginBottom: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(item.id)}
                  style={{ flex: 1, minWidth: 120, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: FONT, outline: "none" }} />
                {tab === "rituals" && (
                  <select value={editPeriod} onChange={e => setEditPeriod(e.target.value)}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none" }}>
                    <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
                  </select>
                )}
                <input value={editVal} onChange={e => setEditVal(e.target.value)} type="number"
                  style={{ width: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.accent, fontFamily: MONO, fontSize: 14, textAlign: "center", outline: "none" }} />
                <button onClick={() => saveEdit(item.id)} style={{ padding: "8px 14px", background: C.green, border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: "8px 10px", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMuted, fontSize: 13, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div key={item.id} style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{item.name}</span>
                  {item.period && <span style={{ fontSize: 10, color: C.textDim }}>{item.period}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: C.accent, fontFamily: MONO }}>{tab === "penalties" ? `£${item.amount}` : `${item[valKey]} pts`}</span>
                  <button onClick={() => startEdit(item)} style={btnS({ color: C.textMuted })}>{I.edit}</button>
                  <button onClick={() => removeItem(item.id)} style={btnS({ color: C.textDim })}>{I.trash}</button>
                </div>
              </div>
            )
          ))}
          <div style={{ background: C.surface, borderRadius: 12, border: `1px dashed ${C.border}`, padding: 12, marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${tab === "perfectDay" ? "perfect day item" : tab === "work" ? "work goal" : tab.slice(0, -1)} name`}
              onKeyDown={e => e.key === "Enter" && addItem()}
              style={{ flex: 1, minWidth: 120, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, fontFamily: FONT, outline: "none" }} />
            {tab === "rituals" && (
              <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13, outline: "none" }}>
                <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
              </select>
            )}
            <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={tab === "penalties" ? "£" : "pts"} type="number"
              style={{ width: 60, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.accent, fontFamily: MONO, fontSize: 14, textAlign: "center", outline: "none" }} />
            <button onClick={addItem} style={{ padding: "8px 16px", background: C.accent, border: "none", borderRadius: 8, color: C.bg, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Add</button>
          </div>
        </>
      )}

      </div>
    </div>
  );
}
