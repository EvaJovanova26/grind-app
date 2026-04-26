// src/components/CommitmentEditor.jsx
//
// Commitments are quarterly themes — they don't carry points or penalties,
// they just hold a name and an optional "why this matters" line.
// Note: they bypass StandardRow because they have no `pts` field.

import ListEditor from './ListEditor';
import { Field, NameField, validateName } from './EditorFields';
import { COLORS, FONTS, inputStyle } from '../utils/theme';

function makeNewCommitment() {
  return {
    id: `commit_${Date.now()}`,
    name: '',
    why: '',
  };
}

// ============================================================
// MAIN
// ============================================================

export default function CommitmentEditor({ commitments, onChange }) {
  return (
    <ListEditor
      title="Commitments"
      sub={`${commitments.length} item${commitments.length === 1 ? '' : 's'}`}
      items={commitments}
      onChange={onChange}
      makeNewItem={makeNewCommitment}
      validate={validateName}
      addLabel="Add commitment"
      renderRow={(item) => <CommitmentRowDisplay item={item} />}
      renderEditor={(draft, updateDraft) => (
        <CommitmentFields draft={draft} updateDraft={updateDraft} />
      )}
    />
  );
}

// ============================================================
// DISPLAY ROW
// ============================================================

function CommitmentRowDisplay({ item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <span
        style={{
          fontSize: '0.95rem',
          color: COLORS.text,
          letterSpacing: '-0.005em',
        }}
      >
        {item.name}
      </span>
      {item.why && (
        <span
          style={{
            fontSize: '0.8rem',
            color: COLORS.textMuted,
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {item.why}
        </span>
      )}
    </div>
  );
}

// ============================================================
// EDIT FIELDS
// ============================================================

function CommitmentFields({ draft, updateDraft }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder="e.g. Find the next role"
      />
      <Field label="Why this matters (1 line)">
        <input
          type="text"
          value={draft.why}
          onChange={(e) => updateDraft({ why: e.target.value })}
          placeholder="What you're actually betting on"
          style={{ ...inputStyle, width: '100%' }}
        />
      </Field>
    </div>
  );
}
