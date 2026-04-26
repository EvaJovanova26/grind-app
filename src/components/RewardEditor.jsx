// src/components/RewardEditor.jsx
//
// Rewards have { id, name, cost } where cost is in points.
// They don't earn points — they spend them — so they bypass StandardRow
// and render their own row with the cost in lime accent.

import ListEditor from './ListEditor';
import { Field, NameField, validateName } from './EditorFields';
import { COLORS, FONTS, inputStyle } from '../utils/theme';

function makeNewReward() {
  return {
    id: `reward_${Date.now()}`,
    name: '',
    cost: 500,
  };
}

function validateReward(item) {
  const nameErr = validateName(item);
  if (nameErr) return nameErr;
  const cost = Number(item.cost);
  if (!Number.isFinite(cost) || cost <= 0) {
    return 'Cost must be greater than 0 points.';
  }
  return null;
}

// ============================================================
// MAIN
// ============================================================

export default function RewardEditor({ rewards, onChange }) {
  return (
    <ListEditor
      title="Rewards"
      sub={`${rewards.length} item${rewards.length === 1 ? '' : 's'}`}
      items={rewards}
      onChange={onChange}
      makeNewItem={makeNewReward}
      validate={validateReward}
      addLabel="Add reward"
      renderRow={(item) => <RewardRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <RewardFields draft={draft} updateDraft={updateDraft} />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW
// ============================================================

function RewardRowDisplay({ item }) {
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
      <span
        style={{
          marginLeft: 'auto',
          color: COLORS.accent,
          fontFamily: FONTS.mono,
          fontSize: '0.8rem',
          flexShrink: 0,
          fontWeight: 600,
        }}
      >
        {item.cost.toLocaleString()} pts
      </span>
    </div>
  );
}

// ============================================================
// EDIT FIELDS
// ============================================================

function RewardFields({ draft, updateDraft }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder="e.g. 1hr guilt-free gaming"
      />
      <Field label="Cost (points)">
        <input
          type="number"
          min="1"
          step="50"
          value={draft.cost}
          onChange={(e) => updateDraft({ cost: Number(e.target.value) })}
          style={{ ...inputStyle, width: '160px' }}
        />
      </Field>
    </div>
  );
}
