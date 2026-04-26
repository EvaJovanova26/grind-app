// src/tabs/WeekTab.jsx
//
// The Week tab: weekly + monthly rhythms.
// Tracks medium-cadence behaviors that don't belong on a daily list.

import { useState } from 'react';
import {
  todayISO,
  startOfWeek,
  currentMonthKey,
  daysBetween,
  addDays,
} from '../utils/dates';
import { COLORS, FONTS, cardStyle, secondaryButtonStyle } from '../utils/theme';
import { Check, MetricCard, SectionHead } from '../components/ui';

// ============================================================
// MAIN
// ============================================================

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
// TOP SUMMARY — two MetricCards
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
      <MetricCard
        label="This Week"
        value={`${weeklyDone} / ${weeklyTotal}`}
        color={COLORS.accent}
        caption={daysLeftInWeek >= 0 ? `${daysLeftInWeek + 1} days left` : 'Week ended'}
      />
      <MetricCard
        label="This Month"
        value={`${monthlyDone} / ${monthlyTotal}`}
        color={COLORS.accent}
        caption={monthKey}
      />
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
      <SectionHead
        title="Weekly Rhythms"
        sub="Resets Monday"
      />

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
      <SectionHead
        title="Monthly Rhythms"
        sub="Resets 1st of month"
      />

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
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.hair}`,
        cursor: 'pointer',
        gap: '0.85rem',
        background: carried ? COLORS.amber + '12' : 'transparent',
        borderLeft: carried ? `3px solid ${COLORS.amber}` : '3px solid transparent',
        transition: 'background 0.1s',
        borderRadius: '6px',
      }}
      onMouseEnter={(e) => {
        if (!carried) e.currentTarget.style.background = COLORS.surfaceHover;
      }}
      onMouseLeave={(e) => {
        if (!carried) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Check
        state={done ? 'full' : 'empty'}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      />
      <div style={{ flex: 1 }}>
        <div style={{
          textDecorationLine: done ? 'line-through' : 'none',
          textDecorationColor: COLORS.textDim,
          color: done ? COLORS.textMuted : COLORS.text,
          fontSize: '0.95rem',
          letterSpacing: '-0.005em',
        }}>
          {rhythm.name}
        </div>
        {carried && (
          <div style={{
            color: COLORS.amber,
            fontSize: '0.72rem',
            fontFamily: FONTS.mono,
            marginTop: '0.25rem',
            letterSpacing: '0.04em',
          }}>
            Carried from last week
          </div>
        )}
      </div>
      {rhythm.penalty > 0 && (
        <span style={{
          color: COLORS.red,
          fontSize: '0.72rem',
          fontFamily: FONTS.mono,
          opacity: done ? 0.3 : 0.7,
        }}>
          miss: £{rhythm.penalty}
        </span>
      )}
      <span style={{
        color: done ? COLORS.textDim : COLORS.accent,
        fontSize: '0.8rem',
        fontFamily: FONTS.mono,
        minWidth: '2.5rem',
        textAlign: 'right',
      }}>
        +{rhythm.pts}
      </span>
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
      totalEarned: (prev.totalEarned || 0) + 30,
    }));
    setShowing(false);
    alert('Week closed. +30 pts for reflecting.');
  };

  if (showing) {
    return (
      <section style={{ ...cardStyle, marginTop: '1rem' }}>
        <h3 style={{
          margin: '0 0 1rem',
          fontFamily: FONTS.display,
          fontSize: '1.25rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: COLORS.text,
        }}>
          Close the week
        </h3>
        <div style={{
          fontSize: '0.9rem',
          color: COLORS.textMuted,
          marginBottom: '1rem',
          lineHeight: 1.6,
        }}>
          You hit{' '}
          <strong style={{ color: COLORS.accent, fontFamily: FONTS.mono }}>
            {done}/{total}
          </strong>{' '}
          rhythms this week ({percent}%).
          Unfinished items will carry over to next week with an amber highlight.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={closeWeek}
            style={{
              background: COLORS.accent,
              color: COLORS.bg,
              border: 'none',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONTS.sans,
              letterSpacing: '-0.01em',
            }}
          >
            Noted · close week (+30)
          </button>
          <button
            onClick={() => setShowing(false)}
            style={secondaryButtonStyle}
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
          color: COLORS.textMuted,
          border: `1px dashed ${COLORS.hair}`,
          padding: '0.65rem 1.25rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontFamily: FONTS.sans,
          letterSpacing: '-0.005em',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.text;
          e.currentTarget.style.borderColor = COLORS.hairBright;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.textMuted;
          e.currentTarget.style.borderColor = COLORS.hair;
        }}
      >
        Close this week →
      </button>
    </div>
  );
}
