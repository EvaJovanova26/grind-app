// src/App.jsx
//
// The shell. Three jobs:
//   1. Load data from storage (with migration if needed)
//   2. Manage the active tab
//   3. Render the active tab with shared state and setters
//
// All actual content lives in tabs/ files (Delivery 3+).
// This file should stay small.

import { useState, useEffect, useCallback } from 'react';
import { loadData, saveData } from './utils/storage';
import { ensureV6Schema } from './utils/migration';
import { todayISO, formatLong } from './utils/dates';
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
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        Loading…
      </div>
    );
  }

  // ------ Render ------
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || TodayTab;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e8e8e8',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '1.5rem 2rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>
            nudge
          </h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.5, fontSize: '0.9rem' }}>
            {formatLong(viewDate)}
          </p>
        </div>
      </header>

      {/* Tab nav */}
      <nav style={{
        padding: '1.5rem 2rem 0',
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #222',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
              color: activeTab === tab.id ? '#d9f66f' : '#888',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #d9f66f' : '2px solid transparent',
              padding: '0.75rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
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