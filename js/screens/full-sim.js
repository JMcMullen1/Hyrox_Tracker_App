/**
 * Full Sim Screen
 * Complete Hyrox simulation workout mode
 */

import { createToggle } from '../components/toggle.js';
import { createWorkoutBlockList, setBlockActive, setBlockCompleted, scrollToActiveBlock, updateBlockTime } from '../components/workout-block.js';
import { createStopwatch } from '../components/stopwatch.js';
import { createResultsView, createSeeResultsButton } from '../components/results-card.js';
import { showStopWorkoutModal } from '../components/modal.js';
import { HYROX_SIM_BLOCKS } from '../exercises.js';
import { generateId, deepClone } from '../utils.js';
import { navigate } from '../router.js';
import {
    initTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    nextBlock,
    finishWorkout,
    onTick,
    onBlockComplete,
    onWorkoutComplete,
    getCurrentElapsed,
    getCurrentBlockIndex,
    getBlockTimes,
    isRunning,
    isPaused,
    isLastBlock,
    isActive,
    getState,
    clearStoredTimerState
} from '../timer.js';
import {
    saveWorkoutSession,
    updatePersonalBest,
    updateSimPB,
    getAllPersonalBests,
    getToggleSetting
} from '../db.js';
import { getCanonicalExerciseId } from '../exercises.js';

let container = null;
let currentCategory = 'amateur';
let workoutActive = false;
let workoutComplete = false;
let currentWorkout = null;
let blocksContainer = null;
let stopwatchComponent = null;
let toggle = null;

/**
 * Render the full sim screen
 * @returns {HTMLElement} Screen element
 */
export function render() {
    container = document.createElement('div');
    container.className = 'screen full-sim-screen';

    return container;
}

/**
 * Called after render
 */
export async function onMount() {
    // Get saved category
    currentCategory = await getToggleSetting('full-sim');

    if (workoutActive || workoutComplete) {
        // Re-render active workout
        renderActiveWorkout();
    } else {
        renderSetupView();
    }
}

/**
 * Render setup view (before workout starts)
 */
function renderSetupView() {
    workoutActive = false;
    workoutComplete = false;

    container.innerHTML = '';

    // Toggle
    toggle = createToggle({
        screen: 'full-sim',
        onChange: async (value) => {
            currentCategory = value;
            renderBlocks();
        }
    });
    container.appendChild(toggle);

    // Title
    const title = document.createElement('h2');
    title.className = 'section-title mb-md';
    title.textContent = currentCategory === 'pro' ? 'Hyrox Pro (Elite)' : 'Hyrox Open (Amateur)';
    title.id = 'sim-title';
    container.appendChild(title);

    // Blocks container
    const blocksWrapper = document.createElement('div');
    blocksWrapper.id = 'blocks-wrapper';
    container.appendChild(blocksWrapper);

    renderBlocks();

    // Start button
    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary btn-full btn-lg mt-md';
    startBtn.textContent = 'Start Workout';
    startBtn.addEventListener('click', startWorkout);
    container.appendChild(startBtn);
}

/**
 * Render blocks list
 */
function renderBlocks() {
    const wrapper = document.getElementById('blocks-wrapper');
    if (!wrapper) return;

    const titleEl = document.getElementById('sim-title');
    if (titleEl) {
        titleEl.textContent = currentCategory === 'pro' ? 'Hyrox Pro (Elite)' : 'Hyrox Open (Amateur)';
    }

    const blocks = HYROX_SIM_BLOCKS[currentCategory];
    wrapper.innerHTML = '';

    blocksContainer = createWorkoutBlockList(blocks, {
        activeIndex: -1,
        blockTimes: [],
        showIndex: true
    });

    wrapper.appendChild(blocksContainer);
}

/**
 * Start the workout
 */
function startWorkout() {
    const blocks = deepClone(HYROX_SIM_BLOCKS[currentCategory]);
    const workoutId = generateId();

    currentWorkout = {
        id: workoutId,
        mode: 'sim',
        category: currentCategory,
        blocks: blocks,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        blockTimesMs: [],
        totalTimeMs: 0
    };

    // Initialize timer
    initTimer({
        workoutId,
        mode: 'sim',
        category: currentCategory,
        blocks
    });

    // Set up callbacks
    onTick((elapsed) => {
        if (stopwatchComponent) {
            stopwatchComponent.updateDisplay(elapsed);
        }
    });

    onBlockComplete((blockIndex, timeMs) => {
        currentWorkout.blockTimesMs[blockIndex] = timeMs;

        // Update block display
        const blockEl = blocksContainer?.querySelector(`[data-block-index="${blockIndex}"]`);
        if (blockEl) {
            setBlockCompleted(blockEl, timeMs);
        }

        // Activate next block
        const nextIndex = blockIndex + 1;
        if (nextIndex < blocks.length) {
            const nextBlockEl = blocksContainer?.querySelector(`[data-block-index="${nextIndex}"]`);
            if (nextBlockEl) {
                setBlockActive(nextBlockEl);
                scrollToActiveBlock(blocksContainer, nextIndex);
            }

            // Update stopwatch for last block
            if (stopwatchComponent && nextIndex === blocks.length - 1) {
                stopwatchComponent.setLastBlock(true);
            }
        }
    });

    onWorkoutComplete(async (blockTimes, totalTime) => {
        currentWorkout.blockTimesMs = blockTimes;
        currentWorkout.totalTimeMs = totalTime;
        currentWorkout.finishedAt = new Date().toISOString();

        workoutActive = false;
        workoutComplete = true;

        // Fetch PBs BEFORE updating them, so results can compare against previous PBs
        const previousPBs = await getAllPersonalBests(currentCategory);
        const previousSimPB = await import('../db.js').then(m => m.getSimPB(currentCategory));
        previousPBs['full_sim_total'] = previousSimPB;

        // Store previous PBs with workout for history comparison
        currentWorkout.previousPBs = previousPBs;

        // Save workout (includes previousPBs for later viewing)
        await saveWorkoutSession(currentWorkout);

        // Update PBs (after fetching the previous ones)
        await updatePBs();

        // Clear timer state
        await clearStoredTimerState();

        // Show completion view with previous PBs for comparison
        renderCompletionView(previousPBs);
    });

    workoutActive = true;
    renderActiveWorkout();

    // Start the timer
    startTimer();
}

/**
 * Render active workout view
 */
function renderActiveWorkout() {
    container.innerHTML = '';

    const blocks = currentWorkout?.blocks || HYROX_SIM_BLOCKS[currentCategory];
    const currentIndex = getCurrentBlockIndex();
    const blockTimes = getBlockTimes();

    // Title
    const header = document.createElement('div');
    header.className = 'section-header mb-md';
    header.innerHTML = `
        <h2 class="section-title">${currentCategory === 'pro' ? 'Hyrox Pro' : 'Hyrox Open'}</h2>
        <span class="history-item-badge ${currentCategory}">${currentCategory}</span>
    `;
    container.appendChild(header);

    // Blocks
    blocksContainer = createWorkoutBlockList(blocks, {
        activeIndex: currentIndex,
        blockTimes: blockTimes,
        showIndex: true
    });
    container.appendChild(blocksContainer);

    // Stopwatch
    stopwatchComponent = createStopwatch({
        isLastBlock: isLastBlock(),
        isPaused: isPaused(),
        onPause: () => {
            pauseTimer();
            stopwatchComponent.setPaused(true);
        },
        onResume: () => {
            resumeTimer();
            stopwatchComponent.setPaused(false);
        },
        onStop: async () => {
            const action = await showStopWorkoutModal();
            if (action === 'discard') {
                await stopTimer(true);
                workoutActive = false;
                currentWorkout = null;
                renderSetupView();
            }
        },
        onNext: () => {
            nextBlock();
        },
        onFinish: () => {
            finishWorkout();
        }
    });

    // Update display with current time
    stopwatchComponent.updateDisplay(getCurrentElapsed());
    stopwatchComponent.setPaused(isPaused());

    container.appendChild(stopwatchComponent);

    // Scroll to active block
    scrollToActiveBlock(blocksContainer, currentIndex);
}

/**
 * Render completion view
 * @param {Object} pbs - Previous personal bests for comparison (fetched before updating)
 */
async function renderCompletionView(pbs = null) {
    container.innerHTML = '';

    // If no PBs passed, use stored previousPBs from workout or fetch current PBs
    if (!pbs) {
        pbs = currentWorkout?.previousPBs || await getAllPersonalBests(currentCategory);
        if (!currentWorkout?.previousPBs) {
            const simPB = await import('../db.js').then(m => m.getSimPB(currentCategory));
            pbs['full_sim_total'] = simPB;
        }
    }

    // Show "See Results" button first
    const completionDiv = document.createElement('div');
    completionDiv.className = 'text-center';
    completionDiv.style.padding = '48px 16px';

    completionDiv.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 24px;">🎉</div>
        <h2 style="color: var(--color-gold); margin-bottom: 8px;">Workout Complete!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 32px;">Great work finishing your Hyrox simulation!</p>
    `;

    const seeResultsBtn = createSeeResultsButton(() => {
        container.innerHTML = '';
        const resultsView = createResultsView(currentWorkout, pbs);
        container.appendChild(resultsView);

        // Add done button
        const doneBtn = document.createElement('button');
        doneBtn.className = 'btn btn-primary btn-full mt-md';
        doneBtn.textContent = 'Done';
        doneBtn.addEventListener('click', () => {
            workoutComplete = false;
            currentWorkout = null;
            navigate('dashboard');
        });
        container.appendChild(doneBtn);
    });

    completionDiv.appendChild(seeResultsBtn);
    container.appendChild(completionDiv);

    // Add "Start New" button
    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-secondary btn-full mt-md';
    newBtn.textContent = 'Start New Workout';
    newBtn.addEventListener('click', () => {
        workoutComplete = false;
        currentWorkout = null;
        renderSetupView();
    });
    container.appendChild(newBtn);
}

/**
 * Update personal bests from completed workout
 */
async function updatePBs() {
    if (!currentWorkout) return;

    const { blocks, blockTimesMs, totalTimeMs, category } = currentWorkout;

    // Update per-exercise PBs
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const time = blockTimesMs[i];

        if (time) {
            const exerciseId = getCanonicalExerciseId(block, category);
            if (exerciseId) {
                await updatePersonalBest(category, exerciseId, time);
            }
        }
    }

    // Update full sim PB
    if (totalTimeMs > 0) {
        await updateSimPB(category, totalTimeMs);
    }
}
