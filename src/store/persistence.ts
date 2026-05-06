import { bankStore, type BankState } from './bank-store.ts';

const DB_NAME = 'fmatelier';
const DB_VERSION = 1;
const STORE_NAME = 'bank';
const STATE_KEY = 'current';
const DEBOUNCE_MS = 500;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveState(db: IDBDatabase, state: BankState): void {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(
    {
      bank: state.bank,
      selectedVoiceIndex: state.selectedVoiceIndex,
      selectedOperator: state.selectedOperator,
      dirty: state.dirty,
      fileName: state.fileName,
    },
    STATE_KEY,
  );
}

function loadState(db: IDBDatabase): Promise<BankState | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function initPersistence(): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openDB();
  } catch {
    return; // IndexedDB unavailable — silently degrade
  }

  // Restore previous session state
  try {
    const saved = await loadState(db);
    if (saved) {
      bankStore.restoreState(saved);
    }
  } catch { /* ignore restore failure */ }

  // Auto-save on state changes (debounced)
  let timer: ReturnType<typeof setTimeout> | null = null;
  bankStore.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveState(db, state);
    }, DEBOUNCE_MS);
  });

  // Warn before closing with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (bankStore.getState().dirty) {
      e.preventDefault();
    }
  });
}
