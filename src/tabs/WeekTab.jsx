// src/tabs/WeekTab.jsx
//
// The Week tab: weekly + monthly rhythms.
//
// In v7+:
//   - Ticking a rhythm stores today's date as the value (not just `true`)
//   - Points are earned on the day of the tick, contributing to that day's
//     Perfect Day ring
//   - Unticking is allowed but prompts the user with the original tick date
//   - Past Perfect Day rings retain their points even after untick

import { useState } from 'react';
import {
  todayISO,
  startOfWeek,
  currentMonthKey,
  daysBetween,
  addDays,
  formatShort,
} from '../utils/dates';
import { COLORS, FONTS, cardStyle, secondaryButtonStyle } from '../utils/theme';
import { Check, MetricCard, SectionHead } from '../components/ui';

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
// SUMMARY CARDS
// ============================================================

function WeekSummary({ data, weekKey, monthKey }) {
  const weeklyChecks = data.weeklyChecks[weekKey] || {};
  const monthlyChecks = data.monthlyChecks[monthKey] || {};

  // Truthy check works for both `true` and date-string values
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
      <SectionHead title="Weekly Rhythms" sub="Resets Monday" />
      <div style={{ ...cardStyle, padding: '0.5rem' }}>
        {data.weeklyRhythms.map((r, idx) => {
          const tickDate = checks[r.id] || null;
          return (
            <RhythmRow
              key={r.id}
              rhythm={r}
              tickDate={tickDate}
              carried={isCarriedOver(data, r.id, weekKey)}
              onClick={() => handleWeeklyClick(data, setData, weekKey, r, tickDate)}
              isLast={idx === data.weeklyRhythms.length - 1}
            />
          );
        })}
      </div>
    </section>
  );
}

function handleWeeklyClick(data, setData, weekKey, rhythm, tickDate) {
  if (tickDate) {
    // Currently ticked — confirm before unticking
    const niceDate = formatShort(tickDate);
    const ok = confirm(
      `Untick "${rhythm.name}"?\n\n` +
      `It was ticked on ${niceDate}. Points already earned that day will stay — ` +
      `removing the tick just makes this rhythm available again for the rest of the week.`
    );
    if (!ok) return;
    untickWeekly(setData, weekKey, rhythm);
  } else {
    // Not ticked — add a tick for today
    tickWeekly(setData, weekKey, rhythm);
  }
}

function tickWeekly(setData, weekKey, rhythm) {
  setData(prev => {
    const checks = { ...(prev.weeklyChecks[weekKey] || {}) };
    checks[rhythm.id] = todayISO();
    return {
      ...prev,
      weeklyChecks: { ...prev.weeklyChecks, [weekKey]: checks },
      totalEarned: (prev.totalEarned || 0) + rhythm.pts,
    };
  });
}

function untickWeekly(setData, weekKey, rhythm) {
  // Note: per spec, totalEarned is NOT decremented on untick.
  // Past day's ring keeps its points; only the rhythm's "ticked" state is cleared.
  setData(prev => {
    const checks = { ...(prev.weeklyChecks[weekKey] || {}) };
    delete checks[rhythm.id];
    return {
      ...prev,
      weeklyChecks: { ...prev.weeklyChecks, [weekKey]: checks },
    };
  });
}

function isCarriedOver(data, rhythmId, currentWeekKey) {
  const currentChecks = data.weeklyChecks[currentWeekKey] || {};
  if (currentChecks[rhythmId]) return false;

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
      <SectionHead title="Monthly Rhythms" sub="Resets 1st of month" />
      <div style={{ ...cardStyle, padding: '0.5rem' }}>
        {data.monthlyRhythms.map((r, idx) => {
          const tickDate = checks[r.id] || null;
          return (
            <RhythmRow
              key={r.id}
              rhythm={r}
              tickDate={tickDate}
              carried={false}
              onClick={() => handleMonthlyClick(data, setData, monthKey, r, tickDate)}
              isLast={idx === data.monthlyRhythms.length - 1}
            />
          );
        })}
      </div>
    </section>
  );
}

function handleMonthlyClick(data, setData, monthKey, rhythm, tickDate) {
  if (tickDate) {
    const niceDate = formatShort(tickDate);
    const ok = confirm(
      `Untick "${rhythm.name}"?\n\n` +
      `It was ticked on ${niceDate}. Points already earned that day will stay — ` +
      `removing the tick just makes this rhythm available again for the rest of the month.`
    );
    if (!ok) return;
    untickMonthly(setData, monthKey, rhythm);
  } else {
    tickMonthly(setData, monthKey, rhythm);
  }
}

function tickMonthly(setData, monthKey, rhythm) {
  setData(prev => {
    const checks = { ...(prev.monthlyChecks[monthKey] || {}) };
    checks[rhythm.id] = todayISO();
    return {
      ...prev,
      monthlyChecks: { ...prev.monthlyChecks, [monthKey]: checks },
      totalEarned: (prev.totalEarned || 0) + rhythm.pts,
    };
  });
}

function untickMonthly(setData, monthKey, rhythm) {
  setData(prev => {
    const checks = { ...(prev.monthlyChecks[monthKey] || {}) };
    delete checks[rhythm.id];
    return {
      ...prev,
      monthlyChecks: { ...prev.monthlyChecks, [monthKey]: checks },
    };
  });
}

// ============================================================
// RHYTHM ROW
// ============================================================

function RhythmRow({ rhythm, tickDate, carried, onClick, isLast }) {
  const done = !!tickDate;
  return (
    <div
      onClick={onClick}
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
        onClick={(e) => { e.stopPropagation(); onClick(); }}
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
        {done && tickDate && (
          <div style={{
            color: COLORS.textDim,
            fontSize: '0.7rem',
            fontFamily: FONTS.mono,
            marginTop: '0.2rem',
            letterSpacing: '0.04em',
          }}>
            ticked {formatShort(tickDate)}
          </div>
        )}
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
          <button onClick={() => setShowing(false)} style={secondaryButtonStyle}>
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
