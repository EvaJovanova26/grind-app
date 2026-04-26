// src/utils/storage.js
//
// The single source of truth for data persistence.

const STORAGE_KEY = 'grind_app_data';
const SCHEMA_VERSION = 8; // bumped from v7 — penalty payments are now itemized

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('[storage] Failed to load data:', err);
    return null;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[storage] Failed to save data:', err);
    return false;
  }
}

export function exportJSON() {
  const data = loadData();
  if (!data) {
    console.warn('[storage] No data to export');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `grind-backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(rawString) {
  try {
    const parsed = JSON.parse(rawString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Not a valid JSON object');
    }
    if (!Array.isArray(parsed.rituals)) {
      throw new Error('Missing rituals array — this doesn\'t look like a grind backup');
    }
    saveData(parsed);
    return true;
  } catch (err) {
    console.error('[storage] Failed to import data:', err);
    return false;
  }
}

export function getStoredSchemaVersion() {
  const data = loadData();
  if (!data) return null;
  return data.schemaVersion || 5;
}

export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;
