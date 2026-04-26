// src/tabs/TasksTab.jsx
//
// The Tasks tab: deadlines + backlog + commitments.
// The planning layer — longer-arc work that doesn't belong on Today.

import { useState, useEffect } from 'react';
import { todayISO, daysBetween, daysUntil, addDays } from '../utils/dates';
import { BACKLOG_AGING } from '../data/defaults';
import {
  COLORS,
  FONTS,
  cardStyle,
  inputStyle,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../utils/theme';
import { SectionHead } from '../components/ui';

// ============================================================
// MAIN
// ============================================================

export default function TasksTab({ data, setData }) {
  // On mount, check backlog items for aging penalties
  useEffect(() => {
    applyBacklogAging(data, setData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      padding: '1.5rem 2rem 4rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <DeadlinesSection data={data} setData={setData} />
      <BacklogSection data={data} setData={setData} />
      <CommitmentsSection data={data} setData={setData} />
    </div>
  );
}

// ============================================================
// BACKLOG AGING (runs on load)
// ============================================================

function applyBacklogAging(data, setData) {
  const today = todayISO();
  const { firstPenaltyDays, secondPenaltyDays, firstPenaltyAmount, secondPenaltyAmount } = BACKLOG_AGING;

  let needsUpdate = false;
  const newPenaltyEntries = [];

  const updatedBacklog = (data.backlog || []).map(item => {
    const age = daysBetween(item.addedDate, today);
    const applied = item.penaltiesApplied || [];
    const updatedApplied = [...applied];

    if (age >= firstPenaltyDays && !applied.includes('first')) {
      updatedApplied.push('first');
      newPenaltyEntries.push({
        id: `backlog_aging_${item.id}_first`,
        name: `Backlog aging: "${item.name}"`,
        amount: firstPenaltyAmount,
        date: today,
        logId: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      });
      needsUpdate = true;
    }

    if (age >= secondPenaltyDays && !applied.includes('second')) {
      updatedApplied.push('second');
      newPenaltyEntries.push({
        id: `backlog_aging_${item.id}_second`,
        name: `Backlog aging: "${item.name}"`,
        amount: secondPenaltyAmount,
        date: today,
        logId: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      });
      needsUpdate = true;
    }

    return { ...item, penaltiesApplied: updatedApplied };
  });

  if (needsUpdate) {
    setData(prev => ({
      ...prev,
      backlog: updatedBacklog,
      penaltyLog: [...prev.penaltyLog, ...newPenaltyEntries],
    }));
  }
}

// ============================================================
// DEADLINES
// ============================================================

function DeadlinesSection({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...data.deadlines].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const completeDeadline = (id) => {
    setData(prev => {
      const target = prev.deadlines.find(d => d.id === id);
      if (!target) return prev;
      return {
        ...prev,
        deadlines: prev.deadlines.filter(d => d.id !== id),
        totalEarned: (prev.totalEarned || 0) + (target.pts || 0),
      };
    });
  };

  const deleteDeadline = (id) => {
    if (!confirm('Delete this deadline without earning the points?')) return;
    setData(prev => ({
      ...prev,
      deadlines: prev.deadlines.filter(d => d.id !== id),
    }));
  };

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Deadlines"
        sub={`${data.deadlines.length} active`}
        right={
          <button onClick={() => setShowAdd(!showAdd)} style={ghostButtonStyle}>
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        }
      />

      {showAdd && (
        <AddDeadlineForm
          data={data}
          setData={setData}
          onDone={() => setShowAdd(false)}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState text="No deadlines. Sometimes peaceful, sometimes suspicious." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sorted.map(d => (
            <DeadlineCard
              key={d.id}
              deadline={d}
              onComplete={() => completeDeadline(d.id)}
              onDelete={() => deleteDeadline(d.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DeadlineCard({ deadline, onComplete, onDelete }) {
  const days = daysUntil(deadline.dueDate);
  const overdue = days < 0;
  const dueToday = days === 0;
  const urgent = days > 0 && days <= 2;

  const accentColor = overdue
    ? COLORS.red
    : dueToday || urgent
    ? COLORS.amber
    : COLORS.textMuted;

  const label = overdue
    ? `${Math.abs(days)}d overdue`
    : dueToday
    ? 'Due today'
    : days === 1
    ? 'Due tomorrow'
    : `${days}d left`;

  return (
    <div style={{
      ...cardStyle,
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      <div style={{
        minWidth: '3rem',
        textAlign: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: FONTS.display,
          fontSize: '1.75rem',
          fontWeight: 400,
          color: accentColor,
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {overdue ? Math.abs(days) : days === 0 ? '!' : days}
        </div>
        <div style={{
          fontFamily: FONTS.mono,
          fontSize: '0.65rem',
          color: COLORS.textMuted,
          marginTop: '0.3rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {overdue ? 'Days late' : dueToday ? 'Today' : 'Days'}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.95rem',
          color: COLORS.text,
          letterSpacing: '-0.005em',
        }}>
          {deadline.name}
        </div>
        <div style={{
          fontSize: '0.78rem',
          color: COLORS.textMuted,
          marginTop: '0.25rem',
          fontFamily: FONTS.mono,
        }}>
          {deadline.dueDate} · {label}
        </div>
      </div>

      <span style={{
        color: COLORS.accent,
        fontSize: '0.85rem',
        fontFamily: FONTS.mono,
      }}>
        +{deadline.pts}
      </span>

      <button
        onClick={onComplete}
        style={{
          background: COLORS.accent,
          color: COLORS.bg,
          border: 'none',
          padding: '0.4rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: FONTS.sans,
          letterSpacing: '-0.005em',
        }}
      >
        Done
      </button>
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.textFaint,
          cursor: 'pointer',
          fontSize: '1rem',
          padding: '0 0.25rem',
        }}
        aria-label="Delete deadline"
      >
        ×
      </button>
    </div>
  );
}

function AddDeadlineForm({ data, setData, onDone }) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 7));
  const [pts, setPts] = useState(30);

  const submit = () => {
    if (!name.trim()) return;
    setData(prev => ({
      ...prev,
      deadlines: [
        ...prev.deadlines,
        {
          id: `deadline_${Date.now()}`,
          name: name.trim(),
          dueDate,
          pts: Number(pts),
        },
      ],
    }));
    onDone();
  };

  return (
    <div style={{ ...cardStyle, marginBottom: '0.75rem', padding: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr auto',
        gap: '0.5rem',
      }}>
        <input
          id="deadline-name"
          name="deadline-name"
          type="text"
          placeholder="Deadline name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          id="deadline-due"
          name="deadline-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={inputStyle}
        />
        <input
          id="deadline-pts"
          name="deadline-pts"
          type="number"
          placeholder="Points"
          value={pts}
          onChange={(e) => setPts(e.target.value)}
          style={inputStyle}
        />
        <button onClick={submit} style={primaryButtonStyle}>Add</button>
      </div>
    </div>
  );
}

// ============================================================
// BACKLOG
// ============================================================

function BacklogSection({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const today = todayISO();

  const sorted = [...data.backlog].sort((a, b) =>
    a.addedDate.localeCompare(b.addedDate)
  );

  const completeItem = (id) => {
    setData(prev => {
      const target = prev.backlog.find(b => b.id === id);
      if (!target) return prev;
      return {
        ...prev,
        backlog: prev.backlog.filter(b => b.id !== id),
        totalEarned: (prev.totalEarned || 0) + (target.pts || 0),
      };
    });
  };

  const dropItem = (id) => {
    if (!confirm('Drop this from your backlog? No points, no penalty.')) return;
    setData(prev => ({
      ...prev,
      backlog: prev.backlog.filter(b => b.id !== id),
    }));
  };

  const oldestAge = sorted.length > 0 ? daysBetween(sorted[0].addedDate, today) : 0;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Backlog"
        sub={
          sorted.length > 0
            ? `${sorted.length} waiting · oldest ${oldestAge}d`
            : '0 waiting'
        }
        right={
          <button onClick={() => setShowAdd(!showAdd)} style={ghostButtonStyle}>
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        }
      />

      {showAdd && (
        <AddBacklogForm
          data={data}
          setData={setData}
          onDone={() => setShowAdd(false)}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState text="Empty backlog. Lovely." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sorted.map(item => (
            <BacklogCard
              key={item.id}
              item={item}
              onComplete={() => completeItem(item.id)}
              onDrop={() => dropItem(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function BacklogCard({ item, onComplete, onDrop }) {
  const age = daysBetween(item.addedDate, todayISO());
  const { warningDays, firstPenaltyDays, secondPenaltyDays } = BACKLOG_AGING;

  let status = 'fresh';
  let statusColor = COLORS.textMuted;
  let statusText = `${age}d`;

  if (age >= secondPenaltyDays) {
    status = 'severe';
    statusColor = COLORS.red;
    statusText = `${age}d · still here`;
  } else if (age >= firstPenaltyDays) {
    status = 'late';
    statusColor = COLORS.red;
    statusText = `${age}d waiting`;
  } else if (age >= warningDays) {
    status = 'warn';
    statusColor = COLORS.amber;
    statusText = `${age}d waiting`;
  }

  return (
    <div style={{
      ...cardStyle,
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      borderLeft: status !== 'fresh' ? `3px solid ${statusColor}` : '3px solid transparent',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.95rem',
          color: COLORS.text,
          letterSpacing: '-0.005em',
        }}>
          {item.name}
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: statusColor,
          marginTop: '0.25rem',
          fontFamily: FONTS.mono,
          letterSpacing: '0.04em',
        }}>
          {statusText}
        </div>
      </div>
      <span style={{
        color: COLORS.accent,
        fontSize: '0.85rem',
        fontFamily: FONTS.mono,
      }}>
        +{item.pts}
      </span>
      <button
        onClick={onComplete}
        style={{
          background: COLORS.accent,
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
        Done
      </button>
      <button
        onClick={onDrop}
        style={{
          background: 'transparent',
          color: COLORS.textMuted,
          border: `1px solid ${COLORS.hair}`,
          padding: '0.4rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.78rem',
          cursor: 'pointer',
          fontFamily: FONTS.sans,
        }}
      >
        Drop
      </button>
    </div>
  );
}

function AddBacklogForm({ data, setData, onDone }) {
  const [name, setName] = useState('');
  const [pts, setPts] = useState(30);

  const submit = () => {
    if (!name.trim()) return;
    setData(prev => ({
      ...prev,
      backlog: [
        ...prev.backlog,
        {
          id: `backlog_${Date.now()}`,
          name: name.trim(),
          pts: Number(pts),
          addedDate: todayISO(),
          penaltiesApplied: [],
        },
      ],
    }));
    onDone();
  };

  return (
    <div style={{ ...cardStyle, marginBottom: '0.75rem', padding: '1rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 1fr auto',
        gap: '0.5rem',
      }}>
        <input
          id="backlog-name"
          name="backlog-name"
          type="text"
          placeholder="Task name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          id="backlog-pts"
          name="backlog-pts"
          type="number"
          placeholder="Points"
          value={pts}
          onChange={(e) => setPts(e.target.value)}
          style={inputStyle}
        />
        <button onClick={submit} style={primaryButtonStyle}>Add</button>
      </div>
    </div>
  );
}

// ============================================================
// COMMITMENTS
// ============================================================

function CommitmentsSection({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const commitments = data.commitments || [];

  const deleteCommitment = (id) => {
    if (!confirm('Drop this commitment?')) return;
    setData(prev => ({
      ...prev,
      commitments: prev.commitments.filter(c => c.id !== id),
    }));
  };

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHead
        title="Commitments"
        sub={`${commitments.length} this quarter`}
        right={
          commitments.length < 3 ? (
            <button onClick={() => setShowAdd(!showAdd)} style={ghostButtonStyle}>
              {showAdd ? 'Cancel' : '+ Add'}
            </button>
          ) : null
        }
      />

      {commitments.length >= 3 && !showAdd && (
        <div style={{
          fontSize: '0.8rem',
          color: COLORS.textMuted,
          fontStyle: 'italic',
          marginBottom: '0.75rem',
          fontFamily: FONTS.sans,
        }}>
          Cap is 3 — drop one before adding another.
        </div>
      )}

      {showAdd && (
        <AddCommitmentForm
          data={data}
          setData={setData}
          onDone={() => setShowAdd(false)}
        />
      )}

      {commitments.length === 0 ? (
        <EmptyState text="No commitments set. What are you actually betting on this quarter?" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {commitments.map(c => (
            <div
              key={c.id}
              style={{
                ...cardStyle,
                borderLeft: `3px solid ${COLORS.magenta}`,
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: FONTS.display,
                  fontSize: '1.1rem',
                  fontWeight: 400,
                  color: COLORS.text,
                  marginBottom: '0.3rem',
                  letterSpacing: '-0.015em',
                }}>
                  {c.name}
                </div>
                {c.why && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: COLORS.textMuted,
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}>
                    {c.why}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteCommitment(c.id)}
                style={{
                  background: 'transparent',
                  color: COLORS.textMuted,
                  border: `1px solid ${COLORS.hair}`,
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontFamily: FONTS.sans,
                }}
              >
                Drop
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddCommitmentForm({ data, setData, onDone }) {
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    setData(prev => ({
      ...prev,
      commitments: [
        ...prev.commitments,
        {
          id: `commit_${Date.now()}`,
          name: name.trim(),
          why: why.trim(),
        },
      ],
    }));
    onDone();
  };

  return (
    <div style={{ ...cardStyle, marginBottom: '0.75rem' }}>
      <input
        id="commit-name"
        name="commit-name"
        type="text"
        placeholder="Commitment name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: '0.5rem' }}
      />
      <input
        id="commit-why"
        name="commit-why"
        type="text"
        placeholder="Why this matters (1 line)"
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        style={{ ...inputStyle, width: '100%', marginBottom: '0.5rem' }}
      />
      <button onClick={submit} style={primaryButtonStyle}>Add commitment</button>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================

function EmptyState({ text }) {
  return (
    <div style={{
      ...cardStyle,
      color: COLORS.textMuted,
      fontSize: '0.9rem',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '2rem',
      fontFamily: FONTS.sans,
    }}>
      {text}
    </div>
  );
}
