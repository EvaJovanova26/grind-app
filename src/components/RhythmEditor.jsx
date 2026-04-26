// src/components/RhythmEditor.jsx
//
// Edits weekly OR monthly rhythms. Same shape ({ id, name, pts, penalty }),
// so one component covers both via a `cadence` prop.
//
// Usage:
//   <RhythmEditor cadence="weekly"  rhythms={data.weeklyRhythms}  onChange={...} />
//   <RhythmEditor cadence="monthly" rhythms={data.monthlyRhythms} onChange={...} />
//
// `penalty` is in £, charged to the penalty jar if the rhythm is missed
// by week's-end (weekly) or month's-end (monthly). 0 is allowed — meaning
// "no penalty for missing this one".

import ListEditor from './ListEditor';
import {
  NameField,
  PtsField,
  MoneyField,
  StandardRow,
  validateName,
  validatePts,
} from './EditorFields';
import { COLORS, FONTS } from '../utils/theme';

// ============================================================
// CADENCE CONFIG
// ============================================================

const CADENCES = {
  weekly: {
    title: 'Weekly rhythms',
    addLabel: 'Add weekly rhythm',
    idPrefix: 'w',
    defaultPts: 25,
    defaultPenalty: 2,
    placeholder: 'e.g. Laundry',
  },
  monthly: {
    title: 'Monthly rhythms',
    addLabel: 'Add monthly rhythm',
    idPrefix: 'm',
    defaultPts: 30,
    defaultPenalty: 5,
    placeholder: 'e.g. Review subscriptions',
  },
};

// ============================================================
// VALIDATION
// ============================================================

function validateRhythm(item) {
  const nameErr = validateName(item);
  if (nameErr) return nameErr;
  const ptsErr = validatePts(item);
  if (ptsErr) return ptsErr;
  const penalty = Number(item.penalty);
  if (!Number.isFinite(penalty) || penalty < 0) {
    return 'Penalty must be 0 or greater.';
  }
  return null;
}

// ============================================================
// MAIN
// ============================================================

export default function RhythmEditor({ cadence, rhythms, onChange }) {
  const cfg = CADENCES[cadence];
  if (!cfg) {
    throw new Error(`RhythmEditor: unknown cadence "${cadence}"`);
  }

  const makeNewRhythm = () => ({
    id: `${cfg.idPrefix}_${Date.now()}`,
    name: '',
    pts: cfg.defaultPts,
    penalty: cfg.defaultPenalty,
  });

  return (
    <ListEditor
      title={cfg.title}
      sub={`${rhythms.length} item${rhythms.length === 1 ? '' : 's'}`}
      items={rhythms}
      onChange={onChange}
      makeNewItem={makeNewRhythm}
      validate={validateRhythm}
      addLabel={cfg.addLabel}
      renderRow={(item) => <RhythmRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <RhythmFields
          draft={draft}
          updateDraft={updateDraft}
          placeholder={cfg.placeholder}
        />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW — name + (miss: £X) on the right + +pts
// ============================================================

function RhythmRowDisplay({ item }) {
  const penaltyMark = item.penalty > 0 && (
    <span
      style={{
        color: COLORS.red,
        fontFamily: FONTS.mono,
        fontSize: '0.72rem',
        opacity: 0.75,
      }}
    >
      miss: £{item.penalty}
    </span>
  );
  return <StandardRow item={item} right={penaltyMark} />;
}

// ============================================================
// EDIT FIELDS
// ============================================================

function RhythmFields({ draft, updateDraft, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder={placeholder}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.6rem',
        }}
      >
        <PtsField
          value={draft.pts}
          onChange={(pts) => updateDraft({ pts })}
        />
        <MoneyField
          label="Penalty (£) if missed"
          value={draft.penalty}
          onChange={(penalty) => updateDraft({ penalty })}
          allowZero
        />
      </div>
    </div>
  );
}
