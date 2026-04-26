// src/components/EditorFields.jsx
//
// Shared building blocks for editor forms.
// Imported by every editor in src/components/ — keeps fields,
// validation, and row display visually + behaviorally consistent.
//
// What's here:
//   - Field            : label wrapper (uppercase mono caption above input)
//   - NameField        : standard text input, autofocused
//   - PtsField         : standard positive-integer input
//   - MoneyField       : standard £ input (allowZero toggle)
//   - StandardRow      : the common name + meta + +pts row layout
//   - validateName     : "name is required"
//   - validatePts      : "points must be > 0"

import { COLORS, FONTS, inputStyle } from '../utils/theme';

// ============================================================
// FIELD WRAPPER
// ============================================================

export function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: '0.62rem',
          color: COLORS.textMuted,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// ============================================================
// COMMON FIELD COMPONENTS
// ============================================================

export function NameField({ value, onChange, placeholder, autoFocus = true }) {
  return (
    <Field label="Name">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ ...inputStyle, width: '100%' }}
      />
    </Field>
  );
}

export function PtsField({ value, onChange, label = 'Points' }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, width: '100%' }}
      />
    </Field>
  );
}

export function MoneyField({ label, value, onChange, allowZero = false }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={allowZero ? '0' : '0.5'}
        step="0.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ...inputStyle, width: '100%' }}
      />
    </Field>
  );
}

// ============================================================
// STANDARD ROW DISPLAY
// ============================================================
//
// Common row layout: name on the left, optional meta in the middle (mono
// muted), optional `right` slot before the +pts on the far right.
// Used by IntentionRow, RitualRow, WorkRitualRow, RhythmRow.

export function StandardRow({ item, meta, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}>
      <span
        style={{
          fontSize: '0.95rem',
          color: COLORS.text,
          letterSpacing: '-0.005em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.name}
      </span>
      {meta && (
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: '0.7rem',
            color: COLORS.textMuted,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          {meta}
        </span>
      )}
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}>
        {right}
        <span
          style={{
            color: COLORS.accent,
            fontFamily: FONTS.mono,
            fontSize: '0.8rem',
            flexShrink: 0,
          }}
        >
          +{item.pts}
        </span>
      </span>
    </div>
  );
}

// ============================================================
// SHARED VALIDATION
// ============================================================

export function validateName(item) {
  if (!item.name || !item.name.trim()) return 'Name is required.';
  return null;
}

export function validatePts(item) {
  const pts = Number(item.pts);
  if (!Number.isFinite(pts) || pts <= 0) {
    return 'Points must be a number greater than 0.';
  }
  return null;
}
