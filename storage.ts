// A simple Promise-based wrapper for IndexedDB
// This avoids adding a third-party library.

const DB_NAME = 'FinancialOrganizerDB';
const STORE_NAME = 'user_data';
const MIGRATION_KEY = 'financial-organizer-migration-v1-complete';

let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
  return dbPromise;
}

export async function get<T>(key: string): Promise<T | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result !== undefined ? request.result : null);
    };

    request.onerror = () => {
      console.error(`Error getting data for key: ${key}`, request.error);
      reject(request.error);
    };
  });
}

export async function set(key: string, value: any): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`Error setting data for key: ${key}`, request.error);
      reject(request.error);
    };
  });
}

export async function remove(key: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error(`Error removing data for key: ${key}`, request.error);
      reject(request.error);
    };
  });
}

export async function migrateFromLocalStorage() {
  try {
    const migrationComplete = window.localStorage.getItem(MIGRATION_KEY);
    if (migrationComplete === 'true') {
      return;
    }

    console.log("Starting migration from localStorage to IndexedDB...");

    const keysToMigrate: { key: string; value: string }[] = [];
    const keysToKeep = [
        'financial-organizer-currentUser',
        'financial-organizer-lastUser',
        'financial-organizer-theme',
        'financial-organizer-users',
        MIGRATION_KEY
    ];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('financial-organizer-') && !keysToKeep.includes(key)) {
        const value = window.localStorage.getItem(key);
        if (value) {
            keysToMigrate.push({ key, value });
        }
      }
    }

    if (keysToMigrate.length === 0) {
        console.log("No data to migrate.");
        window.localStorage.setItem(MIGRATION_KEY, 'true');
        return;
    }

    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);

        keysToMigrate.forEach(({ key, value }) => {
            try {
                const parsedValue = JSON.parse(value);
                store.put(parsedValue, key);
            } catch (e) {
                console.warn(`Could not parse localStorage item ${key}, skipping.`);
            }
        });
    });

    console.log(`Migration successful. Migrated ${keysToMigrate.length} items.`);
    window.localStorage.setItem(MIGRATION_KEY, 'true');

  } catch (error) {
    console.error("Migration from localStorage failed:", error);
  }
}