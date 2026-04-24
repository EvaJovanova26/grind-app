// src/utils/dates.js
//
// Date helpers. Nothing here touches app state — these are pure functions
// that take dates and return something useful.
//
// We use ISO date strings (YYYY-MM-DD) as our canonical date format
// throughout the app. This matches what the current grind app uses.

/**
 * Get today's date as an ISO string (YYYY-MM-DD) in local time.
 * Note: we use local time, not UTC, so "today" matches what the user
 * sees on their calendar.
 */
export function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if an ISO date string is today.
 */
export function isToday(isoDate) {
  return isoDate === todayISO();
}

/**
 * Check if an ISO date string is in the past (before today).
 */
export function isPast(isoDate) {
  return isoDate < todayISO();
}

/**
 * Check if an ISO date string is in the future (after today).
 */
export function isFuture(isoDate) {
  return isoDate > todayISO();
}

/**
 * Add days to an ISO date string. Negative values go back in time.
 * Example: addDays('2026-04-23', -1) => '2026-04-22'
 */
export function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Days between two ISO date strings.
 * Positive if `to` is after `from`, negative if before.
 * Example: daysBetween('2026-04-20', '2026-04-23') => 3
 */
export function daysBetween(fromISO, toISO) {
  const from = new Date(fromISO + 'T00:00:00');
  const to = new Date(toISO + 'T00:00:00');
  const ms = to - from;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Days until a deadline from today. Negative means overdue.
 * Example: if today is 2026-04-23 and deadline is 2026-04-25 => 2
 *          if today is 2026-04-23 and deadline is 2026-04-20 => -3
 */
export function daysUntil(isoDate) {
  return daysBetween(todayISO(), isoDate);
}

/**
 * Format a date for display. Short style: "Thu 23 Apr"
 */
export function formatShort(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a date for display. Long style: "Thursday 23 April"
 */
export function formatLong(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Get the ISO string for the Monday of the week containing the given date.
 * Used for weekly rhythms — each week starts Monday.
 */
export function startOfWeek(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayNum}`;
}

/**
 * Get the ISO month key for the given date. Format: "YYYY-MM"
 * Used for monthly rhythms and penalty-paid tracking.
 */
export function monthKey(isoDate) {
  return isoDate.slice(0, 7); // first 7 chars of YYYY-MM-DD
}

/**
 * Current month key as YYYY-MM.
 */
export function currentMonthKey() {
  return monthKey(todayISO());
}

/**
 * Check if two ISO dates are in the same week (Monday-Sunday).
 */
export function sameWeek(isoDateA, isoDateB) {
  return startOfWeek(isoDateA) === startOfWeek(isoDateB);
}

/**
 * Check if two ISO dates are in the same month.
 */
export function sameMonth(isoDateA, isoDateB) {
  return monthKey(isoDateA) === monthKey(isoDateB);
}