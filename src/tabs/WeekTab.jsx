// src/tabs/WeekTab.jsx
//
// The Week tab: weekly + monthly rhythms.
// Tracks medium-cadence behaviors that don't belong on a daily list.

import { useState } from 'react';
import {
  todayISO,
  formatLong,
  startOfWeek,
  currentMonthKey,
  daysBetween,
  addDays,
} from '../utils/dates';

const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1a1a1a',
  border: '#222',
  text: '#e8e8e8',
  textDim: '#888',
  textFaint: '#555',
  accent: '#d9f66f',
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

export default function WeekTab({ data, setData }) {
  const weekKey = startOfWeek(todayISO());
  const monthKey = currentMonthKey();

  return (
    <div style={{
      padding: '1.5rem 2rem 4rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <WeekSummary data={data} weekKey={weekKey} monthKey={monthKey} />

      <WeeklySection data={data} setData={setData} weekKey={weekKey} />

      <MonthlySection data={data} setData={setData} monthKey={monthKey} />

      <CloseWeekButton data={data} setData={setData} weekKey={weekKey} />
    </div>
  );
}

// ============================================================
// TOP SUMMARY
// ============================================================

function WeekSummary({ data, weekKey, monthKey }) {
  const weeklyChecks = data.weeklyChecks[weekKey] || {};
  const monthlyChecks = data.monthlyChecks[monthKey] || {};

  const weeklyDone = Object.values(weeklyChecks).filter(Boolean).length;
  const weeklyTotal = data.weeklyRhythms.length;

  const monthlyDone = Object.values(monthlyChecks).filter(Boolean).length;
  const monthlyTotal = data.monthlyRhythms.length;

  const weekEnd = addDays(weekKey, 6);
  const daysLeftInWeek = daysBetween(todayISO(), weekEnd);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginBottom: '2rem',
    }}>
      <div style={cardStyle}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: COLORS.textDim,
          marginBottom: '0.5rem',
        }}>
          THIS WEEK
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: COLORS.accent }}>
          {weeklyDone} / {weeklyTotal}
        </div>
        <div style={{ fontSize: '0.8rem', color: COLORS.textFaint, marginTop: '0.25rem' }}>
          {daysLeftInWeek >= 0 ? `${daysLeftInWeek + 1} days left` : 'Week ended'}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{
          fontSize: '0.7rem',
          letterSpacing: '0.1em',
          color: COLORS.textDim,
          marginBottom: '0.5rem',
        }}>
          THIS MONTH
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: COLORS.accent }}>
          {monthlyDone} / {monthlyTotal}
        </div>
        <div style={{ fontSize: '0.8rem', color: COLORS.textFaint, marginTop: '0.25rem' }}>
          {monthKey}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WEEKLY RHYTHMS
// ============================================================

function WeeklySection({ data, setData, weekKey }) {
  const checks = data.weeklyChecks[weekKey] || {};

  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.75rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: COLORS.text }}>
          Weekly Rhythms
        </h2>
        <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>
          Resets Monday
        </span>
      </div>

      <div style={{ ...cardStyle, padding: '0.5rem' }}>
        {data.weeklyRhythms.map((r, idx) => (
          <RhythmRow
            key={r.id}
            rhythm={r}
            done={!!checks[r.id]}
            carried={isCarriedOver(data, r.id, weekKey)}
            onToggle={() => toggleWeekly(data, setData, weekKey, r)}
            isLast={idx === data.weeklyRhythms.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function toggleWeekly(data, setData, weekKey, rhythm) {
  setData(prev => {
    const checks = { ...(prev.weeklyChecks[weekKey] || {}) };
    const was = !!checks[rhythm.id];

    if (was) {
      delete checks[rhythm.id];
    } else {
      checks[rhythm.id] = true;
    }

    const ptsDelta = was ? -rhythm.pts : rhythm.pts;

    return {
      ...prev,
      weeklyChecks: { ...prev.weeklyChecks, [weekKey]: checks },
      totalEarned: (prev.totalEarned || 0) + ptsDelta,
    };
  });
}

// Look backwards through past weeks. If the rhythm was unchecked in a
// prior week AND hasn't been checked yet this week, it's "carried over".
// We only look back 3 weeks to keep things reasonable.
function isCarriedOver(data, rhythmId, currentWeekKey) {
  const currentChecks = data.weeklyChecks[currentWeekKey] || {};
  if (currentChecks[rhythmId]) return false; // already done this week

  for (let i = 1; i <= 3; i++) {
    const pastWeekKey = addDays(currentWeekKey, -7 * i);
    const pastChecks = data.weeklyChecks[pastWeekKey];
    // Only consider it "carried" if there's any data for that past week AND the item was unchecked
    if (pastChecks && !pastChecks[rhythmId]) return true;
  }
  return false;
}

// ============================================================
// MONTHLY RHYTHMS
// ============================================================

function MonthlySection({ data, setData, monthKey }) {
  const checks = data.monthlyChecks[monthKey] || {};

  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.75rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: COLORS.text }}>
          Monthly Rhythms
        </h2>
        <span style={{ color: COLORS.textFaint, fontSize: '0.85rem' }}>
          Resets 1st of month
        </span>
      </div>

      <div style={{ ...cardStyle, padding: '0.5rem' }}>
        {data.monthlyRhythms.map((r, idx) => (
          <RhythmRow
            key={r.id}
            rhythm={r}
            done={!!checks[r.id]}
            carried={false}
            onToggle={() => toggleMonthly(data, setData, monthKey, r)}
            isLast={idx === data.monthlyRhythms.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function toggleMonthly(data, setData, monthKey, rhythm) {
  setData(prev => {
    const checks = { ...(prev.monthlyChecks[monthKey] || {}) };
    const was = !!checks[rhythm.id];

    if (was) {
      delete checks[rhythm.id];
    } else {
      checks[rhythm.id] = true;
    }

    const ptsDelta = was ? -rhythm.pts : rhythm.pts;

    return {
      ...prev,
      monthlyChecks: { ...prev.monthlyChecks, [monthKey]: checks },
      totalEarned: (prev.totalEarned || 0) + ptsDelta,
    };
  });
}

// ============================================================
// RHYTHM ROW (shared by weekly and monthly)
// ============================================================

function RhythmRow({ rhythm, done, carried, onToggle, isLast }) {
  const borderBottom = isLast ? 'none' : `1px solid ${COLORS.border}`;

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem',
        borderBottom,
        cursor: 'pointer',
        gap: '0.75rem',
        background: carried ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
        borderLeft: carried ? `3px solid ${COLORS.warning}` : '3px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!carried) e.currentTarget.style.background = COLORS.cardHover;
      }}
      onMouseLeave={(e) => {
        if (!carried) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Checkbox done={done} />
      <div style={{ flex: 1 }}>
        <div style={{
          textDecoration: done ? 'line-through' : 'none',
          color: done ? COLORS.textFaint : COLORS.text,
          fontSize: '0.95rem',
        }}>
          {rhythm.name}
        </div>
        {carried && (
          <div style={{
            color: COLORS.warning,
            fontSize: '0.75rem',
            marginTop: '0.2rem',
          }}>
            Carried from last week
          </div>
        )}
      </div>
      {rhythm.penalty > 0 && (
        <span style={{
          color: COLORS.danger,
          fontSize: '0.75rem',
          opacity: done ? 0.3 : 0.7,
        }}>
          miss: £{rhythm.penalty}
        </span>
      )}
      <span style={{
        color: done ? COLORS.textFaint : COLORS.accent,
        fontSize: '0.85rem',
        fontVariantNumeric: 'tabular-nums',
        minWidth: '2.5rem',
        textAlign: 'right',
      }}>
        +{rhythm.pts}
      </span>
    </div>
  );
}

function Checkbox({ done }) {
  return (
    <div style={{
      width: '1.25rem',
      height: '1.25rem',
      border: `2px solid ${done ? COLORS.accent : COLORS.textFaint}`,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: done ? COLORS.accent : 'transparent',
    }}>
      {done && <span style={{ color: '#000', fontSize: '0.85rem', fontWeight: 900 }}>✓</span>}
    </div>
  );
}

// ============================================================
// CLOSE-THE-WEEK BUTTON
// ============================================================

function CloseWeekButton({ data, setData, weekKey }) {
  const [showing, setShowing] = useState(false);

  const checks = data.weeklyChecks[weekKey] || {};
  const done = Object.values(checks).filter(Boolean).length;
  const total = data.weeklyRhythms.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const closeWeek = () => {
    setData(prev => ({
      ...prev,
      totalEarned: (prev.totalEarned || 0) + 30, // small bonus for closing
    }));
    setShowing(false);
    alert('Week closed. +30 pts for reflecting.');
  };

  if (showing) {
    return (
      <section style={{ ...cardStyle, marginTop: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: COLORS.text }}>
          Close the week
        </h3>
        <div style={{
          fontSize: '0.9rem',
          color: COLORS.textDim,
          marginBottom: '1rem',
          lineHeight: 1.6,
        }}>
          You hit <strong style={{ color: COLORS.accent }}>{done}/{total}</strong> rhythms
          this week ({percent}%).
          Unfinished items will carry over to next week with an amber highlight.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={closeWeek}
            style={{
              background: COLORS.accent,
              color: '#000',
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Noted · close week (+30)
          </button>
          <button
            onClick={() => setShowing(false)}
            style={{
              background: 'transparent',
              color: COLORS.textDim,
              border: `1px solid ${COLORS.border}`,
              padding: '0.6rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Not yet
          </button>
        </div>
      </section>
    );
  }

  return (
    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
      <button
        onClick={() => setShowing(true)}
        style={{
          background: 'transparent',
          color: COLORS.textDim,
          border: `1px dashed ${COLORS.border}`,
          padding: '0.6rem 1.25rem',
          borderRadius: '6px',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        Close this week →
      </button>
    </div>
  );
}