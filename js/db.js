/**
 * IndexedDB Database Module
 * Handles all data persistence for the Hyrox Tracker app
 */

const DB_NAME = 'HyroxTrackerDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
    WORKOUT_SESSIONS: 'workoutSessions',
    WORKOUT_TEMPLATES: 'workoutTemplates',
    PERSONAL_BESTS: 'personalBests',
    META: 'meta'
};

let db = null;

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function initDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Failed to open database:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database initialized successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Workout Sessions Store
            if (!database.objectStoreNames.contains(STORES.WORKOUT_SESSIONS)) {
                const sessionStore = database.createObjectStore(STORES.WORKOUT_SESSIONS, { keyPath: 'id' });
                sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
                sessionStore.createIndex('finishedAt', 'finishedAt', { unique: false });
                sessionStore.createIndex('mode', 'mode', { unique: false });
                sessionStore.createIndex('category', 'category', { unique: false });
            }

            // Workout Templates Store
            if (!database.objectStoreNames.contains(STORES.WORKOUT_TEMPLATES)) {
                const templateStore = database.createObjectStore(STORES.WORKOUT_TEMPLATES, { keyPath: 'id' });
                templateStore.createIndex('name', 'name', { unique: false });
                templateStore.createIndex('category', 'category', { unique: false });
            }

            // Personal Bests Store
            if (!database.objectStoreNames.contains(STORES.PERSONAL_BESTS)) {
                const pbStore = database.createObjectStore(STORES.PERSONAL_BESTS, { keyPath: 'id' });
                pbStore.createIndex('category', 'category', { unique: false });
                pbStore.createIndex('exerciseId', 'exerciseId', { unique: false });
            }

            // Meta Store (settings, timer state, etc.)
            if (!database.objectStoreNames.contains(STORES.META)) {
                database.createObjectStore(STORES.META, { keyPath: 'key' });
            }

            console.log('Database schema created/updated');
        };
    });
}

/**
 * Get database instance
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
    if (!db) {
        await initDB();
    }
    return db;
}

/**
 * Generic add operation
 * @param {string} storeName - Store name
 * @param {Object} data - Data to add
 * @returns {Promise<string>} Added item's key
 */
export async function add(storeName, data) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic put operation (add or update)
 * @param {string} storeName - Store name
 * @param {Object} data - Data to put
 * @returns {Promise<string>} Item's key
 */
export async function put(storeName, data) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic get operation
 * @param {string} storeName - Store name
 * @param {string} key - Item key
 * @returns {Promise<Object|undefined>} Retrieved item
 */
export async function get(storeName, key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic getAll operation
 * @param {string} storeName - Store name
 * @returns {Promise<Array>} All items in store
 */
export async function getAll(storeName) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Generic delete operation
 * @param {string} storeName - Store name
 * @param {string} key - Item key
 * @returns {Promise<void>}
 */
export async function remove(storeName, key) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get items by index
 * @param {string} storeName - Store name
 * @param {string} indexName - Index name
 * @param {*} value - Index value to match
 * @returns {Promise<Array>} Matching items
 */
export async function getByIndex(storeName, indexName, value) {
    const database = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// ============================================
// Workout Sessions
// ============================================

/**
 * Save a workout session
 * @param {Object} session - Workout session data
 * @returns {Promise<string>} Session ID
 */
export async function saveWorkoutSession(session) {
    return put(STORES.WORKOUT_SESSIONS, session);
}

/**
 * Get a workout session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object|undefined>} Session data
 */
export async function getWorkoutSession(id) {
    return get(STORES.WORKOUT_SESSIONS, id);
}

/**
 * Get all workout sessions
 * @returns {Promise<Array>} All sessions sorted by date (newest first)
 */
export async function getAllWorkoutSessions() {
    const sessions = await getAll(STORES.WORKOUT_SESSIONS);
    return sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

/**
 * Get workout sessions by category
 * @param {string} category - 'amateur' or 'pro'
 * @returns {Promise<Array>} Sessions for category
 */
export async function getWorkoutSessionsByCategory(category) {
    return getByIndex(STORES.WORKOUT_SESSIONS, 'category', category);
}

/**
 * Get workout sessions by mode
 * @param {string} mode - 'sim' or 'custom'
 * @returns {Promise<Array>} Sessions for mode
 */
export async function getWorkoutSessionsByMode(mode) {
    return getByIndex(STORES.WORKOUT_SESSIONS, 'mode', mode);
}

/**
 * Delete a workout session
 * @param {string} id - Session ID
 * @returns {Promise<void>}
 */
export async function deleteWorkoutSession(id) {
    return remove(STORES.WORKOUT_SESSIONS, id);
}

// ============================================
// Workout Templates
// ============================================

/**
 * Save a workout template
 * @param {Object} template - Template data
 * @returns {Promise<string>} Template ID
 */
export async function saveWorkoutTemplate(template) {
    return put(STORES.WORKOUT_TEMPLATES, template);
}

/**
 * Get a workout template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object|undefined>} Template data
 */
export async function getWorkoutTemplate(id) {
    return get(STORES.WORKOUT_TEMPLATES, id);
}

/**
 * Get all workout templates
 * @returns {Promise<Array>} All templates
 */
export async function getAllWorkoutTemplates() {
    return getAll(STORES.WORKOUT_TEMPLATES);
}

/**
 * Get templates by category
 * @param {string} category - 'amateur' or 'pro'
 * @returns {Promise<Array>} Templates for category
 */
export async function getTemplatesByCategory(category) {
    return getByIndex(STORES.WORKOUT_TEMPLATES, 'category', category);
}

/**
 * Delete a workout template
 * @param {string} id - Template ID
 * @returns {Promise<void>}
 */
export async function deleteWorkoutTemplate(id) {
    return remove(STORES.WORKOUT_TEMPLATES, id);
}

// ============================================
// Personal Bests
// ============================================

/**
 * Get PB key
 * @param {string} category - 'amateur' or 'pro'
 * @param {string} exerciseId - Exercise ID
 * @returns {string} Composite key
 */
function getPBKey(category, exerciseId) {
    return `${category}:${exerciseId}`;
}

/**
 * Get personal best for an exercise
 * @param {string} category - 'amateur' or 'pro'
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<number|null>} Best time in ms or null
 */
export async function getPersonalBest(category, exerciseId) {
    const key = getPBKey(category, exerciseId);
    const pb = await get(STORES.PERSONAL_BESTS, key);
    return pb ? pb.bestTimeMs : null;
}

/**
 * Update personal best if new time is better
 * @param {string} category - 'amateur' or 'pro'
 * @param {string} exerciseId - Exercise ID
 * @param {number} timeMs - New time in ms
 * @returns {Promise<boolean>} True if PB was updated
 */
export async function updatePersonalBest(category, exerciseId, timeMs) {
    const key = getPBKey(category, exerciseId);
    const existing = await get(STORES.PERSONAL_BESTS, key);

    if (!existing || timeMs < existing.bestTimeMs) {
        await put(STORES.PERSONAL_BESTS, {
            id: key,
            category,
            exerciseId,
            bestTimeMs: timeMs,
            achievedAt: new Date().toISOString()
        });
        return true;
    }

    return false;
}

/**
 * Get all personal bests for a category
 * @param {string} category - 'amateur' or 'pro'
 * @returns {Promise<Object>} Map of exerciseId to bestTimeMs
 */
export async function getAllPersonalBests(category) {
    const pbs = await getByIndex(STORES.PERSONAL_BESTS, 'category', category);
    const pbMap = {};
    for (const pb of pbs) {
        pbMap[pb.exerciseId] = pb.bestTimeMs;
    }
    return pbMap;
}

/**
 * Get full sim PB total time
 * @param {string} category - 'amateur' or 'pro'
 * @returns {Promise<number|null>} Best total time in ms or null
 */
export async function getSimPB(category) {
    const key = getPBKey(category, 'full_sim_total');
    const pb = await get(STORES.PERSONAL_BESTS, key);
    return pb ? pb.bestTimeMs : null;
}

/**
 * Update full sim PB if new time is better
 * @param {string} category - 'amateur' or 'pro'
 * @param {number} totalTimeMs - New total time in ms
 * @returns {Promise<boolean>} True if PB was updated
 */
export async function updateSimPB(category, totalTimeMs) {
    return updatePersonalBest(category, 'full_sim_total', totalTimeMs);
}

// ============================================
// Meta / Settings
// ============================================

/**
 * Get a meta value
 * @param {string} key - Meta key
 * @param {*} defaultValue - Default value if not found
 * @returns {Promise<*>} Stored value or default
 */
export async function getMeta(key, defaultValue = null) {
    const item = await get(STORES.META, key);
    return item ? item.value : defaultValue;
}

/**
 * Set a meta value
 * @param {string} key - Meta key
 * @param {*} value - Value to store
 * @returns {Promise<void>}
 */
export async function setMeta(key, value) {
    return put(STORES.META, { key, value });
}

/**
 * Get timer recovery state
 * @returns {Promise<Object|null>} Timer state or null
 */
export async function getTimerState() {
    return getMeta('timerState', null);
}

/**
 * Save timer recovery state
 * @param {Object} state - Timer state
 * @returns {Promise<void>}
 */
export async function saveTimerState(state) {
    return setMeta('timerState', state);
}

/**
 * Clear timer recovery state
 * @returns {Promise<void>}
 */
export async function clearTimerState() {
    return remove(STORES.META, 'timerState');
}

/**
 * Get toggle setting for a screen
 * @param {string} screen - Screen name
 * @returns {Promise<string>} 'amateur' or 'pro'
 */
export async function getToggleSetting(screen) {
    return getMeta(`toggle_${screen}`, 'amateur');
}

/**
 * Set toggle setting for a screen
 * @param {string} screen - Screen name
 * @param {string} value - 'amateur' or 'pro'
 * @returns {Promise<void>}
 */
export async function setToggleSetting(screen, value) {
    return setMeta(`toggle_${screen}`, value);
}

/**
 * Get last visited route
 * @returns {Promise<string>} Route path
 */
export async function getLastRoute() {
    return getMeta('lastRoute', 'dashboard');
}

/**
 * Set last visited route
 * @param {string} route - Route path
 * @returns {Promise<void>}
 */
export async function setLastRoute(route) {
    return setMeta('lastRoute', route);
}
