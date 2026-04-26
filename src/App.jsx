// src/App.jsx
//
// The shell. Three jobs:
//   1. Load data from storage (with migration if needed)
//   2. Manage the active tab
//   3. Render the active tab with shared state and setters
//
// All actual content lives in tabs/ files.
// This file should stay small.

import { useState, useEffect, useCallback } from 'react';
import { loadData, saveData } from './utils/storage';
import { ensureV6Schema } from './utils/migration';
import { todayISO, formatLong } from './utils/dates';
import { COLORS, FONTS } from './utils/theme';
import { Wordmark } from './components/ui';
import TodayTab from './tabs/TodayTab';
import WeekTab from './tabs/WeekTab';
import TasksTab from './tabs/TasksTab';
import RewardsTab from './tabs/RewardsTab';
import SettingsTab from './tabs/SettingsTab';

// Tab definitions — order matters (this is the display order)
const TABS = [
  { id: 'today',    label: 'Today',    component: TodayTab },
  { id: 'week',     label: 'Week',     component: WeekTab },
  { id: 'tasks',    label: 'Tasks',    component: TasksTab },
  { id: 'rewards',  label: 'Rewards',  component: RewardsTab },
  { id: 'settings', label: 'Settings', component: SettingsTab },
];

export default function App() {
  // ------ Shared state ------
  // data: the whole app state. Everything reads from and writes to this.
  const [data, setDataState] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [viewDate, setViewDate] = useState(todayISO());

  // ------ Load on mount (runs once) ------
  useEffect(() => {
    const raw = loadData();
    const v6 = ensureV6Schema(raw);
    setDataState(v6);
    // Save back immediately so migration is persisted
    saveData(v6);
  }, []);

  // ------ Wrapped setter that persists automatically ------
  // Any component that wants to change data calls this.
  // It updates React state AND saves to storage — single source of truth.
  const setData = useCallback((updater) => {
    setDataState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveData(next);
      return next;
    });
  }, []);

  // ------ Loading state ------
  if (!data) {
    return (
      <div style={{
        padding: '2rem',
        fontFamily: FONTS.sans,
        color: COLORS.textMuted,
      }}>
        Loading…
      </div>
    );
  }

  // ------ Render ------
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || TodayTab;

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: FONTS.sans,
    }}>
      {/* Header — wordmark + date */}
      <header style={{
        padding: '1.75rem 2rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <Wordmark size={32} />
          <span style={{
            fontFamily: FONTS.mono,
            fontSize: '0.75rem',
            color: COLORS.textMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            {formatLong(viewDate)}
          </span>
        </div>
      </header>

      {/* Tab nav — pill treatment, active tab gets lime text + soft surface bg */}
      <nav style={{
        padding: '1.25rem 2rem 0',
        display: 'flex',
        gap: '0.25rem',
        borderBottom: `1px solid ${COLORS.hair}`,
        flexWrap: 'wrap',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? COLORS.surface : 'transparent',
                color: isActive ? COLORS.accent : COLORS.textMuted,
                border: 'none',
                borderTop: `1px solid ${isActive ? COLORS.hair : 'transparent'}`,
                borderLeft: `1px solid ${isActive ? COLORS.hair : 'transparent'}`,
                borderRight: `1px solid ${isActive ? COLORS.hair : 'transparent'}`,
                borderBottom: `2px solid ${isActive ? COLORS.accent : 'transparent'}`,
                borderRadius: '8px 8px 0 0',
                padding: '0.65rem 1.15rem',
                fontSize: '0.9rem',
                fontFamily: FONTS.sans,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                marginBottom: '-1px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = COLORS.text;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = COLORS.textMuted;
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Active tab */}
      <main>
        <ActiveComponent
          data={data}
          setData={setData}
          viewDate={viewDate}
          setViewDate={setViewDate}
        />
      </main>
    </div>
  );
}
