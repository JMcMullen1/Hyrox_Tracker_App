/**
 * Timer Engine
 * Robust stopwatch implementation that survives backgrounding
 * Uses timestamps to avoid drift
 */

import { saveTimerState, getTimerState, clearTimerState } from './db.js';
import { debounce } from './utils.js';

// Timer state
let timerState = {
    workoutId: null,
    mode: null,
    category: null,
    blocks: [],
    currentBlockIndex: 0,
    blockTimesMs: [],
    isRunning: false,
    isPaused: false,
    startTimestamp: null,
    pausedAt: null,
    accumulatedMs: 0,
    workoutStartTimestamp: null
};

// Callbacks
let onTickCallback = null;
let onBlockCompleteCallback = null;
let onWorkoutCompleteCallback = null;

// Animation frame ID
let animationFrameId = null;

// Save state debounced (every 500ms while running)
const saveStateDebounced = debounce(async () => {
    if (timerState.isRunning || timerState.isPaused) {
        await saveTimerState(timerState);
    }
}, 500);

/**
 * Initialize timer with blocks
 * @param {Object} config - Timer configuration
 * @param {string} config.workoutId - Unique workout ID
 * @param {string} config.mode - 'sim' or 'custom'
 * @param {string} config.category - 'amateur' or 'pro'
 * @param {Array} config.blocks - Array of workout blocks
 */
export function initTimer(config) {
    timerState = {
        workoutId: config.workoutId,
        mode: config.mode,
        category: config.category,
        blocks: config.blocks,
        currentBlockIndex: 0,
        blockTimesMs: new Array(config.blocks.length).fill(null),
        isRunning: false,
        isPaused: false,
        startTimestamp: null,
        pausedAt: null,
        accumulatedMs: 0,
        workoutStartTimestamp: null
    };
}

/**
 * Restore timer from saved state
 * @returns {Promise<Object|null>} Restored state or null
 */
export async function restoreTimer() {
    const savedState = await getTimerState();

    if (savedState && savedState.workoutId) {
        timerState = { ...savedState };
        return timerState;
    }

    return null;
}

/**
 * Start the timer
 */
export function startTimer() {
    if (timerState.isRunning) return;

    const now = Date.now();

    if (!timerState.workoutStartTimestamp) {
        timerState.workoutStartTimestamp = now;
    }

    if (timerState.isPaused) {
        // Resuming from pause
        timerState.startTimestamp = now;
        timerState.isPaused = false;
    } else {
        // Fresh start
        timerState.startTimestamp = now;
        timerState.accumulatedMs = 0;
    }

    timerState.isRunning = true;
    timerState.pausedAt = null;

    // Start the tick loop
    tick();

    // Save state
    saveStateDebounced();
}

/**
 * Pause the timer
 */
export function pauseTimer() {
    if (!timerState.isRunning || timerState.isPaused) return;

    const now = Date.now();
    const elapsed = now - timerState.startTimestamp;
    timerState.accumulatedMs += elapsed;
    timerState.isPaused = true;
    timerState.pausedAt = now;
    timerState.isRunning = false;

    // Cancel animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Save state immediately
    saveTimerState(timerState);
}

/**
 * Resume the timer
 */
export function resumeTimer() {
    if (!timerState.isPaused) return;
    startTimer();
}

/**
 * Stop the timer completely
 * @param {boolean} discard - Whether to discard the workout
 */
export async function stopTimer(discard = false) {
    timerState.isRunning = false;
    timerState.isPaused = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (discard) {
        await clearTimerState();
        resetTimerState();
    }
}

/**
 * Get current elapsed time for current block
 * @returns {number} Elapsed time in ms
 */
export function getCurrentElapsed() {
    if (!timerState.isRunning && !timerState.isPaused) {
        return 0;
    }

    if (timerState.isPaused) {
        return timerState.accumulatedMs;
    }

    const now = Date.now();
    return timerState.accumulatedMs + (now - timerState.startTimestamp);
}

/**
 * Get total workout elapsed time
 * @returns {number} Total elapsed time in ms
 */
export function getTotalElapsed() {
    if (!timerState.workoutStartTimestamp) {
        return 0;
    }

    // Sum of completed block times plus current block time
    const completedTime = timerState.blockTimesMs
        .filter(t => t !== null)
        .reduce((sum, t) => sum + t, 0);

    return completedTime + getCurrentElapsed();
}

/**
 * Move to next block
 * @returns {boolean} True if moved to next block, false if workout complete
 */
export function nextBlock() {
    const currentTime = getCurrentElapsed();

    // Save current block time
    timerState.blockTimesMs[timerState.currentBlockIndex] = currentTime;

    // Notify callback
    if (onBlockCompleteCallback) {
        onBlockCompleteCallback(timerState.currentBlockIndex, currentTime);
    }

    // Check if this was the last block
    if (timerState.currentBlockIndex >= timerState.blocks.length - 1) {
        // Workout complete
        timerState.isRunning = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (onWorkoutCompleteCallback) {
            const totalTime = timerState.blockTimesMs.reduce((sum, t) => sum + (t || 0), 0);
            onWorkoutCompleteCallback(timerState.blockTimesMs, totalTime);
        }

        return false;
    }

    // Move to next block
    timerState.currentBlockIndex++;
    timerState.accumulatedMs = 0;
    timerState.startTimestamp = Date.now();

    // Save state
    saveStateDebounced();

    return true;
}

/**
 * Finish the workout (called on last block)
 */
export function finishWorkout() {
    nextBlock();
}

/**
 * Get timer state
 * @returns {Object} Current timer state
 */
export function getState() {
    return { ...timerState };
}

/**
 * Check if timer is active
 * @returns {boolean} True if timer is running or paused
 */
export function isActive() {
    return timerState.isRunning || timerState.isPaused;
}

/**
 * Check if timer is running
 * @returns {boolean} True if timer is running
 */
export function isRunning() {
    return timerState.isRunning;
}

/**
 * Check if timer is paused
 * @returns {boolean} True if timer is paused
 */
export function isPaused() {
    return timerState.isPaused;
}

/**
 * Get current block index
 * @returns {number} Current block index
 */
export function getCurrentBlockIndex() {
    return timerState.currentBlockIndex;
}

/**
 * Get block times
 * @returns {Array} Array of block times in ms
 */
export function getBlockTimes() {
    return [...timerState.blockTimesMs];
}

/**
 * Check if on last block
 * @returns {boolean} True if on last block
 */
export function isLastBlock() {
    return timerState.currentBlockIndex >= timerState.blocks.length - 1;
}

/**
 * Set tick callback
 * @param {Function} callback - Called on each tick with elapsed ms
 */
export function onTick(callback) {
    onTickCallback = callback;
}

/**
 * Set block complete callback
 * @param {Function} callback - Called when a block is completed
 */
export function onBlockComplete(callback) {
    onBlockCompleteCallback = callback;
}

/**
 * Set workout complete callback
 * @param {Function} callback - Called when workout is completed
 */
export function onWorkoutComplete(callback) {
    onWorkoutCompleteCallback = callback;
}

/**
 * Timer tick loop
 */
function tick() {
    if (!timerState.isRunning) return;

    const elapsed = getCurrentElapsed();

    if (onTickCallback) {
        onTickCallback(elapsed);
    }

    // Save state periodically
    saveStateDebounced();

    // Schedule next tick
    animationFrameId = requestAnimationFrame(tick);
}

/**
 * Reset timer state
 */
function resetTimerState() {
    timerState = {
        workoutId: null,
        mode: null,
        category: null,
        blocks: [],
        currentBlockIndex: 0,
        blockTimesMs: [],
        isRunning: false,
        isPaused: false,
        startTimestamp: null,
        pausedAt: null,
        accumulatedMs: 0,
        workoutStartTimestamp: null
    };
}

/**
 * Clear timer state from storage
 */
export async function clearStoredTimerState() {
    await clearTimerState();
}

/**
 * Setup visibility change handler to persist state
 */
export function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden && (timerState.isRunning || timerState.isPaused)) {
            // Save state when app goes to background
            await saveTimerState(timerState);
        } else if (!document.hidden && timerState.isRunning) {
            // Resume tick loop when app comes back
            tick();
        }
    });

    // Also handle before unload
    window.addEventListener('beforeunload', () => {
        if (timerState.isRunning || timerState.isPaused) {
            // Synchronously save to localStorage as backup
            try {
                localStorage.setItem('hyrox_timer_backup', JSON.stringify(timerState));
            } catch (e) {
                console.error('Failed to save timer backup:', e);
            }
        }
    });

    // Check for backup on load
    window.addEventListener('load', async () => {
        try {
            const backup = localStorage.getItem('hyrox_timer_backup');
            if (backup) {
                const backupState = JSON.parse(backup);
                // Only restore if there's no existing state in IndexedDB
                const existing = await getTimerState();
                if (!existing || !existing.workoutId) {
                    await saveTimerState(backupState);
                }
                localStorage.removeItem('hyrox_timer_backup');
            }
        } catch (e) {
            console.error('Failed to restore timer backup:', e);
        }
    });
}
