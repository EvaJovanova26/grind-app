// src/components/IntentionEditor.jsx
//
// Intentions are stored as three independent sub-lists (body, mind, life).
// Each sub-list has the same shape: { id, name, pts }. So we render three
// separate ListEditor instances, one per category, with category-specific
// titles and placeholder hints.
//
// SettingsTab passes the whole intentions object; this component slices it
// per-category and routes each onChange back through the original setter.

import ListEditor from './ListEditor';
import {
  NameField,
  PtsField,
  StandardRow,
  validateName,
  validatePts,
} from './EditorFields';

// ============================================================
// CATEGORY CONFIG — drives the three sub-editors
// ============================================================

const CATEGORIES = [
  {
    key: 'body',
    title: 'Body intentions',
    placeholder: 'e.g. Gym session',
    defaultPts: 25,
    addLabel: 'Add body intention',
  },
  {
    key: 'mind',
    title: 'Mind intentions',
    placeholder: 'e.g. Read for 30min',
    defaultPts: 20,
    addLabel: 'Add mind intention',
  },
  {
    key: 'life',
    title: 'Life intentions',
    placeholder: 'e.g. Cook a proper meal',
    defaultPts: 25,
    addLabel: 'Add life intention',
  },
];

// ============================================================
// VALIDATION + FACTORY
// ============================================================

function validateIntention(item) {
  return validateName(item) || validatePts(item);
}

function makeNewIntentionFor(defaultPts) {
  return () => ({
    id: `intention_${Date.now()}`,
    name: '',
    pts: defaultPts,
  });
}

// ============================================================
// MAIN
// ============================================================

export default function IntentionEditor({ intentions, onChange }) {
  return (
    <>
      {CATEGORIES.map((cat) => {
        const items = intentions[cat.key];
        return (
          <ListEditor
            key={cat.key}
            title={cat.title}
            sub={`${items.length} item${items.length === 1 ? '' : 's'}`}
            items={items}
            onChange={(next) => onChange({ ...intentions, [cat.key]: next })}
            makeNewItem={makeNewIntentionFor(cat.defaultPts)}
            validate={validateIntention}
            addLabel={cat.addLabel}
            renderRow={(item) => <StandardRow item={item} />}
            renderEditor={(draft, updateDraft) => (
              <IntentionFields
                draft={draft}
                updateDraft={updateDraft}
                placeholder={cat.placeholder}
              />
            )}
          />
        );
      })}
    </>
  );
}

// ============================================================
// EDIT FIELDS
// ============================================================

function IntentionFields({ draft, updateDraft, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <NameField
        value={draft.name}
        onChange={(name) => updateDraft({ name })}
        placeholder={placeholder}
      />
      <div style={{ width: '120px' }}>
        <PtsField
          value={draft.pts}
          onChange={(pts) => updateDraft({ pts })}
        />
      </div>
    </div>
  );
}
