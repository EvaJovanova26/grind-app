// src/tabs/SettingsTab.jsx
//
// Settings: data export/import, schema info, reset actions.
// The plumbing all lives in utils/storage.js — this is just UI.

import { useRef, useState } from 'react';
import { exportJSON, importJSON, loadData, saveData } from '../utils/storage';
import { freshV6State } from '../utils/migration';

const COLORS = {
  bg: '#0a0a0a',
  card: '#141414',
  cardHover: '#1a1a1a',
  border: '#222',
  text: '#e8e8e8',
  textDim: '#888',
  textFaint: '#555',
  accent: '#d9f66f',
  danger: '#ef4444',
  warning: '#f59e0b',
};

const cardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '1.25rem',
};

export default function SettingsTab({ data, setData }) {
  return (
    <div style={{
      padding: '1.5rem 2rem 4rem',
      maxWidth: '800px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      <DataSection setData={setData} />
      <InfoSection data={data} />
      <MaintenanceSection data={data} setData={setData} />
      <DangerZone setData={setData} />
    </div>
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

    if (!confirm('Importing will REPLACE all current data with the backup contents. Continue?')) {
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
      <h2 style={headerStyle}>Data</h2>
      <div style={cardStyle}>
        <p style={descStyle}>
          Back up your data to a JSON file, or restore from a previous backup.
          Do this before any major changes.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
          <div style={{
            marginTop: '0.75rem',
            fontSize: '0.85rem',
            color: status.type === 'success' ? COLORS.accent : COLORS.danger,
          }}>
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
    { label: 'Intentions', value: data.intentions.body.length + data.intentions.mind.length + data.intentions.life.length },
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
    { label: 'Total points earned', value: (data.totalEarned || 0).toLocaleString() },
    { label: 'Total points spent', value: (data.totalSpent || 0).toLocaleString() },
  ];

  return (
    <section>
      <h2 style={headerStyle}>App info</h2>
      <div style={cardStyle}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.5rem',
        }}>
          {counts.map(c => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                fontSize: '0.85rem',
              }}
            >
              <span style={{ color: COLORS.textDim }}>{c.label}</span>
              <span style={{ color: COLORS.text, fontVariantNumeric: 'tabular-nums' }}>
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
    const agingPenalties = (data.penaltyLog || []).filter(p =>
      p.id && p.id.startsWith('backlog_aging_')
    );
    if (agingPenalties.length === 0) {
      alert('No aging penalties to forgive.');
      return;
    }
    if (!confirm(`Remove ${agingPenalties.length} backlog-aging penalties from your log?`)) return;

    setData(prev => ({
      ...prev,
      penaltyLog: prev.penaltyLog.filter(p => !(p.id && p.id.startsWith('backlog_aging_'))),
    }));
  };

  const recalculateTotalEarned = () => {
    // Walk all historical checks and rebuild totalEarned from scratch
    let total = 0;

    for (const [, checks] of Object.entries(data.ritualChecks || {})) {
      for (const [id, taps] of Object.entries(checks)) {
        if (!taps) continue;
        const ritual = data.rituals.find(r => r.id === id);
        if (!ritual) continue;
        if (ritual.water) total += taps * 2;
        else if (ritual.twice) total += (ritual.pts / 2) * taps;
        else total += ritual.pts;
      }
    }
    for (const [, checks] of Object.entries(data.intentionChecks || {})) {
      for (const [id, checked] of Object.entries(checks)) {
        if (!checked) continue;
        const all = [...data.intentions.body, ...data.intentions.mind, ...data.intentions.life];
        const intention = all.find(i => i.id === id);
        if (intention) total += intention.pts;
      }
    }
    for (const [, checks] of Object.entries(data.workRitualChecks || {})) {
      for (const [id, taps] of Object.entries(checks)) {
        if (!taps) continue;
        const wr = data.workRituals.find(w => w.id === id);
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
        const r = data.weeklyRhythms.find(w => w.id === id);
        if (r) total += r.pts;
      }
    }
    for (const [, checks] of Object.entries(data.monthlyChecks || {})) {
      for (const [id, checked] of Object.entries(checks)) {
        if (!checked) continue;
        const r = data.monthlyRhythms.find(m => m.id === id);
        if (r) total += r.pts;
      }
    }

    setData(prev => ({ ...prev, totalEarned: Math.round(total) }));
    alert(`Total earned recalculated: ${Math.round(total).toLocaleString()} pts`);
  };

  return (
    <section>
      <h2 style={headerStyle}>Maintenance</h2>
      <div style={cardStyle}>
        <p style={descStyle}>
          Safe to use. These fix common quirks without deleting any data.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={forgiveAgingPenalties} style={secondaryButtonStyle}>
            Forgive backlog-aging penalties
          </button>
          <button onClick={recalculateTotalEarned} style={secondaryButtonStyle}>
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
    if (!confirm('THIS WILL DELETE ALL YOUR DATA. Export a backup first. Continue?')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    const fresh = freshV6State();
    saveData(fresh);
    setData(fresh);
    alert('App reset to defaults.');
  };

  return (
    <section>
      <h2 style={{ ...headerStyle, color: COLORS.danger }}>Danger zone</h2>
      <div style={{
        ...cardStyle,
        borderColor: COLORS.danger + '44',
      }}>
        <p style={descStyle}>
          Nuclear options. Export a backup first if you're not sure.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={hardReset}
            style={{
              ...secondaryButtonStyle,
              color: COLORS.danger,
              borderColor: COLORS.danger + '66',
            }}
          >
            Reset app to defaults (keeps no data)
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// STYLES
// ============================================================

const headerStyle = {
  margin: '0 0 0.75rem',
  fontSize: '1.1rem',
  fontWeight: 600,
  color: COLORS.text,
};

const descStyle = {
  margin: 0,
  fontSize: '0.85rem',
  color: COLORS.textDim,
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  background: COLORS.accent,
  color: '#000',
  border: 'none',
  borderRadius: '6px',
  padding: '0.55rem 1rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  background: 'transparent',
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '0.55rem 1rem',
  fontSize: '0.9rem',
  cursor: 'pointer',
  textAlign: 'left',
};