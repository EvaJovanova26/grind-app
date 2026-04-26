// src/tabs/TodayTab.jsx
//
// The main daily surface.

import { useState } from 'react';
import {
  todayISO,
  formatLong,
  addDays,
  isToday,
  isPast,
  currentMonthKey,
} from '../utils/dates';
import {
  totalPointsForDate,
  currentBalance,
  currentMonthPenalties,
  ritualsCompletedCount,
  intentionsCompletedCount,
} from '../utils/points';
import {
  COLORS,
  FONTS,
  cardStyle,
  inputStyle,
  primaryButtonStyle,
} from '../utils/theme';
import {
  Check,
  MetricCard,
  SectionHead,
  WidgetLabel,
  PerfectDayRing,
} from '../components/ui';

// Saturday = 6, Sunday = 0
function isWeekend(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

// ============================================================
// MAIN
// ============================================================

export default function TodayTab({ data, setData, viewDate, setViewDate }) {
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);

  const monthKey = currentMonthKey();
  const viewingPast = isPast(viewDate);
  const canLogPenalty = isToday(viewDate);
  const weekend = isWeekend(viewDate);

  // Today's cumulative points across ALL sources (incl. weekly/monthly rhythms ticked today)
  const todayPoints = totalPointsForDate(data, viewDate);

  // ── Criterion 1: Rituals (≥75% of daily rituals fully done) ──
  const ritualsDone = ritualsCompletedCount(data, viewDate);
  const ritualsTotal = data.rituals.length;
  const ritualPct = ritualsTotal > 0 ? ritualsDone / ritualsTotal : 0;
  const ritualsMet = ritualPct >= 0.75;

  // ── Criterion 2: Intentions (≥3 ticked across all 3 categories) ──
  const intentionsDone = intentionsCompletedCount(data, viewDate);
  const intentionsTotal =
    data.intentions.body.length +
    data.intentions.mind.length +
    data.intentions.life.length;
  const intentionsMet = intentionsDone >= 3;

  // ── Criterion 3: Work + tasks (weekday) / Tasks only (weekend) ──
  const workRitualChecks = data.workRitualChecks[viewDate] || {};
  const workRitualsDone = data.workRituals.filter(wr => {
    const taps = workRitualChecks[wr.id] || 0;
    const maxTaps = wr.twice ? 2 : 1;
    return taps >= maxTaps;
  }).length;
  const workRitualsTotal = data.workRituals.length;
  const todaysTodos = data.workTodos[viewDate] || [];
  const todosDone = todaysTodos.filter(t => t.done).length;
  const todosTotal = todaysTodos.length;

  let workMet, workLabel, workDetail;
  if (weekend) {
    workMet = todosTotal > 0 && todosDone === todosTotal;
    workLabel = 'All daily tasks';
    workDetail = `${todosDone}/${todosTotal}`;
  } else {
    const allWorkRituals = workRitualsDone === workRitualsTotal && workRitualsTotal > 0;
    const allTodos = todosTotal === 0 || todosDone === todosTotal;
    workMet = allWorkRituals && allTodos;
    workLabel = 'All work + tasks';
    workDetail = `${workRitualsDone + todosDone}/${workRitualsTotal + todosTotal}`;
  }

  const perfectDayCriteria = [
    { label: 'Rituals (75%+)', met: ritualsMet, detail: `${ritualsDone}/${ritualsTotal}` },
    { label: 'Intentions (3+)', met: intentionsMet, detail: `${intentionsDone}` },
    { label: workLabel, met: workMet, detail: workDetail },
  ];

  // Perfect Day = all 3 criteria met AND points ≥ 250
  const isPerfect = ritualsMet && intentionsMet && workMet && todayPoints >= 250;

  return (
    <div style={{
      padding: '1.5rem 2rem 6rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {viewingPast && (
        <div style={{
          background: COLORS.amber + '14',
          border: `1px solid ${COLORS.amber}55`,
          color: COLORS.amber,
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: FONTS.sans,
        }}>
          <span>Viewing past · {formatLong(viewDate)}</span>
          <button
            onClick={() => setViewDate(todayISO())}
            style={{
              background: COLORS.amber,
              color: COLORS.bg,
              border: 'none',
              padding: '0.4rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
            }}
          >
            Back to today
          </button>
        </div>
      )}

      <DateNav viewDate={viewDate} setViewDate={setViewDate} />

      <ScoreCards data={data} viewDate={viewDate} monthKey={monthKey} />

      <div style={{ marginBottom: '2rem' }}>
        <PerfectDayRing
          points={todayPoints}
          threshold={250}
          criteria={perfectDayCriteria}
          isPerfect={isPerfect}
        />
      </div>

      <Section
        title="Daily Rituals"
        sub={`${ritualsDone}/${ritualsTotal}`}
        accent={ritualsDone === ritualsTotal && ritualsTotal > 0 ? COLORS.accent : null}
      >
        <RitualList data={data} setData={setData} viewDate={viewDate} />
      </Section>

      <Section title="Intentions" sub={`${intentionsDone}/${intentionsTotal}`}>
        <IntentionsView data={data} setData={setData} viewDate={viewDate} />
      </Section>

      <Section title="Work">
        <WorkView data={data} setData={setData} viewDate={viewDate} />
      </Section>

      {canLogPenalty && (
        <button
          onClick={() => setPenaltyModalOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: COLORS.red,
            color: COLORS.text,
            border: 'none',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 8px 24px rgba(255, 107, 107, 0.35)`,
            fontFamily: FONTS.sans,
            letterSpacing: '-0.01em',
            zIndex: 50,
          }}
        >
          + Log penalty
        </button>
      )}

      {penaltyModalOpen && (
        <PenaltyModal
          data={data}
          setData={setData}
          onClose={() => setPenaltyModalOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// SECTION WRAPPER
// ============================================================

function Section({ title, sub, accent, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead title={title} sub={sub} accent={accent} />
      {children}
    </section>
  );
}

// ============================================================
// DATE NAV
// ============================================================

function DateNav({ viewDate, setViewDate }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1.5rem',
      padding: '0.75rem 1rem',
      ...cardStyle,
      borderRadius: '14px',
    }}>
      <button
        onClick={() => setViewDate(addDays(viewDate, -1))}
        style={navBtnStyle}
        aria-label="Previous day"
      >
        ‹
      </button>
      <input
        type="date"
        id="view-date"
        name="view-date"
        value={viewDate}
        onChange={(e) => setViewDate(e.target.value)}
        style={{
          background: 'transparent',
          color: COLORS.text,
          border: 'none',
          fontSize: '1rem',
          fontFamily: FONTS.mono,
          colorScheme: 'dark',
          outline: 'none',
        }}
      />
      <button
        onClick={() => setViewDate(addDays(viewDate, 1))}
        style={navBtnStyle}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}

const navBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: COLORS.textMuted,
  fontSize: '1.25rem',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem',
  fontFamily: FONTS.sans,
};

// ============================================================
// SCORE CARDS
// ============================================================

function ScoreCards({ data, viewDate, monthKey }) {
  const todayScore = totalPointsForDate(data, viewDate);
  const balance = currentBalance(data);
  const penaltyThisMonth = currentMonthPenalties(data, monthKey);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '1rem',
      marginBottom: '1.5rem',
    }}>
      <MetricCard
        label="Points"
        value={balance.toLocaleString()}
        caption="Available to spend"
      />
      <MetricCard
        label="Penalty Jar"
        value={`£${penaltyThisMonth.toFixed(2)}`}
        color={penaltyThisMonth > 0 ? COLORS.red : COLORS.text}
        caption={monthKey}
      />
      <MetricCard
        label={isToday(viewDate) ? 'Today' : 'This day'}
        value={`+${todayScore}`}
        color={COLORS.accent}
        caption={todayScore > 0 ? 'Earned so far' : 'Nothing yet'}
      />
    </div>
  );
}

// ============================================================
// RITUAL LIST
// ============================================================

function RitualList({ data, setData, viewDate }) {
  return (
    <div style={{ ...cardStyle, padding: '0.5rem' }}>
      {data.rituals.map((ritual, idx) => (
        <RitualRow
          key={ritual.id}
          ritual={ritual}
          taps={(data.ritualChecks[viewDate] || {})[ritual.id] || 0}
          onTap={() => cycleRitualTap(data, setData, viewDate, ritual)}
          isLast={idx === data.rituals.length - 1}
        />
      ))}
    </div>
  );
}

function RitualRow({ ritual, taps, onTap, isLast }) {
  let maxTaps;
  if (ritual.water) maxTaps = 4;
  else if (ritual.twice) maxTaps = 2;
  else maxTaps = 1;

  const fullyDone = taps >= maxTaps;
  const partial = taps > 0 && !fullyDone;

  let ptsLabel;
  if (ritual.water) {
    ptsLabel = `${taps * 500}ml / 2L · +${taps * 2}`;
  } else if (ritual.twice) {
    ptsLabel = taps === 2 ? `+${ritual.pts}` : taps === 1 ? `+${ritual.pts / 2} (½)` : `+${ritual.pts}`;
  } else {
    ptsLabel = `+${ritual.pts}`;
  }

  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.7rem 0.75rem',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.hair}`,
        cursor: 'pointer',
        gap: '0.85rem',
        transition: 'background 0.1s',
        borderRadius: '8px',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = COLORS.surfaceHover}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Check
        state={fullyDone ? 'full' : partial ? 'partial' : 'empty'}
        onClick={(e) => { e.stopPropagation(); onTap(); }}
      />
      <span style={{
        flex: 1,
        textDecorationLine: fullyDone ? 'line-through' : 'none',
        textDecorationColor: COLORS.textDim,
        color: fullyDone ? COLORS.textMuted : COLORS.text,
        fontSize: '0.95rem',
        letterSpacing: '-0.005em',
      }}>
        {ritual.name}
      </span>
      <span style={{
        color: fullyDone ? COLORS.textDim : COLORS.accent,
        fontSize: '0.8rem',
        fontFamily: FONTS.mono,
      }}>
        {ptsLabel}
      </span>
    </div>
  );
}

function cycleRitualTap(data, setData, viewDate, ritual) {
  let maxTaps;
  if (ritual.water) maxTaps = 4;
  else if (ritual.twice) maxTaps = 2;
  else maxTaps = 1;

  setData(prev => {
    const checks = { ...(prev.ritualChecks[viewDate] || {}) };
    const current = checks[ritual.id] || 0;
    const next = current >= maxTaps ? 0 : current + 1;

    if (next === 0) {
      delete checks[ritual.id];
    } else {
      checks[ritual.id] = next;
    }

    let ptsDelta = 0;
    if (ritual.water) {
      ptsDelta = (next - current) * 2;
    } else if (ritual.twice) {
      ptsDelta = ((next - current) * ritual.pts) / 2;
    } else {
      ptsDelta = (next > 0 ? ritual.pts : 0) - (current > 0 ? ritual.pts : 0);
    }

    return {
      ...prev,
      ritualChecks: { ...prev.ritualChecks, [viewDate]: checks },
      totalEarned: Math.round((prev.totalEarned || 0) + ptsDelta),
    };
  });
}

// ============================================================
// INTENTIONS
// ============================================================

function IntentionsView({ data, setData, viewDate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1rem',
    }}>
      <IntentionColumn
        title="Body"
        items={data.intentions.body}
        data={data}
        setData={setData}
        viewDate={viewDate}
      />
      <IntentionColumn
        title="Mind"
        items={data.intentions.mind}
        data={data}
        setData={setData}
        viewDate={viewDate}
      />
      <IntentionColumn
        title="Life"
        items={data.intentions.life}
        data={data}
        setData={setData}
        viewDate={viewDate}
      />
    </div>
  );
}

function IntentionColumn({ title, items, data, setData, viewDate }) {
  const checks = data.intentionChecks[viewDate] || {};
  const done = items.filter(i => checks[i.id]).length;

  return (
    <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.85rem',
      }}>
        <WidgetLabel>{title}</WidgetLabel>
        <span style={{
          fontFamily: FONTS.mono,
          fontSize: '0.7rem',
          color: done === items.length && items.length > 0 ? COLORS.accent : COLORS.textDim,
        }}>
          {done}/{items.length}
        </span>
      </div>
      {items.map(item => {
        const isDone = !!checks[item.id];
        return (
          <div
            key={item.id}
            onClick={() => toggleIntention(data, setData, viewDate, item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
              cursor: 'pointer',
            }}
          >
            <Check
              state={isDone ? 'full' : 'empty'}
              onClick={(e) => {
                e.stopPropagation();
                toggleIntention(data, setData, viewDate, item);
              }}
              size={16}
            />
            <span style={{
              flex: 1,
              fontSize: '0.9rem',
              textDecorationLine: isDone ? 'line-through' : 'none',
              textDecorationColor: COLORS.textDim,
              color: isDone ? COLORS.textMuted : COLORS.text,
              letterSpacing: '-0.005em',
            }}>
              {item.name}
            </span>
            <span style={{
              color: isDone ? COLORS.textDim : COLORS.accent,
              fontSize: '0.75rem',
              fontFamily: FONTS.mono,
            }}>
              +{item.pts}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function toggleIntention(data, setData, viewDate, item) {
  setData(prev => {
    const checks = { ...(prev.intentionChecks[viewDate] || {}) };
    const wasChecked = !!checks[item.id];

    if (wasChecked) {
      delete checks[item.id];
    } else {
      checks[item.id] = true;
    }

    const ptsDelta = wasChecked ? -item.pts : item.pts;

    return {
      ...prev,
      intentionChecks: { ...prev.intentionChecks, [viewDate]: checks },
      totalEarned: (prev.totalEarned || 0) + ptsDelta,
    };
  });
}

// ============================================================
// WORK
// ============================================================

function WorkView({ data, setData, viewDate }) {
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoScale, setNewTodoScale] = useState('standard');
  const todos = data.workTodos[viewDate] || [];

  const scalePts = { quick: 10, standard: 20, heavy: 35 };

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const todo = {
      id: `todo_${Date.now()}`,
      name: newTodoText.trim(),
      pts: scalePts[newTodoScale],
      done: false,
    };
    setData(prev => ({
      ...prev,
      workTodos: {
        ...prev.workTodos,
        [viewDate]: [...(prev.workTodos[viewDate] || []), todo],
      },
    }));
    setNewTodoText('');
    setNewTodoScale('standard');
  };

  const toggleTodo = (todoId) => {
    setData(prev => {
      const list = (prev.workTodos[viewDate] || []).map(t => {
        if (t.id !== todoId) return t;
        return { ...t, done: !t.done };
      });
      const target = list.find(t => t.id === todoId);
      const originalTarget = (prev.workTodos[viewDate] || []).find(t => t.id === todoId);
      const wasDone = originalTarget?.done;
      const nowDone = target?.done;
      const ptsDelta = (nowDone ? target.pts : 0) - (wasDone ? target.pts : 0);
      return {
        ...prev,
        workTodos: { ...prev.workTodos, [viewDate]: list },
        totalEarned: (prev.totalEarned || 0) + ptsDelta,
      };
    });
  };

  const deleteTodo = (todoId) => {
    setData(prev => {
      const originalTarget = (prev.workTodos[viewDate] || []).find(t => t.id === todoId);
      const list = (prev.workTodos[viewDate] || []).filter(t => t.id !== todoId);
      const ptsDelta = originalTarget?.done ? -originalTarget.pts : 0;
      return {
        ...prev,
        workTodos: { ...prev.workTodos, [viewDate]: list },
        totalEarned: (prev.totalEarned || 0) + ptsDelta,
      };
    });
  };

  return (
    <div>
      <div style={{ ...cardStyle, padding: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.5rem 0.75rem 0.4rem' }}>
          <WidgetLabel>Daily habits</WidgetLabel>
        </div>
        {data.workRituals.map((wr, idx) => (
          <RitualRow
            key={wr.id}
            ritual={wr}
            taps={(data.workRitualChecks[viewDate] || {})[wr.id] || 0}
            onTap={() => cycleWorkRitualTap(data, setData, viewDate, wr)}
            isLast={idx === data.workRituals.length - 1}
          />
        ))}
      </div>

      <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <WidgetLabel>Today's tasks</WidgetLabel>
        </div>

        {todos.length === 0 && (
          <div style={{
            color: COLORS.textDim,
            fontSize: '0.85rem',
            fontStyle: 'italic',
            padding: '0.5rem 0',
          }}>
            No tasks yet. Add one below.
          </div>
        )}

        {todos.map(todo => (
          <div
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0',
            }}
          >
            <Check
              state={todo.done ? 'full' : 'empty'}
              onClick={() => toggleTodo(todo.id)}
              size={16}
            />
            <span
              onClick={() => toggleTodo(todo.id)}
              style={{
                flex: 1,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecorationLine: todo.done ? 'line-through' : 'none',
                textDecorationColor: COLORS.textDim,
                color: todo.done ? COLORS.textMuted : COLORS.text,
                letterSpacing: '-0.005em',
              }}
            >
              {todo.name}
            </span>
            <span style={{
              color: todo.done ? COLORS.textDim : COLORS.accent,
              fontSize: '0.75rem',
              fontFamily: FONTS.mono,
            }}>
              +{todo.pts}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.textFaint,
                cursor: 'pointer',
                fontSize: '0.95rem',
                padding: '0 0.25rem',
              }}
              aria-label="Delete task"
            >
              ×
            </button>
          </div>
        ))}

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${COLORS.hair}`,
          flexWrap: 'wrap',
        }}>
          <input
            id="new-todo"
            name="new-todo"
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a task…"
            style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
          />
          <select
            id="todo-scale"
            name="todo-scale"
            value={newTodoScale}
            onChange={(e) => setNewTodoScale(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <option value="quick">Quick (+10)</option>
            <option value="standard">Standard (+20)</option>
            <option value="heavy">Heavy (+35)</option>
          </select>
          <button onClick={addTodo} style={primaryButtonStyle}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function cycleWorkRitualTap(data, setData, viewDate, wr) {
  const maxTaps = wr.twice ? 2 : 1;

  setData(prev => {
    const checks = { ...(prev.workRitualChecks[viewDate] || {}) };
    const current = checks[wr.id] || 0;
    const next = current >= maxTaps ? 0 : current + 1;

    if (next === 0) {
      delete checks[wr.id];
    } else {
      checks[wr.id] = next;
    }

    let ptsDelta;
    if (wr.twice) {
      ptsDelta = ((next - current) * wr.pts) / 2;
    } else {
      ptsDelta = (next > 0 ? wr.pts : 0) - (current > 0 ? wr.pts : 0);
    }

    return {
      ...prev,
      workRitualChecks: { ...prev.workRitualChecks, [viewDate]: checks },
      totalEarned: Math.round((prev.totalEarned || 0) + ptsDelta),
    };
  });
}

// ============================================================
// PENALTY MODAL
// ============================================================

function PenaltyModal({ data, setData, onClose }) {
  const logPenalty = (penalty) => {
    setData(prev => ({
      ...prev,
      penaltyLog: [
        ...prev.penaltyLog,
        {
          id: penalty.id,
          name: penalty.name,
          amount: penalty.amount,
          date: todayISO(),
          logId: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        },
      ],
    }));
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.hair}`,
          borderRadius: 16,
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          fontFamily: FONTS.sans,
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h3 style={{
            margin: 0,
            color: COLORS.text,
            fontFamily: FONTS.display,
            fontSize: '1.4rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}>
            Log a penalty
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.penalties.map(p => (
            <button
              key={p.id}
              onClick={() => logPenalty(p)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: COLORS.bg,
                color: COLORS.text,
                border: `1px solid ${COLORS.hair}`,
                borderRadius: 10,
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: FONTS.sans,
                transition: 'background 0.1s, border-color 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.surfaceHover;
                e.currentTarget.style.borderColor = COLORS.hairBright;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.bg;
                e.currentTarget.style.borderColor = COLORS.hair;
              }}
            >
              <span>{p.name}</span>
              <span style={{
                color: COLORS.red,
                fontWeight: 600,
                fontFamily: FONTS.mono,
              }}>
                £{p.amount}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
