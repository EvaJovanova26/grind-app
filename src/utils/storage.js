// src/utils/storage.js
//
// The single source of truth for data persistence.
// Every read and write to app data flows through here.
//
// When we migrate to Supabase later, we only change the guts of these
// 4 functions. The rest of the app doesn't need to know where the data
// is actually stored.

const STORAGE_KEY = 'grind_app_data';
const SCHEMA_VERSION = 6; // bumped from v5 when we restructured

/**
 * Load the full app data from localStorage.
 * Returns null if nothing is stored yet (first-time user).
 */
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

/**
 * Save the full app data to localStorage.
 * Returns true on success, false on failure.
 */
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[storage] Failed to save data:', err);
    return false;
  }
}

/**
 * Export the current data as a downloadable JSON file.
 * Used by the Settings tab's backup button.
 */
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

/**
 * Import data from a JSON string (from a backup file).
 * Validates it looks like our schema before saving.
 * Returns true on success, false on failure.
 */
export function importJSON(rawString) {
  try {
    const parsed = JSON.parse(rawString);

    // Basic shape validation — must at least have rituals array
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

/**
 * Get the current schema version of stored data.
 * Used by migration logic to know if data needs upgrading.
 */
export function getStoredSchemaVersion() {
  const data = loadData();
  if (!data) return null;
  return data.schemaVersion || 5; // assume v5 if no version field
}

/**
 * The current schema version the app expects.
 * Exported so migration can compare.
 */
export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;