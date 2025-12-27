/**
 * Results Card Component
 * Displays workout results with full comparison table
 */

import { formatTime, formatLongTime, calculateDelta } from '../utils.js';
import { EXERCISE_DISPLAY_NAMES, getCanonicalExerciseId } from '../exercises.js';
import { getAllPersonalBests, getSimPB } from '../db.js';

/**
 * Create results view with full comparison table
 * @param {Object} workout - Completed workout data
 * @param {Object} pbs - Personal bests for comparison
 * @returns {HTMLElement} Results container
 */
export function createResultsView(workout, pbs = {}) {
    const container = document.createElement('div');
    container.className = 'results-container';

    const totalTime = workout.totalTimeMs;
    const simPB = pbs['full_sim_total'];
    const totalDelta = simPB ? calculateDelta(totalTime, simPB) : null;

    // Create header
    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `
        <h1 class="results-title">Workout Complete!</h1>
        <p class="results-subtitle">${workout.mode === 'sim' ? 'Full Hyrox Simulation' : 'Custom Workout'}</p>
    `;
    container.appendChild(header);

    // Total time card
    const totalCard = document.createElement('div');
    totalCard.className = 'pb-card';
    totalCard.innerHTML = `
        <div class="pb-title">Total Time</div>
        <div class="pb-value">${formatLongTime(totalTime)}</div>
        ${workout.mode === 'sim' && simPB ? `
            <div style="margin-top: 12px; display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="color: var(--text-muted); font-size: 14px;">PB: ${formatLongTime(simPB)}</span>
                ${totalDelta ? `<span class="delta ${totalDelta.type}">${totalDelta.formatted}</span>` : ''}
            </div>
        ` : ''}
    `;
    container.appendChild(totalCard);

    // Full comparison table
    const tableCard = document.createElement('div');
    tableCard.className = 'card';
    tableCard.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">Exercise Breakdown</h3>
        </div>
        <div class="results-table">
            <div class="results-table-header">
                <span class="results-col-exercise">Exercise</span>
                <span class="results-col-time">Time</span>
                <span class="results-col-pb">PB</span>
                <span class="results-col-delta">+/-</span>
            </div>
            <div class="results-table-body">
                ${workout.blocks.map((block, index) => {
                    const exerciseId = getCanonicalExerciseId(block, workout.category);
                    const pbTime = exerciseId ? pbs[exerciseId] : null;
                    const currentTime = workout.blockTimesMs[index];
                    const delta = pbTime ? calculateDelta(currentTime, pbTime) : null;
                    const isNewPB = delta && delta.value < 0;

                    return `
                        <div class="results-table-row ${isNewPB ? 'new-pb' : ''}">
                            <span class="results-col-exercise">
                                ${block.label}
                                ${isNewPB ? '<span class="new-pb-badge">NEW PB!</span>' : ''}
                            </span>
                            <span class="results-col-time">${formatTime(currentTime, false)}</span>
                            <span class="results-col-pb">${pbTime ? formatTime(pbTime, false) : '-'}</span>
                            <span class="results-col-delta">
                                ${delta ? `<span class="delta ${delta.type}">${delta.formatted}</span>` : '-'}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    container.appendChild(tableCard);

    // Summary stats
    const stats = calculateStats(workout, pbs);
    const statsCard = document.createElement('div');
    statsCard.className = 'stats-grid';
    statsCard.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.newPBs}</div>
            <div class="stat-label">New PBs</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.exerciseCount}</div>
            <div class="stat-label">Exercises</div>
        </div>
    `;
    container.appendChild(statsCard);

    return container;
}

/**
 * Calculate summary stats from workout
 */
function calculateStats(workout, pbs) {
    let newPBs = 0;

    workout.blocks.forEach((block, index) => {
        const exerciseId = getCanonicalExerciseId(block, workout.category);
        const pbTime = exerciseId ? pbs[exerciseId] : null;
        const currentTime = workout.blockTimesMs[index];

        if (pbTime && currentTime < pbTime) {
            newPBs++;
        }
    });

    return {
        newPBs,
        exerciseCount: workout.blocks.length
    };
}

/**
 * Create a comparison table for all exercises (standalone)
 * @param {Object} workout - Workout data
 * @param {Object} pbs - Personal bests map
 * @returns {HTMLElement} Comparison table element
 */
export function createComparisonTable(workout, pbs = {}) {
    const container = document.createElement('div');
    container.className = 'comparison-table';

    container.innerHTML = `
        <div class="comparison-row header">
            <span>Exercise</span>
            <span>Time</span>
            <span>PB</span>
            <span>+/-</span>
        </div>
        ${workout.blocks.map((block, index) => {
            const exerciseId = getCanonicalExerciseId(block, workout.category);
            const pbTime = exerciseId ? pbs[exerciseId] : null;
            const currentTime = workout.blockTimesMs[index];
            const delta = pbTime ? calculateDelta(currentTime, pbTime) : { formatted: '-', type: 'neutral' };

            return `
                <div class="comparison-row">
                    <span class="comparison-exercise">${block.label}</span>
                    <span class="comparison-time comparison-current">${formatTime(currentTime, false)}</span>
                    <span class="comparison-time comparison-pb">${pbTime ? formatTime(pbTime, false) : '-'}</span>
                    <span class="delta ${delta.type}">${delta.formatted}</span>
                </div>
            `;
        }).join('')}
    `;

    return container;
}

/**
 * Create "See Results" button
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Button element
 */
export function createSeeResultsButton(onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-full btn-lg';
    btn.textContent = 'See Results';
    btn.addEventListener('click', onClick);
    return btn;
}
