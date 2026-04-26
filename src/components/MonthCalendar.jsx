// src/components/MonthCalendar.jsx
//
// Custom month grid that replaces the native date input on TodayTab.
// Each cell is colored by points scored that day:
//   - Empty:   no points logged (faint outline only)
//   - Lime:    1-249 pts (alpha scales with how close to threshold)
//   - Magenta: 250+ pts (over threshold)
//   - Gold tick badge overlay: full Perfect Day (criteria met AND 250+)
//
// Days outside the displayed month are dimmed.
// Today gets a muted ring; the selected viewDate gets a lime ring.

import { useState, useMemo } from 'react';
import { todayISO } from '../utils/dates';
import {
  totalPointsForDate,
  isPerfectDay,
  PERFECT_DAY_THRESHOLD,
} from '../utils/points';
import { COLORS, FONTS } from '../utils/theme';

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const GOLD = '#ffd166';

// ============================================================
// Date helpers (local to this component)
// ============================================================

function getMonthGrid(monthAnchor) {
  // Returns 42 cells (6 rows × 7 cols), Mon-first.
  const d = new Date(monthAnchor + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const firstDayDow = (firstOfMonth.getDay() + 6) % 7; // shift Sun=0 → Mon=0

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const cell = new Date(year, month, 1 - firstDayDow + i);
    const iso = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`;
    cells.push({
      iso,
      day: cell.getDate(),
      inMonth: cell.getMonth() === month,
    });
  }
  return cells;
}

function shiftMonth(monthAnchor, delta) {
  const d = new Date(monthAnchor + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth() + delta;
  // setMonth is safe — JS handles overflow (e.g. month=12 → next year jan)
  const next = new Date(y, m, 1);
  const ny = next.getFullYear();
  const nm = String(next.getMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}-01`;
}

function monthLabel(monthAnchor) {
  const d = new Date(monthAnchor + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ============================================================
// MAIN
// ============================================================

export default function MonthCalendar({ data, viewDate, onSelect }) {
  const [monthAnchor, setMonthAnchor] = useState(viewDate);
  const today = todayISO();

  const cells = useMemo(() => getMonthGrid(monthAnchor), [monthAnchor]);

  return (
    <div style={{
      background: COLORS.surface,
      border: `1px solid ${COLORS.hair}`,
      borderRadius: 14,
      padding: '1rem',
      marginBottom: '1.5rem',
    }}>
      {/* Month nav header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <button
          onClick={() => setMonthAnchor(shiftMonth(monthAnchor, -1))}
          style={navBtnStyle}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div style={{
          fontFamily: FONTS.display,
          fontSize: '1rem',
          color: COLORS.text,
          letterSpacing: '-0.01em',
        }}>
          {monthLabel(monthAnchor)}
        </div>
        <button
          onClick={() => setMonthAnchor(shiftMonth(monthAnchor, 1))}
          style={navBtnStyle}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '4px',
      }}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} style={{
            fontFamily: FONTS.mono,
            fontSize: '0.62rem',
            color: COLORS.textMuted,
            textAlign: 'center',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.25rem 0',
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
      }}>
        {cells.map(cell => (
          <DayCell
            key={cell.iso}
            cell={cell}
            data={data}
            isToday={cell.iso === today}
            isSelected={cell.iso === viewDate}
            onClick={() => onSelect(cell.iso)}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '0.85rem',
        paddingTop: '0.75rem',
        borderTop: `1px solid ${COLORS.hair}`,
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        fontFamily: FONTS.mono,
        fontSize: '0.62rem',
        color: COLORS.textMuted,
        letterSpacing: '0.06em',
      }}>
        <LegendChip color={COLORS.accent + '50'} label="points" />
        <LegendChip color={COLORS.magenta} label="250+" />
        <LegendChip color={GOLD} label="perfect" badge />
      </div>
    </div>
  );
}

// ============================================================
// DAY CELL
// ============================================================

function DayCell({ cell, data, isToday, isSelected, onClick }) {
  const points = totalPointsForDate(data, cell.iso);
  const overThreshold = points >= PERFECT_DAY_THRESHOLD;
  const perfect = isPerfectDay(data, cell.iso);

  // Background color
  let bg = 'transparent';
  let textColor = cell.inMonth ? COLORS.text : COLORS.textFaint;

  if (overThreshold) {
    bg = COLORS.magenta + 'd0';
    textColor = COLORS.bg;
  } else if (points > 0) {
    // Lime gradient — alpha scales 0.20 → 0.75 as points → threshold.
    // Always visible, never fully opaque (so today/selected rings remain readable).
    const intensity = Math.min(1, points / PERFECT_DAY_THRESHOLD);
    const alpha = Math.round((0.2 + intensity * 0.55) * 255);
    const alphaHex = alpha.toString(16).padStart(2, '0');
    bg = COLORS.accent + alphaHex;
    if (intensity > 0.55) textColor = COLORS.bg;
  }

  // Outline
  let border = '1.5px solid transparent';
  if (isSelected) border = `1.5px solid ${COLORS.accent}`;
  else if (isToday) border = `1.5px solid ${COLORS.textMuted}`;

  return (
    <button
      onClick={onClick}
      style={{
        aspectRatio: '1',
        background: bg,
        border,
        borderRadius: 8,
        cursor: 'pointer',
        position: 'relative',
        opacity: cell.inMonth ? 1 : 0.35,
        padding: 0,
        fontFamily: FONTS.mono,
        fontSize: '0.78rem',
        color: textColor,
        fontWeight: isSelected ? 700 : isToday ? 600 : 400,
        transition: 'transform 0.12s, border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {cell.day}
      {perfect && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          width: 14,
          height: 14,
          background: GOLD,
          color: COLORS.bg,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.55rem',
          fontWeight: 800,
          boxShadow: `0 0 6px ${GOLD}99`,
          border: `1.5px solid ${COLORS.bg}`,
        }}>
          ✓
        </span>
      )}
    </button>
  );
}

// ============================================================
// LEGEND CHIP
// ============================================================

function LegendChip({ color, label, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {badge ? (
        <div style={{
          width: 11,
          height: 11,
          background: color,
          color: COLORS.bg,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.5rem',
          fontWeight: 800,
        }}>
          ✓
        </div>
      ) : (
        <div style={{
          width: 12,
          height: 12,
          background: color,
          borderRadius: 3,
        }} />
      )}
      <span>{label}</span>
    </div>
  );
}

const navBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: COLORS.textMuted,
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0.25rem 0.6rem',
  fontFamily: FONTS.sans,
};
