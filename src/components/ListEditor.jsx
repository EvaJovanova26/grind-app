// src/components/ListEditor.jsx
//
// Generic editor framework for content lists in Settings.
// Used by rituals (commit A); intentions, work rituals, weekly + monthly
// rhythms (commit B); commitments, penalties, rewards (commit C).
//
// What this owns:
//   - Editing state (which item is being edited, the working draft, validation error)
//   - Reorder buttons (▲ ▼)
//   - Add / save / cancel / delete actions
//   - Layout shell (rows, dividers, +Add button at the bottom)
//
// What the caller owns (via props):
//   - Item shape and how rows render (renderRow + renderEditor)
//   - Default new-item factory (makeNewItem)
//   - Validation rules (validate)
//   - Persistence (onChange — called with the new array; parent commits it to state)
//
// The framework is fully controlled — it has no idea where the data comes
// from or goes to. That keeps it reusable for every list in Settings.

import { useState } from 'react';
import {
  COLORS,
  FONTS,
  cardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  ghostButtonStyle,
} from '../utils/theme';

export default function ListEditor({
  title,
  sub,
  items,
  onChange,
  makeNewItem,
  validate,
  renderRow,
  renderEditor,
  addLabel = 'Add',
}) {
  // Internal editing state. The new draft lives here until saved — that way
  // a half-typed item never leaks into the persisted list.
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [isNew, setIsNew] = useState(false);

  const isEditingAny = editingId !== null;

  // ---------- Actions ----------

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft({ ...item });
    setError(null);
    setIsNew(false);
  };

  const startAdd = () => {
    const fresh = makeNewItem();
    setEditingId(fresh.id);
    setDraft(fresh);
    setError(null);
    setIsNew(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
    setIsNew(false);
  };

  const saveEdit = () => {
    const err = validate ? validate(draft) : null;
    if (err) {
      setError(err);
      return;
    }
    if (isNew) {
      onChange([...items, draft]);
    } else {
      onChange(items.map((i) => (i.id === editingId ? draft : i)));
    }
    cancelEdit();
  };

  const deleteItem = (item) => {
    if (
      !confirm(
        `Delete "${item.name}"?\n\nIt will disappear from your lists, but any historical points it earned stay in your totals.`,
      )
    )
      return;
    onChange(items.filter((i) => i.id !== item.id));
  };

  const moveItem = (idx, direction) => {
    const j = idx + direction;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  // updateDraft is passed to renderEditor — it's how field components mutate the draft
  const updateDraft = (changes) => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setError(null);
  };

  // ---------- Render ----------

  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <h3
        style={{
          margin: '0 0 0.85rem',
          fontFamily: FONTS.display,
          fontSize: '1.25rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: COLORS.text,
        }}
      >
        {title}
        {sub && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.7rem',
              color: COLORS.textMuted,
              marginLeft: 10,
              letterSpacing: '0.06em',
            }}
          >
            {sub}
          </span>
        )}
      </h3>

      <div style={{ ...cardStyle, padding: '0.5rem' }}>
        {items.length === 0 && !isNew && (
          <div
            style={{
              padding: '1rem',
              color: COLORS.textMuted,
              fontSize: '0.85rem',
              fontStyle: 'italic',
              textAlign: 'center',
              fontFamily: FONTS.sans,
            }}
          >
            Empty list. Add your first item below.
          </div>
        )}

        {items.map((item, idx) => {
          const isEditing = editingId === item.id;
          const isLast = idx === items.length - 1 && !isNew;

          if (isEditing) {
            return (
              <EditorRow
                key={item.id}
                draft={draft}
                error={error}
                onSave={saveEdit}
                onCancel={cancelEdit}
                renderEditor={renderEditor}
                updateDraft={updateDraft}
                isLast={isLast}
              />
            );
          }
          return (
            <DisplayRow
              key={item.id}
              item={item}
              idx={idx}
              total={items.length}
              disabled={isEditingAny}
              onEdit={() => startEdit(item)}
              onDelete={() => deleteItem(item)}
              onMoveUp={() => moveItem(idx, -1)}
              onMoveDown={() => moveItem(idx, 1)}
              renderRow={renderRow}
              isLast={isLast}
            />
          );
        })}

        {/* New-item editor row appears at the bottom, just above +Add */}
        {isNew && draft && (
          <EditorRow
            key="__new__"
            draft={draft}
            error={error}
            onSave={saveEdit}
            onCancel={cancelEdit}
            renderEditor={renderEditor}
            updateDraft={updateDraft}
            isLast
          />
        )}

        {!isEditingAny && (
          <div
            style={{
              padding: '0.5rem',
              borderTop:
                items.length > 0 ? `1px solid ${COLORS.hair}` : 'none',
            }}
          >
            <button
              onClick={startAdd}
              style={{ ...ghostButtonStyle, width: '100%' }}
            >
              + {addLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// DISPLAY ROW
// ============================================================
// Static view of an item, with up/down/edit/delete controls on the right.
// While ANY row is being edited, the others are dimmed and disabled — that
// avoids the messy edge case of reordering mid-edit.

function DisplayRow({
  item,
  idx,
  total,
  disabled,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  renderRow,
  isLast,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.75rem',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.hair}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <ArrowBtn
          direction="up"
          disabled={disabled || idx === 0}
          onClick={onMoveUp}
        />
        <ArrowBtn
          direction="down"
          disabled={disabled || idx === total - 1}
          onClick={onMoveDown}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>{renderRow(item)}</div>

      <button
        onClick={onEdit}
        disabled={disabled}
        style={{
          ...secondaryButtonStyle,
          padding: '0.35rem 0.75rem',
          fontSize: '0.78rem',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        disabled={disabled}
        style={{
          background: 'transparent',
          border: 'none',
          color: COLORS.textFaint,
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '1.1rem',
          padding: '0 0.4rem',
          lineHeight: 1,
        }}
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  );
}

function ArrowBtn({ direction, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent',
        border: 'none',
        color: disabled ? COLORS.textFaint : COLORS.textMuted,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '0.65rem',
        padding: '0.05rem 0.4rem',
        lineHeight: 1.2,
        fontFamily: FONTS.sans,
      }}
      aria-label={`Move ${direction}`}
    >
      {direction === 'up' ? '▲' : '▼'}
    </button>
  );
}

// ============================================================
// EDITOR ROW
// ============================================================
// Inline form for editing the currently-active item. The caller's
// renderEditor() decides what fields appear; we only render the
// chrome (background, error message, Save/Cancel buttons).

function EditorRow({
  draft,
  error,
  onSave,
  onCancel,
  renderEditor,
  updateDraft,
  isLast,
}) {
  return (
    <div
      style={{
        padding: '0.85rem 0.75rem',
        borderBottom: isLast ? 'none' : `1px solid ${COLORS.hair}`,
        background: COLORS.bg2,
        borderRadius: '8px',
        margin: '0.25rem 0',
      }}
    >
      {renderEditor(draft, updateDraft)}
      {error && (
        <div
          style={{
            color: COLORS.red,
            fontSize: '0.78rem',
            marginTop: '0.6rem',
            fontFamily: FONTS.sans,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
        <button onClick={onSave} style={primaryButtonStyle}>
          Save
        </button>
        <button onClick={onCancel} style={secondaryButtonStyle}>
          Cancel
        </button>
      </div>
    </div>
  );
}
