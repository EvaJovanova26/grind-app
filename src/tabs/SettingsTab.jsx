// src/tabs/SettingsTab.jsx
//
// Settings: edit content lists + data export/import + schema info + maintenance + reset.
// Plumbing for storage lives in utils/storage.js — this is just UI.
//
// Section order (top → bottom):
//   1. Edit content   ← NEW (commit A: Rituals only; B + C add the other 7 lists)
//   2. Data           (export/import backups)
//   3. App info       (counts, schema version)
//   4. Maintenance    (forgive aging penalties, recalculate totals)
//   5. Danger zone    (hard reset)

import { useRef, useState } from 'react';
import { exportJSON, importJSON, loadData, saveData } from '../utils/storage';
import { freshV6State } from '../utils/migration';
import {
  COLORS,
  FONTS,
  cardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from '../utils/theme';
import RitualEditor from '../components/RitualEditor';

// ============================================================
// MAIN
// ============================================================

export default function SettingsTab({ data, setData }) {
  return (
    <div
      style={{
        padding: '1.5rem 2rem 4rem',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <EditContentSection data={data} setData={setData} />
      <DataSection setData={setData} />
      <InfoSection data={data} />
      <MaintenanceSection data={data} setData={setData} />
      <DangerZone setData={setData} />
    </div>
  );
}

// ============================================================
// SECTION HEADER (local — Settings has a distinct heading style)
// ============================================================

function SettingsHeader({ title, danger }) {
  return (
    <h2
      style={{
        margin: '0 0 0.85rem',
        fontFamily: FONTS.display,
        fontSize: '1.5rem',
        fontWeight: 400,
        color: danger ? COLORS.red : COLORS.text,
        letterSpacing: '-0.02em',
      }}
    >
      {title}
    </h2>
  );
}

const descStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: COLORS.textMuted,
  lineHeight: 1.55,
  fontFamily: FONTS.sans,
};

// ============================================================
// EDIT CONTENT — NEW
// ============================================================
//
// Wraps the per-list editors. Currently only Rituals (commit A).
// Commit B will add: Intentions (×3), Work Rituals, Weekly + Monthly Rhythms.
// Commit C will add: Commitments, Penalties, Rewards.

function EditContentSection({ data, setData }) {
  const updateRituals = (rituals) =>
    setData((prev) => ({ ...prev, rituals }));

  return (
    <section>
      <SettingsHeader title="Edit content" />
      <p style={{ ...descStyle, marginBottom: '1rem' }}>
        Customize the lists that drive the app — names, points, ordering, and
        ritual tap behavior. Past data is preserved when items change. Deleting
        an item hides it from lists going forward; historical points stay in
        your totals.
      </p>
      <RitualEditor rituals={data.rituals} onChange={updateRituals} />
    </section>
  );
}

// ============================================================
// DATA EXPORT / IMPORT
// ============================================================

function DataSection({ setData }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState(null);

  const handleExport = () => {
    exportJSON();
    setStatus({ type: 'success', msg: 'Export downloaded.' });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'Importing will REPLACE all current data with the backup contents. Continue?',
      )
    ) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const raw = evt.target?.result;
      if (typeof raw !== 'string') {
        setStatus({ type: 'error', msg: 'Could not read file.' });
        return;
      }
      const ok = importJSON(raw);
      if (ok) {
        const imported = loadData();
        setData(imported);
        setStatus({ type: 'success', msg: 'Import successful. Data restored.' });
      } else {
        setStatus({ type: 'error', msg: 'Import failed. File may be invalid.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section>
      <SettingsHeader title="Data" />
      <div style={cardStyle}>
        <p style={descStyle}>
          Back up your data to a JSON file, or restore from a previous backup.
          Do this before any major changes.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button onClick={handleExport} style={primaryButtonStyle}>
            Export backup
          </button>
          <button onClick={handleImportClick} style={secondaryButtonStyle}>
            Import backup
          </button>
          <input
            id="import-file"
            name="import-file"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            style={{ display: 'none' }}
          />
        </div>
        {status && (
          <div
            style={{
              marginTop: '0.85rem',
              fontSize: '0.85rem',
              color: status.type === 'success' ? COLORS.accent : COLORS.red,
              fontFamily: FONTS.sans,
            }}
          >
            {status.msg}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// APP INFO (counts + versions)
// ============================================================

function InfoSection({ data }) {
  const counts = [
    { label: 'Schema version', value: data.schemaVersion },
    { label: 'Rituals', value: data.rituals.length },
    {
      label: 'Intentions',
      value:
        data.intentions.body.length +
        data.intentions.mind.length +
        data.intentions.life.length,
    },
    { label: 'Work rituals', value: data.workRituals.length },
    { label: 'Weekly rhythms', value: data.weeklyRhythms.length },
    { label: 'Monthly rhythms', value: data.monthlyRhythms.length },
    { label: 'Commitments', value: data.commitments.length },
    { label: 'Backlog items', value: data.backlog.length },
    { label: 'Active deadlines', value: data.deadlines.length },
    { label: 'Penalty types', value: data.penalties.length },
    { label: 'Reward types', value: data.rewards.length },
    { label: 'Total penalties logged', value: (data.penaltyLog || []).length },
    { label: 'Total rewards claimed', value: (data.rewardLog || []).length },
    {
      label: 'Total points earned',
      value: (data.totalEarned || 0).toLocaleString(),
    },
    {
      label: 'Total points spent',
      value: (data.totalSpent || 0).toLocaleString(),
    },
  ];

  return (
    <section>
      <SettingsHeader title="App info" />
      <div style={cardStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.4rem 1.25rem',
          }}
        >
          {counts.map((c) => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                fontSize: '0.85rem',
                fontFamily: FONTS.sans,
                borderBottom: `1px solid ${COLORS.hair}`,
              }}
            >
              <span style={{ color: COLORS.textMuted }}>{c.label}</span>
              <span
                style={{
                  color: COLORS.text,
                  fontFamily: FONTS.mono,
                  fontSize: '0.8rem',
                }}
              >
                {c.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAINTENANCE
// ============================================================

function MaintenanceSection({ data, setData }) {
  const forgiveAgingPenalties = () => {
    const agingPenalties = (data.penaltyLog || []).filter(
      (p) => p.id && p.id.startsWith('backlog_aging_'),
    );
    if (agingPenalties.length === 0) {
      alert('No aging penalties to forgive.');
      return;
    }
    if (
      !confirm(
        `Remove ${agingPenalties.length} backlog-aging penalties from your log?`,
      )
    )
      return;

    setData((prev) => ({
      ...prev,
      penaltyLog: prev.penaltyLog.filter(
        (p) => !(p.id && p.id.startsWith('backlog_aging_')),
      ),
    }));
  };

  const recalculateTotalEarned = () => {
    let total = 0;

    for (const [, checks] of Object.entries(data.ritualChecks || {})) {
      for (const [id, taps] of Object.entries(checks)) {
        if (!taps) continue;
        const ritual = data.rituals.find((r) => r.id === id);
        if (!ritual) continue;
        if (ritual.water) total += taps * 2;
        else if (ritual.twice) total += (ritual.pts / 2) * taps;
        else total += ritual.pts;
      }
    }
    for (const [, checks] of Object.entries(data.intentionChecks || {})) {
      for (const [id, checked] of Object.entries(checks)) {
        if (!checked) continue;
        const all = [
          ...data.intentions.body,
          ...data.intentions.mind,
          ...data.intentions.life,
        ];
        const intention = all.find((i) => i.id === id);
        if (intention) total += intention.pts;
      }
    }
    for (const [, checks] of Object.entries(data.workRitualChecks || {})) {
      for (const [id, taps] of Object.entries(checks)) {
        if (!taps) continue;
        const wr = data.workRituals.find((w) => w.id === id);
        if (!wr) continue;
        if (wr.twice) total += (wr.pts / 2) * taps;
        else total += wr.pts;
      }
    }
    for (const [, todos] of Object.entries(data.workTodos || {})) {
      for (const t of todos) {
        if (t.done) total += t.pts || 0;
      }
    }
    for (const [, checks] of Object.entries(data.weeklyChecks || {})) {
      for (const [id, checked] of Object.entries(checks)) {
        if (!checked) continue;
        const r = data.weeklyRhythms.find((w) => w.id === id);
        if (r) total += r.pts;
      }
    }
    for (const [, checks] of Object.entries(data.monthlyChecks || {})) {
      for (const [id, checked] of Object.entries(checks)) {
        if (!checked) continue;
        const r = data.monthlyRhythms.find((m) => m.id === id);
        if (r) total += r.pts;
      }
    }

    setData((prev) => ({ ...prev, totalEarned: Math.round(total) }));
    alert(`Total earned recalculated: ${Math.round(total).toLocaleString()} pts`);
  };

  return (
    <section>
      <SettingsHeader title="Maintenance" />
      <div style={cardStyle}>
        <p style={descStyle}>
          Safe to use. These fix common quirks without deleting any data.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <button
            onClick={forgiveAgingPenalties}
            style={{ ...secondaryButtonStyle, textAlign: 'left' }}
          >
            Forgive backlog-aging penalties
          </button>
          <button
            onClick={recalculateTotalEarned}
            style={{ ...secondaryButtonStyle, textAlign: 'left' }}
          >
            Recalculate points from history
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// DANGER ZONE
// ============================================================

function DangerZone({ setData }) {
  const hardReset = () => {
    if (
      !confirm(
        'THIS WILL DELETE ALL YOUR DATA. Export a backup first. Continue?',
      )
    )
      return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    const fresh = freshV6State();
    saveData(fresh);
    setData(fresh);
    alert('App reset to defaults.');
  };

  return (
    <section>
      <SettingsHeader title="Danger zone" danger />
      <div
        style={{
          ...cardStyle,
          borderColor: COLORS.red + '44',
        }}
      >
        <p style={descStyle}>
          Nuclear options. Export a backup first if you're not sure.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={hardReset}
            style={{
              ...secondaryButtonStyle,
              color: COLORS.red,
              borderColor: COLORS.red + '66',
              textAlign: 'left',
            }}
          >
            Reset app to defaults (keeps no data)
          </button>
        </div>
      </div>
    </section>
  );
}
