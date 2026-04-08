import { useState, useEffect, useCallback } from "react";

const APP_KEY = "grind_app_v3";
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
  rituals: defaultRituals,
  perfectDay: defaultPerfectDay,
  ritualChecks: {},
  perfectDayChecks: {},
  penalties: defaultPenalties,
  penaltyLog: [],
  penaltyPaidMonths: [],
  rewards: defaultRewards,
  rewardLog: [],
  activeGoals: [],
  backlog: [],
  deadlines: [],
  goalLog: [],
  totalEarned: 0,
  totalSpent: 0,
};

function load() {
  try {
    const d = localStorage.getItem(APP_KEY);
    if (!d) return defaultState;
    const parsed = JSON.parse(d);
    return { ...defaultState, ...parsed };
  } catch { return defaultState; }
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
};

const C = {
  bg: "#0c0c0c", surface: "#141414", surfaceHover: "#1a1a1a", border: "#1f1f1f", borderLight: "#292929",
  text: "#e5e0da", textMuted: "#706b64", textDim: "#4a4640",
  accent: "#dea058", accentDim: "#dea05822", accentBg: "#1c1710",
  green: "#5aad5a", greenDim: "#5aad5a22", greenBg: "#121c12",
  red: "#c9504c", redDim: "#c9504c22", redBg: "#1c1212",
  blue: "#52b0cb", blueDim: "#52b0cb22", blueBg: "#101a1e",
  purple: "#a67eec", purpleDim: "#a67eec22", purpleBg: "#18121e",
  gold: "#d4af37", goldDim: "#d4af3722", goldBg: "#1c1a10",
};
const FONT = `'DM Sans', system-ui, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', monospace`;

export default function App() {
  const [state, setState] = useState(load);
  const [view, setView] = useState("main");
  const [addingGoal, setAddingGoal] = useState(false);
  const [addingBacklog, setAddingBacklog] = useState(false);
  const [addingDeadline, setAddingDeadline] = useState(false);

  const p = useCallback((fn) => setState(prev => { const n = typeof fn === "function" ? fn(prev) : fn; save(n); return n; }), []);
  const todayStr = today();
  const tc = state.ritualChecks[todayStr] || {};
  const pdc = (state.perfectDayChecks || {})[todayStr] || {};

  const ritualPtsToday = state.rituals.filter(r => tc[r.id]).reduce((s, r) => s + r.pts, 0);
  const perfectPtsToday = (state.perfectDay || []).filter(pd => pdc[pd.id]).reduce((s, pd) => s + pd.pts, 0);

  const totalRitualPts = Object.entries(state.ritualChecks).reduce((total, [, checks]) =>
    total + state.rituals.filter(r => checks[r.id]).reduce((s, r) => s + r.pts, 0), 0);
  const totalPerfectPts = Object.entries(state.perfectDayChecks || {}).reduce((total, [, checks]) =>
    total + (state.perfectDay || []).filter(pd => checks[pd.id]).reduce((s, pd) => s + pd.pts, 0), 0);

  const curMonth = todayStr.slice(0, 7);
  const monthPens = state.penaltyLog.filter(pl => pl.date.startsWith(curMonth));
  const monthPenTotal = monthPens.reduce((s, pl) => s + pl.amount, 0);
  const isPaid = state.penaltyPaidMonths.includes(curMonth);

  const balance = totalRitualPts + totalPerfectPts + state.totalEarned - state.totalSpent;

  const allPerfectDone = (state.perfectDay || []).length > 0 && (state.perfectDay || []).every(pd => pdc[pd.id]);
  const perfectDayCount = (state.perfectDay || []).filter(pd => pdc[pd.id]).length;
  const perfectDayTotal = (state.perfectDay || []).length;

  const toggleRitual = (id) => p(s => {
    const dc = { ...s.ritualChecks }; const t = { ...(dc[todayStr] || {}) }; t[id] = !t[id]; dc[todayStr] = t;
    return { ...s, ritualChecks: dc };
  });

  const togglePerfectDay = (id) => p(s => {
    const dc = { ...(s.perfectDayChecks || {}) }; const t = { ...(dc[todayStr] || {}) }; t[id] = !t[id]; dc[todayStr] = t;
    const prevAllDone = (s.perfectDay || []).every(pd => ((s.perfectDayChecks || {})[todayStr] || {})[pd.id]);
    const newAllDone = (s.perfectDay || []).every(pd => t[pd.id]);
    let bonusAdded = 0;
    if (newAllDone && !prevAllDone) bonusAdded = 100;
    return { ...s, perfectDayChecks: dc, totalEarned: s.totalEarned + bonusAdded };
  });

  const logPenalty = (pe) => p(s => ({ ...s, penaltyLog: [...s.penaltyLog, { ...pe, date: todayStr, logId: uid() }] }));

  const completeGoal = (g) => {
    const streak = getStreak(g.id, state.goalLog || []) + 1;
    const mult = streakMult(streak);
    const pts = (g.pts || 20) * mult;
    p(s => ({ ...s, goalLog: [...(s.goalLog || []), { goalId: g.id, date: todayStr }], totalEarned: s.totalEarned + pts }));
  };

  const completeBacklog = (b) => {
    const age = daysAgo(b.addedDate);
    const bonus = Math.min(age * 2, 200);
    const pts = (b.pts || 50) + bonus;
    p(s => ({ ...s, backlog: s.backlog.filter(x => x.id !== b.id), totalEarned: s.totalEarned + pts }));
  };

  const completeDeadline = (dl) => {
    const rem = daysUntil(dl.dueDate);
    const earlyBonus = rem > 0 ? Math.min(rem * 10, 100) : 0;
    const pts = (dl.pts || 50) + earlyBonus;
    p(s => ({ ...s, deadlines: s.deadlines.filter(x => x.id !== dl.id), totalEarned: s.totalEarned + pts }));
  };

  const claimReward = (rw) => {
    if (balance < rw.cost) return;
    p(s => ({ ...s, totalSpent: s.totalSpent + rw.cost, rewardLog: [...s.rewardLog, { ...rw, date: todayStr }] }));
  };

  if (view === "settings") return <Settings state={state} p={p} onBack={() => setView("main")} />;

  const allRitualsDone = state.rituals.every(r => tc[r.id]);
  const ritualProg = state.rituals.length > 0 ? state.rituals.filter(r => tc[r.id]).length / state.rituals.length : 0;
  const perfectProg = perfectDayTotal > 0 ? perfectDayCount / perfectDayTotal : 0;

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT, minHeight: "100vh", padding: "14px 14px 80px", maxWidth: 520, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" }}><span style={{ color: C.accent }}>grind</span></h1>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <button onClick={() => setView("settings")} style={btnS({ color: C.textMuted })}>{I.gear}</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Chip icon={I.star} label="Points" value={balance} color={C.accent} bg={C.accentBg} />
        <Chip icon={I.coin} label="Jar" value={`£${monthPenTotal.toFixed(2)}`} color={C.red} bg={C.redBg} />
        <Chip icon={I.flame} label="Today" value={`+${ritualPtsToday + perfectPtsToday}`} color={C.green} bg={C.greenBg} />
      </div>

      {/* DAILY RITUALS */}
      <Sec title="Daily Rituals" sub={allRitualsDone ? "All done ✓" : `${state.rituals.filter(r => tc[r.id]).length}/${state.rituals.length}`} color={C.green}>
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ height: 3, background: C.border }}><div style={{ height: "100%", width: `${ritualProg * 100}%`, background: C.green, transition: "width 0.3s", borderRadius: 3 }} /></div>
          {["morning", "afternoon", "evening"].map(per => {
            const items = state.rituals.filter(r => r.period === per);
            if (!items.length) return null;
            return (<div key={per}>
              <div style={{ padding: "7px 14px 3px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: C.textDim }}>{per}</div>
              {items.map(r => <CheckRow key={r.id} checked={!!tc[r.id]} onToggle={() => toggleRitual(r.id)} label={r.name} pts={r.pts} color={C.green} />)}
            </div>);
          })}
        </div>
      </Sec>

      {/* PERFECT DAY */}
      <Sec title="Perfect Day" sub={allPerfectDone ? "PERFECT! +100 bonus ✨" : `${perfectDayCount}/${perfectDayTotal}`} color={C.gold}>
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${allPerfectDone ? C.gold + "44" : C.border}`, overflow: "hidden", transition: "border-color 0.3s" }}>
          <div style={{ height: 3, background: C.border }}><div style={{ height: "100%", width: `${perfectProg * 100}%`, background: allPerfectDone ? C.gold : C.accent, transition: "width 0.3s, background 0.3s", borderRadius: 3 }} /></div>
          {allPerfectDone && (
            <div style={{ background: C.goldBg, borderBottom: `1px solid ${C.goldDim}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.gold, fontWeight: 600 }}>
              {I.trophy} Perfect day! +100 bonus points
            </div>
          )}
          {(state.perfectDay || []).map(pd => <CheckRow key={pd.id} checked={!!pdc[pd.id]} onToggle={() => togglePerfectDay(pd.id)} label={pd.name} pts={pd.pts} color={C.gold} />)}
        </div>
      </Sec>

      {/* PENALTY JAR */}
      <Sec title="Penalty Jar" sub={`£${monthPenTotal.toFixed(2)} this month`} color={C.red}>
        <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12 }}>
          {monthPenTotal > 0 && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redDim}`, borderRadius: 8, padding: "9px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.red, fontSize: 12, fontWeight: 600 }}>{I.warn} Running total</div>
              <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.red }}>£{monthPenTotal.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {state.penalties.map(pe => (
              <button key={pe.id} onClick={() => logPenalty(pe)} style={{
                background: C.redBg, border: `1px solid ${C.redDim}`, borderRadius: 8, padding: "7px 11px",
                color: C.text, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: FONT,
              }}>{pe.name} <span style={{ fontFamily: MONO, color: C.red, fontWeight: 600 }}>£{pe.amount}</span></button>
            ))}
          </div>
          {monthPens.length > 0 && (
            <div style={{ marginTop: 8, maxHeight: 80, overflow: "auto" }}>
              {monthPens.slice(-5).reverse().map(pe => (
                <div key={pe.logId} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted, padding: "2px 0" }}>
                  <span>{pe.name}</span><span style={{ color: C.red }}>-£{pe.amount}</span>
                </div>
              ))}
            </div>
          )}
          {monthPenTotal > 0 && !isPaid && (
            <button onClick={() => p(s => ({ ...s, penaltyPaidMonths: [...s.penaltyPaidMonths, curMonth] }))}
              style={{ width: "100%", marginTop: 8, padding: "7px 0", background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 8, color: C.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
              Mark as paid
            </button>
          )}
          {isPaid && <div style={{ textAlign: "center", fontSize: 11, color: C.green, marginTop: 6 }}>✓ Paid for {curMonth}</div>}
        </div>
      </Sec>

      {/* ACTIVE GOALS */}
      <Sec title="Active Goals" sub={`${state.activeGoals.length}/7`} color={C.accent}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {state.activeGoals.map(g => {
            const streak = getStreak(g.id, state.goalLog || []);
            const mult = streakMult(streak);
            const doneToday = (state.goalLog || []).some(e => e.goalId === g.id && e.date === todayStr);
            return (
              <div key={g.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, opacity: doneToday ? 0.45 : 1 }}>
                <CircleBtn done={doneToday} color={doneToday ? C.green : C.accent} onClick={() => !doneToday && completeGoal(g)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  {streak > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: C.accent, marginTop: 1 }}>{I.flame} {streak}d {mult > 1 && <span style={{ background: C.accentDim, padding: "0 5px", borderRadius: 3, fontWeight: 600 }}>×{mult}</span>}</div>}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.accent }}>+{(g.pts || 20) * mult}</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {state.backlog.map(b => {
            const age = daysAgo(b.addedDate); const bonus = Math.min(age * 2, 200); const total = (b.pts || 50) + bonus;
            return (
              <div key={b.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <CircleBtn color={C.purple} onClick={() => completeBacklog(b)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{age > 0 ? `${age}d in backlog` : "Today"} {bonus > 0 && <span style={{ color: C.purple }}>+{bonus} bonus</span>}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.purple }}>{total}</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {state.deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(dl => {
            const rem = daysUntil(dl.dueDate); const urgent = rem <= 3; const overdue = rem < 0;
            const earlyBonus = rem > 0 ? Math.min(rem * 10, 100) : 0;
            const bc = overdue ? C.red : urgent ? C.accent : C.blue;
            return (
              <div key={dl.id} style={{
                background: C.surface, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                border: `1px solid ${overdue ? C.red + "55" : urgent ? C.accent + "44" : C.border}`,
              }}>
                <CircleBtn color={bc} onClick={() => completeDeadline(dl)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dl.name}</div>
                  <div style={{ fontSize: 10, marginTop: 1, display: "flex", alignItems: "center", gap: 3, color: overdue ? C.red : urgent ? C.accent : C.textMuted }}>
                    {I.clock} {overdue ? `${Math.abs(rem)}d overdue` : rem === 0 ? "Due today!" : `${rem}d left`}
                    {earlyBonus > 0 && <span style={{ color: C.blue }}> +{earlyBonus} early</span>}
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, color: bc }}>{(dl.pts || 50) + earlyBonus}</span>
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

      {/* REWARDS */}
      <Sec title="Rewards" sub={`${balance} pts available`} color={C.accent}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {state.rewards.map(rw => {
            const ok = balance >= rw.cost;
            return (
              <button key={rw.id} onClick={() => ok && claimReward(rw)} style={{
                background: ok ? C.accentBg : C.surface, border: `1px solid ${ok ? C.accentDim : C.border}`,
                borderRadius: 10, padding: "9px 12px", cursor: ok ? "pointer" : "default", color: C.text,
                textAlign: "left", opacity: ok ? 1 : 0.4, display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontFamily: FONT,
              }}>
                {I.gift} {rw.name} <span style={{ fontFamily: MONO, color: C.accent, fontWeight: 600, marginLeft: "auto", paddingLeft: 8 }}>{rw.cost}</span>
              </button>
            );
          })}
        </div>
      </Sec>
    </div>
  );
}

/* ── Shared components ── */
function btnS(extra = {}) { return { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", ...extra }; }

function Chip({ icon, label, value, color, bg }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: "9px 12px", flex: 1, minWidth: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: color + "99", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{icon} {label}</div>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Sec({ title, sub, color, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 3, height: 14, background: color, borderRadius: 2, display: "inline-block" }} />{title}
        </h2>
        {sub && <span style={{ fontSize: 11, color: C.textMuted }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ checked, onToggle, label, pts, color }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${C.border}08`, opacity: checked ? 0.45 : 1, transition: "opacity 0.2s" }}>
      <div style={{
        width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? color : C.borderLight}`,
        background: checked ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0, color: "#fff",
      }}>{checked && I.check}</div>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ display: "none" }} />
      <span style={{ flex: 1, fontSize: 13, textDecoration: checked ? "line-through" : "none" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 11, color }}>{checked ? "✓" : `+${pts}`}</span>
    </label>
  );
}

function CircleBtn({ done, color, onClick }) {
  return (
    <button onClick={onClick} disabled={done} style={{
      width: 28, height: 28, borderRadius: 7, border: `2px solid ${color}`, flexShrink: 0,
      background: done ? color : "transparent", color: done ? "#fff" : color,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: done ? "default" : "pointer",
    }}>{I.check}</button>
  );
}

function DashedBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      width: "100%", padding: "9px 0", background: C.surface, border: `1px dashed ${C.border}`,
      borderRadius: 10, color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: FONT,
    }}>{I.plus} {label}</button>
  );
}

function QuickAdd({ placeholder, defPts, onAdd, onCancel }) {
  const [n, setN] = useState(""); const [pt, setPt] = useState(defPts);
  return (
    <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
      <input autoFocus value={n} onChange={e => setN(e.target.value)} placeholder={placeholder} onKeyDown={e => e.key === "Enter" && n.trim() && onAdd(n.trim(), pt)}
        style={{ flex: 1, minWidth: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none" }} />
      <input value={pt} onChange={e => setPt(Number(e.target.value) || 0)} type="number"
        style={{ width: 55, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.accent, fontFamily: MONO, fontSize: 13, textAlign: "center", outline: "none" }} />
      <button onClick={() => n.trim() && onAdd(n.trim(), pt)} style={{ padding: "7px 14px", background: C.accent, border: "none", borderRadius: 7, color: C.bg, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "7px 10px", background: "none", border: `1px solid ${C.border}`, borderRadius: 7, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>✕</button>
    </div>
  );
}

function DeadlineAdd({ onAdd, onCancel }) {
  const [n, setN] = useState(""); const [pt, setPt] = useState(50); const [d, setD] = useState("");
  return (
    <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
      <input autoFocus value={n} onChange={e => setN(e.target.value)} placeholder="Deadline name"
        style={{ flex: 1, minWidth: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none" }} />
      <input value={d} onChange={e => setD(e.target.value)} type="date"
        style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none", colorScheme: "dark" }} />
      <input value={pt} onChange={e => setPt(Number(e.target.value) || 0)} type="number"
        style={{ width: 55, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.accent, fontFamily: MONO, fontSize: 13, textAlign: "center", outline: "none" }} />
      <button onClick={() => n.trim() && d && onAdd(n.trim(), pt, d)} style={{ padding: "7px 14px", background: C.accent, border: "none", borderRadius: 7, color: C.bg, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Add</button>
      <button onClick={onCancel} style={{ padding: "7px 10px", background: "none", border: `1px solid ${C.border}`, borderRadius: 7, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>✕</button>
    </div>
  );
}

/* ── SETTINGS ── */
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
    { id: "penalties", label: "Penalties", color: C.red },
    { id: "rewards", label: "Rewards", color: C.accent },
    { id: "data", label: "Data", color: C.textMuted },
  ];

  const items = tab === "rituals" ? state.rituals : tab === "perfectDay" ? (state.perfectDay || []) : tab === "penalties" ? state.penalties : tab === "rewards" ? state.rewards : [];
  const valKey = tab === "penalties" ? "amount" : tab === "rewards" ? "cost" : "pts";
  const defVal = tab === "penalties" ? 1 : tab === "rewards" ? 500 : tab === "perfectDay" ? 25 : 5;

  const addItem = () => {
    if (!newName.trim()) return;
    const v = Number(newVal) || defVal;
    const item = { id: uid(), name: newName.trim(), [valKey]: v };
    if (tab === "rituals") item.period = newPeriod;
    p(s => ({ ...s, [tab]: [...(s[tab] || []), item] }));
    setNewName(""); setNewVal("");
  };

  const startEdit = (item) => {
    setEditingId(item.id); setEditName(item.name); setEditVal(item[valKey]);
    if (item.period) setEditPeriod(item.period);
  };

  const saveEdit = (id) => {
    p(s => ({
      ...s,
      [tab]: (s[tab] || []).map(x => x.id === id ? {
        ...x, name: editName.trim() || x.name, [valKey]: Number(editVal) || x[valKey],
        ...(tab === "rituals" ? { period: editPeriod } : {}),
      } : x),
    }));
    setEditingId(null);
  };

  const removeItem = (id) => p(s => ({ ...s, [tab]: (s[tab] || []).filter(x => x.id !== id) }));

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT, minHeight: "100vh", padding: 14, maxWidth: 520, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Settings</h1>
        <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", color: C.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>← Back</button>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setEditingId(null); }} style={{
            padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid", fontFamily: FONT,
            ...(tab === t.id ? { background: t.color + "18", color: t.color, borderColor: t.color + "33" } : { background: C.surface, color: C.textMuted, borderColor: C.border }),
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "data" ? (
        <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reset all data</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Wipes everything. Cannot be undone.</div>
          <button onClick={() => { if (confirm("Are you sure? This deletes everything.")) { localStorage.removeItem(APP_KEY); location.reload(); } }}
            style={{ padding: "7px 14px", background: C.redBg, border: `1px solid ${C.red}44`, borderRadius: 7, color: C.red, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: FONT }}>
            Reset everything
          </button>
        </div>
      ) : (
        <>
          {items.map(item => (
            editingId === item.id ? (
              <div key={item.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.borderLight}`, padding: 10, marginBottom: 5, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(item.id)}
                  style={{ flex: 1, minWidth: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none" }} />
                {tab === "rituals" && (
                  <select value={editPeriod} onChange={e => setEditPeriod(e.target.value)}
                    style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.text, fontSize: 12, outline: "none" }}>
                    <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
                  </select>
                )}
                <input value={editVal} onChange={e => setEditVal(e.target.value)} type="number"
                  style={{ width: 55, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.accent, fontFamily: MONO, fontSize: 13, textAlign: "center", outline: "none" }} />
                <button onClick={() => saveEdit(item.id)} style={{ padding: "7px 12px", background: C.green, border: "none", borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditingId(null)} style={{ padding: "7px 8px", background: "none", border: `1px solid ${C.border}`, borderRadius: 7, color: C.textMuted, fontSize: 12, cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div key={item.id} style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: "9px 12px", marginBottom: 5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{item.name}</span>
                  {item.period && <span style={{ fontSize: 10, color: C.textDim }}>{item.period}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.accent, fontFamily: MONO }}>
                    {tab === "penalties" ? `£${item.amount}` : `${item[valKey]} pts`}
                  </span>
                  <button onClick={() => startEdit(item)} style={btnS({ color: C.textMuted })}>{I.edit}</button>
                  <button onClick={() => removeItem(item.id)} style={btnS({ color: C.textDim })}>{I.trash}</button>
                </div>
              </div>
            )
          ))}

          <div style={{ background: C.surface, borderRadius: 10, border: `1px dashed ${C.border}`, padding: 10, marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`New ${tab === "perfectDay" ? "perfect day item" : tab.slice(0, -1)} name`}
              onKeyDown={e => e.key === "Enter" && addItem()}
              style={{ flex: 1, minWidth: 100, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 10px", color: C.text, fontSize: 13, fontFamily: FONT, outline: "none" }} />
            {tab === "rituals" && (
              <select value={newPeriod} onChange={e => setNewPeriod(e.target.value)}
                style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.text, fontSize: 12, outline: "none" }}>
                <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
              </select>
            )}
            <input value={newVal} onChange={e => setNewVal(e.target.value)} placeholder={tab === "penalties" ? "£" : "pts"} type="number"
              style={{ width: 55, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "7px 8px", color: C.accent, fontFamily: MONO, fontSize: 13, textAlign: "center", outline: "none" }} />
            <button onClick={addItem} style={{ padding: "7px 14px", background: C.accent, border: "none", borderRadius: 7, color: C.bg, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Add</button>
          </div>
        </>
      )}
    </div>
  );
}
