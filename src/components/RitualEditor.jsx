// src/components/RitualEditor.jsx
//
// Wraps ListEditor with ritual-specific config:
//   - Field UI: name, points, tap-type dropdown, water taps (only when water type)
//   - Validation: name required, points > 0, water taps a positive integer
//   - New-item factory: defaults for a fresh ritual
//
// Tap type collapses two booleans (twice, water) into a single tri-state
// dropdown at the UI layer. Storage stays as separate booleans, plus an
// optional `waterTaps` number (defaults to 4 when missing).
//
// This keeps the schema additive — existing data works untouched.

import { COLORS, FONTS, inputStyle } from '../utils/theme';
import ListEditor from './ListEditor';

// ============================================================
// TAP TYPE — bidirectional mapping to/from twice + water flags
// ============================================================

const TAP_TYPES = [
  { value: 'single', label: 'Single tap (full points)' },
  { value: 'twice', label: 'Two taps (half then full)' },
  { value: 'water', label: 'Water (500ml increments)' },
];

function getTapType(item) {
  if (item.water) return 'water';
  if (item.twice) return 'twice';
  return 'single';
}

// When the user changes tap type, sync all related fields together.
// This is also where we set/clear waterTaps so it only exists when relevant.
function applyTapType(updateDraft, type) {
  updateDraft({
    twice: type === 'twice',
    water: type === 'water',
    waterTaps: type === 'water' ? 4 : undefined,
  });
}

// ============================================================
// FACTORIES + VALIDATION
// ============================================================

function makeNewRitual() {
  return {
    id: `ritual_${Date.now()}`,
    name: '',
    pts: 10,
    twice: false,
    water: false,
  };
}

function validateRitual(item) {
  if (!item.name || !item.name.trim()) {
    return 'Name is required.';
  }
  const pts = Number(item.pts);
  if (!Number.isFinite(pts) || pts <= 0) {
    return 'Points must be a number greater than 0.';
  }
  if (item.water) {
    const taps = Number(item.waterTaps ?? 4);
    if (!Number.isInteger(taps) || taps < 1) {
      return 'Water taps must be a whole number ≥ 1.';
    }
  }
  return null;
}

// ============================================================
// MAIN — what the parent (SettingsTab) actually uses
// ============================================================

export default function RitualEditor({ rituals, onChange }) {
  return (
    <ListEditor
      title="Daily Rituals"
      sub={`${rituals.length} item${rituals.length === 1 ? '' : 's'}`}
      items={rituals}
      onChange={onChange}
      makeNewItem={makeNewRitual}
      validate={validateRitual}
      addLabel="Add ritual"
      renderRow={(item) => <RitualRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <RitualFields draft={draft} updateDraft={updateDraft} />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW — what the user sees when not editing
// ============================================================

function RitualRowDisplay({ item }) {
  const tap = getTapType(item);
  const tapLabel =
    tap === 'water'
      ? `water · ${item.waterTaps ?? 4}× 500ml`
      : tap === 'twice'
        ? 'two taps'
        : 'single';

  return (
    <div
      style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem' }}
    >
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
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: '0.7rem',
          color: COLORS.textMuted,
          letterSpacing: '0.04em',
        }}
      >
        {tapLabel}
      </span>
      <span
        style={{
          marginLeft: 'auto',
          color: COLORS.accent,
          fontFamily: FONTS.mono,
          fontSize: '0.8rem',
          flexShrink: 0,
        }}
      >
        +{item.pts}
      </span>
    </div>
  );
}

// ============================================================
// EDIT FIELDS — the form that appears when editing/adding
// ============================================================

function RitualFields({ draft, updateDraft }) {
  const tapType = getTapType(draft);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <Field label="Name">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          style={{ ...inputStyle, width: '100%' }}
          autoFocus
          placeholder="e.g. Morning skincare"
        />
      </Field>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          gap: '0.6rem',
        }}
      >
        <Field label="Points">
          <input
            type="number"
            min="1"
            value={draft.pts}
            onChange={(e) => updateDraft({ pts: Number(e.target.value) })}
            style={{ ...inputStyle, width: '100%' }}
          />
        </Field>
        <Field label="Tap behavior">
          <select
            value={tapType}
            onChange={(e) => applyTapType(updateDraft, e.target.value)}
            style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
          >
            {TAP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {tapType === 'water' && (
        <Field label="Max water taps (each tap = 500ml, +2 pts)">
          <input
            type="number"
            min="1"
            value={draft.waterTaps ?? 4}
            onChange={(e) =>
              updateDraft({ waterTaps: Number(e.target.value) })
            }
            style={{ ...inputStyle, width: '120px' }}
          />
        </Field>
      )}
    </div>
  );
}

// Tiny shared label-wrapper so every field has the same uppercase mono caption
function Field({ label, children }) {
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
