// src/tabs/TasksTab.jsx
//
// The Tasks tab: deadlines + backlog + commitments.
// The planning layer — longer-arc work that doesn't belong on Today.

import { useState, useEffect } from 'react';
import { todayISO, daysBetween, daysUntil, addDays } from '../utils/dates';
import { BACKLOG_AGING } from '../data/defaults';

const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1a1a1a',
  border: '#222',
  text: '#e8e8e8',
  textDim: '#888',
  textFaint: '#555',
  accent: '#d9f66f',
  danger: '#ef4444',
  warning: '#f59e0b',
  purple: '#a78bfa',
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
//
// For each backlog item, check how many days it's been sitting.
// Apply penalties at 14d and 21d thresholds, but only once each
// (tracked via penaltiesApplied array on the item).

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

  // Sort by due date ascending
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
      <SectionHeader
        title="Deadlines"
        count={`${data.deadlines.length} active`}
        action={
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={addButtonStyle}
          >
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

  const accentColor = overdue ? COLORS.danger : dueToday || urgent ? COLORS.warning : COLORS.textDim;
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
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accentColor, lineHeight: 1 }}>
          {overdue ? Math.abs(days) : days === 0 ? '!' : days}
        </div>
        <div style={{ fontSize: '0.7rem', color: COLORS.textFaint, marginTop: '0.2rem' }}>
          {overdue ? 'DAYS LATE' : dueToday ? 'TODAY' : 'DAYS'}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.95rem', color: COLORS.text }}>
          {deadline.name}
        </div>
        <div style={{ fontSize: '0.8rem', color: COLORS.textFaint, marginTop: '0.2rem' }}>
          {deadline.dueDate} · {label}
        </div>
      </div>

      <span style={{
        color: COLORS.accent,
        fontSize: '0.9rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        +{deadline.pts}
      </span>

      <button
        onClick={onComplete}
        style={{
          background: COLORS.accent,
          color: '#000',
          border: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem' }}>
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

  // Sort by age (oldest first)
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

  // Find oldest age
  const oldestAge = sorted.length > 0 ? daysBetween(sorted[0].addedDate, today) : 0;

  return (
    <section style={{ marginBottom: '2rem' }}>
      <SectionHeader
        title="Backlog"
        count={
          sorted.length > 0
            ? `${sorted.length} waiting · oldest ${oldestAge}d`
            : '0 waiting'
        }
        action={
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={addButtonStyle}
          >
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
  let statusColor = COLORS.textFaint;
  let statusText = `${age}d`;

  if (age >= secondPenaltyDays) {
    status = 'severe';
    statusColor = COLORS.danger;
    statusText = `${age}d · still here`;
  } else if (age >= firstPenaltyDays) {
    status = 'late';
    statusColor = COLORS.danger;
    statusText = `${age}d waiting`;
  } else if (age >= warningDays) {
    status = 'warn';
    statusColor = COLORS.warning;
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
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.95rem', color: COLORS.text }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: statusColor, marginTop: '0.2rem' }}>
          {statusText}
        </div>
      </div>
      <span style={{
        color: COLORS.accent,
        fontSize: '0.9rem',
        fontVariantNumeric: 'tabular-nums',
      }}>
        +{item.pts}
      </span>
      <button
        onClick={onComplete}
        style={{
          background: COLORS.accent,
          color: '#000',
          border: 'none',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Done
      </button>
      <button
        onClick={onDrop}
        style={{
          background: 'transparent',
          color: COLORS.textFaint,
          border: `1px solid ${COLORS.border}`,
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          cursor: 'pointer',
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
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '0.5rem' }}>
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
      <SectionHeader
        title="Commitments"
        count={`${commitments.length} this quarter`}
        action={
          commitments.length < 3 && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              style={addButtonStyle}
            >
              {showAdd ? 'Cancel' : '+ Add'}
            </button>
          )
        }
      />

      {commitments.length >= 3 && !showAdd && (
        <div style={{
          fontSize: '0.8rem',
          color: COLORS.textFaint,
          fontStyle: 'italic',
          marginBottom: '0.75rem',
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
                borderLeft: `3px solid ${COLORS.purple}`,
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: COLORS.text,
                  marginBottom: '0.3rem',
                }}>
                  {c.name}
                </div>
                {c.why && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: COLORS.textDim,
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
                  color: COLORS.textFaint,
                  border: `1px solid ${COLORS.border}`,
                  padding: '0.3rem 0.7rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
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
// SHARED BITS
// ============================================================

function SectionHeader({ title, count, action }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '0.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: COLORS.text }}>
          {title}
        </h2>
        {count && (
          <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{
      ...cardStyle,
      color: COLORS.textFaint,
      fontSize: '0.9rem',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '2rem',
    }}>
      {text}
    </div>
  );
}

const inputStyle = {
  background: COLORS.bg,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '0.5rem 0.75rem',
  fontSize: '0.9rem',
};

const addButtonStyle = {
  background: 'transparent',
  color: COLORS.accent,
  border: `1px solid ${COLORS.border}`,
  padding: '0.35rem 0.85rem',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
};

const primaryButtonStyle = {
  background: COLORS.accent,
  color: '#000',
  border: 'none',
  borderRadius: '6px',
  padding: '0.5rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
};