// src/components/PenaltyEditor.jsx
//
// Penalties have { id, name, amount } where amount is in £.
// They don't carry points (they cost money, not points), so they
// bypass StandardRow and render their own row.

import ListEditor from './ListEditor';
import { NameField, MoneyField, validateName } from './EditorFields';
import { COLORS, FONTS } from '../utils/theme';

function makeNewPenalty() {
  return {
    id: `penalty_${Date.now()}`,
    name: '',
    amount: 2,
  };
}

function validatePenalty(item) {
  const nameErr = validateName(item);
  if (nameErr) return nameErr;
  const amount = Number(item.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Amount must be greater than £0.';
  }
  return null;
}

// ============================================================
// MAIN
// ============================================================

export default function PenaltyEditor({ penalties, onChange }) {
  return (
    <ListEditor
      title="Penalties"
      sub={`${penalties.length} item${penalties.length === 1 ? '' : 's'}`}
      items={penalties}
      onChange={onChange}
      makeNewItem={makeNewPenalty}
      validate={validatePenalty}
      addLabel="Add penalty"
      renderRow={(item) => <PenaltyRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <PenaltyFields draft={draft} updateDraft={updateDraft} />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW
// ============================================================

function PenaltyRowDisplay({ item }) {
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
          color: COLORS.red,
          fontFamily: FONTS.mono,
          fontSize: '0.8rem',
          flexShrink: 0,
          fontWeight: 600,
        }}
      >
        £{item.amount}
      </span>
    </div>
  );
}

// ============================================================
// EDIT FIELDS
// ============================================================

function PenaltyFields({ draft, updateDraft }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder="e.g. Mobile gaming (per hour)"
      />
      <div style={{ width: '160px' }}>
        <MoneyField
          label="Amount (£)"
          value={draft.amount}
          onChange={(amount) => updateDraft({ amount })}
        />
      </div>
    </div>
  );
}
