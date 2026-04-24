// src/tabs/TodayTab.jsx
//
// The main daily surface. Contains:
//   - Date nav (prev/next day)
//   - Score cards (points, penalty jar, today's score)
//   - Daily rituals (with 2x-tap and water increment mechanics)
//   - Intentions (Body/Mind/Life)
//   - Work rituals + today's todos
//   - Quick penalty add button

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
  ritualPointsForDate,
  intentionPointsForDate,
  workRitualPointsForDate,
  workTodoPointsForDate,
  totalPointsForDate,
  currentBalance,
  currentMonthPenalties,
  ritualsCompletedCount,
} from '../utils/points';

// ============================================================
// STYLE CONSTANTS — kept here for quick tweaking
// ============================================================

const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1a1a1a',
  border: '#222',
  text: '#e8e8e8',
  textDim: '#888',
  textFaint: '#555',
  accent: '#d9f66f',      // lime
  accentDim: '#8a9c42',
  danger: '#ef4444',
  warning: '#f59e0b',
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '1.25rem',
};

// ============================================================
// MAIN
// ============================================================

export default function TodayTab({ data, setData, viewDate, setViewDate }) {
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);

  const monthKey = currentMonthKey();
  const viewingPast = isPast(viewDate);
  const canLogPenalty = isToday(viewDate); // penalties only logged for today

  return (
    <div style={{
      padding: '1.5rem 2rem 6rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* Viewing past banner */}
      {viewingPast && (
        <div style={{
          background: '#2a1e0a',
          border: `1px solid ${COLORS.warning}`,
          color: COLORS.warning,
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Viewing past · {formatLong(viewDate)}</span>
          <button
            onClick={() => setViewDate(todayISO())}
            style={{
              background: COLORS.warning,
              color: '#000',
              border: 'none',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Back to today
          </button>
        </div>
      )}

      {/* Date nav */}
      <DateNav viewDate={viewDate} setViewDate={setViewDate} />

      {/* Score cards */}
      <ScoreCards data={data} viewDate={viewDate} monthKey={monthKey} />

      {/* Daily rituals */}
      <Section title="Daily Rituals" count={`${ritualsCompletedCount(data, viewDate)}/${data.rituals.length}`}>
        <RitualList data={data} setData={setData} viewDate={viewDate} />
      </Section>

      {/* Intentions */}
      <Section title="Intentions">
        <IntentionsView data={data} setData={setData} viewDate={viewDate} />
      </Section>

      {/* Work */}
      <Section title="Work">
        <WorkView data={data} setData={setData} viewDate={viewDate} />
      </Section>

      {/* Floating penalty button */}
      {canLogPenalty && (
        <button
          onClick={() => setPenaltyModalOpen(true)}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: COLORS.danger,
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.25rem',
            borderRadius: '999px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          + Log penalty
        </button>
      )}

      {/* Penalty modal */}
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
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '12px',
    }}>
      <button
        onClick={() => setViewDate(addDays(viewDate, -1))}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.textDim,
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
        }}
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
          fontFamily: 'ui-monospace, monospace',
          colorScheme: 'dark',
        }}
      />
      <button
        onClick={() => setViewDate(addDays(viewDate, 1))}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.textDim,
          fontSize: '1.25rem',
          cursor: 'pointer',
          padding: '0.25rem 0.5rem',
        }}
        aria-label="Next day"
      >
        ›
      </button>
    </div>
  );
}

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
      marginBottom: '2rem',
    }}>
      <MetricCard
        label="POINTS"
        value={balance.toLocaleString()}
        color={COLORS.accent}
      />
      <MetricCard
        label="PENALTY JAR"
        value={`£${penaltyThisMonth.toFixed(2)}`}
        color={penaltyThisMonth > 0 ? COLORS.danger : COLORS.textDim}
      />
      <MetricCard
        label={isToday(viewDate) ? 'TODAY' : 'THIS DAY'}
        value={`+${todayScore}`}
        color={COLORS.accent}
      />
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={cardStyle}>
      <div style={{
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        color: COLORS.textDim,
        marginBottom: '0.5rem',
      }}>
        {label}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// SECTION WRAPPER
// ============================================================

function Section({ title, count, children }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.75rem',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: 600,
          color: COLORS.text,
        }}>
          {title}
        </h2>
        {count && (
          <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
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
  // Determine max taps for this ritual
  let maxTaps;
  if (ritual.water) maxTaps = 4;
  else if (ritual.twice) maxTaps = 2;
  else maxTaps = 1;

  const fullyDone = taps >= maxTaps;
  const partial = taps > 0 && !fullyDone;

  // Points display
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
        padding: '0.75rem 0.75rem',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.border}`,
        cursor: 'pointer',
        gap: '0.75rem',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = COLORS.cardHover}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Checkbox state={fullyDone ? 'full' : partial ? 'partial' : 'empty'} />
      <span style={{
        flex: 1,
        textDecoration: fullyDone ? 'line-through' : 'none',
        color: fullyDone ? COLORS.textFaint : COLORS.text,
        fontSize: '0.95rem',
      }}>
        {ritual.name}
      </span>
      <span style={{
        color: fullyDone ? COLORS.textFaint : COLORS.accent,
        fontSize: '0.85rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {ptsLabel}
      </span>
    </div>
  );
}

function Checkbox({ state }) {
  const styles = {
    width: '1.25rem',
    height: '1.25rem',
    border: `2px solid ${state === 'empty' ? COLORS.textFaint : COLORS.accent}`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: state === 'full' ? COLORS.accent : state === 'partial' ? `${COLORS.accent}44` : 'transparent',
  };
  return (
    <div style={styles}>
      {state === 'full' && (
        <span style={{ color: '#000', fontSize: '0.85rem', fontWeight: 900 }}>✓</span>
      )}
      {state === 'partial' && (
        <span style={{ color: COLORS.accent, fontSize: '0.7rem', fontWeight: 900 }}>½</span>
      )}
    </div>
  );
}

// Cycle tap state: 0 → 1 → 2 → ... → max → 0
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

    // Recalculate earned: difference between new and old for this ritual
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
// INTENTIONS (Body / Mind / Life)
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

  return (
    <div style={{ ...cardStyle, padding: '1rem' }}>
      <div style={{
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        color: COLORS.textDim,
        marginBottom: '0.75rem',
      }}>
        {title.toUpperCase()}
      </div>
      {items.map(item => {
        const done = !!checks[item.id];
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
            <Checkbox state={done ? 'full' : 'empty'} />
            <span style={{
              flex: 1,
              fontSize: '0.9rem',
              textDecoration: done ? 'line-through' : 'none',
              color: done ? COLORS.textFaint : COLORS.text,
            }}>
              {item.name}
            </span>
            <span style={{
              color: done ? COLORS.textFaint : COLORS.accent,
              fontSize: '0.8rem',
              fontVariantNumeric: 'tabular-nums',
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
// WORK (rituals + today's todos)
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
      {/* Work rituals */}
      <div style={{ ...cardStyle, padding: '0.5rem', marginBottom: '1rem' }}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: COLORS.textDim,
          padding: '0.5rem 0.75rem 0.25rem',
        }}>
          DAILY HABITS
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

      {/* Today's todos */}
      <div style={{ ...cardStyle, padding: '1rem' }}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: COLORS.textDim,
          marginBottom: '0.75rem',
        }}>
          TODAY'S TASKS
        </div>

        {todos.length === 0 && (
          <div style={{
            color: COLORS.textFaint,
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
            <div onClick={() => toggleTodo(todo.id)} style={{ cursor: 'pointer' }}>
              <Checkbox state={todo.done ? 'full' : 'empty'} />
            </div>
            <span
              onClick={() => toggleTodo(todo.id)}
              style={{
                flex: 1,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? COLORS.textFaint : COLORS.text,
              }}
            >
              {todo.name}
            </span>
            <span style={{
              color: todo.done ? COLORS.textFaint : COLORS.accent,
              fontSize: '0.8rem',
              fontVariantNumeric: 'tabular-nums',
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
                fontSize: '0.9rem',
              }}
              aria-label="Delete task"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add todo */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: `1px solid ${COLORS.border}`,
        }}>
          <input
            id="new-todo"
            name="new-todo"
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Add a task…"
            style={{
              flex: 1,
              background: COLORS.bg,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.9rem',
            }}
          />
          <select
            id="todo-scale"
            name="todo-scale"
            value={newTodoScale}
            onChange={(e) => setNewTodoScale(e.target.value)}
            style={{
              background: COLORS.bg,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              padding: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <option value="quick">Quick (+10)</option>
            <option value="standard">Standard (+20)</option>
            <option value="heavy">Heavy (+35)</option>
          </select>
          <button
            onClick={addTodo}
            style={{
              background: COLORS.accent,
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
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
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h3 style={{ margin: 0, color: COLORS.text }}>Log a penalty</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.textDim,
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
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
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = COLORS.cardHover}
              onMouseLeave={(e) => e.currentTarget.style.background = COLORS.bg}
            >
              <span>{p.name}</span>
              <span style={{ color: COLORS.danger, fontWeight: 600 }}>
                £{p.amount}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}