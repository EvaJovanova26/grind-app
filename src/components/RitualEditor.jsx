// src/components/RitualEditor.jsx
//
// Wraps ListEditor with ritual-specific config:
//   - Field UI: name, points, tap-type dropdown, water taps (only when water type)
//   - Validation: name required, points > 0, water taps a positive integer
//   - New-item factory: defaults for a fresh ritual
//
// Reused for Work Rituals via the `allowWater` prop (work rituals can't
// have a water tap behavior). Same component, two configurations:
//
//   <RitualEditor rituals={data.rituals} onChange={...} />               // daily rituals
//   <RitualEditor rituals={data.workRituals} onChange={...}              // work rituals
//                 title="Work rituals" allowWater={false} idPrefix="wr"
//                 addLabel="Add work ritual" />
//
// Tap type collapses two booleans (twice, water) into a single tri-state
// dropdown at the UI layer. Storage stays as separate booleans, plus an
// optional `waterTaps` number (defaults to 4 when missing).

import ListEditor from './ListEditor';
import {
  Field,
  NameField,
  PtsField,
  StandardRow,
  validateName,
  validatePts,
} from './EditorFields';
import { inputStyle } from '../utils/theme';

// ============================================================
// TAP TYPE — bidirectional mapping to/from twice + water flags
// ============================================================

const ALL_TAP_TYPES = [
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
// VALIDATION
// ============================================================

function validateRitual(item) {
  const nameErr = validateName(item);
  if (nameErr) return nameErr;
  const ptsErr = validatePts(item);
  if (ptsErr) return ptsErr;
  if (item.water) {
    const taps = Number(item.waterTaps ?? 4);
    if (!Number.isInteger(taps) || taps < 1) {
      return 'Water taps must be a whole number ≥ 1.';
    }
  }
  return null;
}

// ============================================================
// MAIN
// ============================================================

export default function RitualEditor({
  rituals,
  onChange,
  title = 'Daily Rituals',
  addLabel = 'Add ritual',
  idPrefix = 'ritual',
  defaultPts = 10,
  allowWater = true,
}) {
  const tapTypes = allowWater
    ? ALL_TAP_TYPES
    : ALL_TAP_TYPES.filter((t) => t.value !== 'water');

  const makeNewRitual = () => ({
    id: `${idPrefix}_${Date.now()}`,
    name: '',
    pts: defaultPts,
    twice: false,
    water: false,
  });

  return (
    <ListEditor
      title={title}
      sub={`${rituals.length} item${rituals.length === 1 ? '' : 's'}`}
      items={rituals}
      onChange={onChange}
      makeNewItem={makeNewRitual}
      validate={validateRitual}
      addLabel={addLabel}
      renderRow={(item) => <RitualRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <RitualFields
          draft={draft}
          updateDraft={updateDraft}
          tapTypes={tapTypes}
        />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW
// ============================================================

function RitualRowDisplay({ item }) {
  const tap = getTapType(item);
  const tapLabel =
    tap === 'water'
      ? `water · ${item.waterTaps ?? 4}× 500ml`
      : tap === 'twice'
        ? 'two taps'
        : 'single';

  return <StandardRow item={item} meta={tapLabel} />;
}

// ============================================================
// EDIT FIELDS
// ============================================================

function RitualFields({ draft, updateDraft, tapTypes }) {
  const tapType = getTapType(draft);
  const showWaterTaps =
    tapType === 'water' && tapTypes.some((t) => t.value === 'water');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder="e.g. Morning skincare"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          gap: '0.6rem',
        }}
      >
        <PtsField
          value={draft.pts}
          onChange={(pts) => updateDraft({ pts })}
        />
        <Field label="Tap behavior">
          <select
            value={tapType}
            onChange={(e) => applyTapType(updateDraft, e.target.value)}
            style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
          >
            {tapTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {showWaterTaps && (
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
